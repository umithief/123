
import React from 'react';

interface HighlighterProps {
  text: string;
  highlight: string;
  className?: string;
}

export const Highlighter: React.FC<HighlighterProps> = ({ 
  text, 
  highlight, 
  className = 'bg-[#F2A619]/30 text-[#F2A619] font-bold rounded-sm px-0.5' 
}) => {
  if (!highlight || !highlight.trim()) {
    return <>{text}</>;
  }

  // Regex özel karakterlerini kaçış karakteriyle sarmala
  const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedHighlight})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className={`bg-transparent ${className}`}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};
