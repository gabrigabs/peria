/**
 * NestJS Controller Parser
 *
 * Uses ts-morph to extract routes, handlers, and decorators from NestJS controllers.
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  Project,
  Node,
  SyntaxKind,
  type ClassDeclaration,
  type MethodDeclaration,
  type Decorator,
  type SourceFile,
  type ParameterDeclaration,
  type ClassDeclaration as TsMorphClass,
} from 'ts-morph'
import type { RouteEntity, HandlerEntity, HttpMethod, SchemaEntity, Confidence } from '../../types/graph.js'
import type { RepoContext } from '../types.js'

/**
 * HTTP method decorators
 */
const HTTP_METHODS: Record<string, HttpMethod> = {
  Get: 'GET',
  Post: 'POST',
  Put: 'PUT',
  Patch: 'PATCH',
  Delete: 'DELETE',
  Head: 'HEAD',
  Options: 'OPTIONS',
}

/**
 * Parameter decorators
 */
const PARAM_DECORATORS = ['Param', 'Query', 'Body', 'Headers', 'Cookies', 'Ip', 'Session']

/**
 * Middleware decorators
 */
const MIDDLEWARE_DECORATORS = ['UseGuards', 'UsePipes', 'UseInterceptors', 'UseFilters', 'UseCors']

/**
 * Extract all routes from NestJS controllers
 */
export async function extractRoutes(context: RepoContext): Promise<RouteEntity[]> {
  const { cwd } = context
  const routes: RouteEntity[] = []

  // Create a ts-morph project
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  })

  // Add all TypeScript files from the cwd
  const tsConfigPath = findTsConfig(cwd)
  if (tsConfigPath) {
    project.addSourceFilesFromTsConfig(tsConfigPath)
  } else {
    // Fallback: add files manually
    project.addSourceFiles(`${cwd}/**/*.ts`)
  }

  // Get all source files
  const sourceFiles = project.getSourceFiles()
    .filter(sf => sf.getFilePath().startsWith(cwd))
    .filter(sf => !sf.getFilePath().includes('node_modules'))
    .filter(sf => !sf.getFilePath().includes('.d.ts'))

  for (const sourceFile of sourceFiles) {
    const fileRoutes = extractRoutesFromFile(sourceFile)
    routes.push(...fileRoutes)
  }

  return routes
}

/**
 * Find tsconfig.json in the project
 */
function findTsConfig(cwd: string): string | undefined {
  const candidates = [
    join(cwd, 'tsconfig.json'),
    join(cwd, 'tsconfig.build.json'),
    join(cwd, 'apps', 'api', 'tsconfig.json'),
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate
    }
  }

  return undefined
}

/**
 * Extract routes from a single source file
 */
function extractRoutesFromFile(sourceFile: SourceFile): RouteEntity[] {
  const routes: RouteEntity[] = []
  const filePath = sourceFile.getFilePath()

  // Get all classes
  const classes = sourceFile.getClasses()

  for (const classDecl of classes) {
    // Check if this is a controller
    const controllerDeco = classDecl.getDecorator('Controller')
    if (!controllerDeco) continue

    // Extract controller prefix
    const controllerPrefix = extractControllerPath(controllerDeco)
    const className = classDecl.getName()

    if (!className) continue

    // Extract class-level decorators (these apply to all methods)
    const classGuards = extractClassMiddleware(classDecl, 'UseGuards')
    const classPipes = extractClassMiddleware(classDecl, 'UsePipes')
    const classInterceptors = extractClassMiddleware(classDecl, 'UseInterceptors')

    // Get all methods
    const methods = classDecl.getMethods()

    for (const method of methods) {
      // Find HTTP method decorator
      const httpMethodDeco = findHttpMethodDecorator(method)
      if (!httpMethodDeco) continue

      const httpMethod = getHttpMethod(httpMethodDeco)
      const routePath = extractRoutePath(httpMethodDeco)
      const fullPath = combinePaths(controllerPrefix, routePath)

      // Extract method decorators (merge with class-level)
      const methodGuards = extractMiddleware(method, 'UseGuards')
      const methodPipes = extractMiddleware(method, 'UsePipes')
      const methodInterceptors = extractMiddleware(method, 'UseInterceptors')

      // Merge class and method decorators
      const guards = [...classGuards, ...methodGuards]
      const pipes = [...classPipes, ...methodPipes]
      const interceptors = [...classInterceptors, ...methodInterceptors]

      // Extract parameters
      const parameters = extractParameters(method)

      // Create route entity
      const route = createRouteEntity({
        path: fullPath,
        method: httpMethod,
        className,
        methodName: method.getName(),
        filePath,
        line: method.getStartLineNumber(),
        guards,
        pipes,
        interceptors,
        parameters,
      })

      routes.push(route)
    }
  }

  return routes
}

/**
 * Extract the path from a @Controller decorator
 */
function extractControllerPath(decorator: Decorator): string {
  const args = decorator.getArguments()
  if (args.length === 0) return ''

  const firstArg = args[0]
  if (Node.isStringLiteral(firstArg)) {
    return firstArg.getText().slice(1, -1) // Remove quotes
  }

  if (Node.isObjectLiteralExpression(firstArg)) {
    const pathProp = firstArg.getProperty('path')
    if (pathProp && Node.isPropertyAssignment(pathProp)) {
      const value = pathProp.getInitializer()
      if (Node.isStringLiteral(value)) {
        return value.getText().slice(1, -1)
      }
    }
  }

  return ''
}

/**
 * Find HTTP method decorator on a method
 */
