import { useEffect, useCallback, useReducer } from "react";
import getCatsApiFetchParams from "./getCatsApiFetchParams";
import usePaginatedFetch, {
  FetchPageCallbackType,
  PageState,
} from "./usePaginatedFetch";
import usePrevious from "./usePrevious";
import usePrefetchImages, {
  PrefetchMapType,
  PrefetchStatus,
} from "./usePrefetchImages";
import CatSlideshowControls from "./CatSlideshowControls";
import { SlideAnimation, Direction } from "./SlideAnimation";
import { LoadingCard } from "./Cards";
import styles from "./CatSlideshow.module.css";

const PAGE_SIZE = 20;
const PAGE_PREFETCH_LIMIT = 8;

type Props = {
  selectedBreedID: string;
};

type CatAPISearchResponseItem = {
  id: string;
  url: string;
};

type CatAPISearchResponse = Array<CatAPISearchResponseItem>;
type SlideshowPage = Array<{ id: string; url: string }>;
type SlideshowPagesMap = Record<number, PageState<SlideshowPage, string>>;

type CatSlideshowState = {
  direction: Direction;
  index: number;
  visibleIndex: number | null;
  maxIndex: number | null;
};

type ResetAction = {
  type: "reset";
};

type ImageLoadAction = {
  type: "image-load";
  index: number;
  status: PrefetchStatus;
};

type MaxIndexAction = {
  type: "max-index";
  index: number;
};

type UpdateIndexAction = {
  type: "update-index";
  increment: number;
  prefetchMap: PrefetchMapType;
};

type ActionType =
  | ImageLoadAction
  | MaxIndexAction
  | UpdateIndexAction
  | ResetAction;

function fetchPageFromCatsApi(
  pageIndex: number,
  selectedBreedID: string,
  fetchPage: FetchPageCallbackType<SlideshowPage>
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
    getPageData: async (response): Promise<SlideshowPage> => {
      const json: CatAPISearchResponse = await response.json();
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

function getImageURL(pages: SlideshowPagesMap, index: number) {
  const pageIndex = getPageIndex(index);
  const offset = index % PAGE_SIZE;
  return pages?.[pageIndex]?.data?.[offset]?.url;
}

function initCatSlideshowState(): CatSlideshowState {
  return {
    direction: "next",
    index: 0,
    maxIndex: null,
    visibleIndex: null,
  };
}

function catSlideshowReducer(
  state: CatSlideshowState,
  action: ActionType
): CatSlideshowState {
  // console.log("%ccatslideshow: " + action.type, "color: red", action, state);
  switch (action.type) {
    case "reset":
      return initCatSlideshowState();
    case "max-index":
      return { ...state, maxIndex: action.index };
    case "image-load": {
      const { index, status } = action;
      return index === state.index && status === "ready"
        ? { ...state, visibleIndex: index }
        : state;
    }
    case "update-index": {
      const { increment, prefetchMap } = action;
      const direction = increment > 0 ? "next" : "previous";
      let index =
        direction === "next"
          ? Math.min(state.maxIndex || 0, state.index + increment)
          : Math.max(0, state.index + increment);

      // skip over images that failed to load
      if (prefetchMap.get(index) === "error") {
        const indexes = [...prefetchMap.keys()];
        const nextIndexes =
          direction === "next"
            ? indexes.slice(index + 1)
            : indexes.slice(0, index).reverse();
        const readyIndex = nextIndexes.find(
          (i) => prefetchMap.get(i) === "ready"
        );
        index = readyIndex !== undefined ? readyIndex : index;
      }

      return {
        ...state,
        direction,
        index,
        visibleIndex:
          prefetchMap.get(index) === "ready" ? index : state.visibleIndex,
      };
    }
  }
}

export default function CatSlideshow({ selectedBreedID }: Props) {
  const [state, dispatch] = useReducer(
    catSlideshowReducer,
    undefined,
    initCatSlideshowState
  );

  const { index, direction, visibleIndex, maxIndex } = state;
  const previousBreedID = usePrevious<string>(selectedBreedID);

  const { pages, metadata, fetchPage, resetPages } = usePaginatedFetch<
    SlideshowPage,
    string
  >(selectedBreedID, "loading");

  const { prefetchMap, resetPrefetch } = usePrefetchImages(
    index,
    useCallback((i) => getImageURL(pages, i), [pages]),
    useCallback(
      (i: number, status: PrefetchStatus) =>
        dispatch({ type: "image-load", status, index: i }),
      []
    )
  );

  useEffect(() => {
    if (selectedBreedID !== previousBreedID) {
      resetPages(selectedBreedID);
      resetPrefetch();
      dispatch({ type: "reset" });
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
  }, [fetchPage, index, pages, selectedBreedID]);

  useEffect(() => {
    if (metadata?.paginationCount !== undefined) {
      const maxIndex = Number(metadata.paginationCount) - 1;
      dispatch({ type: "max-index", index: maxIndex });
    }
  }, [metadata]);

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
        isDisabled={visibleIndex === null}
        onPreviousClick={useCallback(() => {
          dispatch({ type: "update-index", increment: -1, prefetchMap });
        }, [prefetchMap])}
        onNextClick={useCallback(() => {
          dispatch({ type: "update-index", increment: 1, prefetchMap });
        }, [prefetchMap])}
        canScrollLeft={index !== 0}
        canScrollRight={index < (maxIndex || 0)}
        index={index}
        maxIndex={maxIndex || 0}
      />
    </div>
  );
}
