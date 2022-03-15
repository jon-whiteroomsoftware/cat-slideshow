import { useEffect, useState } from "react";

function useLocalStateStorage(key, initialValue) {
  const [state, setState] = useState(() => {
    return initialValue || JSON.parse(window.localStorage.getItem(key));
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(state));
  }, [state, key]);

  return [state, setState];
}

function Greeting({ initialName = "" }) {
  const [name, setName] = useLocalStateStorage("name");

  function handleChange(event) {
    setName({ name: event.target.value });
  }

  return (
    <div>
      <form>
        <label htmlFor="name">Name: </label>
        <input value={name.name} onChange={handleChange} id="name" />
      </form>
      {name.name ? <strong>Hello {name.name}</strong> : "Please type your name"}
    </div>
  );
}

function App() {
  return <Greeting />;
}

export default App;
