import { useState, useEffect, useMemo, useReducer } from "react";
import "./CatApp.css";

let API_KEY = "1a2691b0-d86c-41c1-b968-3b264d96ff7";
API_KEY = "DEMO-API-KEY";
const API_VERSION = "1";
const SERVER = "api.thecatapi.com";

/*
3) image slider with timer between each image
  - countdown should reset for each image
  - can't rewind past zero
  - unify first and subsequent fetches
  - store images by page?
  - timer to change image
  - useReducer, useContext, useCallback, useMemo
*/

function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = function () {
      resolve(img);
    };
    img.onerror = img.onabort = function () {
      reject(url);
    };
    img.src = url;
  });
}

const fetchFromCatsAPI = async (path, params = {}) => {
  const queryParams = new URLSearchParams(params);
  const url = new URL(`/v${API_VERSION}${path}`, `https://${SERVER}`);
  console.log("CAT API FETCH", url.toString(), queryParams.toString());

  const response = await fetch(`${url}?${queryParams}`, {
    headers: {
      "x-api-key": API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error("API call failed");
  }

  return {
    json: await response.json(),
    pagination: {
      count: response.headers.get("Pagination-Count"),
      page: response.headers.get("Pagination-Page"),
    },
  };
};

function CatApp() {
  let [selectedBreedID, setSelectedBreedID] = useState("");
  let [breeds, setBreeds] = useState([]);
  let [isBreedsLoading, setIsBreedsLoading] = useState(true);
  let [isBreedsError, setIsBreedsError] = useState(false);

  const onBreedChange = (value) => setSelectedBreedID(value);

  useEffect(() => {
    const fetchBreeds = async () => {
      try {
        const { json } = await fetchFromCatsAPI("/breeds", {});

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

  return (
    <div className="CatApp">
      <BreedSelector
        onBreedChange={onBreedChange}
        breeds={breeds}
        isLoading={isBreedsLoading}
        isError={isBreedsError}
      />
      <CatImage
        isLoading={isBreedsLoading}
        isError={isBreedsError}
        selectedBreedID={selectedBreedID}
      />
    </div>
  );
}

function getCommonImageSearchParams(pageSize, selectedBreedID) {
  return new URLSearchParams({
    limit: pageSize,
    order: "DESC",
    selectedBreedID,
  });
}

function shortenURL(url) {
  return url.replace(/.*\//, "");
}

function CatImage({ isLoading, isError, selectedBreedID }) {
  const PAGE_SIZE = 10;
  const FETCH_BOUNDARY = 3;
  const [isImagesLoading, setIsImagesLoading] = useState(true);
  const [isImagesError, setIsImagesError] = useState(false);
  const [images, setImages] = useState([]);
  const [index, setIndex] = useState(0);
  const [isNextImageLoading, setIsNextImageLoading] = useState(false);
  const [pageCount, setPageCount] = useState(0);

  const commonQueryParams = useMemo(
    () => getCommonImageSearchParams(PAGE_SIZE, selectedBreedID),
    [PAGE_SIZE, selectedBreedID]
  );

  const onButtonClick = (value) => {
    let imageCount = images.length;
    let newIndex = (index + value) % imageCount;

    if (newIndex < 0) {
      newIndex = imageCount - 1;
    }

    setIsNextImageLoading(true);
    console.log("new index", newIndex, shortenURL(images[newIndex].url));

    preloadImage(images[newIndex].url).then(() => {
      setIsNextImageLoading(false);
      setIndex(newIndex);
    });

    const nextImageURL = images[newIndex + 1]?.url;

    if (nextImageURL) {
      console.log("preloading next", newIndex + 1, shortenURL(nextImageURL));
      preloadImage(nextImageURL);
    }
  };

  // loadMore effect
  //   index, isLoading, is Error,
  //   set isImagesLoading is false

  // breed change effect - selectedBreedID
  //   setIndex(0), empty out images, pageCount -> imagesLoading is true

  // on image show change
  //   reset timer

  useEffect(() => {
    if (!isLoading && index + FETCH_BOUNDARY >= images.length) {
      const fetchMoreImages = async (pageIndex) => {
        const queryParams = commonQueryParams;
        queryParams.append("page", pageIndex);

        try {
          let { json } = await fetchFromCatsAPI("/images/search", queryParams);

          console.log("Loaded page", pageIndex, images.length, json.length);
          setImages([...images, ...json]);
        } catch (error) {}
      };

      const nextPageIndex = images.length / PAGE_SIZE;
      console.log("Need to fetch more", nextPageIndex);
      fetchMoreImages(nextPageIndex);
    }
  }, [index, images, commonQueryParams, isLoading]);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        setIsImagesLoading(true);
        setIsImagesError(false);
        let { json, pagination } = await fetchFromCatsAPI(
          "/images/search",
          commonQueryParams
        );
        setImages(json);
        setIndex(0);
        setPageCount(Math.ceil(pagination.count / PAGE_SIZE));
        setIsImagesLoading(false);
      } catch (error) {
        setIsImagesError(true);
        setIsImagesLoading(false);
      }
    };

    if (!isLoading && !isError) {
      fetchImages();
    }
  }, [selectedBreedID, isError, isLoading, commonQueryParams]);

  return (
    <div className="CatImage">
      {isError || isImagesError ? (
        <div className="message">An error has occurred</div>
      ) : isLoading || isImagesLoading ? (
        <div className="message">loading...</div>
      ) : (
        <div
          className={`image ${isNextImageLoading ? "nextLoading" : ""}`}
          style={{
            backgroundImage: `url(${images[index].url})`,
          }}
        ></div>
      )}
      <CatControls
        isLoading={isLoading}
        isError={isError}
        onButtonClick={onButtonClick}
      />
    </div>
  );
}

function BreedSelector({ onBreedChange, breeds, isLoading, isError }) {
  return (
    <div className="BreedSelector">
      <form>
        <label>Breed</label>
        <select
          className={isError ? "isError" : ""}
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

export default CatApp;
