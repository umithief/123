import React from 'react';
import { AIChat } from './AIChat';

export const AIAssistantPage: React.FC = () => {
  return (
    <div className="pt-20 md:pt-32 pb-24 max-w-7xl mx-auto px-4">
         <div className="text-center mb-6 animate-in fade-in">
            <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">MOTOVIBE <span className="text-moto-accent">AI</span></h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Kişisel sürüş asistanınız.</p>
         </div>
         <AIChat />
    </div>
  );
};