import React, { useEffect } from "react";
import { KeenSliderPlugin, useKeenSlider } from "keen-slider/react";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import ShouldRender from "./ShouldRender";

type Props = {
  children: React.ReactNode;
  onFinish?: () => void;
};

type ArrowProps = {
  onClick: () => void;
  prev?: boolean;
};

// Fix keen-slider initial layout shift.
const InitializePlugin: KeenSliderPlugin = (slider) => {
  slider.on("created", () => {
    slider?.container?.classList?.add("initialized");
  });
};

const arrowIconProps = {
  className:
    "text-neutral-800 dark:text-white flex-shrink-0 sm:w-[30px] sm:h-[30px] h-[20px] w-[20px]",
};

const Arrow: React.FC<ArrowProps> = ({ onClick, prev }) => {
  return (
    <button
      className={`absolute top-0 ${
        prev ? "sm:-left-7 -left-5" : "sm:-right-7 -right-5"
      } h-full w-5 flex justify-center items-center`}
      onClick={onClick}
    >
      <ShouldRender if={prev}>
        <MdKeyboardArrowLeft {...arrowIconProps} />
      </ShouldRender>

      <ShouldRender if={!prev}>
        <MdKeyboardArrowRight {...arrowIconProps} />
      </ShouldRender>
    </button>
  );
};

const Carousel: React.FC<Props> = ({ children, onFinish }) => {
  const [currentSlide, setCurrentSlide] = React.useState(0);

  const [sliderRef, instanceRef] = useKeenSlider(
    {
      initial: 0,
      mode: "free",
      slides: {
        perView: "auto",
        spacing: 15,
      },
      slideChanged: (instance) => {
        setCurrentSlide(instance.track.details.abs);
      },
    },
    [InitializePlugin]
  );

  const isLastSlide =
    instanceRef?.current &&
    currentSlide === instanceRef.current.track?.details?.maxIdx;

  const isFirstSlide = currentSlide === 0;

  useEffect(() => {
    instanceRef?.current?.update?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  return (
    <div className="relative">
      <div ref={sliderRef} className="keen-slider">
        {children}
      </div>

      <ShouldRender if={!isFirstSlide}>
        <Arrow
          prev
          onClick={() => instanceRef.current?.moveToIdx(currentSlide - 1)}
        />
      </ShouldRender>

      <ShouldRender if={!isLastSlide}>
        <Arrow
          onClick={() => instanceRef.current?.moveToIdx(currentSlide + 1)}
        />
      </ShouldRender>
    </div>
  );
};

export default Carousel;