function findHttpMethodDecorator(method: MethodDeclaration): Decorator | undefined {
  const decorators = method.getDecorators()

  for (const deco of decorators) {
    const name = deco.getName()
    if (HTTP_METHODS[name]) {
      return deco
    }
  }

  return undefined
}

/**
 * Get HTTP method from decorator name
 */
function getHttpMethod(decorator: Decorator): HttpMethod {
  const name = decorator.getName()
  return HTTP_METHODS[name] || 'GET'
}

/**
 * Extract route path from HTTP method decorator
 */
function extractRoutePath(decorator: Decorator): string {
  const args = decorator.getArguments()
  if (args.length === 0) return ''

  const firstArg = args[0]
  if (Node.isStringLiteral(firstArg)) {
    return firstArg.getText().slice(1, -1)
  }

  return ''
}

/**
 * Combine controller prefix and route path
 */
function combinePaths(prefix: string, route: string): string {
  // Remove leading/trailing slashes
  const cleanPrefix = prefix.replace(/^\/|\/$/g, '')
  const cleanRoute = route.replace(/^\/|\/$/g, '')

  if (!cleanPrefix && !cleanRoute) return '/'
  if (!cleanPrefix) return `/${cleanRoute}`
  if (!cleanRoute) return `/${cleanPrefix}`

  return `/${cleanPrefix}/${cleanRoute}`
}

/**
 * Extract middleware from method decorators
 */
function extractMiddleware(
  method: MethodDeclaration,
  decoratorName: string
): string[] {
  const decorators = method.getDecorators()
  const result: string[] = []

  for (const deco of decorators) {
    if (deco.getName() === decoratorName) {
      const args = deco.getArguments()
      for (const arg of args) {
        const text = arg.getText()
        // Strip quotes from string literals (e.g., 'GuardName' -> GuardName)
        result.push(text.startsWith("'") && text.endsWith("'") ? text.slice(1, -1) : text)
      }
    }
  }

  return result
}

/**
 * Extract middleware from class decorators
 */
function extractClassMiddleware(
  classDecl: ClassDeclaration,
  decoratorName: string
): string[] {
  const decorators = classDecl.getDecorators()
  const result: string[] = []

  for (const deco of decorators) {
    if (deco.getName() === decoratorName) {
      const args = deco.getArguments()
      for (const arg of args) {
        const text = arg.getText()
        // Strip quotes from string literals (e.g., 'GuardName' -> GuardName)
        result.push(text.startsWith("'") && text.endsWith("'") ? text.slice(1, -1) : text)
      }
    }
  }

  return result
}

/**
 * Extract parameters from method signature
 */
function extractParameters(
  method: MethodDeclaration
): Array<{ name: string; type: 'path' | 'query' | 'body' | 'header' | 'cookie'; schema?: string }> {
  const parameters: Array<{ name: string; type: 'path' | 'query' | 'body' | 'header' | 'cookie'; schema?: string }> = []
  const params = method.getParameters()

  for (const param of params) {
    const decorators = param.getDecorators()

    for (const deco of decorators) {
      const decoName = deco.getName()

      if (PARAM_DECORATORS.includes(decoName)) {
        const args = deco.getArguments()
        const paramName = param.getName()
        const type = getParamType(decoName)

        // Get the type annotation if available
        const typeNode = param.getTypeNode()
        let schema: string | undefined

        if (typeNode) {
          schema = typeNode.getText()
        }

        parameters.push({
          name: args.length > 0 ? extractStringArg(args[0]) : paramName,
          type,
          schema,
        })
      }
    }
  }

  return parameters
}

/**
 * Map decorator name to parameter type
 */
function getParamType(decoratorName: string): 'path' | 'query' | 'body' | 'header' | 'cookie' {
  switch (decoratorName) {
    case 'Param':
      return 'path'
    case 'Query':
      return 'query'
    case 'Body':
      return 'body'
    case 'Headers':
      return 'header'
    case 'Cookies':
      return 'cookie'
    default:
      return 'query'
  }
}

/**
 * Extract string argument from AST node
 */
function extractStringArg(arg: Node): string {
  if (Node.isStringLiteral(arg)) {
    return arg.getText().slice(1, -1)
  }
  return ''
}

/**
 * Create a RouteEntity from extracted data
 */
function createRouteEntity(data: {
  path: string
  method: HttpMethod
  className: string
  methodName: string
  filePath: string
  line: number
  guards: string[]
  pipes: string[]
  interceptors: string[]
  parameters: Array<{ name: string; type: 'path' | 'query' | 'body' | 'header' | 'cookie'; schema?: string }>
}): RouteEntity {
  const { path, method, className, methodName, filePath, line, guards, pipes, interceptors, parameters } = data

  const handler: HandlerEntity = {
    id: `handler:${className}.${methodName}`,
    name: methodName,
    file: filePath,
    line,
    className,
    methodName,
    decorators: [...guards, ...pipes, ...interceptors],
  }

  // Convert parameters to schema entities
  const schemas: SchemaEntity[] = parameters.map((param, idx) => ({
    id: `param:${className}.${methodName}:${param.name}`,
    name: param.name,
    type: param.type as SchemaEntity['type'],
    description: `Parameter extracted from @${param.type === 'path' ? 'Param' : param.type === 'query' ? 'Query' : 'Body'} decorator`,
    source: { file: filePath, line },
  }))

  return {
    id: `route:${method}:${path}`,
    path,
    method,
    handler,
    schemas,
    middleware: [...pipes, ...interceptors],
    guards,
    source: { file: filePath, line },
    confidence: 'high' as Confidence,
    extractionMethod: 'ast',
  }
}
