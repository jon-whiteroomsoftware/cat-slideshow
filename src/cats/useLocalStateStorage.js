import { useEffect, useState } from "react";

export default function useLocalStateStorage(key, initialValue) {
  const [state, setState] = useState(() => {
    return JSON.parse(window.localStorage.getItem(key)) || initialValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}
