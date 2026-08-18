"use client";

import { useCallback, useState, type Dispatch, type SetStateAction } from "react";

/**
 * Kaynağı değiştiğinde kendini sıfırlayan yerel state.
 *
 * Klasik çözüm `useEffect` içinde `setState` çağırmaktır; bu bir render turu
 * daha tetikler ve arada eski değer ekranda görünür. Burada değer render
 * sırasında türetilir: `key` değiştiği anda kullanıcı düzenlemeleri düşer ve
 * taze `factory()` sonucu döner — ekstra render yok, eskimiş kare yok.
 */
export function useResettableState<T>(
  key: string,
  factory: () => T,
): [T, Dispatch<SetStateAction<T>>] {
  const [edit, setEdit] = useState<{ key: string; value: T } | null>(null);

  // Düzenleme yalnızca ait olduğu kaynak için geçerlidir.
  const value = edit && edit.key === key ? edit.value : factory();

  const setValue = useCallback<Dispatch<SetStateAction<T>>>(
    (next) => {
      setEdit((current) => {
        const base = current && current.key === key ? current.value : factory();
        const resolved = typeof next === "function" ? (next as (prev: T) => T)(base) : next;
        return { key, value: resolved };
      });
    },
    [key, factory],
  );

  return [value, setValue];
}
