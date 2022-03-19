import { useCallback } from "react";
import clsx from "clsx";
import styles from "./BreedSelector.module.css";

export default function BreedSelector({
  onSelectBreedID,
  breeds,
  selectedBreedID,
  status,
}) {
  const onSelectChange = useCallback(
    (e) => {
      onSelectBreedID(e.target.value);
    },
    [onSelectBreedID]
  );

  return (
    <div className={styles.breedSelector}>
      <form className={styles.form}>
        <label className={styles.label}>Breed</label>
        <span>
          <select
            className={clsx({
              [styles.select]: true,
              [styles.error]: status === "error",
            })}
            disabled={breeds === null || status === "error"}
            onChange={onSelectChange}
            type="select"
            value={selectedBreedID || undefined}
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
