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

// function getFetchInfo(prefetchMap) {
//   const fetchInfo = {
//     waitIndexes: [],
//     prefetchCount: 0,
//   };

//   for (let i of prefetchMap.keys()) {
//     const status = prefetchMap.get(i);

//     if (status === "wait") {
//       fetchInfo.waitIndexes.push(i);
//     } else if (status === "prefetch") {
//       fetchInfo.prefetchCount++;
//     }
//   }

//   return fetchInfo;
// }

function initCatSlideshowState() {
  return {
    index: 0,
    visibleIndex: null,
    readyMap: {},
  };
}

function catSlideshowReducer(state, action) {
  console.log("%ccatimage: " + action.type, "color: orange", action);

  function changeIndex(state, increment) {
    const newIndex = Math.max(0, state.index + increment);
    const isReady = state.indexReadyMap[newIndex] === "ready";

    return {
      ...state,
      index: newIndex,
      visibleIndex: isReady ? newIndex : state.visibleIndex,
    };
  }

  switch (action.type) {
    case "change-breed":
      return initCatSlideshowState();
    case "decrement-index":
      return changeIndex(state, -1);
    case "increment-index": {
      return changeIndex(state, 1);
    }
    case "prefetch-status": {
      // console.log("Prefetch status", action);
      const newState = {
        ...state,
        indexReadyMap: { ...state.indexReadyMap, [action.index]: "ready" },
      };

      if (action.index === state.index) {
        newState.visibleIndex = action.index;
      }

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
  const prefetchMapRef = useRef(new Map());

  const [state, dispatch] = useReducer(
    catSlideshowReducer,
    undefined,
    initCatSlideshowState
  );

  const { index, visibleIndex, indexReadyMap } = state;
  console.log("slideshow render", {
    index,
    visibleIndex,
    indexReadyMap,
    prefetchMap: [...prefetchMapRef.current],
  });

  useEffect(() => {
    if (selectedBreedID !== prevSelectedBreedIDRef.current) {
      prevSelectedBreedIDRef.current = selectedBreedID;
      resetPages(selectedBreedID);
      dispatch({ type: "change-breed", selectedBreedID });
      prefetchMapRef.current.clear();
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
    const prefetchMap = prefetchMapRef.current;
    const waitIndexes = [...prefetchMap.keys()].filter(
      (k) => prefetchMap.get(k) === "wait"
    );
    const prefetchCount = [...prefetchMap.values()].filter(
      (v) => v === "prefetch"
    ).length;

    // console.log("UPDATE PREFETCHING - INFO", {
    //   index,
    //   visibleIndex,
    //   waitIndexes,
    //   prefetchCount,
    //   map: [...prefetchMap],
    // });

    for (let i = 0; i < MAX_PREFETCH; i++) {
      const newIndex = index + i + (index === 0 ? 0 : 1);
      if (!prefetchMap.get(newIndex)) {
        // console.log("Adding wait index: ", newIndex);
        prefetchMap.set(newIndex, "wait");
      }
    }

    if (prefetchCount < MAX_PREFETCH) {
      waitIndexes.slice(0, MAX_PREFETCH - prefetchCount).forEach((i) => {
        const url = getImageURL(pages, i);

        const updateImageStatus = (i, status) => {
          // console.log("Update image status", i, status);
          //prefetchMap.delete(i);
          prefetchMap.set(i, status);
          dispatch({ type: "prefetch-status", index: i, status });
        };

        if (url) {
          // console.log("Starting prefetch", i);
          prefetchMap.set(i, "prefetch");

          preloadImage(url)
            .then(() => updateImageStatus(i, "ready"))
            .catch(() => updateImageStatus(i, "error"));
        }
      });
    }
  }, [pages, index, visibleIndex, state.indexReadyMap]);

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
