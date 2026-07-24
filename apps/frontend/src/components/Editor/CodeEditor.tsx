import React, { useRef } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';
import { SupportedLanguage } from '@peercode/shared';

export interface CodeEditorProps {
  language?: SupportedLanguage;
  value?: string;
  onChange?: (value: string | undefined) => void;
  onCursorChange?: (line: number, column: number) => void;
  readOnly?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  language = 'javascript',
  value = '// Welcome to PeerCode\nfunction helloWorld() {\n  console.log("PeerCode IDE Ready");\n}\n\nhelloWorld();\n',
  onChange,
  onCursorChange,
  readOnly = false,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleEditorDidMount: OnMount = (editor, _monaco) => {
    editorRef.current = editor;

    // Track cursor position for status bar & live cursor awareness
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChange) {
        onCursorChange(e.position.lineNumber, e.position.column);
      }
    });

    // Focus editor on mount
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
