import { useEffect, useCallback, useState } from "react";
import getCatsApiFetchParams from "./getCatsApiFetchParams";
import usePaginatedFetch, {
  FetchPageCallbackType,
  PageType,
} from "./usePaginatedFetch";
import usePrevious from "./usePrevious";
import usePrefetchImages from "./usePrefetchImages";
import CatSlideshowControls from "./CatSlideshowControls";
import { SlideAnimation, Direction } from "./SlideAnimation";
import { LoadingCard } from "./Cards";
import styles from "./CatSlideshow.module.css";

type CatSlideshowPropsType = {
  selectedBreedID: string;
};

type CatAPISearchResponseItemType = {
  id: string;
  url: string;
};

type CatAPISearchResponseType = Array<CatAPISearchResponseItemType>;
type SlideshowPageType = Array<{ id: string; url: string }>;
type SlideshowPagesType = Record<number, PageType<SlideshowPageType, string>>;

const PAGE_SIZE = 20;
const PAGE_PREFETCH_LIMIT = 8;

function fetchPageFromCatsApi(
  pageIndex: number,
  selectedBreedID: string,
  fetchPage: FetchPageCallbackType<SlideshowPageType>
) {
  const { url, options } = getCatsApiFetchParams("/images/search", {
    breed_id: selectedBreedID === "all" ? "" : selectedBreedID,
    limit: String(PAGE_SIZE),
    order: "ASC",
    page: String(pageIndex),
  });

  fetchPage({
    url,
    options,
    index: pageIndex,
    key: selectedBreedID,
    getPageData: async (response): Promise<SlideshowPageType> => {
      const json: CatAPISearchResponseType = await response.json();
      return json.map((item) => ({ id: item.id, url: item.url }));
    },
    getMetadata: (response): Record<string, string> => {
      const count = response.headers.get("pagination-count");
      return count !== null ? { paginationCount: count } : {};
    },
  });
}

function getPageIndex(index: number) {
  return Math.floor(index / PAGE_SIZE);
}

function getImageURL(pages: SlideshowPagesType, index: number) {
  const pageIndex = getPageIndex(index);
  const offset = index % PAGE_SIZE;
  return pages?.[pageIndex]?.data?.[offset]?.url;
}

export default function CatSlideshow({
  selectedBreedID,
}: CatSlideshowPropsType) {
  const [direction, setDirection] = useState<Direction>("next");
  const [index, setIndex] = useState<number>(0);
  const [visibleIndex, setVisibleIndex] = useState<number | null>(null);
  const [maxIndex, setMaxIndex] = useState<number | null>(null);
  const previousBreedID = usePrevious<string>(selectedBreedID);
  const { pages, metadata, status, fetchPage, resetPages } = usePaginatedFetch<
    SlideshowPageType,
    string
  >(selectedBreedID, "loading");
  const { imageLoadMap, resetPrefetch } = usePrefetchImages(
    index,
    useCallback((i) => getImageURL(pages, i), [pages])
  );

  useEffect(() => {
    if (selectedBreedID !== previousBreedID) {
      resetPages(selectedBreedID);
      resetPrefetch();
      setIndex(0);
      setDirection("next");
      setVisibleIndex(null);
      setMaxIndex(null);
    }
  }, [selectedBreedID, resetPages, resetPrefetch, previousBreedID]);

  useEffect(() => {
    const pageIndex = getPageIndex(index);
    const prefetchPageIndex = getPageIndex(index + PAGE_PREFETCH_LIMIT);
    const doFetch = (i: number) =>
      fetchPageFromCatsApi(i, selectedBreedID, fetchPage);

    if (!pages[pageIndex]) {
      doFetch(pageIndex);
    }

    if (prefetchPageIndex !== pageIndex && !pages[prefetchPageIndex]) {
      doFetch(prefetchPageIndex);
    }

    if (metadata?.paginationCount !== undefined) {
      setMaxIndex(Number(metadata.paginationCount) - 1);
    }
  }, [fetchPage, index, metadata, pages, selectedBreedID]);

  useEffect(() => {
    // skip over images that failed to load
    if (imageLoadMap[index] === "error") {
      const indexes = Object.keys(imageLoadMap);
      const nextIndexes =
        direction === "next"
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
    setDirection("previous");
    setIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const onNextClick = useCallback(() => {
    setDirection("next");
    setIndex((prev) => Math.min(maxIndex || 0, prev + 1));
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
        isDisabled={status !== "loaded"}
        onPreviousClick={onPrevousClick}
        onNextClick={onNextClick}
        canScrollLeft={index !== 0}
        canScrollRight={index < (maxIndex || 0)}
      />
    </div>
  );
}
