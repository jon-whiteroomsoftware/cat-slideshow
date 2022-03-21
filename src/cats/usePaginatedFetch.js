import { useState, useCallback } from "react";
import useAbortableFetch from "./useAbortableFetch";

export default function usePaginatedFetch(initialKey, initialStatus = "idle") {
  const [key, setKey] = useState(initialKey);
  const [pages, setPages] = useState({});
  const [metadata, setMetadata] = useState(null);
  const {
    status: fetchStatus,
    runFetch,
    abort: abortFetch,
  } = useAbortableFetch(initialStatus);

  const resetPages = useCallback(
    (key) => {
      abortFetch();
      setKey(key);
      setPages({});
      setMetadata(null);
    },
    [abortFetch]
  );

  const fetchPage = useCallback(
    ({
      url,
      options,
      index,
      key: fetchKey,
      getPageData,
      getMetadata = null,
    }) => {
      function updatePages(update) {
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

  const status = fetchStatus === "loading" ? "loading" : "idle";
  return { key, pages, metadata, status, fetchPage, resetPages };
}
