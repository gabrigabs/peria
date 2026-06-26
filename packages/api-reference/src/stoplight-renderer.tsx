/**
 * Stoplight Elements Renderer for Peria
 *
 * Provides React components for rendering API reference using Stoplight Elements,
 * enriched with Peria metadata (handler info, source links, drift status).
 */

import { API } from '@stoplight/elements-core';
import type React from 'react';

// Import styles - users should import @stoplight/elements/styles in their app
// import '@stoplight/elements/styles.css';

/**
 * Confidence level indicator colors
 */
export const confidenceColors = {
  high: '#10b981', // green
  medium: '#f59e0b', // amber
  low: '#6b7280', // gray
} as const;

/**
 * Drift status indicator colors
 */
export const driftColors = {
  aligned: '#10b981', // green
  warning: '#f59e0b', // amber
  error: '#ef4444', // red
} as const;

/**
 * Configuration for the Stoplight renderer
 */
export interface StoplightConfig {
  /** OpenAPI spec URL or object */
  specUrl?: string;
  /** OpenAPI spec as object (for embedded specs) */
  spec?: Record<string, unknown>;
  /** Base URL for the API (optional) */
  baseUrl?: string;
  /** API name shown in the header */
  apiName?: string;
  /** Logo URL */
  logo?: string;
  /** Hide the Stoplight branding */
  hideStoplightBranding?: boolean;
  /** Layout style */
  layout?: 'sidebar' | 'three-panel' | 'stacked';
  /** Default search term */
  searchTerm?: string;
}

/**
 * Props for the StoplightRenderer component
 */
export interface StoplightRendererProps extends StoplightConfig {
  /** CSS class name */
  className?: string;
  /** Style overrides */
  style?: React.CSSProperties;
}

/**
 * Stoplight Elements API options derived from config
 */
function getAPIOptions(config: StoplightConfig) {
  return {
    apiDescriptionUrl: config.specUrl,
    apiDescriptionDocument: config.spec,
    basePath: config.baseUrl,
    logo: config.logo,
    tryItCredentialsPolicy: 'cors' as const,
    router: 'history' as const,
  };
}

/**
 * Main Stoplight Renderer component
 *
 * Renders the Stoplight Elements API reference UI with Peria configuration.
 */
export function StoplightRenderer(props: StoplightRendererProps): React.ReactElement {
  const { className, style, ...config } = props;

  return (
    <div className={className} style={style}>
      <API {...getAPIOptions(config)} />
    </div>
  );
}

/**
 * Props for the OperationContext component
 */
export interface OperationContextProps {
  /** Operation ID (path + method) */
  operationId: string;
  /** Handler class name */
  handlerClassName?: string;
  /** Handler method name */
  handlerMethodName?: string;
  /** Source file path */
  sourceFile?: string;
  /** Source line number */
  sourceLine?: number;
  /** Module name */
  module?: string;
  /** Related documentation pages */
  docs?: string[];
  /** Related schema names */
  schemas?: string[];
  /** Confidence level */
  confidence?: 'high' | 'medium' | 'low';
  /** Drift status */
  drift?: 'aligned' | 'warning' | 'error';
  /** Extraction method */
  extractionMethod?: 'ast' | 'openapi' | 'heuristic';
}

/**
 * Operation Context Panel
 *
 * Shows Peria metadata for an OpenAPI operation including:
 * - Handler information (class, method, file, line)
 * - Module information
 * - Related documentation
 * - Related schemas
 * - Confidence level
 * - Drift status
 */
