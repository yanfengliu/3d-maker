import { expect, it } from 'vitest';
import { publishImportChange, subscribeImportChanges } from './changes';
import type { ImportChange } from './changes';

it('notifies subscribed inventory views and stops delivering after unsubscribe', async () => {
  const received: ImportChange[] = [];
  const unsubscribe = subscribeImportChanges(change => { received.push(change); });
  try {
    const once = () => new Promise<ImportChange>(resolve => {
      const stop = subscribeImportChanges(change => { stop(); resolve(change); });
    });
    const saved = once();
    publishImportChange({ kind: 'saved', id: 'item' });
    await expect(saved).resolves.toEqual({ kind: 'saved', id: 'item' });
    unsubscribe();
    const removed = once();
    publishImportChange({ kind: 'removed', id: 'item' });
    await expect(removed).resolves.toEqual({ kind: 'removed', id: 'item' });
    expect(received).toEqual([{ kind: 'saved', id: 'item' }]);
  } finally {
    unsubscribe();
  }
});
