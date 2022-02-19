import { useEffect, useRef, useReducer } from "react";
import { preloadImage } from "./utils.js";
import getCatsApiFetchParams from "./getCatsApiFetchParams.js";
import usePaginatedFetch from "./usePaginatedFetch";
import CatSlideshowControls from "./CatSlideshowControls.js";

const PAGE_SIZE = 8;
const PREFETCH_LOOKAHEAD = 3;

function initCatSlideshowState() {
  return { index: 0, isIndexChanging: true };
}

function getSearchApiParams(selectedBreedID, pageIndex) {
  return {
    breeds: selectedBreedID === "all" ? "" : selectedBreedID,
    limit: PAGE_SIZE,
    order: "ASC",
    page: pageIndex,
  };
}

function getPageIndex(i) {
  Math.floor(i / PAGE_SIZE);
}

function getPageIndexAndOffset(i) {
  return [getPageIndex(i), i % PAGE_SIZE];
}

function catSlideshowReducer(state, action) {
  console.log("%ccatimage: " + action.type, "color: orange", action);
  switch (action.type) {
    case "change-breed":
      return initCatSlideshowState();
    case "change-index":
      return {
        index: action.index,
        isIndexChanging: true,
      };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

function CatSlideshow({ selectedBreedID }) {
  const prevSelectedBreedIDRef = useRef(selectedBreedID);
  const prevIndexRef = useRef(null);
  const { pages, status, fetchPage, resetPages } = usePaginatedFetch(PAGE_SIZE);

  const [state, dispatch] = useReducer(
    catSlideshowReducer,
    undefined,
    initCatSlideshowState
  );

  const { index, isIndexChanging } = state;
  console.log("render", { index, isIndexChanging, selectedBreedID, status });

  if (selectedBreedID !== prevSelectedBreedIDRef.current) {
    prevSelectedBreedIDRef.current = selectedBreedID;
    prevIndexRef.current = null;
    resetPages(selectedBreedID);
    dispatch({ type: "change-breed", selectedBreedID });
  }

  if (isIndexChanging) {
    const pageIndex = getPageIndex(index);
    const prefetchPageIndex = getPageIndex(index + PREFETCH_LOOKAHEAD);

    const doFetchPage = (pageIndex) => {
      const { url, options } = getCatsApiFetchParams(
        "/images/search",
        getSearchApiParams(selectedBreedID, pageIndex),
        3000
      );

      fetchPage(url, options, pageIndex, selectedBreedID);
    };

    if (!pages[pageIndex]) {
      doFetchPage(pageIndex);
    }

    if (prefetchPageIndex !== pageIndex && !pages[prefetchPageIndex]) {
      doFetchPage(prefetchPageIndex);
    }
  }

  useEffect(() => {
    const [pageIndex, offset] = getPageIndexAndOffset(index);
    console.log("Pages and index", { pageIndex, offset, index });
  }, [pages, index]);

  /*
  useEffect(() => {
    const pageIndex = Math.floor(state.nextIndex / PAGE_SIZE);
    const offset = state.nextIndex % PAGE_SIZE;
    const url = pages?.[pageIndex]?.[offset]?.url;

    console.log("index is changing", state.nextIndex, url);
  }, [pages, state.isIndexChanging, state.nextIndex]);

  // const imageURL = (index) => {
  //   const { pageIndex, pageOffset } = imageIndex(index);
  //   const imagePage = state.imagePages[pageIndex];
  //   return imagePage ? imagePage.data[pageOffset]?.url : null;
  // };

  // dispatch({ type: "index-changing" });
  // const url = imageURL(newIndex);

  // if (url !== null) {
  //   console.log("URL immediate", url);
  //   dispatch({ type: "index-changed", index: newIndex });
  //   return;
  // }

  // preloadImage(url).then(() => {
  //   console.log("URL prefetched", url);
  //   dispatch({ type: "index-changed", index: newIndex });
  // });
*/

  return (
    <div className="CatSlideshow">
      <div className="mainContainer">
        <div>{state.index}</div>
        {/* // <div
        //   className={`image ${state.isIndexChanging ? "nextLoading" : ""}`}
        //   style={{
        //     backgroundImage: `url(${url})`,
        //   }}
        // ></div> */}
      </div>
      <CatSlideshowControls
        dispatch={dispatch}
        canScrollLeft={state.index !== 0}
      />
    </div>
  );
}

export default CatSlideshow;

/************************************************************ */
/*
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
  const [state, dispatch] = useReducer(catSlideshowReducer, {
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
      <CatSlideshowControls
        isLoading={isLoading || state.isIndexChanging}
        canScrollLeft={state.index !== 0}
        isError={isBreedsError}
        onButtonClick={onButtonClick}
      />
    </div>
  );
}*/
