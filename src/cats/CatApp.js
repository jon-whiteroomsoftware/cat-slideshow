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
- refactor hierarchy to move images down
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
  let [selectedBreedID, setSelectedBreedID] = useState("");
  let [isBreedsLoading, setIsBreedsLoading] = useState(true);
  let [isImagesLoading, setIsImagesLoading] = useState(true);
  let [isBreedsError, setIsBreedsError] = useState(false);
  let [isImagesError, setIsImagesError] = useState(false);

  let [breeds, setBreeds] = useState([]);
  let [images, setImages] = useState([]);
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
      try {
        const json = await fetchFromCatsAPI("/breeds", {});

        let breeds = [{ id: "", name: "All Breeds" }].concat(
          json.filter((b) => ({ id: b.id, name: b.name }))
        );

        setBreeds(breeds);
        setIsBreedsLoading(false);
      } catch (error) {
        setIsBreedsError(true);
        setIsBreedsLoading(false);
      }
    };

    fetchBreeds();
  }, []);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setIsImagesLoading(true);
        setIsImagesError(false);
        const queryParams = new URLSearchParams({
          limit: 8,
          selectedBreedID,
        });
        let json = await fetchFromCatsAPI("/images/search", queryParams);
        setImages(json);
        setIndex(0);
        setIsImagesLoading(false);
      } catch (error) {
        setIsImagesError(true);
        setIsImagesLoading(false);
      }
    };

    if (!isBreedsLoading && !isBreedsError) {
      fetchImages();
    }
  }, [selectedBreedID, isBreedsError, isBreedsLoading]);

  const isAnyLoading = isBreedsLoading || isImagesLoading;
  const isAnyError = isBreedsError || isImagesError;

  return (
    <div className="CatApp">
      <BreedSelector
        onBreedChange={onBreedChange}
        breeds={breeds}
        isLoading={isBreedsLoading}
        isError={isBreedsError}
      />
      <CatImage
        images={images}
        index={index}
        isLoading={isAnyLoading}
        isError={isAnyError}
      />
      <CatControls
        isLoading={isAnyLoading}
        isError={isAnyError}
        onButtonClick={onButtonClick}
      />
    </div>
  );
}

function CatControls({ onButtonClick, isError, isLoading }) {
  return (
    <div className="CatControls">
      <button
        disabled={isLoading || isError}
        onClick={onButtonClick.bind(this, -1)}
        value={-1}
      >
        &lt;
      </button>
      <button
        disabled={isLoading || isError}
        onClick={onButtonClick.bind(this, 1)}
        value={1}
      >
        &gt;
      </button>
    </div>
  );
}

function CatImage({ images, index, isLoading, isError }) {
  return (
    <div className="CatImage">
      {isError ? (
        <div className="message">An error has occurred</div>
      ) : isLoading ? (
        <div className="message">loading...</div>
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

function BreedSelector({ onBreedChange, breeds, isLoading, isError }) {
  return (
    <div className="BreedSelector">
      <form>
        <label>Breed</label>
        <select
          className={isError ? "isDisabled" : ""}
          disabled={isLoading || isError}
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
