import { useState, useRef, useCallback } from 'react';
import * as monaco from 'monaco-editor';
import { AIGenerateResponse, AIOperation, AIReviewStatus, ReviewHistoryItem } from '../types/ai';
import { aiClient } from '../services/aiClient';
import { applyMonacoMarkers, clearMonacoMarkers } from '../utils/monacoMarkers';
import { applyMonacoDecorations, clearMonacoDecorations } from '../utils/monacoDecorations';

export interface UseAIReviewOptions {
  roomId: string;
  editorRef: React.RefObject<monaco.editor.IStandaloneCodeEditor | null>;
  language?: string;
}

export function useAIReview({ roomId, editorRef, language = 'typescript' }: UseAIReviewOptions) {
  const [status, setStatus] = useState<AIReviewStatus>('idle');
  const [stage, setStage] = useState<string>('');
  const [streamingText, setStreamingText] = useState<string>('');
  const [currentResponse, setCurrentResponse] = useState<AIGenerateResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reviewHistory, setReviewHistory] = useState<ReviewHistoryItem[]>([]);
  const [activeModel, setActiveModel] = useState<string>('qwen2.5-coder:7b');
  const [activeProvider, setActiveProvider] = useState<string>('ollama');

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Cancel ongoing AI streaming request
   */
  const cancelReview = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus('cancelled');
    setStage('Cancelled by user');
  }, []);

  /**
   * Clear all Monaco markers, decorations, and active review state
   */
  const clearDiagnostics = useCallback(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        clearMonacoMarkers(model);
      }
      clearMonacoDecorations(editorRef.current);
    }
    setCurrentResponse(null);
    setStreamingText('');
    setErrorMessage(null);
    setStatus('idle');
    setStage('');
  }, [editorRef]);

  /**
   * Request AI operation (review, chat, explain, generate_tests)
   */
  const requestAIOperation = useCallback(
    async (operation: AIOperation = 'review', customCode?: string) => {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      setStatus('loading');
      setStage('Connecting to AI service...');
      setStreamingText('');
      setErrorMessage(null);

      // Clear previous markers
      if (editorRef.current) {
        const model = editorRef.current.getModel();
        if (model) {
          clearMonacoMarkers(model);
        }
        clearMonacoDecorations(editorRef.current);
      }

      const requestId = `req-${Math.random().toString(36).substring(2, 9)}`;

      await aiClient.generateStream({
        roomId,
        operation,
        code: customCode,
        language,
        requestId,
        signal: controller.signal,
        onStatus: (st) => {
          setStatus('streaming');
          setStage(st === 'generating' ? 'Analyzing code with AI...' : st);
        },
        onTokenChunk: (accumulatedText) => {
          setStatus('streaming');
          setStreamingText(accumulatedText);
        },
        onComplete: (res) => {
          setStatus('success');
          setStage('Review complete');
          setCurrentResponse(res);

          if (res.metadata) {
            if (res.metadata.model) setActiveModel(res.metadata.model);
            if (res.metadata.provider) setActiveProvider(res.metadata.provider);
          }

          // Apply Monaco markers and line decorations
          if (editorRef.current) {
            const model = editorRef.current.getModel();
            if (model && res.issues) {
              applyMonacoMarkers(model, res.issues);
            }
            if (res.issues) {
              applyMonacoDecorations(editorRef.current, res.issues);
            }
          }

          // Append to in-memory review session history
          const historyItem: ReviewHistoryItem = {
            id: requestId,
            createdAt: Date.now(),
            response: res,
          };
          setReviewHistory((prev) => [historyItem, ...prev.slice(0, 9)]);
        },
        onError: (err) => {
          setStatus('failed');
          setErrorMessage(err.message);
          setStage('Error processing AI request');
        },
      });
    },
    [roomId, editorRef, language]
  );

  return {
    status,
    stage,
    streamingText,
    currentResponse,
    errorMessage,
    reviewHistory,
    activeModel,
    activeProvider,
    requestAIOperation,
    cancelReview,
    clearDiagnostics,
    selectHistoryItem: (item: ReviewHistoryItem) => {
      setCurrentResponse(item.response);
      if (editorRef.current) {
        const model = editorRef.current.getModel();
        if (model && item.response.issues) {
          applyMonacoMarkers(model, item.response.issues);
        }
        if (item.response.issues) {
          applyMonacoDecorations(editorRef.current, item.response.issues);
        }
      }
    },
  };
}
