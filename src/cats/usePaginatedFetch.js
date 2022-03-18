import { useCallback, useReducer } from "react";
import useAbortableFetch from "./useAbortableFetch";

function fetchReducer(state, action) {
  //console.log("%cfetchReducer: " + action.type, "color: blue", action);

  if (action.type === "reset") {
    return { pages: {}, key: action.key };
  }

  if (state.key !== null && state.key !== action.key) {
    return state; // ignore stale fetch responses
  }

  const updateStateForPage = (pageState, otherState) => {
    return {
      ...state,
      ...otherState,
      pages: {
        ...state.pages,
        [action.index]: pageState,
      },
    };
  };

  switch (action.type) {
    case "fetch-page":
      return updateStateForPage({ status: "loading", data: [] });

    case "page-loaded": {
      const metadata = { ...state.metadata, ...(action.metadata || {}) };
      return updateStateForPage(
        { status: "loaded", data: action.pageData },
        { metadata }
      );
    }

    case "page-error":
      return updateStateForPage({ status: "error", data: [] });

    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

export default function usePaginatedFetch(pageSize, initialStatus = "idle") {
  const [state, dispatch] = useReducer(fetchReducer, {
    metadata: null,
    pages: {},
    key: null,
  });
  const {
    status: fetchStatus,
    runFetch,
    abort: abortFetch,
  } = useAbortableFetch(initialStatus);

  const resetPages = useCallback(
    (key) => {
      abortFetch();
      dispatch({ type: "reset", key });
    },
    [abortFetch]
  );

  const fetchPage = useCallback(
    (url, options, index, key, getPageData, getMetadata = null) => {
      dispatch({ type: "fetch-page", url, index, key });

      return runFetch(url, options)
        .then(async (response) => {
          if (response && response.ok) {
            dispatch({
              type: "page-loaded",
              url,
              index,
              pageData: await getPageData(response),
              metadata: getMetadata?.(response),
              key,
            });
          }
        })
        .catch((error) => {
          dispatch({ type: "page-error", url, index, error, key });
        });
    },
    [runFetch]
  );

  const status = fetchStatus === "loading" ? "loading" : "idle";
  return { ...state, status, fetchPage, resetPages };
}
