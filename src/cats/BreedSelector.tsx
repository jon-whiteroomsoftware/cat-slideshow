import { useCallback, useMemo } from "react";
import clsx from "clsx";
import { Status } from "./useAsync";
import styles from "./BreedSelector.module.css";

type Breed = {
  id: string;
  name: string;
};

type Props = {
  onSelectBreedID: (id: string) => void;
  breeds: Array<Breed> | null;
  selectedBreedID: string;
  status: Status;
};

export default function BreedSelector({
  onSelectBreedID,
  breeds,
  selectedBreedID,
  status,
}: Props) {
  const isError = status === "error";
  const onSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
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
              className={clsx([styles.select, isError && styles.isError])}
              disabled={true}
              value={undefined}
            />
          ) : (
            <select
              className={styles.select}
              onChange={onSelectChange}
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
