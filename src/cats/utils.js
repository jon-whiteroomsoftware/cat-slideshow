import { useEffect, useCallback, useMemo, useReducer, useRef } from "react";

let wait = (ms, r) => new Promise((resolved) => setTimeout(resolved, ms, r));

function makeEnumObject(...keys) {
  return Object.freeze(
    keys.reduce((obj, str) => ({ ...obj, [str]: Symbol(str) }), {})
  );
}

function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = function () {
      resolve(img);
    };
    img.onerror = img.onabort = function () {
      reject(url);
    };
    img.src = url;
  });
}

function asyncReducer(state, action) {
  console.log("%casync: " + action.type, "color: blue", action);
  switch (action.type) {
    case "pending":
      return { status: "pending", data: null, error: null };
    case "resolved":
      return { status: "resolved", data: action.data, error: null };
    case "rejected":
      return { status: "rejected", data: null, error: action.error };
    case "abort":
      return { ...state, status: "idle" };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

function useAsync(initialState = "idle") {
  const [state, dispatch] = useReducer(asyncReducer, {
    status: initialState,
    data: null,
    error: null,
  });

  const run = useCallback((promise) => {
    dispatch({ type: "pending" });

    promise
      .then((data) => dispatch({ type: "resolved", data }))
      .catch((error) => dispatch({ type: "rejected", error }));
  }, []);

  const abort = useCallback(() => {
    dispatch({ type: "abort" });
  }, []);

  return { ...state, run, abort };
}

function useAbortableFetch(initialStatus) {
  const state = useAsync(initialStatus);
  const { status, data, error, run: asyncRun, abort: asyncAbort } = state;
  const { current: controller } = useRef(new AbortController());

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
    [asyncRun, controller.signal]
  );

  useEffect(() => {
    return () => {
      controller.abort();
      asyncAbort();
    };
  }, [asyncAbort, controller]);

  return { response: data, status, error, runFetch };
}

const LoadState = makeEnumObject("Idle", "Loading", "Loaded", "Error");

export { makeEnumObject, preloadImage, LoadState, useAsync, useAbortableFetch };
