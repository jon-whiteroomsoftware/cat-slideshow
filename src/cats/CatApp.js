import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useReducer,
  useMemo,
} from "react";
import {
  LoadState,
  preloadImage,
  useAsync,
  useAbortableFetch,
} from "./utils.js";
import getCatsApiFetchParams from "./getCatsApiFetchParams.js";
import usePaginatedFetch from "./usePaginatedFetch";
import "./CatApp.css";
import "./loadingSpinner.css";

/*
3) image slider with timer between each image
  - toggle in useabortable fetch to cancel in-flights
  - get prefetch working

  - save selectedBreed in localstorage
  - use status in app, for fetching (idle, fetching, resolved, error)
  - error state + ErrorBoundary (react-error-boundary?)
  - useContext + useReducer
  - focus select
  - useMemo and check rendering
  - count renders
  - timer to change image
  - can rewind past zero?
  - countdown should reset for each image
  - allow quick button clicking
  - debounce (until the user stops doing things);
  - useContext, useCallback, useMemo
  - transition images off and onto screen (refs and useLayoutEffect?)
  - fetch code:
*/

const PAGE_SIZE = 8;

function catAppReducer(state, action) {
  console.log("%ccatapp: " + action.type, "color: green", action);
  switch (action.type) {
    case "select-breed":
      return { ...state, selectedBreedID: action.id };
    case "breeds-loaded":
      return { breeds: action.breeds, selectedBreedID: "all" };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

function CatApp() {
  const [state, dispatch] = useReducer(catAppReducer, {
    breeds: null,
    selectedBreedID: null,
  });

  const { response, status, error, runFetch } = useAbortableFetch("pending");
  console.log("Render", status, response, error);

  const onBreedChange = (value) => {
    dispatch({ type: "select-breed", id: value });
  };

  useEffect(() => {
    const { url, options } = getCatsApiFetchParams("/breeds", undefined, 3000);
    console.log("USE EFFECT", url, options);

    runFetch(url, options)
      .then(async (response) => {
        console.log("RESPONSE", response);
        const json = await response.json();
        let breeds = [{ id: "all", name: "All Breeds" }].concat(
          json.filter((b) => ({ id: b.id, name: b.name }))
        );

        dispatch({ type: "breeds-loaded", breeds });
      })
      .catch((error) => {
        console.log("CAUGHT", error);
      });
  }, [runFetch]);

  return (
    <div className="CatApp">
      <BreedSelector
        onBreedChange={onBreedChange}
        breeds={state.breeds}
        isLoading={status === "pending"}
        isError={status === "rejected"}
      />
      {/* <CatImage
        isBreedsError={isBreedsError}
        selectedBreedID={selectedBreedID}
      /> */}
    </div>
  );
}

function BreedSelector({ onBreedChange, breeds, isLoading, isError }) {
  return (
    <div className="BreedSelector">
      <form>
        <label>Breed</label>
        <span className="selectContainer">
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
          {isLoading && (
            <div className="selectSpinner">
              <div className="loadingSpinnerExtraSmall"></div>
            </div>
          )}
        </span>
      </form>
    </div>
  );
}

/************************************************************ */

const FETCH_BOUNDARY = 2;

function catImageReducer(state, action) {
  // console.log("Reduce", action);
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
        areImagesLoading: action.isCurrentPage,
        imagePages: {
          ...state.imagePages,
          [action.index]: { loadState: LoadState.LOADING, data: [] },
        },
      };

    case "page-loaded":
      return {
        ...state,
        areImagesLoading: false,
        imagePages: {
          ...state.imagePages,
          [action.index]: { loadState: LoadState.LOADED, data: action.json },
        },
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
        // let { json } = await fetchFromCatsAPI("/images/search", {
        //   limit: PAGE_SIZE,
        //   order: "ASC",
        //   page: pageIndex,
        //   selectedBreedID,
        // });
        // dispatch({ type: "page-loaded", index: pageIndex, json });
      } catch (error) {
        console.log("Fetch error", { pageIndex, selectedBreedID });
      }
    };

    // do we have the image URLs for this index?
    const { pageIndex } = imageIndex(state.index);

    if (!state.imagePages[pageIndex]) {
      dispatch({ type: "fetch-page", index: pageIndex, isCurrentPage: true });
      fetchPage(pageIndex);
    }

    const prefetchIndex = imageIndex(state.index + FETCH_BOUNDARY);

    if (!state.imagePages[prefetchIndex.pageIndex]) {
      dispatch({ type: "fetch-page", index: prefetchIndex.pageIndex });
      fetchPage(prefetchIndex.pageIndex);
    }
  }, [state.index, selectedBreedID, state.imagePages]);

  const onButtonClick = useCallback(
    (value) => {
      const imageURL = (index) => {
        const { pageIndex, pageOffset } = imageIndex(index);
        const imagePage = state.imagePages[pageIndex];
        return imagePage ? imagePage.data[pageOffset]?.url : null;
      };

      dispatch({ type: "index-changing" });
      const newIndex = Math.max(0, state.index + value);
      const url = imageURL(newIndex);

      if (url !== null) {
        console.log("URL immediate", url);
        dispatch({ type: "index-changed", index: newIndex });
        return;
      }

      preloadImage(url).then(() => {
        console.log("URL prefetched", url);
        dispatch({ type: "index-changed", index: newIndex });
      });
    },
    [state.index, state.imagePages]
  );

  const isLoading = selectedBreedID === null || state.areImagesLoading;
  const isError = isBreedsError;
  let url = null;

  if (!isLoading && state.index !== null) {
    const { pageIndex, pageOffset } = imageIndex(state.index);
    const imagePage = state.imagePages[pageIndex];
    url = imagePage ? imagePage.data[pageOffset]?.url : "";
  }

  // console.log("RENDER", {
  //   index: state.index,
  //   isIndexChanging: state.isIndexChanging,
  //   // selectedBreedID,
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
        canScrollLeft={state.index !== 0}
        isError={isBreedsError}
        onButtonClick={onButtonClick}
      />
    </div>
  );
}

