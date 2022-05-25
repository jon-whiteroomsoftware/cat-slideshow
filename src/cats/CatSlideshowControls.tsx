import clsx from "clsx";
import styles from "./CatSlideshowControls.module.css";

type Props = {
  className: string;
  onPreviousClick: () => void;
  onNextClick: () => void;
  isDisabled: boolean;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  index: number;
  maxIndex: number | null;
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
}: Props) {
  console.log({ index, maxIndex, type: typeof index });

  return (
    <div className={clsx([styles.catSlideshowControls, className])}>
      <button
        className={styles.button}
        disabled={isDisabled || !canScrollLeft}
        onClick={onPreviousClick}
      >
        &lt;
      </button>
      <span className={styles.index}>
        {maxIndex === null ? "- / -" : `${index + 1} / ${maxIndex}`}
      </span>
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
