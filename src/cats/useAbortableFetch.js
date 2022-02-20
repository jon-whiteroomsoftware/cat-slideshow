import { useRef, useCallback, useEffect } from "react";
import useAsync from "./useAsync";

function useAbortableFetch(initialStatus) {
  const state = useAsync(initialStatus);
  const { status, data, error, run: asyncRun, abort: asyncAbort } = state;
  const controllerRef = useRef(new AbortController());

  const abort = useCallback(() => {
    controllerRef.current.abort();
    controllerRef.current = new AbortController();
    asyncAbort();
  }, [asyncAbort, controllerRef]);

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
    [controllerRef, asyncRun]
  );

  useEffect(() => {
    return () => {
      console.log("ABORT");
      abort();
    };
  }, [abort]);

  return {
    response: data,
    status: status,
    error,
    runFetch,
    abort,
  };
}

export default useAbortableFetch;
