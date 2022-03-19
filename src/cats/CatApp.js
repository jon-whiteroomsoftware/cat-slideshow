import { useEffect, useCallback, useState } from "react";
import clsx from "clsx";
import useAbortableFetch from "./useAbortableFetch.js";
import useLocalStateStorage from "./useLocalStateStorage.js";
import getCatsApiFetchParams from "./getCatsApiFetchParams.js";
import CatSlideshow from "./CatSlideshow.js";
import CatSlideshowControls from "./CatSlideshowControls.js";
import BreedSelector from "./BreedSelector.js";
import { MessageCard, LoadingCard } from "./Cards.js";
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
  }, [runFetch]);

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
      {loadStatus === "loading" || config.selectedBreedID === null ? (
        <>
          <LoadingCard />
          <CatSlideshowControls isDisabled={true} />
        </>
      ) : loadStatus === "error" ? (
        <>
          <MessageCard className="error">an error has occurred</MessageCard>
          <CatSlideshowControls isDisabled={true} />
        </>
      ) : (
        <CatSlideshow selectedBreedID={config.selectedBreedID} />
      )}
    </div>
  );
}
