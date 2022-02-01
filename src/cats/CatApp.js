import { useState, useEffect } from "react";
import "./CatApp.css";

const API_KEY = "1a2691b0-d86c-41c1-b968-3b264d96ff7";
const SERVER = "api.thcatapi.com";

/*
3) image slider with timer between each image
countdown should reset for each image
  https://thecatapi.com/?
  api_key=1a2691b0-d86c-41c1-b968-3b264d96ff78'

  - breed selector (https://api.thecatapi.com/v1/breeds)
  - requests images with (https://api.thecatapi.com/images/search?
      breed_id={{selected_breed.id}})
  - arrows to scroll
  - timer to change image
  - loading state
  - keyboard support
*/

function CatApp() {
  let [selectedBreedID, setSelectedBreedID] = useState("");

  const onBreedChange = (value) => {
    console.log("On breed change", value);
  };

  useEffect(() => {
    console.log("Use effect fired");
  }, [selectedBreedID]);

  return (
    <div className="CatApp">
      <BreedSelector onBreedChange={onBreedChange} />
      <CatImage />
      <CatControls />
    </div>
  );
}

function CatControls() {
  const onButtonClick = (e) => {
    console.log("Button click", e.target.value);
  };

  return (
    <div className="CatControls">
      <button onClick={onButtonClick} value={-1}>
        &lt;
      </button>
      <button onClick={onButtonClick} value={1}>
        &gt;
      </button>
    </div>
  );
}

function CatImage() {
  return <div className="CatImage"></div>;
}

function BreedSelector(onBreedChange) {
  return (
    <div className="BreedSelector">
      <form>
        <label>Breed</label>
        <input type="text" onChange={onBreedChange} />
      </form>
    </div>
  );
}

export default CatApp;
