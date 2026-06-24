/**
 * NestJS DTO Parser
 *
 * Extracts DTOs, entities, and schemas from NestJS applications.
 */

import {
  type ClassDeclaration,
  type InterfaceDeclaration,
  Node,
  type SourceFile,
  type TypeAliasDeclaration,
} from 'ts-morph';
import type { Confidence, ExtractionMethod, SchemaEntity } from '../../types/graph.js';
import type { RepoContext } from '../types.js';
import { createTsMorphProject } from './utils.js';

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
];

/**
 * Patterns that suggest a class is an entity
 */
const ENTITY_PATTERNS = [/[Ee]ntity$/, /[Ee]ntities$/];

/**
 * Patterns that suggest a file contains schemas
 */
const SCHEMA_PATTERNS = [/dto\.ts$/, /entity\.ts$/, /schema\.ts$/, /model\.ts$/];

/**
 * Detection method for a schema
 */
interface SchemaDetection {
  isSchema: boolean;
  isEntity: boolean;
  confidence: Confidence;
  extractionMethod: ExtractionMethod;
}

/**
 * Check if a class should be treated as a schema and with what confidence
 */
function detectClassSchema(
  className: string,
  classDecl: ClassDeclaration,
  matchesFilePattern: boolean
): SchemaDetection {
  const hasFilePattern = matchesFilePattern;
  const hasDecorator = classDecl.getDecorators().some((deco) => {
    const name = deco.getName();
    return name === 'Dto' || name === 'Entity' || name === 'Injectable' || name.startsWith('Is');
  });
  const matchesNamePattern =
    DTO_PATTERNS.some((p) => p.test(className)) || ENTITY_PATTERNS.some((p) => p.test(className));

  const isSchema = hasFilePattern || hasDecorator || matchesNamePattern;
  const isEntity = hasFilePattern || ENTITY_PATTERNS.some((p) => p.test(className));

  // Confidence: high if file pattern or decorator, medium if only naming pattern
  const confidence: Confidence =
    hasFilePattern || hasDecorator ? 'high' : matchesNamePattern ? 'medium' : 'low';

  const extractionMethod: ExtractionMethod = hasFilePattern
    ? 'ast'
    : hasDecorator
      ? 'ast'
      : matchesNamePattern
        ? 'heuristic'
        : 'heuristic';

  return { isSchema, isEntity, confidence, extractionMethod };
}

/**
 * Check if an interface should be treated as a schema
 */
function detectInterfaceSchema(ifaceName: string, matchesFilePattern: boolean): SchemaDetection {
  const hasFilePattern = matchesFilePattern;
  const matchesNamePattern =
    DTO_PATTERNS.some((p) => p.test(ifaceName)) || ENTITY_PATTERNS.some((p) => p.test(ifaceName));

  const isSchema = hasFilePattern || matchesNamePattern;
  const isEntity = hasFilePattern || ENTITY_PATTERNS.some((p) => p.test(ifaceName));

  const confidence: Confidence = hasFilePattern ? 'high' : matchesNamePattern ? 'medium' : 'low';

  const extractionMethod: ExtractionMethod = hasFilePattern ? 'ast' : 'heuristic';

  return { isSchema, isEntity, confidence, extractionMethod };
}

/**
 * Check if a type alias should be treated as a schema
 */
function detectTypeSchema(typeName: string, matchesFilePattern: boolean): SchemaDetection {
  const hasFilePattern = matchesFilePattern;
  const matchesNamePattern =
    DTO_PATTERNS.some((p) => p.test(typeName)) || ENTITY_PATTERNS.some((p) => p.test(typeName));

  const isSchema = hasFilePattern || matchesNamePattern;
  const isEntity = hasFilePattern || ENTITY_PATTERNS.some((p) => p.test(typeName));

  const confidence: Confidence = hasFilePattern ? 'high' : matchesNamePattern ? 'medium' : 'low';

  const extractionMethod: ExtractionMethod = hasFilePattern ? 'ast' : 'heuristic';

  return { isSchema, isEntity, confidence, extractionMethod };
}

/**
 * Extract all DTOs and schemas from NestJS application
 */
export async function extractSchemas(context: RepoContext): Promise<SchemaEntity[]> {
  const { cwd } = context;
  const schemas: SchemaEntity[] = [];

  // Create a ts-morph project
  const { sourceFiles } = createTsMorphProject(cwd);

  for (const sourceFile of sourceFiles) {
    const fileSchemas = extractSchemasFromFile(sourceFile);
    schemas.push(...fileSchemas);
  }

  return schemas;
}

/**
 * Extract schemas from a single source file
 */
