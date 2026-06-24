/**
 * NestJS DTO Parser
 *
 * Extracts DTOs, entities, and schemas from NestJS applications.
 */

import {
  Node,
  type ClassDeclaration,
  type InterfaceDeclaration,
  type TypeAliasDeclaration,
  type PropertySignature,
  type SourceFile,
} from 'ts-morph'
import { createTsMorphProject } from './utils.js'
import type { SchemaEntity } from '../../types/graph.js'
import type { RepoContext } from '../types.js'

/**
 * Patterns that suggest a class is a DTO
 */
const DTO_PATTERNS = [
  /[Dd]to[s]?$/,
  /^Create[A-Z].*Dto$/,
  /^Update[A-Z].*Dto$/,
  /^[A-Z].*Dto[s]?$/,
  /^Delete[A-Z].*Dto$/,
  /^Get[A-Z].*Dto$/,
]

/**
 * Patterns that suggest a class is an entity
 */
const ENTITY_PATTERNS = [
  /[Ee]ntity$/,
  /[Ee]ntities$/,
]

/**
 * Patterns that suggest a file contains schemas
 */
const SCHEMA_PATTERNS = [
  /\.dto\.ts$/,
  /\.entity\.ts$/,
  /\.schema\.ts$/,
  /\.model\.ts$/,
]

/**
 * Extract all DTOs and schemas from NestJS application
 */
export async function extractSchemas(context: RepoContext): Promise<SchemaEntity[]> {
  const { cwd } = context
  const schemas: SchemaEntity[] = []

  // Create a ts-morph project
  const { sourceFiles } = createTsMorphProject(cwd)

  for (const sourceFile of sourceFiles) {
    const fileSchemas = extractSchemasFromFile(sourceFile)
    schemas.push(...fileSchemas)
  }

  return schemas
}

/**
 * Extract schemas from a single source file
 */
function extractSchemasFromFile(sourceFile: SourceFile): SchemaEntity[] {
  const schemas: SchemaEntity[] = []
  const filePath = sourceFile.getFilePath()

  // Check if file matches schema patterns
  const matchesSchemaPattern = SCHEMA_PATTERNS.some(pattern => pattern.test(filePath))

  // Get all classes
  const classes = sourceFile.getClasses()

  for (const classDecl of classes) {
    const className = classDecl.getName()
    if (!className) continue

    // Check if it's likely a DTO or entity
    const isDto = matchesSchemaPattern || isDtoClass(className, classDecl)
    const isEntity = matchesSchemaPattern || ENTITY_PATTERNS.some(p => p.test(className))

    if (isDto || isEntity) {
      const schema = extractSchemaFromClass(classDecl, filePath, className)
      schemas.push(schema)
    }
  }

  // Get all interfaces
  const interfaces = sourceFile.getInterfaces()

  for (const iface of interfaces) {
    const ifaceName = iface.getName()
    if (!ifaceName) continue

    const isDto = matchesSchemaPattern || isDtoInterface(ifaceName)
    const isEntity = matchesSchemaPattern || ENTITY_PATTERNS.some(p => p.test(ifaceName))

    if (isDto || isEntity) {
      const schema = extractSchemaFromInterface(iface, filePath, ifaceName)
      schemas.push(schema)
    }
  }

  // Get all type aliases (for discriminated unions and types)
  const typeAliases = sourceFile.getTypeAliases()

  for (const typeAlias of typeAliases) {
    const typeName = typeAlias.getName()
    if (!typeName) continue

    const isDto = matchesSchemaPattern || isDtoType(typeName)
    const isEntity = matchesSchemaPattern || ENTITY_PATTERNS.some(p => p.test(typeName))

    if (isDto || isEntity) {
      const schema = extractSchemaFromTypeAlias(typeAlias, filePath, typeName)
      schemas.push(schema)
    }
  }

  return schemas
}

/**
 * Check if class is likely a DTO based on decorators or naming
 */
