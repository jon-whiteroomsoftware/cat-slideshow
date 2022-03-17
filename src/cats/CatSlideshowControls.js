import "./CatSlideshowControls.css";

function CatSlideshowControls({
  dispatch,
  isDisabled,
  canScrollLeft,
  canScrollRight,
}) {
  return (
    <div className="CatSlideshowControls">
      <button
        disabled={isDisabled || !canScrollLeft}
        onClick={() => dispatch({ type: "decrement-index" })}
      >
        &lt;
      </button>
      <button
        disabled={isDisabled || !canScrollRight}
        onClick={() => dispatch({ type: "increment-index" })}
      >
        &gt;
      </button>
    </div>
  );
}

export default CatSlideshowControls;
