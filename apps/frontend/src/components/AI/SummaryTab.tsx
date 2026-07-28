import React from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';
import { AIGenerateResponse, AIReviewStatus } from '../../types/ai';

export interface SummaryTabProps {
  status: AIReviewStatus;
  streamingText: string;
  response: AIGenerateResponse | null;
}

export const SummaryTab: React.FC<SummaryTabProps> = ({ status, streamingText, response }) => {
  if (status === 'streaming' || status === 'loading') {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center space-x-2 text-xs font-mono text-indigo-400 animate-pulse">
          <Sparkles className="w-4 h-4" />
          <span>Generating AI Analysis...</span>
        </div>
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
          {streamingText || 'Waiting for tokens...'}
          <span className="inline-block w-2 h-4 ml-1 bg-indigo-500 animate-ping" />
        </div>
      </div>
    );
  }

  if (!response && !streamingText) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        No review output available. Click "Review Code" to start analysis.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 text-xs">
      <div className="flex items-center space-x-2 text-emerald-400 font-semibold border-b border-slate-800 pb-2">
        <CheckCircle className="w-4 h-4" />
        <span>Analysis Summary</span>
      </div>

      <div className="text-slate-300 leading-relaxed font-sans bg-slate-950 p-4 rounded-lg border border-slate-800 whitespace-pre-wrap">
        {response?.summary || streamingText}
      </div>

      {response?.explanation && (
        <div className="space-y-2">
          <span className="font-semibold text-slate-400">Detailed Explanation</span>
          <div className="bg-slate-950/80 p-3 rounded border border-slate-800 text-slate-300 whitespace-pre-wrap">
            {response.explanation}
          </div>
        </div>
      )}
    </div>
  );
};
