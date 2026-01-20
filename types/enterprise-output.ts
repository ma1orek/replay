// ============================================================================
// ENTERPRISE OUTPUT TYPES
// Complete package structure for legacy modernization deliverables
// ============================================================================

import { EnterprisePreset } from "@/lib/enterprise-presets";

// ============================================================================
// SCREEN INVENTORY - From Video Analysis
// ============================================================================

export interface ScreenElement {
  id: string; // EL001, EL002, etc.
  type: "button" | "input" | "select" | "table" | "card" | "modal" | "nav" | "form" | "text" | "image" | "chart" | "other";
  label: string; // Exact text from video
  placeholder?: string;
  value?: string; // Sample data if visible
  position: {
    section: string; // e.g., "header", "sidebar", "main", "footer"
    approximate: string; // e.g., "top-left", "center"
  };
  states: string[]; // e.g., ["default", "hover", "disabled", "loading"]
  ariaLabel?: string;
  timestamp: string; // MM:SS when first observed
  confidence: "high" | "medium" | "low";
  notes?: string; // [VERIFY] or [UNCLEAR: best_guess]
}

export interface Screen {
  id: string; // SCR001, SCR002, etc.
  name: string;
  description: string;
  type: "page" | "modal" | "drawer" | "tab" | "state";
  url?: string; // Inferred route
  elements: ScreenElement[];
  parentScreen?: string; // For modals/drawers
  timestamps: {
    firstSeen: string;
    lastSeen: string;
  };
  screenshot?: string; // Base64 or URL
  confidence: "high" | "medium" | "low";
}

export interface ScreenInventory {
  version: string;
  generatedAt: string;
  videoSource: string;
  videoDuration: string;
  screens: Screen[];
  totalElements: number;
  coverage: {
    screensIdentified: number;
    elementsExtracted: number;
    textAccuracy: string; // e.g., "95%+"
  };
}

// ============================================================================
// INTERACTION FLOW MAPPING
// ============================================================================

export interface Interaction {
  id: string; // INT001, INT002, etc.
  type: "click" | "type" | "select" | "scroll" | "hover" | "drag" | "keypress" | "submit";
  sourceElement: string; // Element ID
  targetScreen?: string; // Screen ID if navigation
  timestamp: string;
  description: string; // Human-readable
  result: string; // What happened after
  dataChange?: {
    field: string;
    before?: string;
    after: string;
  };
}

export interface ValidationRule {
  id: string; // VAL001, VAL002, etc.
  field: string;
  type: "required" | "format" | "min" | "max" | "pattern" | "custom";
  rule: string; // e.g., "email format", "min 8 characters"
  errorMessage: string; // Exact text from video
  timestamp: string;
  confidence: "high" | "medium" | "low";
}

export interface BusinessRule {
  id: string; // BL001, BL002, etc.
  name: string;
  description: string;
  condition: string;
  action: string;
  evidence: {
    timestamps: string[];
    screenIds: string[];
    interactionIds: string[];
  };
  confidence: "high" | "medium" | "low";
  category: "permission" | "validation" | "workflow" | "calculation" | "display" | "other";
}

export interface InferredAPICall {
  id: string; // API001, API002, etc.
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  endpoint: string; // Inferred path
  description: string;
  triggeredBy: string; // Interaction ID
  requestParams?: Record<string, string>;
  requestBody?: Record<string, unknown>;
  responseType: string;
  timestamp: string;
  confidence: "high" | "medium" | "low";
}

export interface InteractionFlowMap {
  version: string;
  generatedAt: string;
  interactions: Interaction[];
  validationRules: ValidationRule[];
  businessRules: BusinessRule[];
  inferredAPIs: InferredAPICall[];
  flowSummary: {
    totalInteractions: number;
    totalValidations: number;
    totalBusinessRules: number;
    totalAPICalls: number;
    userFlows: string[]; // e.g., ["User Creation", "User Edit", "User Delete"]
  };
}

// ============================================================================
// DATA MODEL EXTRACTION
// ============================================================================

export interface EntityField {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "email" | "phone" | "url" | "enum" | "array" | "object";
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
  description: string;
  sampleValue?: string;
  legacyName?: string; // If different from modern name
  source: string; // Screen ID or Element ID where observed
}

export interface Entity {
  name: string; // e.g., "User", "Order", "Product"
  description: string;
  fields: EntityField[];
  relationships: {
    entity: string;
    type: "one-to-one" | "one-to-many" | "many-to-many";
    field: string;
  }[];
  timestamps: {
    createdAt?: boolean;
    updatedAt?: boolean;
    deletedAt?: boolean;
  };
  softDelete: boolean;
}

export interface DataModel {
  version: string;
  generatedAt: string;
  entities: Entity[];
  enums: {
    name: string;
    values: string[];
    source: string;
  }[];
  totalEntities: number;
  totalFields: number;
}

// ============================================================================
// API SPECIFICATION (OpenAPI 3.0)
// ============================================================================

export interface APIEndpoint {
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  summary: string;
  description: string;
  tags: string[];
  operationId: string;
  parameters?: {
    name: string;
    in: "path" | "query" | "header";
    required: boolean;
    schema: {
      type: string;
      format?: string;
      enum?: string[];
    };
    description: string;
  }[];
  requestBody?: {
    required: boolean;
    content: {
      "application/json": {
        schema: Record<string, unknown>;
        example: Record<string, unknown>;
      };
    };
  };
  responses: {
    [statusCode: string]: {
      description: string;
      content?: {
        "application/json": {
          schema: Record<string, unknown>;
          example: Record<string, unknown>;
        };
      };
    };
  };
  security?: Record<string, string[]>[];
  videoEvidence: {
    timestamp: string;
    screenId: string;
    interactionId: string;
  };
}

