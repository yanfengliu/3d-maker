export interface ImportChange {
  kind: 'saved' | 'removed';
  id: string;
}

function openChannel(): BroadcastChannel | null {
  try {
    return typeof BroadcastChannel === 'function' ? new BroadcastChannel('3d-maker:import-changes:v1') : null;
  } catch {
    // Some storage partitions disable cross-context messaging.
    return null;
  }
}

export function publishImportChange(change: ImportChange): void {
  const channel = openChannel();
  if (!channel) return;
  try {
    channel.postMessage(change);
  } finally {
    channel.close();
  }
}

export function subscribeImportChanges(listener: (change: ImportChange) => void): () => void {
  const channel = openChannel();
  if (channel) {
    channel.onmessage = (event: MessageEvent<unknown>) => {
      const data = event.data;
      if (data && typeof data === 'object' && 'kind' in data && (data.kind === 'saved' || data.kind === 'removed') &&
        'id' in data && typeof data.id === 'string') listener({ kind: data.kind, id: data.id });
    };
  }
  return () => { channel?.close(); };
}
