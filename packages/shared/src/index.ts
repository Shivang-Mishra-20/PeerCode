// Shared TypeScript interfaces and contract types for PeerCode

export type SupportedLanguage = 'javascript' | 'typescript' | 'python' | 'cpp';

export interface UserPresence {
  id: string;
  name: string;
  color: string;
  cursor?: {
    line: number;
    column: number;
  };
}

export interface AIReviewItem {
  id: string;
  line: number;
  type: 'bug' | 'smell' | 'inefficiency' | 'unused';
  title: string;
  explanation: string;
  suggestedFix?: string;
}

export interface AIReviewResponse {
  roomId: string;
  timestamp: string;
  language: SupportedLanguage;
  suggestions: AIReviewItem[];
}
