
import React, { useRef, useEffect, useState } from 'react';
import { Story, ViewState } from '../types';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { storyService } from '../services/storyService';
import { motion } from 'framer-motion';

interface StoriesProps {
  onNavigate: (view: ViewState, data?: any) => void;
}

export const Stories: React.FC<StoriesProps> = ({ onNavigate }) => {
  const storyScrollRef = useRef<HTMLDivElement>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  useEffect(() => {
      storyService.getStories().then(setStories);
  }, []);

  const handleScroll = () => {
      if (storyScrollRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = storyScrollRef.current;
          setShowLeftArrow(scrollLeft > 0);
          setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
      }
  };

  const scrollStories = (direction: 'left' | 'right') => {
    const container = storyScrollRef.current;
    if (container) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleStoryClick = (story: Story) => {
      let category = 'ALL';
      const label = story.label.toLowerCase();

      if (label.includes('kask')) category = 'Kask';
      else if (label.includes('mont')) category = 'Mont';
      else if (label.includes('eldiven')) category = 'Eldiven';
      else if (label.includes('bot')) category = 'Bot';
      else if (label.includes('aksesuar')) category = 'Aksesuar';
      else if (label.includes('interkom')) category = 'İnterkom';
      else if (label.includes('koruma')) category = 'Koruma';
      
      onNavigate('shop', category);
  };

  const getGradient = (colorClass: string) => {
      if (colorClass.includes('orange')) return 'from-[#F2994A] to-[#F2C94C]';
      if (colorClass.includes('red')) return 'from-[#FF416C] to-[#FF4B2B]';
      if (colorClass.includes('blue')) return 'from-[#2193b0] to-[#6dd5ed]';
      if (colorClass.includes('green')) return 'from-[#11998e] to-[#38ef7d]';
      if (colorClass.includes('purple')) return 'from-[#8E2DE2] to-[#4A00E0]';
      if (colorClass.includes('pink')) return 'from-[#833ab4] via-[#fd1d1d] to-[#fcb045]'; // Instagramish
      return 'from-gray-700 to-gray-400';
  };

  return (
    <div className="py-8 bg-white border-b border-gray-100 relative group/stories select-none">
        
        <div className="max-w-[1800px] mx-auto px-4 lg:px-8 relative">
            
            {/* Scroll Buttons - Glassmorphism */}
            {showLeftArrow && (
                <button 
                    onClick={() => scrollStories('left')} 
                    className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-full items-center justify-center text-gray-900 hover:scale-110 hover:border-gray-300 shadow-xl transition-all duration-300 -ml-6 opacity-0 group-hover/stories:opacity-100"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
            )}
            
            {showRightArrow && (
                <button 
                    onClick={() => scrollStories('right')} 
                    className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-full items-center justify-center text-gray-900 hover:scale-110 hover:border-gray-300 shadow-xl transition-all duration-300 -mr-6 opacity-0 group-hover/stories:opacity-100"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            )}

            {/* Content List */}
            <div 
                ref={storyScrollRef}
                onScroll={handleScroll}
                className="flex gap-5 md:gap-8 overflow-x-auto no-scrollbar px-2 py-2 scroll-smooth items-start"
            >
                {/* --- LIVE STORY ITEM --- */}
                <div 
                    onClick={() => onNavigate('meetup')}
                    className="flex flex-col items-center gap-2 cursor-pointer group min-w-[80px]"
                >
                    <div className="relative w-[80px] h-[80px] md:w-[90px] md:h-[90px]">
                        {/* Outer Pulse */}
                        <div className="absolute -inset-1 rounded-full border-2 border-red-500 opacity-20 animate-ping"></div>
                        
                        {/* Gradient Ring */}
                        <div className="absolute inset-0 rounded-full p-[3px] bg-gradient-to-tr from-red-600 via-rose-500 to-orange-500 animate-[spin_6s_linear_infinite]"></div>
                        
                        {/* Inner White Gap & Image */}
                        <div className="absolute inset-[3px] rounded-full bg-white p-[3px]">
                            <div className="w-full h-full rounded-full overflow-hidden relative bg-black">
                                <img 
                                    src="https://images.unsplash.com/photo-1605152276897-4f618f831968?q=80&w=200&auto=format&fit=crop" 
                                    className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-500" 
                                    alt="Live" 
                                />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                    <Play className="w-6 h-6 text-white fill-white drop-shadow-md" />
                                </div>
                            </div>
                        </div>

                        {/* Badge */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-sm border border-white tracking-widest animate-pulse flex items-center gap-1">
                            CANLI
                        </div>
                    </div>
                    <span className="text-xs font-bold text-gray-900 mt-1 tracking-tight">MotoVibe TV</span>
                </div>

                {/* --- STORY ITEMS --- */}
                {stories.map((story, index) => (
                    <motion.div 
                        key={story.id} 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleStoryClick(story)}
                        className="flex flex-col items-center gap-2 cursor-pointer group min-w-[80px]"
                    >
                        <div className="relative w-[80px] h-[80px] md:w-[90px] md:h-[90px]">
                            {/* Gradient Ring */}
                            <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${getGradient(story.color)} transition-transform duration-300 group-hover:scale-[1.05]`}></div>
                            
                            {/* Inner White Gap */}
                            <div className="absolute inset-[2.5px] rounded-full bg-white"></div>

                            {/* Image Container */}
                            <div className="absolute inset-[5.5px] rounded-full overflow-hidden bg-gray-100 relative shadow-inner">
                                <img 
                                    src={story.image} 
                                    alt={story.label} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ease-out" 
                                />
                            </div>
                        </div>
                        <span className="text-xs font-semibold text-gray-600 group-hover:text-black transition-colors truncate w-full text-center tracking-tight">
                            {story.label}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    </div>
  );
};
