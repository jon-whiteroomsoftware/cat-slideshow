import { useRef, useCallback, useEffect } from "react";
import useAsync from "./useAsync";

export default function useAbortableFetch(initialStatus) {
  const {
    status,
    data,
    error,
    run: asyncRun,
    abort: asyncAbort,
  } = useAsync(initialStatus);
  const controllerRef = useRef(new AbortController());

  const abort = useCallback(() => {
    controllerRef.current.abort();
    controllerRef.current = new AbortController();
    asyncAbort();
  }, [asyncAbort]);

  const runFetch = useCallback(
    (url, options) => {
      if (!url) {
        return;
      }

      const promise = window
        .fetch(url, {
          ...(options || {}),
          signal: controllerRef.current.signal,
        })
        .then((response) => {
          if (!response || !response.ok) {
            throw new Error("API call failed");
          }

          return response;
        })
        .catch((error) => {
          if (error.name !== "AbortError") {
            throw error;
          }
        });

      asyncRun(promise);
      return promise;
    },
    [asyncRun]
  );

  useEffect(() => {
    return () => abort();
  }, [abort]);

  return {
    response: data,
    status: status,
    error,
    runFetch,
    abort,
  };
}