function extractSchemasFromFile(sourceFile: SourceFile): SchemaEntity[] {
  const schemas: SchemaEntity[] = [];
  const filePath = sourceFile.getFilePath();

  // Check if file matches schema patterns
  const matchesSchemaPattern = SCHEMA_PATTERNS.some((pattern) => pattern.test(filePath));

  // Get all classes
  const classes = sourceFile.getClasses();

  for (const classDecl of classes) {
    const className = classDecl.getName();
    if (!className) continue;

    const detection = detectClassSchema(className, classDecl, matchesSchemaPattern);

    if (detection.isSchema) {
      const schema = extractSchemaFromClass(classDecl, filePath, className, detection);
      schemas.push(schema);
    }
  }

  // Get all interfaces
  const interfaces = sourceFile.getInterfaces();

  for (const iface of interfaces) {
    const ifaceName = iface.getName();
    if (!ifaceName) continue;

    const detection = detectInterfaceSchema(ifaceName, matchesSchemaPattern);

    if (detection.isSchema) {
      const schema = extractSchemaFromInterface(iface, filePath, ifaceName, detection);
      schemas.push(schema);
    }
  }

  // Get all type aliases (for discriminated unions and types)
  const typeAliases = sourceFile.getTypeAliases();

  for (const typeAlias of typeAliases) {
    const typeName = typeAlias.getName();
    if (!typeName) continue;

    const detection = detectTypeSchema(typeName, matchesSchemaPattern);

    if (detection.isSchema) {
      const schema = extractSchemaFromTypeAlias(typeAlias, filePath, typeName, detection);
      schemas.push(schema);
    }
  }

  return schemas;
}

/**
 * Extract schema from class
 */
function extractSchemaFromClass(
  classDecl: ClassDeclaration,
  filePath: string,
  name: string,
  detection: SchemaDetection
): SchemaEntity {
  const line = classDecl.getStartLineNumber();
  const properties = extractProperties(classDecl);

  return {
    id: `schema:${name}`,
    name,
    type: 'body',
    file: filePath,
    line,
    properties: properties.map((p) => ({
      name: p.name,
      type: p.type,
      required: !p.optional,
    })),
    required: properties.filter((p) => !p.optional).map((p) => p.name),
    description: extractJsDoc(classDecl),
    confidence: detection.confidence,
    extractionMethod: detection.extractionMethod,
  };
}

/**
 * Extract schema from interface
 */
function extractSchemaFromInterface(
  iface: InterfaceDeclaration,
  filePath: string,
  name: string,
  detection: SchemaDetection
): SchemaEntity {
  const line = iface.getStartLineNumber();
  const properties = extractInterfaceProperties(iface);

  return {
    id: `schema:${name}`,
    name,
    type: 'body',
    file: filePath,
    line,
    properties: properties.map((p) => ({
      name: p.name,
      type: p.type,
      required: !p.optional,
    })),
    required: properties.filter((p) => !p.optional).map((p) => p.name),
    description: extractJsDoc(iface),
    confidence: detection.confidence,
    extractionMethod: detection.extractionMethod,
  };
}

/**
 * Extract schema from type alias
 */
function extractSchemaFromTypeAlias(
  typeAlias: TypeAliasDeclaration,
  filePath: string,
  name: string,
  detection: SchemaDetection
): SchemaEntity {
  const line = typeAlias.getStartLineNumber();

  return {
    id: `schema:${name}`,
    name,
    type: 'body',
    file: filePath,
    line,
    description: extractJsDoc(typeAlias),
    confidence: detection.confidence,
    extractionMethod: detection.extractionMethod,
  };
}

/**
 * Extract properties from class
 */
function extractProperties(
  classDecl: ClassDeclaration
): Array<{ name: string; type: string; optional: boolean }> {
  const properties: Array<{ name: string; type: string; optional: boolean }> = [];

  const members = classDecl.getMembers();

  for (const member of members) {
    if (Node.isPropertyDeclaration(member)) {
      const name = member.getName();
      if (!name) continue;

      const typeNode = member.getTypeNode();
      const type = typeNode ? typeNode.getText() : 'unknown';

      // Check if property has ? (optional)
      const questionToken = member.getQuestionTokenNode();
      const optional = !!questionToken;

      properties.push({ name, type, optional });
    } else if (Node.isGetAccessorDeclaration(member)) {
      // Get accessors don't have type nodes in the same way
      const name = member.getName();
      if (!name) continue;

      // Get accessor return type from the signature
      const returnType = member.getReturnType();
      const type = returnType.getText();

      properties.push({ name, type, optional: false });
    }
  }

  return properties;
}

/**
 * Extract properties from interface
 */
function extractInterfaceProperties(
  iface: InterfaceDeclaration
): Array<{ name: string; type: string; optional: boolean }> {
  const properties: Array<{ name: string; type: string; optional: boolean }> = [];

  const members = iface.getMembers();

  for (const member of members) {
    if (Node.isPropertySignature(member)) {
      const name = member.getName();
      if (!name) continue;

      const typeNode = member.getTypeNode();
      const type = typeNode ? typeNode.getText() : 'unknown';

      // Check if property has ? (optional) by checking if it's a question token
      const questionToken = member.getQuestionTokenNode();
      const optional = !!questionToken;

      properties.push({ name, type, optional });
    }
  }

  return properties;
}

/**
 * Extract JSDoc comment
 */
function extractJsDoc(
  node: ClassDeclaration | InterfaceDeclaration | TypeAliasDeclaration
): string | undefined {
  const jsDoc = node.getJsDocs()[0];
  if (!jsDoc) return undefined;

  const description = jsDoc.getDescription();
  return description.trim() || undefined;
}
