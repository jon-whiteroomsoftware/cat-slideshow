import { useRef, useCallback, useEffect } from "react";
import useAsync from "./useAsync";

function useAbortableFetch(initialStatus) {
  const state = useAsync(initialStatus);
  const { status, data, error, run: asyncRun, abort: asyncAbort } = state;
  const { current: controller } = useRef(new AbortController());

  const abort = useCallback(() => {
    controller.abort();
    asyncAbort();
  }, [asyncAbort, controller]);

  const runFetch = useCallback(
    (url, options) => {
      if (!url) {
        return;
      }

      const promise = window
        .fetch(url, { ...(options || {}), signal: controller.signal })
        .then((response) => {
          if (!response.ok) {
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
    [controller.signal, asyncRun]
  );

  useEffect(() => {
    return () => abort();
  }, [abort]);

  return { response: data, status, error, runFetch, abort };
}

export default useAbortableFetch;
