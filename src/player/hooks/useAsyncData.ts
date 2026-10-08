import { useCallback, useEffect, useState } from 'react';
import { errorMessage } from '../utils/errors';

export interface AsyncData<T> {
  data: T;
  loading: boolean;
  /** Null while loading and unless the last load failed. */
  error: string | null;
  /** Re-runs the loader. */
  reload: () => void;
  /**
   * Replaces the loaded value without refetching. Used when an action returns
   * fresh data the page already knows about, such as posting a comment and
   * re-reading the one program rather than refetching the whole listing.
   */
  setData: (value: T) => void;
}

interface State<T> {
  data: T;
  error: string | null;
  /** The `key` of the load whose result is currently held, or null if none. */
  settledKey: string | null;
}

/**
 * Runs an async loader on mount and tracks its loading and error state.
 *
 * The public pages used to do this by hand with
 * `promise.then(setState).finally(() => setLoading(false))` and no `.catch`, so
 * a failed request cleared the spinner and rendered the "no programs yet" empty
 * state — indistinguishable from a genuinely empty library — while the real
 * error only reached the console as an unhandled rejection.
 *
 * `deps` behaves like a useEffect dependency list: change one to reload.
 * Loading is derived by comparing the key of the settled result against the
 * current key, rather than being a separate boolean flipped inside the effect,
 * which keeps the effect free of synchronous setState.
 *
 * Responses that arrive after unmount, or after a newer load has started, are
 * discarded, so a slow first request cannot overwrite a fast second one.
 */
export function useAsyncData<T>(
  load: () => Promise<T>,
  initial: T,
  deps: readonly unknown[] = []
): AsyncData<T> {
  const [state, setState] = useState<State<T>>({ data: initial, error: null, settledKey: null });
  const [nonce, setNonce] = useState(0);

  // Deps are primitives (route ids, ids), so stringifying them is a stable
  // identity for "this load". Nonce distinguishes a manual reload of the same
  // deps from the original load.
  const key = `${JSON.stringify(deps)}#${nonce}`;

  useEffect(() => {
    let cancelled = false;

    load().then(
      (result) => {
        if (cancelled) return;
        setState({ data: result, error: null, settledKey: key });
      },
      (err) => {
        if (cancelled) return;
        // Keep whatever data is already on screen; a failed refresh should not
        // blank a page that was rendering fine a moment ago.
        setState((prev) => ({ ...prev, error: errorMessage(err), settledKey: key }));
      }
    );

    return () => {
      cancelled = true;
    };
    // `load` closes over props and changes every render by identity, so the
    // settled result — not the loader's identity — is what decides when to
    // re-run. The loader captured here is the one from the render that produced
    // this key, which is the current one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const loading = state.settledKey !== key;

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const setData = useCallback((value: T) => setState((prev) => ({ ...prev, data: value })), []);

  return {
    data: state.data,
    loading,
    // A stale error from a previous key must not surface over a fresh load.
    error: loading ? null : state.error,
    reload,
    setData,
  };
}