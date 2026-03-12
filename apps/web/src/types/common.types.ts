export enum Environment {
  PRODUCTION = 'PRODUCTION',
  SANDBOX = 'SANDBOX',
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
}
