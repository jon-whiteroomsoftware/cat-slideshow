import { useRef, useCallback, useEffect } from "react";
import useAsync, { Status } from "./useAsync";

export default function useAbortableFetch(initialStatus: Status) {
  const {
    status,
    data,
    error,
    run: asyncRun,
    abort: asyncAbort,
  } = useAsync<Response, Error>(initialStatus);
  const controllerRef = useRef<AbortController>(new AbortController());

  const abort = useCallback(() => {
    controllerRef.current.abort();
    controllerRef.current = new AbortController();
    asyncAbort();
  }, [asyncAbort]);

  const runFetch = useCallback(
    (url: RequestInfo, options: RequestInit) => {
      const promise = window
        .fetch(url, {
          ...(options || {}),
          signal: controllerRef.current.signal,
        })
        .then((response: Response) => {
          if (!response || !response.ok) {
            throw new Error("API call failed");
          }

          return response;
        })
        .catch((error: Error) => {
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
    status,
    error,
    runFetch,
    abort,
  } as const;
}
