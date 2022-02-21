import { useEffect, useRef, useReducer } from "react";
import { preloadImage } from "./utils.js";
import getCatsApiFetchParams from "./getCatsApiFetchParams.js";
import usePaginatedFetch from "./usePaginatedFetch";
import CatSlideshowControls from "./CatSlideshowControls.js";
import LoadingCard from "./LoadingCard.js";

const PAGE_SIZE = 20;
const PAGE_PREFETCH = 8;
const MAX_PREFETCH = 2;

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

function getImageURL(pages, index) {
  const pageIndex = getPageIndex(index);
  const offset = index % PAGE_SIZE;
  return pages?.[pageIndex]?.data?.[offset]?.url;
}

function getFetchInfo(statusMap) {
  const fetchInfo = {
    maxIndex: -1,
    waitIndexes: [],
    prefetchCount: 0,
  };

  for (let i of statusMap.keys()) {
    if (i > fetchInfo.maxIndex) {
      fetchInfo.maxIndex = i;
    }

    const status = statusMap.get(i);

    if (status === "wait") {
      fetchInfo.waitIndexes.push(i);
    } else if (status === "prefetch") {
      fetchInfo.prefetchCount++;
    }
  }

  return fetchInfo;
}

function initCatSlideshowState() {
  return {
    index: 0,
    isIndexReady: false,
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
        isIndexReady: false,
      };
    case "increment-index": {
      return {
        ...state,
        isIndexReady: false,
        index: state.index + 1,
      };
    }
    case "image-ready": {
      const { index, visibleIndex } = state;
      const shouldUpdateState = action.index === index && !state.isIndexReady;
      const newState = shouldUpdateState
        ? { ...state, visibleIndex: index, isIndexReady: true }
        : state;

      // console.log("IMAGE READY", {
      //   shouldUpdateState,
      //   index,
      //   action: action.index,
      //   isIndexReady: state.isIndexReady,
      //   visibleIndex,
      // });

      return newState;
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
  const prevSelectedBreedIDRef = useRef(selectedBreedID);
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
    status: [...imageStatusMapRef.current],
  });

  useEffect(() => {
    if (selectedBreedID !== prevSelectedBreedIDRef.current) {
      prevSelectedBreedIDRef.current = selectedBreedID;
      resetPages(selectedBreedID);
      dispatch({ type: "change-breed", selectedBreedID });
      imageStatusMapRef.current = new Map();
    }
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
    const updatePrefetching = () => {
      const statusMap = imageStatusMapRef.current;
      const { maxIndex, waitIndexes, prefetchCount } = getFetchInfo(statusMap);
      console.log("UPDATE PREFETCHING - INFO", {
        index,
        visibleIndex,
        maxIndex,
        waitIndexes,
        prefetchCount,
        map: [...statusMap],
      });

      if (index !== visibleIndex && statusMap.get(index) === "ready") {
        dispatch({ type: "image-ready", index });
      }

      for (let i = 0; i < MAX_PREFETCH; i++) {
        const newIndex = index + i + (index === 0 ? 0 : 1);
        if (!statusMap.get(newIndex)) {
          // console.log("Adding wait index: ", newIndex);
          statusMap.set(newIndex, "wait");
        }
      }

      if (prefetchCount < MAX_PREFETCH) {
        waitIndexes.slice(0, MAX_PREFETCH - prefetchCount).forEach((i) => {
          // console.log("Starting prefetch", i);
          const url = getImageURL(pages, i);
          if (url) {
            statusMap.set(i, "prefetch");

            preloadImage(url).then(() => {
              statusMap.set(i, "ready");
              updatePrefetching();
            });
          }
        });
      }
    };

    updatePrefetching();
  }, [pages, index, visibleIndex]);

  return (
    <div className="CatSlideshow">
      {visibleIndex !== null ? (
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
      ) : (
        <LoadingCard />
      )}
      <CatSlideshowControls
        dispatch={dispatch}
        canScrollLeft={state.index !== 0}
      />
    </div>
  );
}

export default CatSlideshow;
