import styles from "./CatSlideshowControls.module.css";

export default function CatSlideshowControls({
  dispatch,
  isDisabled,
  canScrollLeft,
  canScrollRight,
}) {
  return (
    <div className={styles.catSlideshowControls}>
      <button
        className={styles.button}
        disabled={isDisabled || !canScrollLeft}
        onClick={() => dispatch({ type: "decrement-index" })}
      >
        &lt;
      </button>
      <button
        className={styles.button}
        disabled={isDisabled || !canScrollRight}
        onClick={() => dispatch({ type: "increment-index" })}
      >
        &gt;
      </button>
    </div>
  );
}
