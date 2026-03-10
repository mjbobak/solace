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
        highlight ? 'text-gray-700 font-medium' : 'text-gray-600'
      }`}
    >
      {text}
    </p>
  );
};
