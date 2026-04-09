import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

const SCROLL_CONTAINER_SELECTOR = [
  "main",
  "[data-route-scroll]",
  "[class*='overflow-y-auto']",
  "[class*='overflow-auto']",
].join(", ");

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useLayoutEffect(() => {
    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      document.querySelectorAll<HTMLElement>(SCROLL_CONTAINER_SELECTOR).forEach((element) => {
        element.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
        element.scrollTop = 0;
        element.scrollLeft = 0;
      });
    };

    resetScroll();
    const frame = requestAnimationFrame(resetScroll);

    return () => cancelAnimationFrame(frame);
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
