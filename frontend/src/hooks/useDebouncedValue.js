import { useEffect, useState } from "react";

/**
 * Delays updating the returned value until `value` has been stable for `delayMs`.
 * Typing fast in city/state should not fire a heavy API call on every keypress.
 */
export function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}
