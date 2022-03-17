import { useEffect, useState } from "react";
import "./SlideAnimation.css";

const Direction = {
  Next: 0,
  Previous: 1,
};

function SlideAnimation({ child, direction }) {
  const [slideChildren, setSlideChildren] = useState([]);

  useEffect(() => {
    setSlideChildren((prevChildren) => {
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
    <div className="SlideAnimation">
      {slideChildren.length === 2
        ? [
            slideChildren[0],
            <div
              className={`slideContainer ${
                direction === Direction.Next ? "slideToNext" : "slideToPrevious"
              }`}
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
