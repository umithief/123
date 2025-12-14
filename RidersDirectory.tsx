
import React, { useState, useEffect } from 'react';
import { Search, Users, ChevronRight, ShieldAlert } from 'lucide-react';
import { User as UserType, ViewState } from '../types';
import { authService } from '../services/auth';
import { UserAvatar } from './ui/UserAvatar';
import { motion, AnimatePresence } from 'framer-motion';

interface RidersDirectoryProps {
  onViewProfile: (userId: string) => void;
  onNavigate: (view: ViewState) => void;
}

export const RidersDirectory: React.FC<RidersDirectoryProps> = ({ onViewProfile }) => {
  const [allUsers, setAllUsers] = useState<UserType[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
        const users = await authService.getAllUsers();
        // Sort alphabetically by name A-Z
        const sortedUsers = users.sort((a, b) => a.name.localeCompare(b.name));
        setAllUsers(sortedUsers);
    } catch (error) {
      console.error("Kullanıcı verisi yüklenemedi", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = allUsers.filter(u => 
      u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
      (u.email && u.email.toLowerCase().includes(userSearchQuery.toLowerCase()))
  );

  return (
    <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-screen bg-gray-50 text-gray-900">
      
      {/* Header */}
      <div className="text-center mb-10 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-moto-accent/10 border border-moto-accent/20 rounded-full text-moto-accent text-xs font-bold uppercase tracking-widest mb-4 shadow-sm">
              <Users className="w-3 h-3" /> Topluluk
          </div>
          <h1 className="text-3xl md:text-5xl font-display font-black text-gray-900 mb-4 drop-shadow-sm">SÜRÜCÜ <span className="text-moto-accent">REHBERİ</span></h1>
          <p className="text-gray-500 max-w-2xl mx-auto">Tüm MotoVibe üyelerini keşfet, takip et ve etkileşime geç.</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-8 sticky top-24 z-30 shadow-xl flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-3 w-full relative z-50">
              <div className="p-2 bg-gray-100 rounded-xl hidden md:block">
                  <Users className="w-5 h-5 text-moto-accent" />
              </div>
              <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                      type="text" 
                      placeholder="Sürücü adı veya e-posta ara..." 
                      value={userSearchQuery} 
                      onChange={(e) => {
                          setUserSearchQuery(e.target.value);
                          setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 focus:border-moto-accent outline-none transition-all focus:bg-white" 
                  />

                  {/* Suggestions Dropdown */}
                  <AnimatePresence>
                      {showSuggestions && userSearchQuery.trim().length > 0 && filteredUsers.length > 0 && (
                          <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              transition={{ duration: 0.2 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[300px] overflow-y-auto custom-scrollbar"
                          >
                              <div className="px-4 py-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-gray-100 bg-gray-50">
                                  Önerilen Kişiler
                              </div>
                              {filteredUsers.slice(0, 5).map(u => (
                                  <button
                                      key={u.id}
                                      onClick={() => onViewProfile(u.id)}
                                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 text-left"
                                  >
                                      <UserAvatar name={u.name} size={36} className="flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1">
                                              <span className="text-sm font-bold text-gray-900 truncate">{u.name}</span>
                                              {u.isAdmin && <ShieldAlert className="w-3 h-3 text-blue-500" />}
                                          </div>
                                          <div className="text-xs text-moto-accent">{u.rank}</div>
                                      </div>
                                      <ChevronRight className="w-4 h-4 text-gray-400" />
                                  </button>
                              ))}
                              {filteredUsers.length > 5 && (
                                  <div className="p-2 text-center text-xs text-gray-500 italic bg-gray-50">
                                      + {filteredUsers.length - 5} sonuç daha...
                                  </div>
                              )}
                          </motion.div>
                      )}
                  </AnimatePresence>
              </div>
          </div>
          <div className="text-xs text-gray-500 font-medium whitespace-nowrap px-2">
              {filteredUsers.length} Sürücü Bulundu
          </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-white border border-gray-200 h-24 rounded-2xl animate-pulse"></div>
              ))}
          </div>
      ) : (
          /* Users Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map(u => (
                  <motion.div
                      key={u.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white border border-gray-200 rounded-2xl p-4 hover:border-moto-accent/50 transition-all flex items-center gap-4 group cursor-pointer hover:shadow-lg"
                      onClick={() => onViewProfile(u.id)}
                  >
                      <UserAvatar name={u.name} size={64} className="ring-2 ring-gray-100 group-hover:ring-moto-accent/30 transition-all shadow-md" />
                      <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate group-hover:text-moto-accent transition-colors flex items-center gap-1 text-lg">
                              {u.name}
                              {u.isAdmin && <ShieldAlert className="w-4 h-4 text-blue-500" />}
                          </h4>
                          <p className="text-xs text-moto-accent font-bold uppercase tracking-wider mb-2">{u.rank || 'Sürücü'}</p>
                          <div className="flex items-center gap-3 text-[10px] text-gray-500 bg-gray-50 w-fit px-2 py-1 rounded-lg border border-gray-200">
                              <span className="font-bold text-gray-700">{u.followers || 0}</span> Takipçi
                              <div className="w-[1px] h-3 bg-gray-300"></div>
                              <span className="font-bold text-gray-700">{u.points || 0}</span> Puan
                          </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-moto-accent group-hover:text-black transition-colors">
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
                      </div>
                  </motion.div>
              ))}
              
              {filteredUsers.length === 0 && (
                  <div className="col-span-full py-20 text-center text-gray-500 bg-white rounded-3xl border border-dashed border-gray-300">
                      <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p className="text-lg font-medium">Aradığınız kriterlere uygun sürücü bulunamadı.</p>
                      <button onClick={() => setUserSearchQuery('')} className="mt-4 text-moto-accent hover:underline text-sm font-bold">Aramayı Temizle</button>
                  </div>
              )}
          </div>
      )}
    </div>
  );
};
