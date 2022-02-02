import { useState, useEffect } from "react";
import "./CatApp.css";

const API_KEY = "1a2691b0-d86c-41c1-b968-3b264d96ff7";
const API_VERSION = "1";
const SERVER = "api.thecatapi.com";

const NEXT = Symbol("next");
const PREV = Symbol("prev");

/*
3) image slider with timer between each image
countdown should reset for each image
  https://thecatapi.com/?
  api_key=1a2691b0-d86c-41c1-b968-3b264d96ff78'

  - image preloading
  - api buffering
  - breed selector (https://api.thecatapi.com/v1/breeds)
  - requests images with (https://api.thecatapi.com/images/search?
      breed_id={{selected_breed.id}})
  - handle server errors
  - timer to change image
  - loading state
  - keyboard support
  - useReducer, useContext, useCallback, useMemo
*/

const fetchFromCatsAPI = async (path, params = {}) => {
  const queryParams = new URLSearchParams(params);
  queryParams.append("api_key", API_KEY);
  const url = new URL(`/v${API_VERSION}${path}`, `https://${SERVER}`);
  const response = await fetch(`${url}?${queryParams}`);

  if (!response.ok) {
    throw new Error("API call failed");
  }
  return response.json();
};

function CatApp() {
  let [breeds, setBreeds] = useState({ data: [], isLoading: true });
  let [imageURLs, setImageURLs] = useState({ urls: [], isLoading: true });
  let [selectedBreedID, setSelectedBreedID] = useState("");
  let [index, setIndex] = useState(0);
  let [direction, setDirection] = useState(NEXT);

  const onBreedChange = (value) => setSelectedBreedID(value);

  const onButtonClick = (value) => {
    let imageCount = imageURLs.urls.length;
    let newIndex = (index + value) % imageCount;

    if (newIndex < 0) {
      newIndex = imageCount - 1;
    }

    console.log("new index", newIndex);
    setIndex(newIndex);
  };

  useEffect(() => {
    fetchFromCatsAPI("/breeds", {})
      .then((json) => {
        let breeds = json.filter((breed) => ({
          id: breed.id,
          name: breed.name,
        }));
        breeds.unshift({ id: "", name: "All Breeds" });

        setBreeds({
          isLoading: false,
          data: breeds,
        });
        setIndex(0);
      })
      .catch((err) => {
        console.log("CAUGHT ERRROR: FETCH BREEDS", err);
      });
  }, []);

  useEffect(() => {
    const queryParams = new URLSearchParams({
      limit: 8,
      selectedBreedID,
    });

    fetchFromCatsAPI("/images/search", queryParams)
      .then((json) => {
        setImageURLs({ urls: json, isLoading: false });
      })
      .catch((err) => {
        console.log("CAUGHT ERRROR: SEARCH", err);
      });
  }, [selectedBreedID]);

  return (
    <div className="CatApp">
      <BreedSelector
        onBreedChange={onBreedChange}
        breeds={breeds.data}
        isLoading={breeds.isLoading}
      />
      <CatImage imageURLs={imageURLs} index={index} />
      <CatControls onButtonClick={onButtonClick} />
    </div>
  );
}

function CatControls({ onButtonClick }) {
  return (
    <div className="CatControls">
      <button onClick={onButtonClick.bind(this, -1)} value={-1}>
        &lt;
      </button>
      <button onClick={onButtonClick.bind(this, 1)} value={1}>
        &gt;
      </button>
    </div>
  );
}

function CatImage({ imageURLs, index }) {
  return (
    <div className={`CatImage ${imageURLs.isLoading ? "isLoading" : ""}`}>
      {imageURLs.isLoading ? (
        <div className="loadMessage">loading</div>
      ) : (
        <div
          className="image"
          style={{
            backgroundImage: `url(${imageURLs.urls[index].url})`,
          }}
        ></div>
      )}
    </div>
  );
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
