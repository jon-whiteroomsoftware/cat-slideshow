import { useEffect, useRef, useReducer } from "react";
import { preloadImage } from "./utils.js";
import getCatsApiFetchParams from "./getCatsApiFetchParams.js";
import usePaginatedFetch from "./usePaginatedFetch";
import CatSlideshowControls from "./CatSlideshowControls.js";
import { SlideAnimation, Direction } from "./SlideAnimation.js";
import { LoadingCard } from "./Cards.js";
import styles from "./CatSlideshow.module.css";

const PAGE_SIZE = 20;
const PAGE_PREFETCH = 8;
const MAX_PREFETCH = 4;

function fetchPageFromCatsApi(pageIndex, selectedBreedID, fetchPage) {
  const { url, options } = getCatsApiFetchParams("/images/search", {
    breed_id: selectedBreedID === "all" ? "" : selectedBreedID,
    limit: PAGE_SIZE,
    order: "ASC",
    page: pageIndex,
  });

  const getPageData = async (response) => {
    const json = await response.json();
    return json.map((item) => ({ id: item.id, url: item.url }));
  };

  const getMetadata = (response) => {
    return Object.fromEntries(
      [...response.headers.entries()].filter(
        (entry) => entry[0] === "pagination-count"
      )
    );
  };

  fetchPage(url, options, pageIndex, selectedBreedID, getPageData, getMetadata);
}

function getPageIndex(index) {
  return Math.floor(index / PAGE_SIZE);
}

function getImageURL(pages, index) {
  const pageIndex = getPageIndex(index);
  const offset = index % PAGE_SIZE;
  return pages?.[pageIndex]?.data?.[offset]?.url;
}

function initCatSlideshowState() {
  return {
    direction: Direction.Next,
    index: 0,
    maxIndex: null,
    visibleIndex: null,
    readyMap: {},
  };
}

function catSlideshowReducer(state, action) {
  //console.log("%ccat slideshow: " + action.type, "color: red", action, state);

  function changeIndex(state, increment) {
    let newIndex = Math.min(
      Math.max(0, state.index + increment),
      state.maxIndex
    );

    if (state.indexReadyMap[newIndex] === "error") {
      // skip over images that failed to preload
      const imageMapIndexes = Object.keys(state.indexReadyMap);
      const nextImageIndexes =
        state.direction === Direction.Next
          ? imageMapIndexes.slice(newIndex + 1)
          : imageMapIndexes.slice(0, newIndex).reverse();

      const nextReadyImageIndex = nextImageIndexes.find(
        (k) => state.indexReadyMap[k] === "ready"
      );

      if (nextReadyImageIndex !== undefined) {
        newIndex = Number(nextReadyImageIndex);
      }
    }

    const isReady = state.indexReadyMap[newIndex] === "ready";

    return {
      ...state,
      direction: increment > 0 ? Direction.Next : Direction.Previous,
      index: newIndex,
      visibleIndex: isReady ? newIndex : state.visibleIndex,
    };
  }

  switch (action.type) {
    case "change-breed":
      return initCatSlideshowState();
    case "update-max-index":
      return { ...state, maxIndex: action.maxIndex };
    case "decrement-index":
      return changeIndex(state, -1);
    case "increment-index": {
      return changeIndex(state, 1);
    }
    case "prefetch-status": {
      const newState = {
        ...state,
        indexReadyMap: {
          ...state.indexReadyMap,
          [action.index]: action.status,
        },
      };

      if (action.status === "ready" && action.index === state.index) {
        newState.visibleIndex = action.index;
      }

      return newState;
    }
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

export default function CatSlideshow({ selectedBreedID }) {
  const prevSelectedBreedIDRef = useRef(selectedBreedID);
  const prefetchMapRef = useRef(new Map());
  const { pages, metadata, fetchPage, resetPages } = usePaginatedFetch(
    PAGE_SIZE,
    "loading"
  );

  const [state, dispatch] = useReducer(
    catSlideshowReducer,
    undefined,
    initCatSlideshowState
  );

  const { direction, index, visibleIndex } = state;

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
    const doFetch = (i) => fetchPageFromCatsApi(i, selectedBreedID, fetchPage);

    if (!pages[pageIndex]) {
      doFetch(pageIndex);
    }

    if (prefetchPageIndex !== pageIndex && !pages[prefetchPageIndex]) {
      doFetch(prefetchPageIndex);
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

    for (let i = 0; i < MAX_PREFETCH; i++) {
      const newIndex = index + i + (index === 0 ? 0 : 1);
      if (!prefetchMap.get(newIndex)) {
        prefetchMap.set(newIndex, "wait");
      }
    }

    if (prefetchCount < MAX_PREFETCH) {
      waitIndexes.slice(0, MAX_PREFETCH - prefetchCount).forEach((i) => {
        const url = getImageURL(pages, i);

        const updateImageStatus = (i, status) => {
          prefetchMap.set(i, status);
          dispatch({ type: "prefetch-status", index: i, status });
        };

        if (url) {
          prefetchMap.set(i, "prefetch");

          preloadImage(url)
            .then(() => updateImageStatus(i, "ready"))
            .catch(() => {
              // retry preload failure once
              setTimeout(() => {
                preloadImage(url)
                  .then(() => updateImageStatus(i, "ready"))
                  .catch(() => updateImageStatus(i, "error"));
              }, 200);
            });
        }
      });
    }
  }, [pages, index, visibleIndex, state.indexReadyMap]);

  useEffect(() => {
    if (metadata?.["pagination-count"] !== undefined) {
      dispatch({
        type: "update-max-index",
        maxIndex: metadata["pagination-count"] - 1,
      });
    }
  }, [metadata]);

  return (
    <div className={styles.catSlideshow}>
      {visibleIndex !== null ? (
        <div className={styles.mainContainer}>
          <>
            <SlideAnimation
              child={
                <div
                  className={styles.image}
                  key={visibleIndex}
                  style={{
                    backgroundImage: `url(${getImageURL(pages, visibleIndex)})`,
                  }}
                ></div>
              }
              direction={direction}
            />
            {visibleIndex !== index && (
              <LoadingCard className={styles.imageOverlay} />
            )}
          </>
        </div>
      ) : (
        <LoadingCard />
      )}
      <CatSlideshowControls
        dispatch={dispatch}
        canScrollLeft={state.index !== 0}
        canScrollRight={state.index < state.maxIndex}
      />
    </div>
  );
}
