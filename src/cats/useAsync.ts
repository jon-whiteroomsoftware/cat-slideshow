import { useReducer, useCallback, Reducer } from "react";

export type Status = "idle" | "loading" | "loaded" | "error" | "aborted";

type LoadingAction = {
  type: "loading";
};

type LoadedAction<D> = {
  type: "loaded";
  data: D;
};

type ErrorAction<E> = {
  type: "error";
  error: E;
};

type AbortAction = {
  type: "abort";
};

type AsyncAction<D, E> =
  | LoadingAction
  | LoadedAction<D>
  | ErrorAction<E>
  | AbortAction;

type AsyncState<D, E> = {
  status: Status;
  data: D | null;
  error: E | null;
};

function asyncReducer<D, E>(
  state: AsyncState<D, E>,
  action: AsyncAction<D, E>
): AsyncState<D, E> {
  switch (action.type) {
    case "loading":
      return { status: "loading", data: null, error: null };
    case "loaded":
      return { status: "loaded", data: action.data, error: null };
    case "error":
      return { status: "error", data: null, error: action.error };
    case "abort":
      return { status: "aborted", data: null, error: null };
  }
}

export default function useAsync<D, E>(initialState: Status = "idle") {
  const [state, dispatch] = useReducer<
    Reducer<AsyncState<D, E>, AsyncAction<D, E>>
  >(asyncReducer, {
    status: initialState,
    data: null,
    error: null,
  });

  const run = useCallback((promise: Promise<D | void>) => {
    dispatch({ type: "loading" });

    promise
      .then((data: D | void) => {
        if (data !== undefined) {
          dispatch({ type: "loaded", data });
        }
      })
      .catch((error: E) => dispatch({ type: "error", error }));
  }, []);

  const abort = useCallback(() => {
    dispatch({ type: "abort" });
  }, []);

  return { ...state, run, abort } as const;
}
