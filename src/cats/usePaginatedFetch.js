import { useCallback, useReducer } from "react";
import useAbortableFetch from "./useAbortableFetch";

function fetchReducer(state, action) {
  console.log("%cfetchReducer: " + action.type, "color: blue", action);

  if (action.type === "reset") {
    return { pages: {}, key: action.key };
  }

  if (state.key !== null && state.key !== action.key) {
    return state; // ignore stale fetch responses
  }

  const updateStateForPage = (pageState) => {
    return {
      ...state,
      pages: {
        ...state.pages,
        [action.index]: pageState,
      },
    };
  };

  switch (action.type) {
    case "fetch-page":
      return updateStateForPage({ status: "pending", data: [] });

    case "page-loaded":
      return updateStateForPage({ status: "resolved", data: action.data });

    case "page-error":
      return updateStateForPage({ status: "error", data: [] });

    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

function usePaginatedFetch(pageSize) {
  const [state, dispatch] = useReducer(fetchReducer, { pages: {}, key: null });
  const {
    status: fetchStatus,
    runFetch,
    abort: abortFetch,
  } = useAbortableFetch("pending", true);

  const resetPages = useCallback(
    (key) => {
      abortFetch();
      dispatch({ type: "reset", key });
    },
    [abortFetch]
  );

  const fetchPage = useCallback(
    (url, options, index, key) => {
      dispatch({ type: "fetch-page", url, index, key });

      return runFetch(url, options)
        .then(async (response) => {
          if (response && response.ok) {
            const json = await response.json();
            dispatch({ type: "page-loaded", url, index, data: json, key });
          }
        })
        .catch((error) => {
          dispatch({ type: "page-error", url, index, error, key });
        });
    },
    [runFetch]
  );

  const status = fetchStatus === "pending" ? "pending" : "idle";
  return { ...state, status, fetchPage, resetPages };
}

export default usePaginatedFetch;
