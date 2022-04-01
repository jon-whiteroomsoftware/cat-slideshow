import { useEffect, useCallback, useRef } from "react";
import { preloadImage, wait } from "./utils";

const MAX_PREFETCH = 4;

type LoadStatus = "ready" | "error";
export type PrefetchStatus = LoadStatus | "wait" | "prefetch";
export type PrefetchMapType = Map<number, PrefetchStatus>;

export default function usePrefetchImages(
  index: number,
  getURLForIndex: (index: number) => string | undefined,
  onImageLoad?: (index: number, status: LoadStatus) => void
) {
  const { current: map } = useRef<PrefetchMapType>(new Map());
  const resetPrefetch = useCallback(() => map.clear(), [map]);

  useEffect(() => {
    (function startPrefetch() {
      const waitIndexes = [...map.keys()].filter((k) => map.get(k) === "wait");
      const prefetchCount = [...map.values()].filter(
        (v) => v === "prefetch"
      ).length;

      if (prefetchCount < MAX_PREFETCH) {
        waitIndexes.slice(0, MAX_PREFETCH - prefetchCount).forEach((i) => {
          const url = getURLForIndex(i);

          function updateLoadStatus(ind: number, status: LoadStatus) {
            map.set(ind, status);
            onImageLoad?.(ind, status);
            startPrefetch();
          }

          if (url) {
            map.set(i, "prefetch");

            preloadImage(url)
              .then(() => updateLoadStatus(i, "ready"))
              .catch(() => updateLoadStatus(i, "error"));
          }
        });
      }

      for (let i = 0; i < MAX_PREFETCH; i++) {
        const newIndex = index + i + (index === 0 ? 0 : 1);
        if (!map.get(newIndex)) {
          map.set(newIndex, "wait");
        }
      }
    })();
  }, [getURLForIndex, onImageLoad, index, map]);

  return { prefetchMap: map, resetPrefetch } as const;
}
