import { useReducer, useCallback } from "react";

function asyncReducer(state, action) {
  //console.log("%casync: " + action.type, "color: blue", action);
  switch (action.type) {
    case "loading":
      return { status: "loading", data: null, error: null };
    case "loaded":
      return { status: "loaded", data: action.data, error: null };
    case "error":
      return { status: "error", data: null, error: action.error };
    case "abort":
      return { status: "aborted", data: null, error: null };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

export default function useAsync(initialState = "idle") {
  const [state, dispatch] = useReducer(asyncReducer, {
    status: initialState,
    data: null,
    error: null,
  });

  const run = useCallback((promise) => {
    dispatch({ type: "loading" });

    promise
      .then((data) => dispatch({ type: "loaded", data }))
      .catch((error) => dispatch({ type: "error", error }));
  }, []);

  const abort = useCallback(() => {
    dispatch({ type: "abort" });
  }, []);

  return { ...state, run, abort };
}
