/**
 * Scrollspy navigation with dots for sections and title for active section
 * Shows navigation dots for inactive sections, displays active section title only
 */

import React from 'react';

import { SECTIONS } from '../constants/infographicConfig';
import type { SectionId } from '../constants/infographicConfig';

interface ScrollSpyNavigationProps {
  activeSection: SectionId;
  onNavigate: (sectionId: SectionId) => void;
}

export const ScrollSpyNavigation: React.FC<ScrollSpyNavigationProps> = ({
  activeSection,
  onNavigate,
}) => {
  const activeLabel = SECTIONS.find((s) => s.id === activeSection)?.label || '';

  return (
    <div className="flex flex-col gap-3 px-6 py-4 min-w-[160px]">
      {SECTIONS.map((section) => {
        const isActive = section.id === activeSection;
        return (
          <div key={section.id} className="flex justify-center">
            {isActive ? (
              // Active section: show title only
              <div className="text-sm text-slate-600/70 font-medium whitespace-nowrap">
                {activeLabel}
              </div>
            ) : (
              // Inactive section: show clickable dot
              <button
                onClick={() => onNavigate(section.id)}
                className="w-2.5 h-2.5 rounded-full bg-slate-300 hover:bg-slate-400 hover:scale-110 transition-all duration-200 flex-shrink-0"
                aria-label={`Navigate to ${section.label}`}
                title={section.label}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
