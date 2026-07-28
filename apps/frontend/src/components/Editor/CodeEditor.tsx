import React, { useRef, useEffect, useState } from 'react';
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
  onEditorMount?: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  readOnly?: boolean;
  provider?: WebsocketProvider | null;
  yText?: Y.Text | null;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  language = 'javascript',
  value,
  onChange,
  onCursorChange,
  onEditorMount,
  readOnly = false,
  provider,
  yText,
}) => {
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  // Bind Yjs Y.Text to Monaco model using MonacoBinding when editor, provider, and yText are ready
  useEffect(() => {
    if (editor && provider && yText && yText.doc) {
      const model = editor.getModel();
      if (model) {
        // Destroy existing binding if any
        if (bindingRef.current) {
          bindingRef.current.destroy();
          bindingRef.current = null;
        }

        // Instantiate new Yjs MonacoBinding
        const binding = new MonacoBinding(yText, model, new Set([editor]), provider.awareness);
        bindingRef.current = binding;
      }
    }

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [editor, provider, yText]);

  const handleEditorDidMount: OnMount = (ed, _monaco) => {
    setEditor(ed);
    if (onEditorMount) {
      onEditorMount(ed);
    }

    // Track cursor position for status bar
    ed.onDidChangeCursorPosition((e) => {
      if (onCursorChange) {
        onCursorChange(e.position.lineNumber, e.position.column);
      }
    });

    ed.focus();
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
          fontSize: 14,
          fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
          fontLigatures: true,
          minimap: { enabled: true, side: 'right' },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          renderLineHighlight: 'all',
          padding: { top: 12, bottom: 12 },
          lineNumbers: 'on',
          glyphMargin: true,
          folding: true,
          links: true,
        }}
      />
    </div>
  );
};
