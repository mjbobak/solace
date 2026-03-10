/**
 * Hook for detecting the currently active section based on scroll position
 * Uses IntersectionObserver API to track which section is most visible
 */

import { useCallback, useEffect, useState } from 'react';

import { SECTIONS } from '../constants/infographicConfig';
import type { SectionId } from '../constants/infographicConfig';

export function useScrollSpy() {
  const [activeSection, setActiveSection] =
    useState<SectionId>('financial-health');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry with the highest intersection ratio (most visible)
        const visibleEntry = entries.reduce((max, entry) =>
          entry.intersectionRatio > max.intersectionRatio ? entry : max,
        );

        if (visibleEntry.isIntersecting) {
          setActiveSection(visibleEntry.target.id as SectionId);
        }
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1],
        // Account for sticky header height (100px) and ensure good detection
        rootMargin: '-100px 0px -60% 0px',
      },
    );

    // Observe all sections
    SECTIONS.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const scrollToSection = useCallback((sectionId: SectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 100; // Sticky header height in pixels
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  }, []);

  return { activeSection, scrollToSection };
}
