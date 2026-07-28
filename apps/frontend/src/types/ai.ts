export type AIOperation = 'review' | 'chat' | 'explain' | 'generate_tests';
export type IssueSeverity = 'error' | 'warning' | 'info';

export interface IssueItem {
  line: number;
  severity: IssueSeverity;
  message: string;
  suggestion?: string;
}

export interface RefactorItem {
  line_start: number;
  line_end: number;
  description: string;
  suggested_code: string;
}

export interface ResponseMetadata {
  requestId: string;
  provider: string;
  model: string;
  durationMs: number;
  tokensGenerated: number;
}

export interface AIGenerateResponse {
  summary: string;
  issues: IssueItem[];
  refactor: RefactorItem[];
  code_output?: string;
  explanation?: string;
  metadata: ResponseMetadata;
}

export interface ReviewHistoryItem {
  id: string;
  createdAt: number;
  response: AIGenerateResponse;
}

export type AIReviewStatus = 'idle' | 'loading' | 'streaming' | 'success' | 'cancelled' | 'failed';
