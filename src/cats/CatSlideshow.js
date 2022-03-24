import { useEffect, useCallback, useState } from "react";
import getCatsApiFetchParams from "./getCatsApiFetchParams.js";
import usePaginatedFetch from "./usePaginatedFetch.js";
import usePrevious from "./usePrevious.js";
import usePrefetchImages from "./usePrefetchImages.js";
import CatSlideshowControls from "./CatSlideshowControls.js";
import { SlideAnimation, Direction } from "./SlideAnimation.js";
import { LoadingCard } from "./Cards.js";
import styles from "./CatSlideshow.module.css";

const PAGE_SIZE = 20;
const PAGE_PREFETCH_LIMIT = 8;

function fetchPageFromCatsApi(pageIndex, selectedBreedID, fetchPage) {
  const { url, options } = getCatsApiFetchParams("/images/search", {
    breed_id: selectedBreedID === "all" ? "" : selectedBreedID,
    limit: PAGE_SIZE,
    order: "ASC",
    page: pageIndex,
  });

  fetchPage({
    url,
    options,
    index: pageIndex,
    key: selectedBreedID,
    getPageData: async (response) => {
      const json = await response.json();
      return json.map((item) => ({ id: item.id, url: item.url }));
    },
    getMetadata: (response) => {
      const count = response.headers.get("pagination-count");
      return count !== null ? { paginationCount: Number(count) } : {};
    },
  });
}

function getPageIndex(index) {
  return Math.floor(index / PAGE_SIZE);
}

function getImageURL(pages, index) {
  const pageIndex = getPageIndex(index);
  const offset = index % PAGE_SIZE;
  return pages?.[pageIndex]?.data?.[offset]?.url;
}

export default function CatSlideshow({ selectedBreedID }) {
  const [direction, setDirection] = useState(Direction.Next);
  const [index, setIndex] = useState(0);
  const [visibleIndex, setVisibleIndex] = useState(null);
  const [maxIndex, setMaxIndex] = useState(null);
  const previousBreedID = usePrevious(selectedBreedID);
  const { pages, metadata, status, fetchPage, resetPages } = usePaginatedFetch(
    selectedBreedID,
    "loading"
  );
  const { imageLoadMap, resetPrefetch } = usePrefetchImages(
    index,
    useCallback((i) => getImageURL(pages, i), [pages])
  );

  useEffect(() => {
    if (selectedBreedID !== previousBreedID) {
      resetPages(selectedBreedID);
      resetPrefetch();
      setIndex(0);
      setDirection(Direction.Next);
      setVisibleIndex(null);
      setMaxIndex(null);
    }
  }, [selectedBreedID, resetPages, resetPrefetch, previousBreedID]);

  useEffect(() => {
    const pageIndex = getPageIndex(index);
    const prefetchPageIndex = getPageIndex(index + PAGE_PREFETCH_LIMIT);
    const doFetch = (i) => fetchPageFromCatsApi(i, selectedBreedID, fetchPage);

    if (!pages[pageIndex]) {
      doFetch(pageIndex);
    }

    if (prefetchPageIndex !== pageIndex && !pages[prefetchPageIndex]) {
      doFetch(prefetchPageIndex);
    }

    if (metadata?.paginationCount !== undefined) {
      setMaxIndex(metadata.paginationCount - 1);
    }
  }, [fetchPage, index, metadata, pages, selectedBreedID]);

  useEffect(() => {
    // skip over images that failed to load
    if (imageLoadMap[index] === "error") {
      const indexes = Object.keys(imageLoadMap);
      const nextIndexes =
        direction === Direction.Next
          ? indexes.slice(index + 1)
          : indexes.slice(0, index).reverse();
      const readyIndex = nextIndexes.find((i) => imageLoadMap[i] === "ready");

      if (readyIndex !== undefined) {
        setIndex(Number(readyIndex));
      }
    }

    if (imageLoadMap[index] === "ready") {
      setVisibleIndex(index);
    }
  }, [index, imageLoadMap, direction]);

  const onPrevousClick = useCallback(() => {
    setDirection(Direction.Previous);
    setIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const onNextClick = useCallback(() => {
    setDirection(Direction.Next);
    setIndex((prev) => Math.min(maxIndex, prev + 1));
  }, [maxIndex]);

  return (
    <div className={styles.catSlideshow}>
      {selectedBreedID === null ? null : visibleIndex === null ? (
        <LoadingCard />
      ) : (
        <div className={styles.mainContainer}>
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
        </div>
      )}
      <CatSlideshowControls
        className={styles.controls}
        disabled={status !== "loaded"}
        onPreviousClick={onPrevousClick}
        onNextClick={onNextClick}
        canScrollLeft={index !== 0}
        canScrollRight={index < maxIndex}
      />
    </div>
  );
}
