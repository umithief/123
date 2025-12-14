
import React, { useState, useEffect } from 'react';
import { BlogPost, ViewState } from '../types';
import { blogService } from '../services/blogService';
import { Heart, MessageSquare, Clock, Wrench, Zap, BookOpen, Search, Compass } from 'lucide-react';
import { UserAvatar } from './ui/UserAvatar';
import { useLanguage } from '../contexts/LanguageProvider';

interface BlogProps {
  onNavigate: (view: ViewState, data?: any) => void;
}

export const Blog: React.FC<BlogProps> = ({ onNavigate }) => {
    const { t } = useLanguage();
    const [articles, setArticles] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');

    const categories = [
        { id: 'all', label: t('shop.all'), icon: BookOpen },
        { id: 'inceleme', label: 'İnceleme', icon: Zap },
        { id: 'teknik', label: 'Teknik & Bakım', icon: Wrench },
        { id: 'gezi', label: 'Gezi Rotaları', icon: Compass },
        { id: 'yasam', label: 'Moto Yaşam', icon: Heart }
    ];

    useEffect(() => {
        const fetchArticles = async () => {
            setLoading(true);
            const data = await blogService.getPosts(activeCategory);
            setArticles(data);
            setLoading(false);
        };
        fetchArticles();
    }, [activeCategory]);

    const handleAuthorClick = (authorName: string) => {
        window.dispatchEvent(new CustomEvent('view-user-profile', { detail: 'u101' }));
    };

    return (
        <div className="pt-24 pb-20 max-w-7xl mx-auto px-6 min-h-screen bg-gray-50 text-gray-900">
            <div className="text-center mb-12 relative z-10">
                <h1 className="text-4xl md:text-6xl font-display font-black text-gray-900 mb-4 tracking-tight drop-shadow-sm">MOTO<span className="text-moto-accent">BLOG</span></h1>
                <p className="text-gray-500 text-lg font-medium">{t('blog.subtitle')}</p>
            </div>

            <div className="flex justify-center gap-3 mb-12 flex-wrap">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                            activeCategory === cat.id 
                            ? 'bg-moto-accent text-black border-moto-accent shadow-lg shadow-orange-200' 
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-900 shadow-sm'
                        }`}
                    >
                        <cat.icon className="w-4 h-4" />
                        {cat.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1,2,3].map(i => <div key={i} className="bg-white h-[400px] rounded-3xl animate-pulse shadow-sm border border-gray-100"></div>)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {articles.map((article) => (
                        <div key={article.id} className="group bg-white border border-gray-200 rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 flex flex-col h-full">
                            <div className="relative h-56 overflow-hidden">
                                <img src={article.image} alt={article.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                    {article.category}
                                </div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{article.date}</span>
                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                    <span>{article.readTime} {t('blog.read_time')}</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-moto-accent transition-colors">
                                    {article.title}
                                </h3>
                                <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-1 line-clamp-3">
                                    {article.excerpt}
                                </p>
                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                                    <div 
                                        className="flex items-center gap-2 cursor-pointer group/author"
                                        onClick={() => handleAuthorClick(article.author.name)}
                                    >
                                        <UserAvatar name={article.author.name} size={32} className="ring-2 ring-gray-100" />
                                        <span className="text-xs font-bold text-gray-700 group-hover/author:text-black">{article.author.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-gray-400 text-xs font-medium">
                                        <span className="flex items-center gap-1 hover:text-red-500 transition-colors cursor-pointer"><Heart className="w-4 h-4" /> {article.likes}</span>
                                        <span className="flex items-center gap-1 hover:text-blue-500 transition-colors cursor-pointer"><MessageSquare className="w-4 h-4" /> {article.comments}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
