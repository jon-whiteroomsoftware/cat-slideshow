import { useState, useEffect, useMemo, useReducer } from "react";
import "./CatApp.css";

let API_KEY = "1a2691b0-d86c-41c1-b968-3b264d96ff7";
API_KEY = "DEMO-API-KEY";
const API_VERSION = "1";
const SERVER = "api.thecatapi.com";

/*
3) image slider with timer between each image
  - avoid possibility of double-fetching by adding key on API call
  - timer to change image
  - countdown should reset for each image
  - can't rewind past zero
  - useContext, useCallback, useMemo
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
  let [selectedBreedID, setSelectedBreedID] = useState(null);
  let [breeds, setBreeds] = useState(null);
  let [isBreedsError, setIsBreedsError] = useState(false);

  const onBreedChange = (value) => setSelectedBreedID(value);

  useEffect(() => {
    const fetchBreeds = async () => {
      try {
        const { json } = await fetchFromCatsAPI("/breeds", {});

        let breeds = [{ id: "all", name: "All Breeds" }].concat(
          json.filter((b) => ({ id: b.id, name: b.name }))
        );

        setBreeds(breeds);
        setSelectedBreedID("all");
      } catch (error) {
        setIsBreedsError(true);
      }
    };

    fetchBreeds();
  }, []);

  return (
    <div className="CatApp">
      <BreedSelector
        onBreedChange={onBreedChange}
        breeds={breeds}
        isError={isBreedsError}
      />
      <CatImage
        isBreedsError={isBreedsError}
        selectedBreedID={selectedBreedID}
      />
    </div>
  );
}

function shortenURL(url) {
  return url.replace(/.*\//, "");
}

const PAGE_SIZE = 8;
const FETCH_BOUNDARY = 2;

function catImageReducer(state, action) {
  console.log("Reduce", action);
  switch (action.type) {
    case "change-breed":
      return {
        ...state,
        index: 0,
        imagePages: {},
        pageCount: null,
        areImagesLoading: true,
      };

    case "fetch-page":
      return {
        ...state,
        imagePages: { ...state.imagePages, [action.index]: [] },
      };

    case "fetch-page-for-current-index":
      return {
        ...state,
        areImagesLoading: true,
        imagePages: { ...state.imagePages, [action.index]: [] },
      };

    case "page-loaded":
      return {
        ...state,
        imagePages: { ...state.imagePages, [action.index]: action.json },
        areImagesLoading: false,
      };

    case "index-changing":
      return {
        ...state,
        isIndexChanging: true,
      };

    case "index-changed":
      return {
        ...state,
        index: action.index,
        isIndexChanging: false,
      };

    default:
      return state;
  }
}

function CatImage({ isBreedsError, selectedBreedID }) {
  const [state, dispatch] = useReducer(catImageReducer, {
    imagePages: {},
    index: null,
    maxPage: null,
    areImagesLoading: true,
    canShowCurrentImage: false,
    isIndexChanging: false,
  });

  const imageIndex = (index) => ({
    pageIndex: Math.floor(index / PAGE_SIZE),
    pageOffset: index % PAGE_SIZE,
  });

  const imageURL = (index) => {
    const { pageIndex, pageOffset } = imageIndex(index);
    const imagePage = state.imagePages[pageIndex];
    return imagePage ? imagePage[pageOffset]?.url : null;
  };

  useEffect(() => {
    if (selectedBreedID !== null) {
      dispatch({ type: "change-breed" });
    }
  }, [selectedBreedID]);

  useEffect(() => {
    if (state.index === null) {
      return;
    }

    const fetchPage = async (pageIndex) => {
      try {
        let { json } = await fetchFromCatsAPI("/images/search", {
          limit: PAGE_SIZE,
          order: "ASC",
          page: pageIndex,
          selectedBreedID,
        });

        dispatch({ type: "page-loaded", index: pageIndex, json });
      } catch (error) {
        console.log("Fetch error", { pageIndex, selectedBreedID });
      }
    };

    // do we have the image URLs for this index?
    const { pageIndex } = imageIndex(state.index);

    if (!state.imagePages[pageIndex]) {
      dispatch({ type: "fetch-page-for-current-index", index: pageIndex });
      fetchPage(pageIndex);
    }

    const prefetchIndex = imageIndex(state.index + FETCH_BOUNDARY);

    if (!state.imagePages[prefetchIndex.pageIndex]) {
      dispatch({ type: "fetch-page", index: prefetchIndex.pageIndex });
      fetchPage(prefetchIndex.pageIndex);

      console.log("Need to load next page");
    }
  }, [state.index, selectedBreedID, state.imagePages]);

  const onButtonClick = (value) => {
    dispatch({ type: "index-changing" });
    const newIndex = Math.max(0, state.index + value);
    const url = imageURL(newIndex);

    if (url !== null) {
      dispatch({ type: "index-changed", index: newIndex });
      return;
    }

    preloadImage(url).then(() => {
      dispatch({ type: "index-changed", index: newIndex });
    });
  };

  const isLoading = selectedBreedID === null || state.areImagesLoading;
  const isError = isBreedsError;
  let url = null;

  if (!isLoading && state.index !== null) {
    const { pageIndex, pageOffset } = imageIndex(state.index);
    const imagePage = state.imagePages[pageIndex];
    url = imagePage ? imagePage[pageOffset]?.url : "";
  }

  // console.log({
  //   index: state.index,
  //   selectedBreedID,
  //   imagesLoading: state.areImagesLoading,
  // });

  return (
    <div className="CatImage">
      {isError ? (
        <div className="message">An error has occurred</div>
      ) : isLoading ? (
        <div className="message">loading...</div>
      ) : (
        <div
          className={`image ${state.isIndexChanging ? "nextLoading" : ""}`}
          style={{
            backgroundImage: `url(${url})`,
          }}
        ></div>
      )}
      <CatControls
        isLoading={isLoading || state.isIndexChanging}
        isError={isBreedsError}
        onButtonClick={onButtonClick}
      />
    </div>
  );
}

function BreedSelector({ onBreedChange, breeds, isError }) {
  return (
    <div className="BreedSelector">
      <form>
        <label>Breed</label>
        <select
          className={isError ? "isError" : ""}
          disabled={breeds === null || isError}
          onChange={(e) => onBreedChange(e.target.value)}
          type="select"
        >
          {breeds === null
            ? []
            : breeds.map((breed) => (
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
