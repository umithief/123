
import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendMessageToGemini } from '../services/geminiService';
import { motion } from 'framer-motion';

const QUICK_SUGGESTIONS = [
    "🏍️ Kask önerisi",
    "🌧️ Yağmurlu hava sürüşü",
    "🔧 Zincir bakımı",
    "🧥 Yazlık mont",
    "🗺️ Hafta sonu rotası",
    "🔊 İnterkom tavsiyesi"
];

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Merhaba! Ben MotoVibe Asistanı. Sana nasıl yardımcı olabilirim? Ekipman seçimi, rota önerileri veya teknik konularda sorularını bekliyorum."
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const history = messages.map(m => ({ role: m.role, text: m.text }));
        
        const responseText = await sendMessageToGemini(userMessage.text, history);

        const botMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: responseText
        };

        setMessages(prev => [...prev, botMessage]);
    } catch (e) {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            text: "Bir hata oluştu. Lütfen tekrar deneyin."
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto h-[700px] flex flex-col bg-white dark:bg-[#050505] rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-colors duration-300">
      
      {/* HUD DECORATIONS */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-moto-accent to-transparent opacity-50"></div>
      
      {/* Header */}
      <div className="relative z-10 p-4 bg-gray-50/80 dark:bg-gradient-to-b dark:from-[#0a0a0a] dark:to-transparent border-b border-gray-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 backdrop-blur-sm">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-black border border-moto-accent/30 dark:shadow-[0_0_15px_rgba(255,31,31,0.2)] flex items-center justify-center relative overflow-hidden shadow-lg">
                <Sparkles className="w-6 h-6 text-moto-accent" />
            </div>
            <div>
                <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white tracking-wide">
                    AI <span className="text-moto-accent">ASİSTAN</span>
                </h2>
                <div className="flex items-center gap-2 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-gray-500 dark:text-gray-400">
                        Gemini (Cloud)
                    </span>
                </div>
            </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar scroll-smooth bg-gray-50 dark:bg-transparent">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg border ${msg.role === 'user' ? 'bg-moto-accent text-white border-moto-accent' : 'bg-white dark:bg-black text-moto-accent border-gray-200 dark:border-moto-accent/30'}`}>
              {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>
            
            <div className={`max-w-[85%] relative`}>
                <div 
                  className={`p-5 rounded-2xl text-sm leading-relaxed backdrop-blur-md border shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-white dark:bg-white text-gray-900 dark:text-black rounded-tr-none border-gray-200 dark:border-white font-medium' 
                      : 'bg-white dark:bg-black/60 text-gray-800 dark:text-gray-200 rounded-tl-none border-gray-200 dark:border-white/10'
                  }`}
                >
                  {msg.text.split('\n').map((line, i) => (
                      <p key={i} className={`min-h-[1em] ${i > 0 ? 'mt-2' : ''}`}>{line}</p>
                  ))}
                </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-4">
             <div className="w-10 h-10 rounded-xl bg-white dark:bg-black border border-gray-200 dark:border-moto-accent/30 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-moto-accent" />
             </div>
             <div className="bg-white dark:bg-black/60 p-5 rounded-2xl rounded-tl-none border border-gray-200 dark:border-white/10 flex items-center gap-3">
                <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-moto-accent animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-moto-accent animate-bounce delay-100"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-moto-accent animate-bounce delay-200"></span>
                </div>
                <span className="text-xs font-medium text-gray-400">
                    Yazıyor...
                </span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative z-20 bg-white dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-white/10 p-4">
        
        {/* Quick Suggestions */}
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
            {QUICK_SUGGESTIONS.map((sug, i) => (
                <button 
                    key={i} 
                    onClick={() => handleSend(sug)}
                    disabled={isLoading}
                    className="flex-shrink-0 px-4 py-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/5 hover:border-moto-accent/50 rounded-lg text-xs text-gray-600 dark:text-gray-300 transition-all whitespace-nowrap active:scale-95 disabled:opacity-50"
                >
                    {sug}
                </button>
            ))}
        </div>

        <div className="relative flex items-center gap-3 bg-gray-50 dark:bg-black border border-gray-200 dark:border-white/10 rounded-2xl p-2 pl-4 focus-within:border-moto-accent/50 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mesajınızı yazın..."
            className="w-full bg-transparent text-gray-900 dark:text-white focus:outline-none text-sm py-2 font-medium placeholder-gray-400 dark:placeholder-gray-600"
            disabled={isLoading}
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="p-3 text-white rounded-xl disabled:opacity-50 transition-all hover:scale-105 active:scale-95 shadow-md bg-moto-accent hover:bg-red-600 shadow-red-900/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};