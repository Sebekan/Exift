"use client";

import { useEffect, useState } from "react";

/**
 * Değeri geciktirerek döner. Arama girdilerinde her tuş vuruşunda istek
 * atılmasını engeller — kullanıcı yazmayı bıraktığında tek istek gider.
 */
export function useDebounced<T>(value: T, delayMs = 350): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
