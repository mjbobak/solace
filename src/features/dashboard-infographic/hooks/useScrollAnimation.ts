/**
 * Hook for detecting when an element enters the viewport
 * Uses Intersection Observer API for efficient scroll detection
 */

import { useRef, useEffect, useState } from 'react';

interface UseScrollAnimationOptions {
  triggerOnce?: boolean;
  threshold?: number | number[];
}

export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
  const { triggerOnce = true, threshold = 0.2 } = options;
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentRef = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce && currentRef) {
            observer.unobserve(currentRef);
          }
        }
      },
      {
        threshold,
      },
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [triggerOnce, threshold]);

  return { ref, isVisible };
}
