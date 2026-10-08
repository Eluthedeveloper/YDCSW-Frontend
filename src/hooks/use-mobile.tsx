import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * True while the viewport is narrower than MOBILE_BREAKPOINT.
 *
 * `useSyncExternalStore` is used rather than an effect that calls setState on
 * mount: the matchMedia object is the external store, and subscribing in an
 * effect first reported a wrong value on the initial render.
 */
export function useIsMobile(): boolean {
  const query = React.useMemo(
    () => window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`),
    []
  );

  const subscribe = React.useCallback(
    (onStoreChange: () => void) => {
      query.addEventListener("change", onStoreChange);
      return () => query.removeEventListener("change", onStoreChange);
    },
    [query]
  );

  return React.useSyncExternalStore(
    subscribe,
    () => query.matches,
    () => false
  );
}