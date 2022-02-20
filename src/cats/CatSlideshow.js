import { useEffect, useRef, useReducer } from "react";
import { preloadImage } from "./utils.js";
import getCatsApiFetchParams from "./getCatsApiFetchParams.js";
import usePaginatedFetch from "./usePaginatedFetch";
import CatSlideshowControls from "./CatSlideshowControls.js";
import LoadingCard from "./LoadingCard.js";

const PAGE_SIZE = 20;
const PAGE_PREFETCH = 8;
const MAX_IMAGE_PREFETCH = 2;

function fetchPageFromCatsApi(pageIndex, selectedBreedID, fetchPage) {
  const { url, options } = getCatsApiFetchParams(
    "/images/search",
    {
      breeds: selectedBreedID === "all" ? "" : selectedBreedID,
      limit: PAGE_SIZE,
      order: "ASC",
      page: pageIndex,
    },
    undefined //1000
  );

  fetchPage(url, options, pageIndex, selectedBreedID);
}

function getPageIndex(index) {
  return Math.floor(index / PAGE_SIZE);
}

function getPageIndexAndOffset(index) {
  return [getPageIndex(index), index % PAGE_SIZE];
}

function getImageURL(pages, index) {
  const pageIndex = getPageIndex(index);
  const offset = index % PAGE_SIZE;
  return pages?.[pageIndex]?.data?.[offset]?.url;
}

function initCatSlideshowState() {
  return {
    index: 0,
    visibleIndex: null,
  };
}

function catSlideshowReducer(state, action) {
  console.log("%ccatimage: " + action.type, "color: orange", action);

  switch (action.type) {
    case "change-breed":
      return initCatSlideshowState();
    case "decrement-index":
      return {
        ...state,
        index: Math.max(0, state.index - 1),
      };
    case "increment-index": {
      return {
        ...state,
        index: state.index + 1,
      };
    }
    case "image-ready": {
      const { index, visibleIndex } = state;

      return visibleIndex !== index && action.index === index
        ? { ...state, visibleIndex: index }
        : state;
    }
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

function CatSlideshow({ selectedBreedID }) {
  const { pages, fetchPage, resetPages } = usePaginatedFetch(
    PAGE_SIZE,
    "loading"
  );
  const imageStatusMapRef = useRef(new Map());

  const [state, dispatch] = useReducer(
    catSlideshowReducer,
    undefined,
    initCatSlideshowState
  );

  const { index, visibleIndex } = state;
  console.log("slideshow render", {
    index,
    visibleIndex,
    status: imageStatusMapRef.current,
  });

  useEffect(() => {
    resetPages(selectedBreedID);
    dispatch({ type: "change-breed", selectedBreedID });
    imageStatusMapRef.current = new Map();
  }, [selectedBreedID, resetPages]);

  useEffect(() => {
    const pageIndex = getPageIndex(index);
    const prefetchPageIndex = getPageIndex(index + PAGE_PREFETCH);

    if (!pages[pageIndex]) {
      fetchPageFromCatsApi(pageIndex, selectedBreedID, fetchPage);
    }

    if (prefetchPageIndex !== pageIndex && !pages[prefetchPageIndex]) {
      fetchPageFromCatsApi(prefetchPageIndex, selectedBreedID, fetchPage);
    }
  }, [index, pages, selectedBreedID, fetchPage]);

  useEffect(() => {
    const statusMap = imageStatusMapRef.current;

    for (let i = index; i < index + MAX_IMAGE_PREFETCH + 1; i++) {
      if (!statusMap.has(i)) {
        statusMap.set(i, "wait");
      }
    }

    if (index !== visibleIndex && statusMap.get(index) === "ready") {
      dispatch({ type: "image-ready", index });
    }

    let prefetchCount = [...statusMap.values()].filter(
      (s) => s === "prefetch"
    ).length;

    if (prefetchCount < MAX_IMAGE_PREFETCH) {
      [...statusMap.keys()]
        .filter((i) => statusMap.get(i) === "wait")
        .slice(0, MAX_IMAGE_PREFETCH - prefetchCount)
        .forEach((i) => {
          const url = getImageURL(pages, i);
          if (url) {
            statusMap.set(i, "prefetch");
            preloadImage(url).then(() => {
              statusMap.set(i, "ready");
              if (index !== visibleIndex && i === index) {
                dispatch({ type: "image-ready", index: i });
              }
            });
          }
        });
    }
  }, [pages, index, visibleIndex]);

  return (
    <div className="CatSlideshow">
      {visibleIndex === null ? (
        <LoadingCard />
      ) : (
        <div className="mainContainer">
          <>
            <div
              className="image"
              style={{
                backgroundImage: `url(${getImageURL(pages, visibleIndex)})`,
              }}
            ></div>
            {visibleIndex !== index && <LoadingCard className="imageOverlay" />}
          </>
        </div>
      )}
      <CatSlideshowControls
        dispatch={dispatch}
        canScrollLeft={state.index !== 0}
      />
    </div>
  );
}

export default CatSlideshow;
