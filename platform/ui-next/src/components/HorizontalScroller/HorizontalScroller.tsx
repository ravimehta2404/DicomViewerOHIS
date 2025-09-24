import React from 'react';
import './embla.css';
import { Icons, Button } from '../';

type HorizontalScrollerProps = {
  children: React.ReactNode;
  scrollByPx?: number;
  className?: string;
};

export function HorizontalScroller({
  children,
  scrollByPx = 100,
  className,
}: HorizontalScrollerProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const updateScrollState = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollPrev(scrollLeft > 0);
    setCanScrollNext(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  React.useEffect(() => {
    updateScrollState();

    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    container.addEventListener('scroll', updateScrollState);

    // Check on resize
    const handleResize = () => {
      setTimeout(updateScrollState, 100);
    };

    window.addEventListener('resize', handleResize);

    // Initial check after render
    const timeoutId = setTimeout(updateScrollState, 100);

    return () => {
      container.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [updateScrollState]);

  const scrollBy = (direction: number) => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const scrollAmount = direction * scrollByPx;
    container.scrollBy({
      left: scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleWheel = React.useCallback((event: React.WheelEvent) => {
    event.preventDefault();
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const scrollDelta = event.deltaX !== 0 ? event.deltaX : event.deltaY;

    container.scrollBy({
      left: scrollDelta,
      behavior: 'auto', // Immediate for responsive feel
    });
  }, []);

  return (
    <div className={['relative w-full', className].filter(Boolean).join(' ')}>
      <div
        ref={scrollContainerRef}
        className="scrollbar-hide flex items-center gap-2 overflow-x-auto px-4 md:px-8"
        onWheel={handleWheel}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {React.Children.map(children, (child, index) => (
          <div
            key={index}
            className="m-auto flex flex-shrink-0"
          >
            {child}
          </div>
        ))}
      </div>

      {/* Left scroll button with gradient fade */}
      {canScrollPrev && (
        <div className="pointer-events-none absolute left-0 top-0 z-20 flex h-full items-center">
          <div className="from-background via-background/90 absolute left-0 h-full w-8 bg-gradient-to-r to-transparent md:w-12"></div>
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/90 border-border/30 text-primary hover:bg-primary-dark pointer-events-auto relative z-30 ml-0.5 h-8 w-8 border shadow-sm backdrop-blur-sm md:ml-1 md:h-10 md:w-10"
            onClick={() => scrollBy(-1)}
            title="Scroll left"
          >
            <Icons.ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </div>
      )}

      {/* Right scroll button with gradient fade */}
      {canScrollNext && (
        <div className="pointer-events-none absolute right-0 top-0 z-20 flex h-full items-center">
          <div className="from-background via-background/90 absolute right-0 h-full w-8 bg-gradient-to-l to-transparent md:w-12"></div>
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/90 border-border/30 text-primary hover:bg-primary-dark pointer-events-auto relative z-30 mr-0.5 h-8 w-8 border shadow-sm backdrop-blur-sm md:mr-1 md:h-10 md:w-10"
            onClick={() => scrollBy(1)}
            title="Scroll right"
          >
            <Icons.ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default HorizontalScroller;
