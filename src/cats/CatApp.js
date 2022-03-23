import { useEffect, useCallback, useState } from "react";
import clsx from "clsx";
import useAbortableFetch from "./useAbortableFetch.js";
import useLocalStateStorage from "./useLocalStateStorage.js";
import getCatsApiFetchParams from "./getCatsApiFetchParams.js";
import CatSlideshow from "./CatSlideshow.js";
import BreedSelector from "./BreedSelector.js";
import { ErrorCard, LoadingCard } from "./Cards.js";
import styles from "./CatApp.module.css";

const CATAPP_KEY = "CatSlideshowApp";
const DEFAULT_CONFIG = { selectedBreedID: "all" };

export default function CatApp({ className }) {
  const { status: loadStatus, runFetch } = useAbortableFetch("loading");
  const [breeds, setBreeds] = useState(null);
  const [config, setAppConfig] = useLocalStateStorage(
    CATAPP_KEY,
    DEFAULT_CONFIG
  );

  useEffect(() => {
    const { url, options } = getCatsApiFetchParams("/breeds");

    runFetch(url, options)
      .then(async (response) => {
        const json = await response.json();
        let breeds = [{ id: "all", name: "All Breeds" }].concat(
          json.map((b) => ({ id: b.id, name: b.name }))
        );

        if (breeds.find((b) => b.id === config.selectedBreedID) === undefined) {
          setAppConfig(DEFAULT_CONFIG);
        }

        setBreeds(breeds);
      })
      .catch((error) => {
        // suppress error
      });
  }, [config.selectedBreedID, runFetch, setAppConfig]);

  const onSelectBreedID = useCallback(
    (breedID) => {
      setAppConfig({ ...config, selectedBreedID: breedID });
    },
    [config, setAppConfig]
  );

  return (
    <div className={clsx([styles.catApp, className])}>
      <BreedSelector
        onSelectBreedID={onSelectBreedID}
        breeds={breeds}
        selectedBreedID={config.selectedBreedID}
        status={loadStatus}
      />
      <CatSlideshow selectedBreedID={config.selectedBreedID} />
      {loadStatus === "loading" && <LoadingCard className={styles.overlay} />}
      {loadStatus === "error" && (
        <ErrorCard className={styles.overlay}>an error has occurred</ErrorCard>
      )}
    </div>
  );
}
