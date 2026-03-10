/**
 * Wrapper component for scroll-triggered fade-in animations
 * Uses Framer Motion + Intersection Observer for smooth animations
 */

import React from 'react';
import { motion } from 'framer-motion';

import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface ScrollAnimatedSectionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const ScrollAnimatedSection: React.FC<ScrollAnimatedSectionProps> = ({
  children,
  delay = 0,
  className = '',
}) => {
  const { ref, isVisible } = useScrollAnimation({
    triggerOnce: true,
    threshold: 0.2,
  });

  const variants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
};
