import * as monaco from 'monaco-editor';
import { IssueItem } from '../types/ai';

const OWNER = 'peercode-ai';

/**
 * Clear all existing Monaco model markers set by PeerCode AI
 */
export function clearMonacoMarkers(model: monaco.editor.ITextModel): void {
  monaco.editor.setModelMarkers(model, OWNER, []);
}

/**
 * Apply AI review issues directly as Monaco model markers (squiggly highlights & hover messages)
 */
export function applyMonacoMarkers(model: monaco.editor.ITextModel, issues: IssueItem[]): void {
  clearMonacoMarkers(model);

  if (!issues || issues.length === 0) return;

  const maxLine = model.getLineCount();

  const markers: monaco.editor.IMarkerData[] = issues.map((issue) => {
    // Ensure line number bounds validity
    const targetLine = Math.min(Math.max(1, issue.line), maxLine);
    const maxCol = model.getLineMaxColumn(targetLine);

    const severity =
      issue.severity === 'error'
        ? monaco.MarkerSeverity.Error
        : issue.severity === 'warning'
          ? monaco.MarkerSeverity.Warning
          : monaco.MarkerSeverity.Info;

    let message = issue.message;
    if (issue.suggestion) {
      message += `\n\nSuggested Fix:\n${issue.suggestion}`;
    }

    return {
      severity,
      startLineNumber: targetLine,
      startColumn: 1,
      endLineNumber: targetLine,
      endColumn: maxCol,
      message,
      source: 'PeerCode AI',
    };
  });

  monaco.editor.setModelMarkers(model, OWNER, markers);
}
