import React, { useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import type * as monaco from 'monaco-editor';
import { SupportedLanguage } from '@peercode/shared';
import AppLayout from '../components/layout/AppLayout';
import { CodeEditor } from '../components/Editor/CodeEditor';
import { ReviewToolbar } from '../components/Editor/ReviewToolbar';
import { AIReviewDrawer } from '../components/AI/AIReviewDrawer';
import { useYjs } from '../hooks/useYjs';
import { useAIReview } from '../hooks/useAIReview';
import { AIOperation } from '../types/ai';

export const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const activeRoomId = roomId || 'session-demo';

  const [language, setLanguage] = useState<SupportedLanguage>('javascript');
  const [cursorPos, setCursorPos] = useState<{ line: number; column: number }>({
    line: 1,
    column: 1,
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  // Ensure stable username per browser session render
  const userName = useMemo(() => `Developer ${Math.floor(Math.random() * 1000)}`, []);

  // Connect to Yjs WebSocket Server using custom hook
  const { yText, provider, status, awarenessUsers } = useYjs({
    roomId: activeRoomId,
    userName,
  });

  // Connect AI Review Hook
  const {
    status: aiStatus,
    stage: aiStage,
    streamingText,
    currentResponse,
    errorMessage,
    reviewHistory,
    activeModel,
    activeProvider,
    requestAIOperation,
    cancelReview,
    clearDiagnostics,
    selectHistoryItem,
  } = useAIReview({
    roomId: activeRoomId,
    editorRef,
    language,
  });

  const handleRequestOperation = (op: AIOperation) => {
    setIsDrawerOpen(true);
    requestAIOperation(op);
  };

  const handleJumpToLine = (line: number) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(line);
      editorRef.current.setPosition({ lineNumber: line, column: 1 });
      editorRef.current.focus();
    }
  };

  return (
    <AppLayout
      activeRoomId={activeRoomId}
      activeLanguage={language}
      onLanguageChange={(newLang) => setLanguage(newLang)}
      cursorPosition={cursorPos}
      showAiPanelDefault={true}
      connectionStatus={status}
      awarenessUsers={awarenessUsers}
    >
      <div className="flex-1 h-full w-full flex flex-col relative overflow-hidden">
        {/* Review Toolbar with Dynamic Model Status Badge */}
        <ReviewToolbar
          status={aiStatus}
          activeModel={activeModel}
          activeProvider={activeProvider}
          isDrawerOpen={isDrawerOpen}
          onToggleDrawer={() => setIsDrawerOpen((prev) => !prev)}
          onRequestOperation={handleRequestOperation}
          onCancel={cancelReview}
        />

        {/* Editor Workspace & Slide-out AI Review Drawer */}
        <div className="flex-1 flex w-full h-full relative overflow-hidden">
          <div className="flex-1 h-full relative">
            <CodeEditor
              language={language}
              provider={provider}
              yText={yText}
              onEditorMount={(ed: monaco.editor.IStandaloneCodeEditor) => {
                editorRef.current = ed;
              }}
              onCursorChange={(line: number, column: number) => setCursorPos({ line, column })}
            />
          </div>

          <AIReviewDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            status={aiStatus}
            stage={aiStage}
            streamingText={streamingText}
            response={currentResponse}
            errorMessage={errorMessage}
            reviewHistory={reviewHistory}
            onSelectHistoryItem={selectHistoryItem}
            onClearDiagnostics={clearDiagnostics}
            onJumpToLine={handleJumpToLine}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default Room;
