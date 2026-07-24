import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2,
  FolderGit2,
  Settings,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Terminal,
  Activity,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Sparkle,
  ChevronDown,
  Command,
} from 'lucide-react';
import { SupportedLanguage } from '@peercode/shared';
import IconButton from '../ui/IconButton';
import Badge from '../ui/Badge';

export interface AppLayoutProps {
  children: React.ReactNode;
  activeLanguage?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  cursorPosition?: { line: number; column: number };
  activeRoomId?: string;
  showAiPanelDefault?: boolean;
}

const SUPPORTED_LANGUAGES: { id: SupportedLanguage; label: string; ext: string }[] = [
  { id: 'javascript', label: 'JavaScript', ext: '.js' },
  { id: 'typescript', label: 'TypeScript', ext: '.ts' },
  { id: 'python', label: 'Python', ext: '.py' },
  { id: 'cpp', label: 'C++', ext: '.cpp' },
];

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activeLanguage = 'javascript',
  onLanguageChange,
  cursorPosition = { line: 1, column: 1 },
  activeRoomId,
  showAiPanelDefault = false,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [aiPanelOpen, setAiPanelOpen] = useState(showAiPanelDefault);
  const [activeTab, setActiveTab] = useState<'rooms' | 'files' | 'settings'>('rooms');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setAiPanelOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0d1117] text-gray-100 overflow-hidden select-none font-sans">
      {/* Handcrafted Desktop App Header */}
      <header className="h-9 min-h-[36px] bg-[#161b22] border-b border-[#30363d] px-2.5 flex items-center justify-between z-30">
        <div className="flex items-center space-x-2.5">
          <IconButton
            icon={
              sidebarOpen ? (
                <PanelLeftClose className="w-3.5 h-3.5" />
              ) : (
                <PanelLeftOpen className="w-3.5 h-3.5" />
              )
            }
            label="Toggle Sidebar (⌘B)"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            size="sm"
          />

          {/* Brand & Breadcrumbs */}
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-5 h-5 rounded bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Code2 className="w-3 h-3 text-blue-400" />
            </div>
            <span className="font-semibold text-gray-200 tracking-tight">PeerCode</span>

            <span className="text-[#30363d]">/</span>

            <span className="text-gray-400 font-mono text-[11px]">workspace</span>

            {activeRoomId && (
              <>
                <span className="text-[#30363d]">/</span>
                <Badge variant="accent" size="sm" className="font-mono">
                  {activeRoomId}
                </Badge>
              </>
            )}
          </div>
        </div>

        {/* Right Header Toolbar Controls */}
        <div className="flex items-center space-x-2">
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono bg-[#21262d] text-gray-200 border border-[#30363d] rounded hover:border-[#484f58] transition-colors"
            >
              <Terminal className="w-3 h-3 text-blue-400" />
              <span className="capitalize">{activeLanguage}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            <AnimatePresence>
              {isLangDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 mt-1 w-40 bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl z-40 py-1 overflow-hidden"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => {
                        if (onLanguageChange) onLanguageChange(lang.id);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs font-mono transition-colors flex items-center justify-between ${
                        activeLanguage === lang.id
                          ? 'bg-blue-600/15 text-blue-400 font-semibold'
                          : 'text-gray-300 hover:bg-[#21262d]'
                      }`}
                    >
                      <span>{lang.label}</span>
                      <span className="text-[10px] text-gray-500">{lang.ext}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <span className="text-[#30363d] text-xs">|</span>

          {/* AI Inspector Toggle Button */}
          <IconButton
            icon={
              aiPanelOpen ? (
                <PanelRightClose className="w-3.5 h-3.5" />
              ) : (
                <PanelRightOpen className="w-3.5 h-3.5" />
              )
            }
            label="Toggle AI Inspector (⌘I)"
            onClick={() => setAiPanelOpen(!aiPanelOpen)}
            variant={aiPanelOpen ? 'active' : 'ghost'}
            size="sm"
          />
        </div>
      </header>

      {/* Main Desktop App Workspace Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Activity Sidebar */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 230, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
              className="h-full bg-[#161b22] border-r border-[#30363d] flex flex-col z-10 overflow-hidden"
            >
              {/* Activity Tab Controls */}
              <div className="flex items-center px-2 py-1.5 border-b border-[#30363d] gap-1 bg-[#161b22]">
                <button
                  onClick={() => setActiveTab('rooms')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded text-[11px] font-medium transition-colors ${
                    activeTab === 'rooms'
                      ? 'bg-[#21262d] text-white border border-[#30363d]'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  Sessions
                </button>
                <button
                  onClick={() => setActiveTab('files')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded text-[11px] font-medium transition-colors ${
                    activeTab === 'files'
                      ? 'bg-[#21262d] text-white border border-[#30363d]'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <FolderGit2 className="w-3 h-3" />
                  Files
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`p-1 rounded text-gray-400 hover:text-gray-200 transition-colors ${
                    activeTab === 'settings' ? 'bg-[#21262d] text-white' : ''
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto p-2.5 space-y-3 text-xs">
                {activeTab === 'rooms' && (
                  <div className="space-y-2">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                      Active Workspace
                    </span>
                    <div className="p-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-200">Current Session</span>
                        <Badge variant="success" size="sm" dot>
                          Live
                        </Badge>
                      </div>
                      <p className="text-[11px] text-gray-500 font-mono truncate">
                        {activeRoomId || 'session-demo'}
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'files' && (
                  <div className="space-y-2">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                      Workspace Files
                    </span>
                    <div className="flex items-center gap-2 px-2 py-1.5 bg-[#21262d] border border-[#30363d] rounded text-blue-400 font-mono text-xs">
                      <Code2 className="w-3.5 h-3.5" />
                      <span>
                        main.
                        {SUPPORTED_LANGUAGES.find((l) => l.id === activeLanguage)?.ext.replace(
                          '.',
                          ''
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="space-y-3">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                      IDE Shortcuts
                    </span>
                    <div className="space-y-2 text-[11px] text-gray-400">
                      <div className="flex justify-between items-center">
                        <span>Toggle Sidebar</span>
                        <div className="flex items-center gap-0.5 px-1 py-0.5 bg-[#21262d] border border-[#30363d] rounded text-[10px] font-mono">
                          <Command className="w-2.5 h-2.5" />B
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Toggle AI Panel</span>
                        <div className="flex items-center gap-0.5 px-1 py-0.5 bg-[#21262d] border border-[#30363d] rounded text-[10px] font-mono">
                          <Command className="w-2.5 h-2.5" />I
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Central Editor Workspace Viewport */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0d1117] relative overflow-hidden">
          {children}
        </main>

        {/* Right AI Review Inspector Panel */}
        <AnimatePresence initial={false}>
          {aiPanelOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
              className="h-full bg-[#161b22] border-l border-[#30363d] flex flex-col z-10 overflow-hidden"
            >
              <div className="h-9 px-3 border-b border-[#30363d] flex items-center justify-between bg-[#161b22]">
                <div className="flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-gray-200">AI Inspector</span>
                </div>
                <Badge variant="purple" size="sm">
                  Qwen2.5-Coder
                </Badge>
              </div>

              {/* Inspector Section Cards */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto text-xs">
                <div className="p-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Code Quality: Optimal</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Local LLM constantly evaluates active document AST for code smells and runtime
                    efficiency.
                  </p>
                </div>

                <div className="p-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Security Audit: Clean</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    0 security vulnerabilities or unhandled exceptions detected.
                  </p>
                </div>

                <div className="p-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-400 font-semibold text-[11px]">
                    <Sparkle className="w-3.5 h-3.5" />
                    <span>Contextual Insights</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Select code inside Monaco Editor to trigger targeted inline AI explanations.
                  </p>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Handcrafted Compact Desktop Status Bar */}
      <footer className="h-5 min-h-[20px] bg-[#161b22] border-t border-[#30363d] px-2.5 flex items-center justify-between text-[10px] font-mono text-gray-400 select-none z-30">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 text-emerald-400">
            <Activity className="w-2.5 h-2.5" />
            <span>Ready</span>
          </div>
          <span className="text-[#30363d]">|</span>
          <div className="flex items-center space-x-1 text-gray-300">
            <Terminal className="w-2.5 h-2.5 text-blue-400" />
            <span className="uppercase">{activeLanguage}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-gray-400">
          <span>
            Ln {cursorPosition.line}, Col {cursorPosition.column}
          </span>
          <span className="text-[#30363d]">|</span>
          <span>UTF-8</span>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
