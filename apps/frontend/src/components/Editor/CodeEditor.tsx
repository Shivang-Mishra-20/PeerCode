import React, { useRef, useEffect } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { MonacoBinding } from 'y-monaco';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';
import { SupportedLanguage } from '@peercode/shared';

export interface CodeEditorProps {
  language?: SupportedLanguage;
  value?: string;
  onChange?: (value: string | undefined) => void;
  onCursorChange?: (line: number, column: number) => void;
  readOnly?: boolean;
  provider?: WebsocketProvider | null;
  yText?: Y.Text | null;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  language = 'javascript',
  value,
  onChange,
  onCursorChange,
  readOnly = false,
  provider,
  yText,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const boundKeyRef = useRef<string | null>(null);

  // Bind Yjs Y.Text to Monaco model using MonacoBinding safely
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && provider && yText && yText.doc) {
      const model = editor.getModel();
      const newKey = `${yText.doc.clientID}-${provider.url}`;

      // Only create a new binding if binding key changes or does not exist
      if (model && boundKeyRef.current !== newKey) {
        if (bindingRef.current) {
          bindingRef.current.destroy();
          bindingRef.current = null;
        }

        const binding = new MonacoBinding(yText, model, new Set([editor]), provider.awareness);
        bindingRef.current = binding;
        boundKeyRef.current = newKey;
      }
    }

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
        boundKeyRef.current = null;
      }
    };
  }, [provider, yText]);

  const handleEditorDidMount: OnMount = (editor, _monaco) => {
    editorRef.current = editor;

    // Track cursor position for status bar
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChange) {
        onCursorChange(e.position.lineNumber, e.position.column);
      }
    });

    editor.focus();
  };

  const handleEditorChange: OnChange = (val) => {
    if (onChange) {
      onChange(val);
    }
  };

  const getMonacoLanguage = (lang: SupportedLanguage): string => {
    switch (lang) {
      case 'typescript':
        return 'typescript';
      case 'python':
        return 'python';
      case 'cpp':
        return 'cpp';
      case 'javascript':
      default:
        return 'javascript';
    }
  };

  return (
    <div className="w-full h-full bg-[#0d1117] relative overflow-hidden select-none">
      <Editor
        height="100%"
        width="100%"
        language={getMonacoLanguage(language)}
        value={value}
        theme="vs-dark"
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          fontSize: 13,
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          lineHeight: 20,
          fontLigatures: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          automaticLayout: true,
          tabSize: 2,
          padding: { top: 12, bottom: 12 },
          renderLineHighlight: 'all',
          folding: true,
          lineNumbers: 'on',
          glyphMargin: false,
          overviewRulerBorder: false,
          hideCursorInOverviewRuler: true,
        }}
      />
    </div>
  );
};

export default CodeEditor;
