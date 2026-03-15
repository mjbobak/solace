/**
 * Reusable component for displaying narrative text and insights
 */

import React from 'react';

interface SectionNarrativeProps {
  text: string;
  highlight?: boolean;
}

export const SectionNarrative: React.FC<SectionNarrativeProps> = ({
  text,
  highlight = false,
}) => {
  return (
    <p
      className={`text-base leading-relaxed ${
        highlight ? 'font-medium text-app' : 'text-muted'
      }`}
    >
      {text}
    </p>
  );
};
