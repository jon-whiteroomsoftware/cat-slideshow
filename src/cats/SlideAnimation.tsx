import { useEffect, useState } from "react";
import clsx from "clsx";
import styles from "./SlideAnimation.module.css";

export type Direction = "previous" | "next";

type Props = {
  child: JSX.Element;
  direction: Direction;
};

function SlideAnimation({ child, direction }: Props) {
  const [slideChildren, setSlideChildren] = useState<Array<JSX.Element>>([]);

  useEffect(() => {
    setSlideChildren((prevChildren: Array<JSX.Element>) => {
      const prevChild = prevChildren.slice(
        ...(direction === "next" ? [-1] : [0, 1])
      );

      return prevChild[0]?.key === child.key
        ? prevChildren
        : direction === "next"
        ? prevChild.concat([child])
        : [child].concat(prevChild);
    });
  }, [child, direction]);

  const onAnimationEnd = () => {
    setSlideChildren([child]);
  };

  return (
    <div className={styles.slideAnimation}>
      {slideChildren.length === 2
        ? [
            slideChildren[0],
            <div
              className={clsx([
                styles.slideContainer,
                direction === "next"
                  ? styles.slideToNext
                  : styles.slideToPrevious,
              ])}
              key={slideChildren[1].key}
              onAnimationEnd={onAnimationEnd}
            >
              {slideChildren[1]}
            </div>,
          ]
        : slideChildren}
    </div>
  );
}

export { SlideAnimation };
