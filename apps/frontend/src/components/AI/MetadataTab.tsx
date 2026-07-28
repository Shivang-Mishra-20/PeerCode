import React from 'react';
import { ResponseMetadata } from '../../types/ai';

export interface MetadataTabProps {
  metadata?: ResponseMetadata;
}

export const MetadataTab: React.FC<MetadataTabProps> = ({ metadata }) => {
  if (!metadata) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">No execution metadata available.</div>
    );
  }

  const items = [
    { label: 'Provider', value: metadata.provider },
    { label: 'Model', value: metadata.model },
    { label: 'Latency', value: `${metadata.durationMs} ms` },
    { label: 'Tokens Generated', value: `${metadata.tokensGenerated} tokens` },
    { label: 'Request ID', value: metadata.requestId },
  ];

  return (
    <div className="p-4 space-y-3 font-mono text-xs">
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between border-b border-slate-800/50 pb-2 last:border-0 last:pb-0"
          >
            <span className="text-slate-400">{item.label}</span>
            <span className="text-emerald-400 font-semibold">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
