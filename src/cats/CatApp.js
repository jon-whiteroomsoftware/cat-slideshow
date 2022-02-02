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

- handle server errors
  - image preloading
  - api buffering
  - breed selector (https://api.thecatapi.com/v1/breeds)
  - requests images with (https://api.thecatapi.com/images/search?
      breed_id={{selected_breed.id}})
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
  let [images, setImages] = useState([]);
  let [isImageLoading, setIsImageLoading] = useState(true);
  let [selectedBreedID, setSelectedBreedID] = useState("");
  let [index, setIndex] = useState(0);
  let [direction, setDirection] = useState(NEXT);

  const onBreedChange = (value) => setSelectedBreedID(value);

  const onButtonClick = (value) => {
    let imageCount = images.length;
    let newIndex = (index + value) % imageCount;
    setDirection(value === -1 ? PREV : NEXT);

    if (newIndex < 0) {
      newIndex = imageCount - 1;
    }

    console.log("new index", newIndex);
    setIndex(newIndex);
  };

  useEffect(() => {
    const fetchBreeds = async () => {
      const json = await fetchFromCatsAPI("/breeds", {});

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
    };

    fetchBreeds();
  }, []);

  useEffect(() => {
    const fetchImages = async () => {
      const queryParams = new URLSearchParams({
        limit: 8,
        selectedBreedID,
      });

      setIsImageLoading(true);
      let json = await fetchFromCatsAPI("/images/search", queryParams);
      setImages(json);
      setIsImageLoading(false);
    };

    fetchImages();
  }, [selectedBreedID]);

  return (
    <div className="CatApp">
      <BreedSelector
        onBreedChange={onBreedChange}
        breeds={breeds.data}
        isLoading={breeds.isLoading}
      />
      <CatImage images={images} index={index} isImageLoading={isImageLoading} />
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

function CatImage({ images, index, isImageLoading }) {
  return (
    <div className={`CatImage ${isImageLoading ? "isLoading" : ""}`}>
      {isImageLoading ? (
        <div className="loadMessage">loading</div>
      ) : (
        <div
          className="image"
          style={{
            backgroundImage: `url(${images[index].url})`,
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
