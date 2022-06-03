import { useState, useCallback, useRef } from "react";
import useAbortableFetch from "./useAbortableFetch";
import { Status } from "./useAsync";

type BasePageState<T> = {
  data: T | [];
};

type PageLoadingState<T> = BasePageState<T> & {
  status: "loading";
};

type PageLoadedState<T> = BasePageState<T> & {
  status: "loaded";
};

type PageErrorState<T, E> = BasePageState<T> & {
  status: "error";
  error: E;
};

export type PageState<T, E> =
  | PageLoadingState<T>
  | PageLoadedState<T>
  | PageErrorState<T, E>;

type PagesMap<T, E> = Record<number, PageState<T, E>>;
type MetadataType = Record<string, string> | null;

type FetchPagePropsType<T> = {
  url: RequestInfo;
  options: RequestInit;
  index: number;
  key: string;
  getPageData: (response: Response) => Promise<T>;
  getMetadata?: (response: Response) => MetadataType;
};

export type FetchPageCallbackType<T> = ({
  url,
  options,
  index,
  key,
  getPageData,
  getMetadata,
}: FetchPagePropsType<T>) => Promise<void | T>;

export default function usePaginatedFetch<T, E>(
  initialKey: string,
  initialStatus: Status = "idle",
  onUpdatePage?: (index: number, page: PageState<T, E>) => void
) {
  const [key, setKey] = useState(initialKey);
  const [pages, setPages] = useState<PagesMap<T, E>>({});
  const [metadata, setMetadata] = useState<MetadataType>(null);
  const {
    status: fetchStatus,
    runFetch,
    abort: abortFetch,
  } = useAbortableFetch(initialStatus);

  const resetPages = useCallback(
    (key: string) => {
      abortFetch();
      setKey(key);
      setPages({});
      setMetadata(null);
    },
    [abortFetch]
  );

  const fetchPage = useCallback(
    async ({
      url,
      options,
      index,
      key: fetchKey,
      getPageData,
      getMetadata,
    }: FetchPagePropsType<T>) => {
      function updatePages(update: PageState<T, E>) {
        setPages((prevPages) => ({ ...prevPages, [index]: update }));
        onUpdatePage?.(index, update);
      }

      updatePages({ status: "loading", data: [] });

      return runFetch(url, options)
        .then(async (response) => {
          if (response && response.ok && key === fetchKey) {
            const pageData = await getPageData(response);
            updatePages({ status: "loaded", data: pageData });

            if (getMetadata !== undefined) {
              setMetadata(getMetadata(response));
            }
          }
        })
        .catch((error) => {
          if (key === fetchKey) {
            updatePages({ status: "error", data: [], error });
          }
        });
    },
    [key, onUpdatePage, runFetch]
  );

  return {
    key,
    pages,
    metadata,
    status: fetchStatus,
    fetchPage,
    resetPages,
  } as const;
}
