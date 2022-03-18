import { useCallback } from "react";
import styles from "./BreedSelector.module.css";

export default function BreedSelector({
  dispatch,
  breeds,
  selectedBreedID,
  status,
}) {
  const onSelectChange = useCallback(
    (e) => {
      dispatch({ type: "select-breed", id: e.target.value });
    },
    [dispatch]
  );

  return (
    <div className={styles.BreedSelector}>
      <form>
        <label>Breed</label>
        <span className={styles.selectContainer}>
          <select
            className={status === "error" ? styles.isError : null}
            disabled={breeds === null || status === "error"}
            onChange={onSelectChange}
            type="select"
            value={selectedBreedID}
          >
            {breeds === null
              ? []
              : breeds.map((breed) => (
                  <option key={breed.id} value={breed.id}>
                    {breed.name}
                  </option>
                ))}
          </select>
        </span>
      </form>
    </div>
  );
}
