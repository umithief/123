import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Rotate3D, Box } from 'lucide-react';

interface Model3DProps {
  src: string;
  poster?: string;
  alt?: string;
}

export const Model3D: React.FC<Model3DProps> = ({ src, poster, alt = "3D Model" }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const modelRef = useRef<HTMLElement>(null);
  
  // Define custom element as any to bypass TypeScript JSX checks without polluting global namespace
  const ModelViewer = 'model-viewer' as any;

  useEffect(() => {
    const modelViewer = modelRef.current;
    if (modelViewer) {
      const handleLoad = () => setIsLoaded(true);
      modelViewer.addEventListener('load', handleLoad);
      return () => modelViewer.removeEventListener('load', handleLoad);
    }
  }, []);

  return (
    <div className="relative w-full h-full bg-gray-100 dark:bg-[#111] rounded-2xl overflow-hidden group">
      {/* Ambient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(50,50,50,0.5)_0%,transparent_70%)] pointer-events-none"></div>
      
      {/* Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-gray-100 dark:bg-[#111]">
          <Loader2 className="w-10 h-10 text-moto-accent animate-spin mb-2" />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest animate-pulse">3D Varlık Yükleniyor</span>
        </div>
      )}

      <ModelViewer
        ref={modelRef}
        src={src}
        poster={poster}
        alt={alt}
        loading="eager"
        camera-controls
        auto-rotate
        ar
        shadow-intensity="1"
        environment-image="neutral"
        exposure="1"
        style={{ width: '100%', height: '100%' }}
      >
        {/* AR Button Customization */}
        <button 
            slot="ar-button" 
            className="absolute bottom-4 right-4 bg-white dark:bg-black text-black dark:text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
        >
            <Box className="w-4 h-4 text-moto-accent" /> AR İLE GÖR
        </button>

        {/* Interaction Prompt */}
        <div slot="interaction-prompt" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0"></div>
      
      </ModelViewer>

      {/* Overlay Controls Hint */}
      {isLoaded && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider pointer-events-none bg-black/20 backdrop-blur px-3 py-1.5 rounded-lg">
              <Rotate3D className="w-4 h-4 text-white" /> Döndür & Yakınlaştır
          </div>
      )}
    </div>
  );
};