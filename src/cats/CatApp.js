import { useState, useEffect, useCallback, useRef, useReducer } from "react";
import { clsx } from "clsx";
import { preloadImage } from "./utils.js";
import useAbortableFetch from "./useAbortableFetch.js";
import getCatsApiFetchParams from "./getCatsApiFetchParams.js";
import usePaginatedFetch from "./usePaginatedFetch";
import CatSlideshow from "./CatSlideshow.js";
import CatSlideshowControls from "./CatSlideshowControls.js";
import BreedSelector from "./BreedSelector.js";
import MessageCard from "./MessageCard.js";
import LoadingCard from "./LoadingCard.js";
import "./CatApp.css";

/*
3) image slider with timer between each image
  - timing bug with fast clicking (just missing a render?)
    - give control of image ready map to reducer?

  - error state + ErrorBoundary (react-error-boundary?)
  - use vh for sizing?
  - useMemo and check rendering
  - count renders
  - timer to change image
  - countdown should reset for each image
  - useContext, useCallback, useMemo
  - transition images off and onto screen (refs and useLayoutEffect?)
    - fade in/out?
  - have another screen with typedown search
*/

const BREED_ID_KEY = "CatApp-breed-id";

function catAppReducer(state, action) {
  console.log("%ccatapp: " + action.type, "color: green", action);
  switch (action.type) {
    case "select-breed": {
      window.localStorage.setItem(BREED_ID_KEY, action.id);
      return { ...state, selectedBreedID: action.id };
    }
    case "breeds-loaded":
      return { breeds: action.breeds, selectedBreedID: action.selectedBreedID };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

function CatApp() {
  const { status: loadStatus, runFetch } = useAbortableFetch("loading");
  const [state, dispatch] = useReducer(catAppReducer, {
    breeds: null,
    selectedBreedID: null,
  });

  useEffect(() => {
    const { url, options } = getCatsApiFetchParams("/breeds", undefined, 1000);

    runFetch(url, options)
      .then(async (response) => {
        if (!response || !response.ok) {
          throw new Error("API call failed");
        }

        const json = await response.json();
        let breeds = [{ id: "all", name: "All Breeds" }].concat(
          json.filter((b) => ({ id: b.id, name: b.name }))
        );

        dispatch({
          type: "breeds-loaded",
          breeds,
          selectedBreedID: window.localStorage.getItem(BREED_ID_KEY) || "all",
        });
      })
      .catch((error) => {
        // suppress error
      });
  }, [runFetch]);

  return (
    <div className="CatApp">
      <BreedSelector
        dispatch={dispatch}
        breeds={state.breeds}
        selectedBreedID={state.selectedBreedID}
        status={loadStatus}
      />
      {loadStatus === "loading" || state.selectedBreedID === null ? (
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
        <CatSlideshow selectedBreedID={state.selectedBreedID} />
      )}
    </div>
  );
}

export default CatApp;