function CatControls({ onButtonClick, isError, isLoading, canScrollLeft }) {
  return (
    <div className="CatControls">
      <button
        disabled={isLoading || isError || !canScrollLeft}
        onClick={onButtonClick.bind(this, -1)}
      >
        &lt;
      </button>
      <button
        disabled={isLoading || isError}
        onClick={onButtonClick.bind(this, 1)}
      >
        &gt;
      </button>
    </div>
  );
}

export default CatApp;

/*
function CatImg(props) {
  const [index, setIndex] = useState(0);
  const { pages, status, fetchPage } = usePaginatedFetch(PAGE_SIZE);

  useEffect(() => {
    const pageIndex = Math.floor(index / PAGE_SIZE);
    const offset = index % PAGE_SIZE;
    console.log("USE EFFECT", index, pageIndex);

    if (!pages[pageIndex]) {
      fetchPage(pageIndex);
    }
  }, [index, pages, fetchPage]);

  function onButtonClick(val) {
    setIndex(index + val);
  }

  return (
    <div>
      <button onClick={() => onButtonClick(-1)}>&lt;</button>
      <button onClick={() => onButtonClick(1)}>&gt;</button>
      <br />
      {`CatImg index: ${index} - Status: ${status}`}
    </div>
  );
}

function Scopy(props) {
  const { current: options } = useRef({
    headers: { "x-api-key": API_KEY },
  });
  const { status, data, error, abort } = useAbortableFetch(props.url, options);

  function onButtonClick() {
    console.log("ABORT");
    abort();
  }

  return (
    <div>
      <button onClick={onButtonClick}>Abort</button>
      <br />
      SCOPY
    </div>
  );
}


*/
