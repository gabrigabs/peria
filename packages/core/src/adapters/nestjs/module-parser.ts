/**
 * NestJS Module Parser
 *
 * Extracts module structure from NestJS @Module decorators.
 */

import {
  Project,
  Node,
  SyntaxKind,
  type ClassDeclaration,
  type SourceFile,
} from 'ts-morph'
import type { ModuleEntity } from '../types.js'
import type { RepoContext } from '../types.js'

/**
 * Extract all modules from NestJS application
 */
export async function extractModules(context: RepoContext): Promise<ModuleEntity[]> {
  const { cwd } = context
  const modules: ModuleEntity[] = []

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
    const fileModules = extractModulesFromFile(sourceFile)
    modules.push(...fileModules)
  }

  return modules
}

/**
 * Find tsconfig.json in the project
 */
function findTsConfig(cwd: string): string | undefined {
  const candidates = [
    `${cwd}/tsconfig.json`,
    `${cwd}/tsconfig.build.json`,
  ]

  for (const candidate of candidates) {
    return candidate
  }

  return undefined
}

/**
 * Extract modules from a single source file
 */
function extractModulesFromFile(sourceFile: SourceFile): ModuleEntity[] {
  const modules: ModuleEntity[] = []
  const filePath = sourceFile.getFilePath()

  // Get all classes
  const classes = sourceFile.getClasses()

  for (const classDecl of classes) {
    // Check if this is a module (has @Module decorator)
    const moduleDeco = classDecl.getDecorator('Module')
    if (!moduleDeco) continue

    const moduleName = classDecl.getName()
    if (!moduleName) continue

    const moduleEntity = extractModuleEntity(classDecl, filePath, moduleName)
    modules.push(moduleEntity)
  }

  return modules
}

/**
 * Extract module entity from class declaration
 */
function extractModuleEntity(
  classDecl: ClassDeclaration,
  filePath: string,
  name: string
): ModuleEntity {
  const decorator = classDecl.getDecorator('Module')
  const line = classDecl.getStartLineNumber()

  const entity: ModuleEntity = {
    id: `module:${name}`,
    name,
    file: filePath,
    line,
  }

  if (!decorator) return entity

  // Extract module configuration
  const args = decorator.getArguments()
  if (args.length === 0) return entity

  const config = args[0]
  if (!Node.isObjectLiteralExpression(config)) return entity

  // Extract imports
  const imports = extractArrayProperty(config, 'imports')
  if (imports.length > 0) {
    entity.imports = imports
  }

  // Extract declarations
  const declarations = extractArrayProperty(config, 'declarations')
  if (declarations.length > 0) {
    entity.declarations = declarations
  }

  // Extract exports
  const exports = extractArrayProperty(config, 'exports')
  if (exports.length > 0) {
    entity.exports = exports
  }

  // Extract providers
  const providers = extractArrayProperty(config, 'providers')
  if (providers.length > 0) {
    entity.providers = providers
  }

  // Extract controllers
  const controllers = extractArrayProperty(config, 'controllers')
  if (controllers.length > 0) {
    entity.controllers = controllers
  }

  return entity
}

/**
 * Extract array property from object literal
 */
function extractArrayProperty(obj: Node, propertyName: string): string[] {
  const result: string[] = []

  const property = obj.getProperty(propertyName)
  if (!property || !Node.isPropertyAssignment(property)) return result

  const initializer = property.getInitializer()
  if (!initializer) return result

  if (Node.isArrayLiteralExpression(initializer)) {
    const elements = initializer.getElements()
    for (const element of elements) {
      const text = element.getText()
      if (text) {
        result.push(text)
      }
    }
  }

  return result
}
