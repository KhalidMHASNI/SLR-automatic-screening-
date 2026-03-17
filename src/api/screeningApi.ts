import { BatchScreenRequest, BatchScreenResponse, HealthResponse, ModelsResponse, ParsedPaper, ScreenedPaper } from '../types';

const BASE_URL = 'http://localhost:8080/api';

export const fetchHealth = async (): Promise<HealthResponse> => {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
};

export const fetchModels = async (): Promise<ModelsResponse> => {
  const res = await fetch(`${BASE_URL}/models`);
  if (!res.ok) throw new Error('Failed to fetch models');
  return res.json();
};

export const screenBatch = async (request: BatchScreenRequest): Promise<BatchScreenResponse> => {
  const res = await fetch(`${BASE_URL}/screen/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  
  if (!res.ok) {
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After');
      throw new Error(`Rate limited. Retry after ${retryAfter || 60}s`);
    }
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Batch screening failed');
  }
  
  return res.json();
};

export const screenSingle = async (thesis: string, paper: ParsedPaper): Promise<ScreenedPaper> => {
  const res = await fetch(`${BASE_URL}/screen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ thesis, ...paper }),
  });
  
  if (!res.ok) {
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After');
      throw new Error(`Rate limited. Retry after ${retryAfter || 60}s`);
    }
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Single screening failed');
  }
  
  const data = await res.json();
  return { ...paper, ...data };
};
