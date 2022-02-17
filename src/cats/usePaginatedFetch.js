import { useEffect, useCallback, useReducer, useRef } from "react";
import fetchFromCatsAPI from "./fetchFromCatsAPI";

function fetchReducer(state, action) {
  console.log("%cfetchReducer: " + action.type, "color: blue", action);
  switch (action.type) {
    case "fetch-page":
      return {
        ...state,
        pages: {
          ...state.pages,
          [action.index]: { status: "loading", data: [] },
        },
      };
    case "page-loaded": {
      return {
        ...state,
        pages: {
          ...state.pages,
          [action.index]: { status: "loaded", data: action.json },
        },
      };
    }
    case "page-error": {
      return {
        ...state,
        pages: {
          ...state.pages,
          [action.index]: { status: "error", data: [] },
        },
      };
    }
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

function usePaginatedFetch(pageSize) {
  const { current: controller } = useRef(new AbortController());
  const [state, dispatch] = useReducer(fetchReducer, {
    pages: {},
    pageSize,
  });

  useEffect(() => {
    return () => controller.abort();
  }, [controller]);

  const fetchPage = useCallback(
    (index) => {
      dispatch({ type: "fetch-page", index });

      fetchFromCatsAPI(
        "/images/search",
        {
          limit: pageSize,
          order: "ASC",
          page: index,
        },
        { signal: controller.signal }
        //true, // isSlow
      )
        .then((data) => dispatch({ type: "page-loaded", index, data }))
        .catch((error) => {
          dispatch({ type: "page-error", index, error });

          if (error.name !== "AbortError") {
            throw error;
          }
        });
    },
    [pageSize, controller.signal]
  );

  const status = Object.values(state.pages).find((d) => d.status === "loading")
    ? "loading"
    : "idle";

  return { ...state, status, fetchPage };
}

export default usePaginatedFetch;
