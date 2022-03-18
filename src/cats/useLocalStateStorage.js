import { useEffect, useState } from "react";

export default function useLocalStateStorage(key, initialValue) {
  const [state, setState] = useState(() => {
    return initialValue || JSON.parse(window.localStorage.getItem(key));
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(state));
  }, [state, key]);

  return [state, setState];
}
