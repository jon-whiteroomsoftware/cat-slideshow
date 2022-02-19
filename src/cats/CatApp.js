import { useState, useEffect, useCallback, useRef, useReducer } from "react";
import { preloadImage } from "./utils.js";
import useAbortableFetch from "./useAbortableFetch.js";
import getCatsApiFetchParams from "./getCatsApiFetchParams.js";
import usePaginatedFetch from "./usePaginatedFetch";
import fetchFromCatsAPI from "./fetchFromCatsAPI.js";
import "./CatApp.css";
import "./loadingSpinner.css";

/*
3) image slider with timer between each image
  - just pass status down instead of isLoading and isError?
  - use status in app, for fetching (idle, fetching, resolved, error)
  - error state + ErrorBoundary (react-error-boundary?)
  - useContext + useReducer
  - use vh for sizing?
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
  - have another screen with typedown search
  - fetch code:
*/

const PAGE_SIZE = 8;
const PREFETCH_LOOKAHEAD = 3;
const BREED_ID_KEY = "CatApp-breed-id";

function catAppReducer(state, action) {
  console.log("%ccatapp: " + action.type, "color: green", action);
  switch (action.type) {
    case "select-breed": {
      window.localStorage.setItem(BREED_ID_KEY, action.id);
      return { ...state, selectedBreedID: action.id };
    }
    case "breeds-loaded":
      return { breeds: action.breeds, selectedBreedID: action.selectedBreedID };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

function CatApp() {
  const [state, dispatch] = useReducer(catAppReducer, {
    breeds: null,
    selectedBreedID: null,
  });

  const { status, runFetch } = useAbortableFetch("pending");
  console.log("Render Catapp", status);

  useEffect(() => {
    const { url, options } = getCatsApiFetchParams("/breeds", undefined, 1000);
    //console.log("USE EFFECT", url, options);

    runFetch(url, options)
      .then(async (response) => {
        if (!response || !response.ok) {
          throw new Error("API call failed");
        }

        const json = await response.json();
        let breeds = [{ id: "all", name: "All Breeds" }].concat(
          json.filter((b) => ({ id: b.id, name: b.name }))
        );

        dispatch({
          type: "breeds-loaded",
          breeds,
          selectedBreedID: window.localStorage.getItem(BREED_ID_KEY) || "all",
        });
      })
      .catch((error) => {
        // suppress error
      });
  }, [runFetch]);

  const isLoading = status === "pending";
  const isError = status === "rejected";

  return (
    <div className="CatApp">
      <BreedSelector
        dispatch={dispatch}
        breeds={state.breeds}
        selectedBreedID={state.selectedBreedID}
        isLoading={isLoading}
        isError={isError}
      />
      <CatImage
        isLoading={isLoading}
        isError={isError}
        selectedBreedID={state.selectedBreedID}
      />
    </div>
  );
}

function catImageReducer(state, action) {
  console.log("%ccatimage: " + action.type, "color: orange", action);
  switch (action.type) {
    case "change-breed":
      return { ...state, index: 0, maxPage: null };
    case "change-index":
      return {
        ...state,
        isIndexChanging: true,
        nextIndex: Math.max(0, (state.index || 0) + action.increment),
      };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

function CatImage({ isLoading, isError, selectedBreedID }) {
  const selectedBreedIDRef = useRef(selectedBreedID);
  const { pages, status, fetchPage, resetPages } = usePaginatedFetch(PAGE_SIZE);
  const [state, dispatch] = useReducer(catImageReducer, {
    index: null,
    maxPage: null,
    isIndexChanging: false,
    nextIndex: null,
  });

  const { index } = state;
  console.log("CatImage render", { status, selectedBreedID, index });

  useEffect(() => {
    if (selectedBreedID !== selectedBreedIDRef.current) {
      selectedBreedIDRef.current = selectedBreedID;
      resetPages(selectedBreedID);
      dispatch({ type: "change-breed", selectedBreedID });
    }
  }, [resetPages, selectedBreedID]);

  useEffect(() => {
    if (selectedBreedID === null) {
      return;
    }

    const getPageIndex = (i) => Math.floor(i / PAGE_SIZE);
    const pageIndex = getPageIndex(index);
    const prefetchPageIndex = getPageIndex(index + PREFETCH_LOOKAHEAD);

    const doFetchPage = (pageIndex) => {
      const { url, options } = getCatsApiFetchParams(
        "/images/search",
        {
          breeds: selectedBreedID === "all" ? "" : selectedBreedID,
          limit: PAGE_SIZE,
          order: "ASC",
          page: pageIndex,
        },
        3000
      );

      fetchPage(url, options, pageIndex, selectedBreedID).then(() => {
        // anytime we were waiting for this page to load (to show index)
        if (index === null) {
          dispatch({ type: "change-index", increment: 0 });
        }
      });
    };

    if (!pages[pageIndex]) {
      doFetchPage(pageIndex);
    }

    if (prefetchPageIndex !== pageIndex && !pages[prefetchPageIndex]) {
      doFetchPage(prefetchPageIndex);
    }
  }, [fetchPage, index, selectedBreedID, pages]);

  useEffect(() => {
    const pageIndex = Math.floor(state.nextIndex / PAGE_SIZE);
    const offset = state.nextIndex % PAGE_SIZE;
    const url = pages?.[pageIndex]?.[offset]?.url;

    console.log("index is changing", state.nextIndex, url);
  }, [pages, state.isIndexChanging, state.nextIndex]);

  /*
      const imageURL = (index) => {
        const { pageIndex, pageOffset } = imageIndex(index);
        const imagePage = state.imagePages[pageIndex];
        return imagePage ? imagePage.data[pageOffset]?.url : null;
      };

      dispatch({ type: "index-changing" });
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
*/

  return (
    <div className="CatImage">
      <div className="mainContainer">
        {isError ? (
          <div className="messageContainer">
            <span className="message">An error has occurred</span>
          </div>
        ) : isLoading || status === "pending" ? (
          <div className="messageContainer">
            <span className="message">loading...</span>
          </div>
        ) : (
          <div>{state.index}</div>
          // <div
          //   className={`image ${state.isIndexChanging ? "nextLoading" : ""}`}
          //   style={{
          //     backgroundImage: `url(${url})`,
          //   }}
          // ></div>
        )}
      </div>
      <CatControls
        dispatch={dispatch}
        isDisabled={isLoading || isError}
        canScrollLeft={state.index !== 0}
      />
    </div>
  );
}

function CatControls({ dispatch, isDisabled, canScrollLeft }) {
  return (
    <div className="CatControls">
      <button
        disabled={isDisabled || !canScrollLeft}
        onClick={() => dispatch({ type: "change-index", increment: -1 })}
      >
        &lt;
      </button>
      <button
        disabled={isDisabled}
        onClick={() => dispatch({ type: "change-index", increment: 1 })}
      >
        &gt;
      </button>
    </div>
  );
}

function BreedSelector({
  dispatch,
  breeds,
  selectedBreedID,
  isLoading,
  isError,
}) {
  function onSelectChange(e) {
    dispatch({ type: "select-breed", id: e.target.value });
  }

  return (
    <div className="BreedSelector">
      <form>
        <label>Breed</label>
        <span className="selectContainer">
          <select
            className={isError ? "isError" : ""}
            disabled={breeds === null || isError}
            onChange={onSelectChange}
            type="select"
            value={selectedBreedID || undefined}
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

function oldCatImageReducer(state, action) {
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
          [action.index]: { loadState: "loading", data: [] },
        },
      };

    case "page-loaded":
      return {
        ...state,
        areImagesLoading: false,
        imagePages: {
          ...state.imagePages,
          [action.index]: { loadState: "loaded", data: action.json },
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

function CatImageOld({ isBreedsError, selectedBreedID }) {
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

export default CatApp;