function isDtoClass(name: string, classDecl: ClassDeclaration): boolean {
  // Check for IsOptional, IsString, etc. from class-validator
  const decorators = classDecl.getDecorators()
  for (const deco of decorators) {
    const decoName = deco.getName()
    if (
      decoName === 'Dto' ||
      decoName === 'Entity' ||
      decoName.startsWith('Is') ||
      decoName === 'Injectable'
    ) {
      return true
    }
  }

  // Check naming patterns
  return DTO_PATTERNS.some(pattern => pattern.test(name))
}

/**
 * Check if type is likely a DTO (for interfaces and type aliases)
 */
function isDtoType(name: string): boolean {
  return DTO_PATTERNS.some(pattern => pattern.test(name))
}

// Alias for semantic clarity when checking interfaces
const isDtoInterface = isDtoType

/**
 * Extract schema from class
 */
function extractSchemaFromClass(
  classDecl: ClassDeclaration,
  filePath: string,
  name: string
): SchemaEntity {
  const line = classDecl.getStartLineNumber()
  const properties = extractProperties(classDecl)

  return {
    id: `schema:${name}`,
    name,
    type: 'body',
    file: filePath,
    line,
    properties: properties.map(p => ({
      name: p.name,
      type: p.type,
      required: !p.optional,
    })),
    required: properties.filter(p => !p.optional).map(p => p.name),
    description: extractJsDoc(classDecl),
  }
}

/**
 * Extract schema from interface
 */
function extractSchemaFromInterface(
  iface: InterfaceDeclaration,
  filePath: string,
  name: string
): SchemaEntity {
  const line = iface.getStartLineNumber()
  const properties = extractInterfaceProperties(iface)

  return {
    id: `schema:${name}`,
    name,
    type: 'body',
    file: filePath,
    line,
    properties: properties.map(p => ({
      name: p.name,
      type: p.type,
      required: !p.optional,
    })),
    required: properties.filter(p => !p.optional).map(p => p.name),
    description: extractJsDoc(iface),
  }
}

/**
 * Extract schema from type alias
 */
function extractSchemaFromTypeAlias(
  typeAlias: TypeAliasDeclaration,
  filePath: string,
  name: string
): SchemaEntity {
  const line = typeAlias.getStartLineNumber()
  const typeNode = typeAlias.getTypeNode()

  return {
    id: `schema:${name}`,
    name,
    type: 'body',
    file: filePath,
    line,
    description: extractJsDoc(typeAlias),
  }
}

/**
 * Extract properties from class
 */
function extractProperties(classDecl: ClassDeclaration): Array<{ name: string; type: string; optional: boolean }> {
  const properties: Array<{ name: string; type: string; optional: boolean }> = []

  const members = classDecl.getMembers()

  for (const member of members) {
    if (Node.isPropertyDeclaration(member) || Node.isGetAccessorDeclaration(member)) {
      const name = member.getName()
      if (!name) continue

      const typeNode = member.getTypeNode()
      const type = typeNode ? typeNode.getText() : 'unknown'

      // Check if property has ? (optional)
      const questionToken = member.getQuestionTokenNode()
      const optional = !!questionToken

      properties.push({ name, type, optional })
    }
  }

  return properties
}

/**
 * Extract properties from interface
 */
function extractInterfaceProperties(
  iface: InterfaceDeclaration
): Array<{ name: string; type: string; optional: boolean }> {
  const properties: Array<{ name: string; type: string; optional: boolean }> = []

  const members = iface.getMembers()

  for (const member of members) {
    if (Node.isPropertySignature(member)) {
      const name = member.getName()
      if (!name) continue

      const typeNode = member.getTypeNode()
      const type = typeNode ? typeNode.getText() : 'unknown'

      // Check if property is optional
      const optional = member.isOptional()

      properties.push({ name, type, optional })
    }
  }

  return properties
}

/**
 * Extract JSDoc comment
 */
function extractJsDoc(
  node: ClassDeclaration | InterfaceDeclaration | TypeAliasDeclaration
): string | undefined {
  const jsDoc = node.getJsDocs()[0]
  if (!jsDoc) return undefined

  const description = jsDoc.getDescription()
  return description.trim() || undefined
}
