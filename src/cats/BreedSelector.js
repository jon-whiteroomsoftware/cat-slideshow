import { useCallback, useMemo } from "react";
import clsx from "clsx";
import styles from "./BreedSelector.module.css";

export default function BreedSelector({
  onSelectBreedID,
  breeds,
  selectedBreedID,
  status,
}) {
  const isError = status === "error";
  const onSelectChange = useCallback(
    (e) => {
      onSelectBreedID(e.target.value);
    },
    [onSelectBreedID]
  );

  const selectOptions = useMemo(() => {
    return breeds === null
      ? null
      : breeds.map((breed) => (
          <option key={breed.id} value={breed.id}>
            {breed.name}
          </option>
        ));
  }, [breeds]);

  return (
    <div className={styles.breedSelector}>
      <form className={styles.form}>
        <label className={styles.label}>Breed</label>
        <span>
          {breeds === null || isError ? (
            <select
              className={clsx([styles.select, isError && styles.error])}
              disabled={true}
              type="select"
              value={undefined}
            />
          ) : (
            <select
              className={styles.select}
              onChange={onSelectChange}
              type="select"
              value={selectedBreedID || undefined}
            >
              {selectOptions}
            </select>
          )}
        </span>
      </form>
    </div>
  );
}