export interface APISpecification {
  openapi: "3.0.3";
  info: {
    title: string;
    description: string;
    version: string;
    contact: {
      name: string;
      email: string;
    };
  };
  servers: {
    url: string;
    description: string;
  }[];
  tags: {
    name: string;
    description: string;
  }[];
  paths: Record<string, Record<string, APIEndpoint>>;
  components: {
    schemas: Record<string, unknown>;
    securitySchemes: Record<string, unknown>;
  };
}

// ============================================================================
// DOCUMENTATION
// ============================================================================

export interface DocumentationSection {
  id: string;
  title: string;
  content: string; // Markdown
  subsections?: DocumentationSection[];
  diagrams?: {
    type: "mermaid" | "svg" | "png";
    content: string;
    caption: string;
  }[];
  codeExamples?: {
    language: string;
    code: string;
    description: string;
  }[];
}

export interface Documentation {
  version: string;
  generatedAt: string;
  sections: {
    overview: DocumentationSection;
    architecture: DocumentationSection;
    components: DocumentationSection;
    dataModel: DocumentationSection;
    apiIntegration: DocumentationSection;
    businessLogic: DocumentationSection;
    deployment: DocumentationSection;
    testing: DocumentationSection;
  };
  glossary: {
    term: string;
    definition: string;
    relatedTerms?: string[];
  }[];
  changelog: {
    version: string;
    date: string;
    changes: string[];
  }[];
}

// ============================================================================
// GENERATED CODE FILES
// ============================================================================

export interface GeneratedFile {
  path: string;
  name: string;
  content: string;
  type: "component" | "page" | "hook" | "service" | "type" | "util" | "config" | "test" | "style" | "doc";
  language: "tsx" | "ts" | "css" | "json" | "md" | "yaml";
  description: string;
  dependencies: string[];
  exports: string[];
  lineCount: number;
  videoEvidence?: {
    screenIds: string[];
    timestamps: string[];
  };
}

export interface ComponentMetadata {
  name: string;
  path: string;
  description: string;
  props: {
    name: string;
    type: string;
    required: boolean;
    default?: string;
    description: string;
  }[];
  accessibility: {
    ariaLabels: string[];
    keyboardNav: boolean;
    focusManagement: boolean;
  };
  businessRules: string[]; // BL### IDs
  videoTimestamps: string[];
}

// ============================================================================
// TEST SCAFFOLDS
// ============================================================================

export interface TestCase {
  id: string;
  name: string;
  type: "unit" | "integration" | "e2e" | "accessibility";
  component: string;
  description: string;
  steps: string[];
  expectedResult: string;
  businessRule?: string; // BL### ID
  priority: "critical" | "high" | "medium" | "low";
}

export interface QAChecklist {
  category: string;
  items: {
    id: string;
    description: string;
    status: "pending" | "pass" | "fail" | "skip";
    notes?: string;
  }[];
}

export interface TestingSuite {
  version: string;
  generatedAt: string;
  testCases: TestCase[];
  qaChecklists: QAChecklist[];
  coverage: {
    components: number;
    businessRules: number;
    accessibility: number;
  };
}

// ============================================================================
// COMPLETE ENTERPRISE PACKAGE
// ============================================================================

export interface EnterprisePackage {
  id: string;
  version: string;
  generatedAt: string;
  projectName: string;
  
  // Source
  source: {
    videoUrl: string;
    videoDuration: string;
    videoFramesAnalyzed: number;
  };
  
  // Configuration
  config: {
    preset: EnterprisePreset;
    industry: string;
    targetFramework: "react" | "next" | "vue" | "svelte";
    typescript: boolean;
    styling: "tailwind" | "css-modules" | "styled-components";
  };
  
  // Analysis Phase Outputs
  analysis: {
    screenInventory: ScreenInventory;
    interactionFlowMap: InteractionFlowMap;
    dataModel: DataModel;
  };
  
  // Generation Phase Outputs
  generation: {
    files: GeneratedFile[];
    components: ComponentMetadata[];
    apiSpec: APISpecification;
    documentation: Documentation;
    testing: TestingSuite;
  };
  
  // Quality Metrics
  quality: {
    contentFidelity: {
      textAccuracy: string;
      dataAccuracy: string;
      uncertainItems: number;
    };
    codeQuality: {
      typescriptStrict: boolean;
      noAnyTypes: boolean;
      lintErrors: number;
      testCoverage: string;
    };
    accessibility: {
      wcagLevel: "A" | "AA" | "AAA";
      violations: number;
    };
  };
  
  // Export
  export: {
    zipUrl?: string;
    gitRepoUrl?: string;
    previewUrl?: string;
  };
}

// ============================================================================
// GENERATION STATUS
// ============================================================================

export interface GenerationPhase {
  id: string;
  name: string;
  status: "pending" | "running" | "complete" | "error";
  progress: number; // 0-100
  startedAt?: string;
  completedAt?: string;
  error?: string;
  output?: unknown;
}

export interface EnterpriseGenerationStatus {
  projectId: string;
  status: "initializing" | "analyzing" | "generating" | "packaging" | "complete" | "error";
  phases: {
    videoProcessing: GenerationPhase;
    screenInventory: GenerationPhase;
    interactionMapping: GenerationPhase;
    dataModelExtraction: GenerationPhase;
    codeGeneration: GenerationPhase;
    documentationGeneration: GenerationPhase;
    apiSpecGeneration: GenerationPhase;
    testingGeneration: GenerationPhase;
    packaging: GenerationPhase;
  };
  overallProgress: number;
  estimatedTimeRemaining?: string;
  currentPhaseMessage?: string;
}
