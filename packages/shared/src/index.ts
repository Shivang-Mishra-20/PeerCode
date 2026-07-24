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
  type: string; // Extensible suggestion category string (e.g. 'bug', 'smell', 'performance', 'security', 'unused')
  title: string;
  explanation: string;
  suggestedFix?: string;
  metadata?: Record<string, unknown>;
}

export interface AIReviewResponse {
  id?: string;
  roomId: string;
  timestamp: string;
  language: SupportedLanguage;
  model?: string;
  suggestions: AIReviewItem[];
}

export interface CreateRoomPayload {
  name?: string;
  language?: SupportedLanguage;
}

export interface RoomResponse {
  id: string;
  name: string | null;
  language: SupportedLanguage;
  createdAt: string;
  updatedAt: string;
}

export interface CodeSnapshotDTO {
  id: string;
  roomId: string;
  content: string;
  language: SupportedLanguage;
  createdAt: string;
}
