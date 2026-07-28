import React from 'react';
import { AlertOctagon, AlertTriangle, Info, ArrowUpRight } from 'lucide-react';
import { IssueItem } from '../../types/ai';

export interface IssuesTabProps {
  issues: IssueItem[];
  onJumpToLine?: (line: number) => void;
}

export const IssuesTab: React.FC<IssuesTabProps> = ({ issues, onJumpToLine }) => {
  if (!issues || issues.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        No code issues detected. Code structure looks clean!
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {issues.map((issue, idx) => {
        const isError = issue.severity === 'error';
        const isWarning = issue.severity === 'warning';

        return (
          <div
            key={idx}
            className={`p-3 rounded-lg border text-xs space-y-2 transition ${
              isError
                ? 'bg-rose-950/20 border-rose-900/50 text-rose-200'
                : isWarning
                  ? 'bg-amber-950/20 border-amber-900/50 text-amber-200'
                  : 'bg-sky-950/20 border-sky-900/50 text-sky-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isError ? (
                  <AlertOctagon className="w-4 h-4 text-rose-400" />
                ) : isWarning ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                ) : (
                  <Info className="w-4 h-4 text-sky-400" />
                )}
                <span className="font-semibold uppercase text-[10px] tracking-wider">
                  {issue.severity}
                </span>
                <span className="font-mono text-slate-400">Line {issue.line}</span>
              </div>

              {onJumpToLine && (
                <button
                  onClick={() => onJumpToLine(issue.line)}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[10px] transition"
                >
                  <span>Go to L{issue.line}</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              )}
            </div>

            <p className="text-slate-300 leading-relaxed font-sans">{issue.message}</p>

            {issue.suggestion && (
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap">
                <span className="text-emerald-400 text-[10px] uppercase font-bold block mb-1">
                  Suggested Fix
                </span>
                {issue.suggestion}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
