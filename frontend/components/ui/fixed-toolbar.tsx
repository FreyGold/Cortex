'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Toolbar } from './toolbar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

export function FixedToolbar({ className, children, ...props }: React.ComponentProps<typeof Toolbar>) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = React.useState(false);
  const [showRight, setShowRight] = React.useState(false);

  const checkScroll = React.useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeft(scrollLeft > 0);
      setShowRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  }, []);

  React.useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    
    // Add a resize observer to the scroll container to detect content changes
    const observer = new ResizeObserver(() => checkScroll());
    if (scrollRef.current) {
      observer.observe(scrollRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', checkScroll);
      observer.disconnect();
    };
  }, [checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 250;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
      // Call checkScroll slightly after to update arrow visibility
      setTimeout(checkScroll, 350); 
    }
  };

  return (
    <div className="relative flex w-full items-center z-50 border-b border-b-border bg-background/95 backdrop-blur-sm supports-backdrop-blur:bg-background/60 rounded-t-lg group overflow-hidden">
      {/* Left button */}
      <div 
        className={cn(
          "absolute left-0 h-full flex items-center bg-gradient-to-r from-background via-background/90 to-transparent pr-4 z-10 transition-opacity duration-200", 
          showLeft ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 ml-1 rounded-sm border border-border/50 bg-background/80 shadow-sm hover:bg-accent"
          onClick={() => scroll('left')}
        >
          <ChevronLeft className="size-4" />
        </Button>
      </div>

      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex-1 overflow-x-auto scrollbar-hide"
      >
        <Toolbar
          {...props}
          className={cn(
            'flex w-full justify-between p-1 min-w-max',
            className
          )}
        >
          {children}
        </Toolbar>
      </div>

      {/* Right button */}
      <div 
        className={cn(
          "absolute right-0 h-full flex items-center bg-gradient-to-l from-background via-background/90 to-transparent pl-4 z-10 transition-opacity duration-200", 
          showRight ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 mr-1 rounded-sm border border-border/50 bg-background/80 shadow-sm hover:bg-accent"
          onClick={() => scroll('right')}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
