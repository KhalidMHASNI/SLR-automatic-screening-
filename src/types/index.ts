export interface ParsedPaper {
  id: string; // generated client-side
  title: string;
  abstract?: string;
  keywords?: string;
  year?: string;
  authors?: string;
  journal?: string;
  model?: string;
}

export interface ScreenedPaper extends ParsedPaper {
  decision: "INCLUDE" | "EXCLUDE" | "MAYBE" | "ERROR";
  confidence: number;
  similarity: number;
  reason: string;
  summary: string | null;
}

export interface ScreeningProgress {
  done: number;
  total: number;
}

export interface SessionMeta {
  durationMs: number;
  startedAt: string;
}

export interface HealthResponse {
  status: string;
  ollama: boolean;
  model: string;
  ollamaLatencyMs: number;
  timestamp: string;
}

export interface ModelsResponse {
  models: string[];
  activeModel: string;
}

export interface BatchScreenRequest {
  thesis: string;
  papers: ParsedPaper[];
}

export interface BatchScreenResponse {
  results: Array<{
    decision: "INCLUDE" | "EXCLUDE" | "MAYBE";
    confidence: number;
    similarity: number;
    reason: string;
    summary: string | null;
  }>;
  totalProcessed: number;
  durationMs: number;
}
