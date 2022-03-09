import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import CatApp from "./cats/CatApp";

// test app mounting/unmounting behavior
function Unmounter({ children }) {
  const [isMounted, setIsMounted] = React.useState(true);

  function onChange(e) {
    setIsMounted(!isMounted);
  }

  return (
    <>
      <div>
        <label>Mounted</label>
        <input type="checkbox" onChange={onChange} checked={isMounted} />
      </div>
      <div>{isMounted && children}</div>
    </>
  );
}

ReactDOM.render(
  <React.StrictMode>
    {/* <Unmounter> */}
    <CatApp />
    {/* </Unmounter> */}
  </React.StrictMode>,
  document.getElementById("root")
);
