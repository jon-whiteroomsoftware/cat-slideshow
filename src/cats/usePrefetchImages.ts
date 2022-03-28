import { useEffect, useState, useCallback, useRef } from "react";
import { preloadImage } from "./utils";

const MAX_PREFETCH = 4;

type LoadStatus = "ready" | "error";
type PrefetchStatus = LoadStatus | "wait" | "prefetch";
type LoadMapType = Record<string, LoadStatus>;

export default function usePrefetchImages(
  index: number,
  getURLForIndex: (index: number) => string | undefined
) {
  const prefetchMapRef = useRef<Map<number, PrefetchStatus>>(new Map());
  const [imageLoadMap, setImageLoadMap] = useState<LoadMapType>({});

  const resetPrefetch = useCallback(() => {
    prefetchMapRef.current = new Map();
    setImageLoadMap({});
  }, []);

  useEffect(() => {
    const prefetchMap = prefetchMapRef.current;
    const waitIndexes = [...prefetchMap.keys()].filter(
      (k) => prefetchMap.get(k) === "wait"
    );
    const prefetchCount = [...prefetchMap.values()].filter(
      (v) => v === "prefetch"
    ).length;

    for (let i = 0; i < MAX_PREFETCH; i++) {
      const newIndex = index + i + (index === 0 ? 0 : 1);
      if (!prefetchMap.get(newIndex)) {
        prefetchMap.set(newIndex, "wait");
      }
    }

    if (prefetchCount < MAX_PREFETCH) {
      waitIndexes.slice(0, MAX_PREFETCH - prefetchCount).forEach((i) => {
        const url = getURLForIndex(i);

        const updateLoadStatus = (ind: number, status: PrefetchStatus) => {
          prefetchMap.set(ind, status);
          setImageLoadMap((prevMap) => ({ ...prevMap, [ind]: status }));
        };

        if (url) {
          prefetchMap.set(i, "prefetch");

          preloadImage(url)
            .then(() => updateLoadStatus(i, "ready"))
            .catch(() => updateLoadStatus(i, "error"));
        }
      });
    }
  }, [getURLForIndex, index]);

  return { imageLoadMap, resetPrefetch } as const;
}
