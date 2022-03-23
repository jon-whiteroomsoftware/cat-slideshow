import { useEffect, useState, useCallback, useRef } from "react";
import { preloadImage } from "./utils.js";

const MAX_PREFETCH = 4;

export default function usePrefetchImages(index, getURLForIndex) {
  const prefetchMapRef = useRef(new Map());
  const [imageLoadMap, setImageLoadMap] = useState({});

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

        const updateLoadStatus = (i, status) => {
          prefetchMap.set(i, status);
          setImageLoadMap((prevMap) => ({ ...prevMap, [i]: status }));
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

  return { imageLoadMap, resetPrefetch };
}
