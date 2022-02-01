import { useState, useEffect } from "react";
import "./CatApp.css";

const API_KEY = "1a2691b0-d86c-41c1-b968-3b264d96ff7";
const SERVER = "api.thecatapi.com";

/*
3) image slider with timer between each image
countdown should reset for each image
  https://thecatapi.com/?
  api_key=1a2691b0-d86c-41c1-b968-3b264d96ff78'

  - breed selector (https://api.thecatapi.com/v1/breeds)
  - requests images with (https://api.thecatapi.com/images/search?
      breed_id={{selected_breed.id}})
  - arrows to scroll
  - fetch breeds to hook
  - timer to change image
  - loading state
  - keyboard support
*/

const fetchBreeds = async () => {
  try {
    const url = `https://${SERVER}/v1/breeds?api_key=${API_KEY}`;
    console.log(url);
    const response = await fetch(url);
    return response.json();
  } catch (error) {
    console.log("breed fetch error", error);
  }
};

function CatApp() {
  let [breeds, setBreeds] = useState({ data: [], isLoading: true });
  let [selectedBreedID, setSelectedBreedID] = useState("");

  const onBreedChange = (value) => {
    console.log("On breed change", value);
  };

  useEffect(() => {
    console.log("Use effect fired");
    fetchBreeds().then((json) => {
      setBreeds({
        isLoading: false,
        data: json.filter((breed) => ({ id: breed.id, name: breed.name })),
      });
    });
  }, [selectedBreedID]);

  return (
    <div className="CatApp">
      <BreedSelector
        onBreedChange={onBreedChange}
        breeds={breeds.data}
        isLoading={breeds.isLoading}
      />
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

function BreedSelector({ onBreedChange, breeds, isLoading }) {
  return (
    <div className="BreedSelector">
      <form>
        <label>Breed</label>
        <select
          className={isLoading ? "isLoading" : ""}
          onChange={(e) => onBreedChange(e.target.value)}
          type="select"
        >
          {breeds.map((breed) => (
            <option key={breed.id} value={breed.id}>
              {breed.name}
            </option>
          ))}
        </select>
      </form>
    </div>
  );
}

export default CatApp;
