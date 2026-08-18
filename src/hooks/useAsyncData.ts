"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toUserMessage } from "@/lib/api/errors";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  /** İlk yükleme sonuçlandı mı — iskelet ile boş durum ayrımı için. */
  loaded: boolean;
  reload: () => void;
  setData: (updater: T | ((current: T | null) => T | null)) => void;
}

interface Settled<T> {
  /** Sonucun ait olduğu istek kimliği. */
  source: object;
  data: T | null;
  error: string | null;
}

/**
 * Tek seferlik veri çekme + yeniden deneme.
 *
 * `fetcher` çağıran tarafta `useCallback` ile sabitlenmelidir — bağımlılıkları
 * bu hook'un yeniden çekme koşullarını belirler. Kimliği değiştiğinde yeni
 * istek atılır ve öncekiler iptal edilir; böylece geç dönen eski yanıt
 * yenisinin üzerine yazamaz.
 *
 * `loading`, state'e yazılmaz — bekleyen istek kimliği ile sonuçlanan istek
 * kimliği karşılaştırılarak render sırasında türetilir. Bu sayede effect içinde
 * senkron `setState` çağrısı (ve yarattığı zincirleme render) yoktur.
 */
export function useAsyncData<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  options: { enabled?: boolean } = {},
): AsyncState<T> {
  const { enabled = true } = options;

  const [reloadToken, setReloadToken] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);

  // İstek kimliği: fetcher değişince (yani çağıranın useCallback bağımlılıkları
  // değişince) veya reload çağrılınca yeni bir nesne üretilir. Sonuçlar bu
  // nesneye mühürlenir; kimlik eşleşmiyorsa sonuç bayattır.
  const source = useMemo(
    () => ({ fetcher, enabled, reloadToken }),
    [fetcher, enabled, reloadToken],
  );

  const isCurrent = settled?.source === source;

  useEffect(() => {
    if (!source.enabled) return;

    const controller = new AbortController();
    let active = true;

    source
      .fetcher(controller.signal)
      .then((result) => {
        if (!active || controller.signal.aborted) return;
        setSettled({ source, data: result, error: null });
      })
      .catch((error) => {
        if (!active || controller.signal.aborted) return;
        setSettled({ source, data: null, error: toUserMessage(error) });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [source]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  const setData = useCallback(
    (updater: T | ((current: T | null) => T | null)) => {
      setSettled((current) => {
        const base = current?.source === source ? current.data : null;
        const next =
          typeof updater === "function"
            ? (updater as (c: T | null) => T | null)(base)
            : updater;
        return { source, data: next, error: null };
      });
    },
    [source],
  );

  return {
    data: isCurrent ? settled.data : null,
    loading: enabled && !isCurrent,
    error: isCurrent ? settled.error : null,
    loaded: isCurrent,
    reload,
    setData,
  };
}
