import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { SupportedLanguage } from '@peercode/shared';
import AppLayout from '../components/layout/AppLayout';
import CodeEditor from '../components/Editor/CodeEditor';
import { useYjs } from '../hooks/useYjs';

export const Room: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const activeRoomId = roomId || 'session-demo';

  const [language, setLanguage] = useState<SupportedLanguage>('javascript');
  const [cursorPos, setCursorPos] = useState<{ line: number; column: number }>({
    line: 1,
    column: 1,
  });

  // Ensure stable username per browser session render
  const userName = useMemo(() => `Developer ${Math.floor(Math.random() * 1000)}`, []);

  // Connect to Yjs WebSocket Server using custom hook
  const { yText, provider, status, awarenessUsers } = useYjs({
    roomId: activeRoomId,
    userName,
  });

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
      <div className="flex-1 h-full w-full relative">
        <CodeEditor
          language={language}
          provider={provider}
          yText={yText}
          onCursorChange={(line, column) => setCursorPos({ line, column })}
        />
      </div>
    </AppLayout>
  );
};

export default Room;
