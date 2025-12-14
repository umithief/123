
import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, MapPin, CloudLightning, CloudSnow, Moon, Loader2, Navigation } from 'lucide-react';
import { weatherService, WeatherData } from '../services/weatherService';
import { motion } from 'framer-motion';

interface WeatherWidgetProps {
    variant?: 'card' | 'minimal';
    className?: string;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ variant = 'card', className = '' }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [city, setCity] = useState<string>('Konum aranıyor...');

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('GPS Yok');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Parallel fetch for speed
          const [weatherData, cityName] = await Promise.all([
              weatherService.getWeather(latitude, longitude),
              weatherService.getCityName(latitude, longitude)
          ]);

          setWeather(weatherData);
          setCity(cityName);
        } catch (err) {
          console.error(err);
          setError('Hata');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.warn("Geolocation denied or error:", err);
        setError('İzin Gerekli');
        setLoading(false);
      },
      { timeout: 10000 }
    );
  }, []);

  const getWeatherIcon = (code: number, isDay: boolean) => {
      if (!isDay && (code === 0 || code === 1)) return Moon;
      if (code <= 1) return Sun;
      if (code <= 3) return Cloud;
      if (code <= 67 || (code >= 80 && code <= 82)) return CloudRain;
      if (code >= 71 && code <= 77) return CloudSnow;
      if (code >= 95) return CloudLightning;
      return Cloud;
  };

  // İzin hatası veya başka bir hata varsa, arayüzü kirletmemek için null döndür (Şerit kaldırıldı)
  if (error) {
      return null;
  }

  if (loading) {
      if (variant === 'minimal') return null;
      return (
        <div className={`flex items-center gap-3 p-3 bg-gray-100 dark:bg-white/5 border border-transparent dark:border-white/10 rounded-xl mt-2 animate-pulse ${className}`}>
            <div className="w-8 h-8 bg-gray-300 dark:bg-white/10 rounded-lg"></div>
            <div className="flex-1 space-y-2">
                <div className="h-2 bg-gray-300 dark:bg-white/10 rounded w-1/3"></div>
                <div className="h-2 bg-gray-300 dark:bg-white/10 rounded w-1/2"></div>
            </div>
        </div>
      );
  }

  if (!weather) return null;

  const Icon = getWeatherIcon(weather.code, weather.isDay);

  // Minimal Variant (Desktop / Overlay)
  if (variant === 'minimal') {
      return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`flex items-center gap-3 bg-black/30 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full ${className}`}
        >
            <Icon className={`w-5 h-5 ${weather.isDay ? 'text-yellow-400' : 'text-blue-300'}`} />
            <div className="flex flex-col">
                <span className="text-sm font-bold text-white leading-none">{Math.round(weather.temperature)}° {weather.condition}</span>
                <div className="flex items-center gap-2 text-[10px] text-gray-300">
                    <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {city}</span>
                    <span className="w-0.5 h-2 bg-white/20"></span>
                    <span className="flex items-center gap-1"><Wind className="w-2.5 h-2.5" /> {weather.windSpeed} km/h</span>
                </div>
            </div>
        </motion.div>
      );
  }

  // Default Card Variant (Mobile)
  return (
    <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-3 relative overflow-hidden group ${className}`}
    >
        <div className="flex items-center justify-between p-3 bg-white dark:bg-[#151515] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm relative z-10">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 flex items-center justify-center rounded-xl border border-gray-100 dark:border-white/5 ${weather.isDay ? 'bg-orange-50 dark:bg-orange-500/10' : 'bg-blue-50 dark:bg-blue-500/10'}`}>
                    <Icon className={`w-6 h-6 ${weather.isDay ? 'text-orange-500' : 'text-blue-400'}`} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-display font-bold text-gray-900 dark:text-white leading-none">{Math.round(weather.temperature)}°</span>
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded">{weather.condition}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-medium">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-moto-accent" /> {city}</span>
                        <span className="w-1 h-1 bg-gray-300 dark:bg-white/20 rounded-full"></span>
                        <span className="flex items-center gap-1"><Wind className="w-3 h-3 text-blue-400" /> {weather.windSpeed} km/h</span>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Ambient Glow */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-20 blur-xl rounded-full pointer-events-none transition-colors ${weather.isDay ? 'bg-orange-500/20' : 'bg-blue-500/20'}`}></div>
    </motion.div>
  );
};
