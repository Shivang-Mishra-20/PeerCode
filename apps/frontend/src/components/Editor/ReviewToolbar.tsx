import React from 'react';
import { Sparkles, StopCircle, RefreshCw, Layers } from 'lucide-react';
import { AIOperation, AIReviewStatus } from '../../types/ai';

export interface ReviewToolbarProps {
  status: AIReviewStatus;
  activeModel: string;
  activeProvider: string;
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
  onRequestOperation: (op: AIOperation) => void;
  onCancel: () => void;
}

export const ReviewToolbar: React.FC<ReviewToolbarProps> = ({
  status,
  activeModel,
  activeProvider,
  isDrawerOpen,
  onToggleDrawer,
  onRequestOperation,
  onCancel,
}) => {
  const isBusy = status === 'loading' || status === 'streaming';

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-xs">
      <div className="flex items-center space-x-3">
        {/* Dynamic Model & Provider Badge */}
        <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono font-medium text-[11px] capitalize">{activeProvider}</span>
          <span className="text-slate-500">/</span>
          <span className="font-mono font-semibold text-emerald-400 text-[11px]">
            {activeModel}
          </span>
        </div>

        {/* Future-Ready Extensible Operation Button Group */}
        <div className="flex items-center space-x-1 border-l border-slate-800 pl-3">
          <button
            onClick={() => onRequestOperation('review')}
            disabled={isBusy}
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition disabled:opacity-50"
          >
            {isBusy ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Review Code</span>
          </button>

          <button
            onClick={() => onRequestOperation('explain')}
            disabled={isBusy}
            className="px-2 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-medium transition disabled:opacity-50"
            title="Explain Code"
          >
            Explain
          </button>

          <button
            onClick={() => onRequestOperation('generate_tests')}
            disabled={isBusy}
            className="px-2 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-medium transition disabled:opacity-50"
            title="Generate Unit Tests"
          >
            Tests
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {isBusy && (
          <button
            onClick={onCancel}
            className="flex items-center space-x-1 px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-medium transition"
          >
            <StopCircle className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
        )}

        <button
          onClick={onToggleDrawer}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded font-medium border transition ${
            isDrawerOpen
              ? 'bg-slate-800 text-indigo-400 border-indigo-500/50'
              : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>AI Panel</span>
        </button>
      </div>
    </div>
  );
};
