import React, { useState } from 'react';
import { X, Trash2, AlertCircle, History } from 'lucide-react';
import { AIGenerateResponse, AIReviewStatus, ReviewHistoryItem } from '../../types/ai';
import { ReviewTabs, TabType } from './ReviewTabs';
import { SummaryTab } from './SummaryTab';
import { IssuesTab } from './IssuesTab';
import { RefactorTab } from './RefactorTab';
import { MetadataTab } from './MetadataTab';

export interface AIReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  status: AIReviewStatus;
  stage: string;
  streamingText: string;
  response: AIGenerateResponse | null;
  errorMessage: string | null;
  reviewHistory: ReviewHistoryItem[];
  onSelectHistoryItem: (item: ReviewHistoryItem) => void;
  onClearDiagnostics: () => void;
  onJumpToLine?: (line: number) => void;
}

export const AIReviewDrawer: React.FC<AIReviewDrawerProps> = ({
  isOpen,
  onClose,
  status,
  stage,
  streamingText,
  response,
  errorMessage,
  reviewHistory,
  onSelectHistoryItem,
  onClearDiagnostics,
  onJumpToLine,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('summary');

  if (!isOpen) return null;

  const issueCount = response?.issues?.length || 0;
  const refactorCount = response?.refactor?.length || 0;

  return (
    <div className="w-96 h-full bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl z-20 transition-all duration-300">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/80">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="font-semibold text-xs text-slate-200 uppercase tracking-wider">
            AI Peer Review
          </span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={onClearDiagnostics}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
            title="Clear Diagnostics & Markers"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            title="Close Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Session History Selector (if multiple reviews exist) */}
      {reviewHistory.length > 1 && (
        <div className="px-3 py-1.5 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center space-x-1">
            <History className="w-3 h-3 text-indigo-400" />
            <span>History ({reviewHistory.length}):</span>
          </div>
          <select
            onChange={(e) => {
              const item = reviewHistory.find((h) => h.id === e.target.value);
              if (item) onSelectHistoryItem(item);
            }}
            value={response?.metadata?.requestId || ''}
            className="bg-slate-800 text-slate-200 text-[10px] rounded border border-slate-700 px-1.5 py-0.5 focus:outline-none"
          >
            {reviewHistory.map((h, i) => (
              <option key={h.id} value={h.id}>
                #{reviewHistory.length - i} ({new Date(h.createdAt).toLocaleTimeString()})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Sub-status stage banner */}
      {stage && status !== 'idle' && (
        <div className="px-4 py-1.5 bg-indigo-950/30 border-b border-indigo-900/30 text-[11px] font-mono text-indigo-300">
          {stage}
        </div>
      )}

      {/* Error Card */}
      {status === 'failed' && errorMessage && (
        <div className="m-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200 space-y-2">
          <div className="flex items-center space-x-2 font-semibold text-rose-300">
            <AlertCircle className="w-4 h-4" />
            <span>Review Request Failed</span>
          </div>
          <p className="text-slate-300 leading-relaxed font-sans">{errorMessage}</p>
        </div>
      )}

      {/* Modular Tab Bar */}
      <ReviewTabs
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        issueCount={issueCount}
        refactorCount={refactorCount}
      />

      {/* Active Tab View Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'summary' && (
          <SummaryTab status={status} streamingText={streamingText} response={response} />
        )}
        {activeTab === 'issues' && (
          <IssuesTab issues={response?.issues || []} onJumpToLine={onJumpToLine} />
        )}
        {activeTab === 'refactor' && <RefactorTab refactoring={response?.refactor || []} />}
        {activeTab === 'metadata' && <MetadataTab metadata={response?.metadata} />}
      </div>
    </div>
  );
};
