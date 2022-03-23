import styles from "./CatSlideshowControls.module.css";

export default function CatSlideshowControls({
  onPreviousClick,
  onNextClick,
  isDisabled,
  canScrollLeft,
  canScrollRight,
}) {
  return (
    <div className={styles.catSlideshowControls}>
      <button
        className={styles.button}
        disabled={isDisabled || !canScrollLeft}
        onClick={onPreviousClick}
      >
        &lt;
      </button>
      <button
        className={styles.button}
        disabled={isDisabled || !canScrollRight}
        onClick={onNextClick}
      >
        &gt;
      </button>
    </div>
  );
}
