import { useEffect, useState } from "react";
import clsx from "clsx";
import styles from "./SlideAnimation.module.css";

enum Direction {
  Previous,
  Next,
}

type SlideAnimationPropsType = {
  child: JSX.Element;
  direction: Direction;
};

function SlideAnimation({ child, direction }: SlideAnimationPropsType) {
  const [slideChildren, setSlideChildren] = useState<Array<JSX.Element>>([]);

  useEffect(() => {
    setSlideChildren((prevChildren: Array<JSX.Element>) => {
      const prevChild = prevChildren.slice(
        ...(direction === Direction.Next ? [-1] : [0, 1])
      );

      return prevChild[0]?.key === child.key
        ? prevChildren
        : direction === Direction.Next
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
                direction === Direction.Next
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

export { SlideAnimation, Direction };
