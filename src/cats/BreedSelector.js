import "./BreedSelector.css";

function BreedSelector({ dispatch, breeds, selectedBreedID, status }) {
  function onSelectChange(e) {
    dispatch({ type: "select-breed", id: e.target.value });
  }

  return (
    <div className="BreedSelector">
      <form>
        <label>Breed</label>
        <span className="selectContainer">
          <select
            className={status === "error" ? "isError" : ""}
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