export function OperationContext(props: OperationContextProps): React.ReactElement {
  const {
    handlerClassName,
    handlerMethodName,
    sourceFile,
    sourceLine,
    module,
    docs,
    schemas,
    confidence,
    drift,
    extractionMethod,
  } = props;

  return (
    <div className="peria-operation-context">
      <div className="peria-context-header">
        <span className="peria-context-label">Peria Evidence</span>
        {confidence && (
          <span
            className="peria-confidence-badge"
            style={{ backgroundColor: confidenceColors[confidence] }}
          >
            {confidence}
          </span>
        )}
        {drift && (
          <span className="peria-drift-badge" style={{ backgroundColor: driftColors[drift] }}>
            {drift}
          </span>
        )}
      </div>

      <div className="peria-context-content">
        {handlerClassName && handlerMethodName && (
          <div className="peria-context-row">
            <span className="peria-context-key">Handler:</span>
            <span className="peria-context-value">
              {handlerClassName}.{handlerMethodName}
            </span>
          </div>
        )}

        {module && (
          <div className="peria-context-row">
            <span className="peria-context-key">Module:</span>
            <span className="peria-context-value">{module}</span>
          </div>
        )}

        {sourceFile && (
          <div className="peria-context-row">
            <span className="peria-context-key">Source:</span>
            <span className="peria-context-value peria-context-source">
              {sourceFile}
              {sourceLine && `:${sourceLine}`}
            </span>
          </div>
        )}

        {extractionMethod && (
          <div className="peria-context-row">
            <span className="peria-context-key">Extraction:</span>
            <span className="peria-context-value">{extractionMethod}</span>
          </div>
        )}

        {schemas && schemas.length > 0 && (
          <div className="peria-context-row peria-context-list">
            <span className="peria-context-key">Schemas:</span>
            <div className="peria-context-values">
              {schemas.map((schema) => (
                <span key={schema} className="peria-schema-tag">
                  {schema}
                </span>
              ))}
            </div>
          </div>
        )}

        {docs && docs.length > 0 && (
          <div className="peria-context-row peria-context-list">
            <span className="peria-context-key">Docs:</span>
            <div className="peria-context-values">
              {docs.map((doc) => (
                <span key={doc} className="peria-doc-link">
                  {doc}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Props for DriftIndicator component
 */
export interface DriftIndicatorProps {
  /** Current drift status */
  status: 'aligned' | 'warning' | 'error';
  /** Number of findings */
  findingsCount?: number;
  /** Last verified timestamp */
  lastVerified?: string;
  /** Click handler to view details */
  onViewDetails?: () => void;
}

/**
 * Drift Indicator Component
 *
 * Visual indicator showing the drift status of an operation.
 */
export function DriftIndicator(props: DriftIndicatorProps): React.ReactElement {
  const { status, findingsCount, lastVerified, onViewDetails } = props;

  const statusLabels = {
    aligned: 'Aligned',
    warning: 'Needs Review',
    error: 'Drift Detected',
  };

  return (
    <div className="peria-drift-indicator">
      <div className="peria-drift-status" style={{ backgroundColor: driftColors[status] }}>
        <span className="peria-drift-icon">
          {status === 'aligned' ? '✓' : status === 'warning' ? '⚠' : '✗'}
        </span>
        <span className="peria-drift-label">{statusLabels[status]}</span>
      </div>

      {findingsCount !== undefined && findingsCount > 0 && (
        <div className="peria-drift-findings">
          {findingsCount} finding{findingsCount !== 1 ? 's' : ''}
        </div>
      )}

      {lastVerified && (
        <div className="peria-drift-timestamp">
          Verified: {new Date(lastVerified).toLocaleDateString()}
        </div>
      )}

      {onViewDetails && (
        <button className="peria-drift-action" onClick={onViewDetails} type="button">
          View Details
        </button>
      )}
    </div>
  );
}

/**
 * Props for APIReferencePage component
 */
export interface APIReferencePageProps {
  /** Stoplight configuration */
  stoplight: StoplightConfig;
  /** Peria metadata map (operationId -> metadata) */
  periaMetadata?: Record<string, OperationContextProps>;
  /** Title for the page */
  title?: string;
  /** Description for the page */
  description?: string;
}

/**
 * Full API Reference Page
 *
 * Complete API reference page with Stoplight Elements and Peria metadata panels.
 */
export function APIReferencePage(props: APIReferencePageProps): React.ReactElement {
  const { stoplight, title, description } = props;

  return (
    <div className="peria-api-reference-page">
      <div className="peria-api-reference-header">
        {title && <h1 className="peria-api-reference-title">{title}</h1>}
        {description && <p className="peria-api-reference-description">{description}</p>}
      </div>

      <div className="peria-api-reference-content">
        <div className="peria-api-reference-stoplight">
          <StoplightRenderer {...stoplight} />
        </div>
      </div>
    </div>
  );
}

/**
 * Get default CSS styles for the components
 * Users can override these with their own styles
 */
export const defaultStyles = `
.peria-operation-context {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
  margin-top: 12px;
}

.peria-context-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.peria-context-label {
  font-weight: 600;
  color: #374151;
}

.peria-confidence-badge,
.peria-drift-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  color: white;
  text-transform: uppercase;
}

.peria-context-row {
  display: flex;
  gap: 8px;
  margin-bottom: 6px;
  align-items: flex-start;
}

.peria-context-key {
  color: #6b7280;
  min-width: 80px;
}

.peria-context-value {
  color: #1f2937;
  word-break: break-all;
}

.peria-context-source {
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
  font-size: 12px;
  background: #e5e7eb;
  padding: 2px 6px;
  border-radius: 3px;
}

.peria-context-list {
  flex-direction: column;
}

.peria-context-values {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.peria-schema-tag {
  background: #dbeafe;
  color: #1e40af;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.peria-doc-link {
  background: #fce7f3;
  color: #9d174d;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.peria-drift-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
}

.peria-drift-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 16px;
  color: white;
  font-weight: 500;
  font-size: 13px;
}

.peria-drift-icon {
  font-size: 14px;
}

.peria-drift-findings,
.peria-drift-timestamp {
  font-size: 12px;
  color: #6b7280;
}

.peria-drift-action {
  background: transparent;
  border: 1px solid #d1d5db;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-left: auto;
}

.peria-drift-action:hover {
  background: #f3f4f6;
}

.peria-api-reference-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.peria-api-reference-header {
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.peria-api-reference-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #111827;
}

.peria-api-reference-description {
  margin: 0;
  color: #6b7280;
}

.peria-api-reference-content {
  flex: 1;
  overflow: hidden;
}

.peria-api-reference-stoplight {
  height: 100%;
}
` as const;
