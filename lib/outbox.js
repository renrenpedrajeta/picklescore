/**
 * Persistent Offline-First Outbox (lib/outbox.js)
 *
 * Persists an ordered queue of RPC calls in localStorage (pikolscore_outbox_v1).
 * Processes calls strictly sequentially (FIFO), applies exponential backoff on network failures,
 * auto-flushes on reconnection/visibility, and pauses immediately on Postgres conflict codes.
 */

const OUTBOX_KEY = 'pikolscore_outbox_v1';
const MAX_QUEUE_SIZE = 500;
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30000;

function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  return null;
}

export class OutboxManager {
  constructor() {
    this.isProcessing = false;
    this.isPaused = false;
    this.backoffDelay = INITIAL_BACKOFF_MS;
    this.retryTimeout = null;
    this.executor = null;
    this.statusListeners = new Set();
    this.errorListeners = new Set();
    this.status = 'synced'; // 'synced' | 'syncing' | 'offline' | 'error'

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.resume();
        this.backoffDelay = INITIAL_BACKOFF_MS;
        this.processQueue();
      });

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.resume();
          this.processQueue();
        }
      });
    }
  }

  /**
   * Set the async RPC execution function.
   * @param {Function} executor (item) => Promise<{ data, error }>
   */
  setExecutor(executor) {
    this.executor = executor;
  }

  /**
   * Read raw queue from localStorage.
   */
  getQueue() {
    const storage = getStorage();
    if (!storage) return [];
    try {
      const raw = storage.getItem(OUTBOX_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('[Outbox] Failed to read queue:', err);
      return [];
    }
  }

  /**
   * Save queue array to localStorage.
   */
  _saveQueue(queue) {
    const storage = getStorage();
    if (!storage) return;
    try {
      storage.setItem(OUTBOX_KEY, JSON.stringify(queue));
    } catch (err) {
      console.error('[Outbox] Failed to save queue:', err);
    }
  }

  /**
   * Enqueue a new operation.
   * @param {object} opItem { op, args, expectedVersion, id? }
   */
  enqueue({ op, args, expectedVersion, id }) {
    const queue = this.getQueue();

    if (queue.length >= MAX_QUEUE_SIZE) {
      console.warn('[Outbox] Max queue size (500) reached. Action dropped.');
      return null;
    }

    const item = {
      id: id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item_${Date.now()}_${Math.random()}`),
      op,
      args,
      expectedVersion: expectedVersion ?? null,
      enqueuedAt: Date.now(),
    };

    queue.push(item);
    this._saveQueue(queue);
    this._updateStatus(queue.length > 0 ? 'syncing' : 'synced');

    this.processQueue();
    return item;
  }

  /**
   * Process the queue sequentially (FIFO, strictly one in-flight RPC at a time).
   */
  async processQueue() {
    if (this.isProcessing || this.isPaused) {
      return;
    }

    const queue = this.getQueue();
    if (queue.length === 0) {
      this._updateStatus('synced');
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      this._updateStatus('offline');
      return;
    }

    if (!this.executor) {
      return;
    }

    this.isProcessing = true;
    this._updateStatus('syncing');

    const item = queue[0];

    try {
      const { error } = await this.executor(item);

      if (!error) {
        // Success: Reset backoff, pop completed item, continue FIFO
        this.backoffDelay = INITIAL_BACKOFF_MS;
        const currentQueue = this.getQueue();
        const updated = currentQueue.filter((q) => q.id !== item.id);
        this._saveQueue(updated);

        this.isProcessing = false;
        if (updated.length === 0) {
          this._updateStatus('synced');
        } else {
          // Immediately process next item
          this.processQueue();
        }
        return;
      }

      // Supabase / Postgres error returned
      const code = String(error.code || '');
      const msg = String(error.message || '');

      const isConflict =
        code === '40001' || msg.includes('version_conflict');
      const isForbidden =
        code === '42501' || msg.includes('forbidden');
      const isClosed =
        code === 'P0001' || msg.includes('session_closed');
      const isStackEmpty =
        code === 'P0002' ||
        msg.includes('nothing_to_undo') ||
        msg.includes('nothing_to_redo');

      if (isConflict || isForbidden || isClosed || isStackEmpty) {
        console.warn(`[Outbox] Halting queue on critical error (${code}):`, msg);
        this.isPaused = true;
        this.isProcessing = false;
        this._updateStatus('error');

        const resolvedCode = isConflict
          ? '40001'
          : isForbidden
          ? '42501'
          : isClosed
          ? 'P0001'
          : 'P0002';

        this._notifyError({
          code: resolvedCode,
          error,
          item,
          queue: this.getQueue(),
        });
        return;
      }

      // General network/server failure: apply exponential backoff
      this._scheduleRetry(item);
    } catch (err) {
      // Fetch or network failure
      console.warn('[Outbox] Network error processing item:', err);
      this._scheduleRetry(item);
    }
  }

  _scheduleRetry() {
    this.isProcessing = false;
    this._updateStatus(navigator.onLine ? 'error' : 'offline');

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    this.retryTimeout = setTimeout(() => {
      this.retryTimeout = null;
      this.processQueue();
    }, this.backoffDelay);

    this.backoffDelay = Math.min(MAX_BACKOFF_MS, this.backoffDelay * 2);
  }

  pause() {
    this.isPaused = true;
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
  }

  resume() {
    this.isPaused = false;
    this.processQueue();
  }

  /**
   * Filter and drop specific operations from the queue (e.g. stale rally ops on 40001).
   */
  filterQueue(predicate) {
    const queue = this.getQueue();
    const filtered = queue.filter(predicate);
    this._saveQueue(filtered);
    this._updateStatus(filtered.length === 0 ? 'synced' : 'syncing');
    return queue.length - filtered.length;
  }

  clearQueue() {
    this._saveQueue([]);
    this._updateStatus('synced');
  }

  getPendingCount() {
    return this.getQueue().length;
  }

  hasPendingRallies() {
    const queue = this.getQueue();
    return queue.some((q) =>
      ['fn_record_rally', 'fn_undo_rally', 'fn_redo_rally'].includes(q.op)
    );
  }

  _updateStatus(newStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach((fn) => fn(this.status, this.getPendingCount()));
    }
  }

  _notifyError(errPayload) {
    this.errorListeners.forEach((fn) => fn(errPayload));
  }

  onStatusChange(fn) {
    this.statusListeners.add(fn);
    fn(this.status, this.getPendingCount());
    return () => this.statusListeners.delete(fn);
  }

  onError(fn) {
    this.errorListeners.add(fn);
    return () => this.errorListeners.delete(fn);
  }
}

// Global singleton instance for cross-component stability
export const outbox = new OutboxManager();
