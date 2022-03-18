import styles from "./BreedSelector.module.css";

function BreedSelector({ dispatch, breeds, selectedBreedID, status }) {
  function onSelectChange(e) {
    dispatch({ type: "select-breed", id: e.target.value });
  }

  return (
    <div className={styles.BreedSelector}>
      <form>
        <label>Breed</label>
        <span className={styles.selectContainer}>
          <select
            className={status === "error" ? styles.isError : ""}
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

export default BreedSelector;
