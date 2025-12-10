// Engine configuration types matching Rust structs

export interface ModelPack {
  label: string;
  analysisModel: string;
  reportModel: string;
  embeddingModel: string;
}

export interface EngineConfig {
  provider: string;
  baseUrl: string;
  activePackId: string | null;
  packs: Record<string, ModelPack>;
}

export interface EngineHealth {
  ollamaAvailable: boolean;
  engineConfigured: boolean;
  activePackId: string | null;
  missingModels: string[];
  gpuSummary?: {
    vendor: "nvidia" | "amd" | "intel" | "none";
    vramGb: number | null;
  };
}

export interface EngineChatRequest {
  role: "analysis" | "gossip";
  question: string;
  contextSummary: string;
  projectMeta: {
    name: string;
    audience: "self" | "team" | "exec";
  };
}

export interface EngineReportRequest {
  templateType: "executive_summary" | "sales_overview" | "market_snapshot" | "general";
  audience: "self" | "team" | "exec";
  dataSummary: string;
}

export interface EngineReportResponse {
  markdown: string;
  modelName: string;
}

// Default config structure
export const DEFAULT_CONFIG: EngineConfig = {
  provider: "ollama",
  baseUrl: "http://127.0.0.1:11434",
  activePackId: "analyst_fast",
  packs: {
    light_fast: {
      label: "Fast & Light",
      analysisModel: "qwen3:4b",
      reportModel: "qwen3:4b",
      embeddingModel: "qwen3-embedding:4b",
    },
    analyst_fast: {
      label: "Analyst Pack (Recommended)",
      analysisModel: "gurubot/glm-4.6v-flash-gguf:q4_k_m",
      reportModel: "gurubot/glm-4.6v-flash-gguf:q4_k_m",
      embeddingModel: "qwen3-embedding:4b",
    },
  },
};

