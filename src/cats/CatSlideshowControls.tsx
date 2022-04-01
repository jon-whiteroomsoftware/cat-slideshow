import clsx from "clsx";
import styles from "./CatSlideshowControls.module.css";

type CatSlideshowControlsPropsType = {
  className: string;
  onPreviousClick: () => void;
  onNextClick: () => void;
  isDisabled: boolean;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  index: number;
  maxIndex: number;
};

export default function CatSlideshowControls({
  className,
  onPreviousClick,
  onNextClick,
  isDisabled,
  canScrollLeft,
  canScrollRight,
  index,
  maxIndex,
}: CatSlideshowControlsPropsType) {
  return (
    <div className={clsx([styles.catSlideshowControls, className])}>
      <button
        className={styles.button}
        disabled={isDisabled || !canScrollLeft}
        onClick={onPreviousClick}
      >
        &lt;
      </button>
      {maxIndex > 0 && (
        <span className={styles.index}>
          {index + 1} / {maxIndex + 1}
        </span>
      )}
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
