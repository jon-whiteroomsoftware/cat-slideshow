import clsx from "clsx";
import styles from "./CatSlideshowControls.module.css";

type CatSlideshowControlsPropsType = {
  className: string;
  onPreviousClick: () => void;
  onNextClick: () => void;
  isDisabled: boolean;
  canScrollLeft: boolean;
  canScrollRight: boolean;
};

export default function CatSlideshowControls({
  className,
  onPreviousClick,
  onNextClick,
  isDisabled,
  canScrollLeft,
  canScrollRight,
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
