import { useEffect, useState } from "react";

const DEFAULT_DELAY_MS = 250;

/** `value`, once it has stopped changing for `delay` ms (e.g. a search box). */
export function useDebouncedValue<T>(value: T, delay = DEFAULT_DELAY_MS) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
