import React, { useState } from 'react';
import { Copy, Check, GitPullRequest } from 'lucide-react';
import { RefactorItem } from '../../types/ai';

export interface RefactorTabProps {
  refactoring: RefactorItem[];
}

export const RefactorTab: React.FC<RefactorTabProps> = ({ refactoring }) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  if (!refactoring || refactoring.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        No refactoring suggestions for this review.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {refactoring.map((item, idx) => (
        <div
          key={idx}
          className="p-3 rounded-lg border border-slate-800 bg-slate-950/80 text-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-indigo-400 font-medium">
              <GitPullRequest className="w-4 h-4" />
              <span>
                Lines {item.line_start} - {item.line_end}
              </span>
            </div>

            <button
              onClick={() => handleCopy(item.suggested_code, idx)}
              className="flex items-center space-x-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition"
            >
              {copiedIdx === idx ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <p className="text-slate-300 font-sans leading-relaxed">{item.description}</p>

          <div className="bg-slate-900 p-3 rounded border border-slate-800 font-mono text-[11px] text-emerald-300 whitespace-pre-wrap overflow-x-auto">
            {item.suggested_code}
          </div>
        </div>
      ))}
    </div>
  );
};
