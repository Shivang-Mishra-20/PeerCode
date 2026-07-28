import React from 'react';
import { FileText, AlertTriangle, GitPullRequest, Info } from 'lucide-react';

export type TabType = 'summary' | 'issues' | 'refactor' | 'metadata';

export interface ReviewTabsProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  issueCount: number;
  refactorCount: number;
}

export const ReviewTabs: React.FC<ReviewTabsProps> = ({
  activeTab,
  onSelectTab,
  issueCount,
  refactorCount,
}) => {
  const tabs: { id: TabType; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'summary', label: 'Summary', icon: <FileText className="w-3.5 h-3.5" /> },
    {
      id: 'issues',
      label: 'Issues',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      badge: issueCount,
    },
    {
      id: 'refactor',
      label: 'Refactor',
      icon: <GitPullRequest className="w-3.5 h-3.5" />,
      badge: refactorCount,
    },
    { id: 'metadata', label: 'Info', icon: <Info className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex items-center space-x-1 border-b border-slate-800 bg-slate-900/60 px-3 pt-2">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-medium border-b-2 transition ${
              isActive
                ? 'border-indigo-500 text-indigo-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                  isActive ? 'bg-indigo-500/30 text-indigo-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
