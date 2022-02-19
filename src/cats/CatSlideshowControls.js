function CatSlideshowControls({ dispatch, isDisabled, canScrollLeft }) {
  return (
    <div className="CatControls">
      <button
        disabled={isDisabled || !canScrollLeft}
        onClick={() => dispatch({ type: "change-index", increment: -1 })}
      >
        &lt;
      </button>
      <button
        disabled={isDisabled}
        onClick={() => dispatch({ type: "change-index", increment: 1 })}
      >
        &gt;
      </button>
    </div>
  );
}

export default CatSlideshowControls;
