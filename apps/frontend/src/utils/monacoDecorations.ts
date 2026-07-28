import * as monaco from 'monaco-editor';
import { IssueItem } from '../types/ai';

let currentDecorationIDs: string[] = [];

/**
 * Clear all line decorations applied by PeerCode AI
 */
export function clearMonacoDecorations(editor: monaco.editor.IStandaloneCodeEditor): void {
  if (currentDecorationIDs.length > 0) {
    currentDecorationIDs = editor.deltaDecorations(currentDecorationIDs, []);
  }
}

/**
 * Apply line highlights for AI review issues
 */
export function applyMonacoDecorations(
  editor: monaco.editor.IStandaloneCodeEditor,
  issues: IssueItem[]
): void {
  clearMonacoDecorations(editor);

  const model = editor.getModel();
  if (!model || !issues || issues.length === 0) return;

  const maxLine = model.getLineCount();

  const newDecorations: monaco.editor.IModelDeltaDecoration[] = issues.map((issue) => {
    const targetLine = Math.min(Math.max(1, issue.line), maxLine);

    const className =
      issue.severity === 'error'
        ? 'bg-rose-500/10 border-l-2 border-rose-500'
        : issue.severity === 'warning'
          ? 'bg-amber-500/10 border-l-2 border-amber-500'
          : 'bg-sky-500/10 border-l-2 border-sky-500';

    return {
      range: new monaco.Range(targetLine, 1, targetLine, 1),
      options: {
        isWholeLine: true,
        className,
      },
    };
  });

  currentDecorationIDs = editor.deltaDecorations([], newDecorations);
}
