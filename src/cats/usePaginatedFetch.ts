import { useState, useCallback } from "react";
import useAbortableFetch from "./useAbortableFetch";
import { Status } from "./useAsync";

type BasePageType<T> = {
  data: T | [];
};

type PageLoadingType<T> = BasePageType<T> & {
  status: "loading";
};

type PageLoadedType<T> = BasePageType<T> & {
  status: "loaded";
};

type PageErrorType<T, E> = BasePageType<T> & {
  status: "error";
  error: E;
};

export type PageType<T, E> =
  | PageLoadingType<T>
  | PageLoadedType<T>
  | PageErrorType<T, E>;

type PagesType<T, E> = Record<number, PageType<T, E>>;
type MetadataType = Record<string, string> | null;

type FetchPagePropsType<T> = {
  url: RequestInfo;
  options: RequestInit;
  index: number;
  key: string;
  getPageData: (response: Response) => Promise<T>;
  getMetadata: (response: Response) => MetadataType;
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
  initialStatus: Status = "idle"
) {
  const [key, setKey] = useState(initialKey);
  const [pages, setPages] = useState<PagesType<T, E>>({});
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

  const fetchPage = useCallback<FetchPageCallbackType<T>>(
    async ({
      url,
      options,
      index,
      key: fetchKey,
      getPageData,
      getMetadata = null,
    }) => {
      function updatePages(update: PageType<T, E>) {
        setPages((prevPages) => ({ ...prevPages, [index]: update }));
      }

      updatePages({ status: "loading", data: [] });

      return runFetch(url, options)
        .then(async (response) => {
          if (response && response.ok && key === fetchKey) {
            const pageData = await getPageData(response);
            updatePages({ status: "loaded", data: pageData });

            if (getMetadata) {
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
    [key, runFetch]
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
