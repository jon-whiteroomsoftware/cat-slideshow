import { useEffect, useCallback, useState } from "react";
import clsx from "clsx";
import useAbortableFetch from "./useAbortableFetch";
import useLocalStateStorage from "./useLocalStateStorage";
import getCatsApiFetchParams from "./getCatsApiFetchParams";
import CatSlideshow from "./CatSlideshow";
import BreedSelector from "./BreedSelector";
import { ErrorCard, LoadingCard } from "./Cards";
import styles from "./CatApp.module.css";

type CatAppPropsType = {
  className?: string;
};

type BreedsAPIResponseType = Array<{ id: string; name: string }>;
type BreedsType = BreedsAPIResponseType | null;

const CATAPP_KEY = "CatSlideshowApp";
const DEFAULT_CONFIG = { selectedBreedID: "all" };

export default function CatApp({ className }: CatAppPropsType) {
  const { status: loadStatus, runFetch } = useAbortableFetch("loading");
  const [breeds, setBreeds] = useState<BreedsType>(null);
  const [config, setAppConfig] = useLocalStateStorage(
    CATAPP_KEY,
    DEFAULT_CONFIG
  );

  useEffect(() => {
    const { url, options } = getCatsApiFetchParams("/breeds");
    runFetch(url, options)
      .then(async (response: Response | void) => {
        if (response !== undefined) {
          const json: BreedsAPIResponseType = await response.json();
          let breeds = [{ id: "all", name: "All Breeds" }].concat(
            json.map((b) => ({ id: b.id, name: b.name }))
          );

          if (breeds.find((b) => b.id === config.selectedBreedID)) {
            setAppConfig(DEFAULT_CONFIG);
          }
          setBreeds(breeds);
        }
      })
      .catch((error) => {
        // suppress error
      });
  }, [config.selectedBreedID, runFetch, setAppConfig]);

  const onSelectBreedID = useCallback<(breedID: string) => void>(
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
