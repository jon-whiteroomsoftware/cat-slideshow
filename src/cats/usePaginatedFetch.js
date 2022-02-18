import { useEffect, useCallback, useReducer, useRef } from "react";
import useAbortableFetch from "./useAbortableFetch";
import fetchFromCatsAPI from "./fetchFromCatsAPI";

function fetchReducer(state, action) {
  console.log("%cfetchReducer: " + action.type, "color: blue", action);
  switch (action.type) {
    case "fetch-page":
      return {
        pages: {
          ...state.pages,
          [action.index]: { status: "loading", data: [] },
        },
      };
    case "page-loaded": {
      return {
        pages: {
          ...state.pages,
          [action.index]: { status: "loaded", data: action.data },
        },
      };
    }
    case "page-error": {
      return {
        pages: {
          ...state.pages,
          [action.index]: { status: "error", data: [] },
        },
      };
    }
    case "reset": {
      return { pages: {} };
    }
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

// TODO
// overlapping fetches
// abort - unmount, changing breeds
// stale responses

function usePaginatedFetch(pageSize) {
  const [state, dispatch] = useReducer(fetchReducer, { pages: {} });
  const {
    status: fetchStatus,
    runFetch,
    abort: abortFetch,
  } = useAbortableFetch("pending", true);

  // useEffect(() => {
  //   return () => controller.abort();
  // }, [controller]);

  const resetPages = useCallback(() => {
    dispatch({ type: "reset" });
    //abortFetch();
  }, []);

  const fetchPage = useCallback(
    (url, options, index) => {
      dispatch({ type: "fetch-page", index });

      return runFetch(url, options)
        .then(async (response) => {
          if (!response || !response.ok) {
            throw new Error("API call failed");
          }
          const json = await response.json();
          dispatch({ type: "page-loaded", index, data: json });
        })
        .catch((error) => {
          dispatch({ type: "page-error", index, error });
        });
    },
    [runFetch]
  );

  const status = Object.values(state.pages).find((d) => d.status === "loading")
    ? "loading"
    : "idle";

  return { ...state, status, fetchPage, resetPages };
}

export default usePaginatedFetch;
