export interface RequestLog {
  id: string;
  apiKeyId: string;
  apiKeyName?: string;
  apiKeyPrefix?: string;
  method: string;
  endpoint: string;
  statusCode: number;
  latencyMs: number;
  requestPayload?: Record<string, unknown>;
  responseBody?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

export interface SparklineDataPoint {
  date: string; // ISO date string e.g. "2024-01-15"
  count: number;
}

export interface LogFilter {
  apiKeyId?: string;
  method?: string;
  statusCode?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}
