function CatSlideshowControls({ dispatch, isDisabled, canScrollLeft }) {
  return (
    <div className="CatControls">
      <button
        disabled={isDisabled || !canScrollLeft}
        onClick={() => dispatch({ type: "decrement-index" })}
      >
        &lt;
      </button>
      <button
        disabled={isDisabled}
        onClick={() => dispatch({ type: "increment-index" })}
      >
        &gt;
      </button>
    </div>
  );
}

export default CatSlideshowControls;
