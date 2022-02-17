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

function useAbortableFetch(url, options, initialState) {
  const initialStatus = url ? "pending" : "idle";
  const state = useAsync({ initialStatus });
  const { status, data, error, run, abort: asyncAbort } = state;
  const controllersRef = useRef([]);

  const abort = useCallback(() => {
    if (controllersRef.current.length) {
      controllersRef.current.forEach((c) => c.abort());
      controllersRef.current = [];
      asyncAbort();
    }
  }, [asyncAbort]);

  useEffect(() => {
    console.log("USE EFFECT");

    if (!url) {
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;
    const opts = { ...(options || {}), signal };
    controllersRef.current.push(controller);
    const promise = window.fetch(url, opts);

    promise
      .catch((error) => {
        if (error.name !== "AbortError") {
          throw error;
        }
      })
      .finally(() => {
        if (controllersRef.current.find((c) => c === controller)) {
          controllersRef.current = controllersRef.current.filter(
            (c) => c !== controller
          );
        }
      });

    run(promise);

    return () => abort();
  }, [url, options, run, abort]);

  return { status, data, error, abort };
}

const LoadState = makeEnumObject("Idle", "Loading", "Loaded", "Error");

export { makeEnumObject, preloadImage, LoadState, useAsync, useAbortableFetch };
