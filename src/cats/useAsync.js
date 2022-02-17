import { useReducer, useCallback } from "react";

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

export default useAsync;
