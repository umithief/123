
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingCart, Users, Plus, Trash2, Edit2, Search, Bell, Grid, Map, Music as MusicIcon, Settings, LogOut, PlayCircle, Loader2, Image as ImageIcon, BarChart2, Globe, DollarSign, Clock, Eye, ShoppingBag, Layers, Circle, ArrowRight, RotateCcw, MessageSquare, Check, X, Truck, Link as LinkIcon, UploadCloud, Box, Award, Zap, ChevronRight, TrendingUp, TrendingDown, MoreVertical, ShieldCheck, Video } from 'lucide-react';
import { Order, Product, ProductCategory, User, Slide, ActivityLog, CategoryItem, Route, MusicTrack, Story, NegotiationOffer, Model3DItem } from '../types';
import { Button } from './ui/Button';
import { productService } from '../services/productService';
import { sliderService } from '../services/sliderService';
import { categoryService } from '../services/categoryService';
import { routeService } from '../services/routeService';
import { storyService } from '../services/storyService';
import { negotiationService } from '../services/negotiationService';
import { orderService } from '../services/orderService';
import { authService } from '../services/auth';
import { modelService } from '../services/modelService';
import { ToastType } from './toast';
import { CONFIG } from '../services/config';
import { useLanguage } from '../contexts/LanguageProvider';
import { motion, AnimatePresence } from 'framer-motion';

// FilePond
// @ts-ignore
import { FilePond, registerPlugin } from 'react-filepond';
// @ts-ignore
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
// @ts-ignore
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
// @ts-ignore
import FilePondPluginImageCrop from 'filepond-plugin-image-crop';
// @ts-ignore
import FilePondPluginImageResize from 'filepond-plugin-image-resize';
// @ts-ignore
import FilePondPluginImageTransform from 'filepond-plugin-image-transform';
import { storageService } from '../services/storageService';

registerPlugin(
    FilePondPluginImagePreview,
    FilePondPluginFileValidateType,
    FilePondPluginImageCrop,
    FilePondPluginImageResize,
    FilePondPluginImageTransform
);

interface AdminPanelProps {
    onLogout: () => void;
    onShowToast: (type: ToastType, message: string) => void;
    onNavigate: (view: any) => void;
}

type AdminTab = 'dashboard' | 'products' | 'orders' | 'users' | 'slider' | 'categories' | 'routes' | 'stories' | 'negotiations' | 'models';

const StatCard = ({ title, value, icon: Icon, trend, color }: any) => (
    <div className="bg-[#1A1A17] border border-white/5 rounded-3xl p-6 relative overflow-hidden group hover:border-white/10 transition-all">
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
            <Icon className="w-16 h-16" />
        </div>
        <div className="relative z-10">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">{title}</p>
            <h3 className="text-3xl font-mono font-bold text-white mb-4">{value}</h3>
            <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${trend > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(trend)}%
                </span>
                <span className="text-xs text-gray-600">geçen aya göre</span>
            </div>
        </div>
    </div>
);

const NavItem = ({ id, label, icon: Icon, active, onClick }: any) => (
    <button
        onClick={() => onClick(id)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group relative overflow-hidden ${active
                ? 'bg-[#F2A619] text-black shadow-lg shadow-[#F2A619]/20 font-bold'
                : 'text-gray-400 hover:bg-white/5 hover:text-white font-medium'
            }`}
    >
        <Icon className={`w-5 h-5 ${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform`} strokeWidth={active ? 2.5 : 2} />
        <span className="relative z-10">{label}</span>
        {active && <div className="absolute inset-0 bg-white/20 blur-xl"></div>}
    </button>
);

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout, onShowToast, onNavigate }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [slides, setSlides] = useState<Slide[]>([]);
    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [routes, setRoutes] = useState<Route[]>([]);
    const [stories, setStories] = useState<Story[]>([]);
    const [negotiations, setNegotiations] = useState<NegotiationOffer[]>([]);
    const [models, setModels] = useState<Model3DItem[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');

    const [imageSource, setImageSource] = useState<'upload' | 'url'>('upload');
    const [modelSource, setModelSource] = useState<'upload' | 'url'>('upload');

    const [files, setFiles] = useState<any[]>([]);
    const [modelFiles, setModelFiles] = useState<any[]>([]);

    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        const [p, s, c, r, st, n, o, u, m] = await Promise.all([
            productService.getProducts(),
            sliderService.getSlides(),
            categoryService.getCategories(),
            routeService.getRoutes(),
            storyService.getStories(),
            negotiationService.getOffers(),
            orderService.getAllOrders(),
            authService.getAllUsers(),
            modelService.getModels()
        ]);
        setProducts(p);
        setSlides(s);
        setCategories(c);
        setRoutes(r);
        setStories(st);
        setNegotiations(n);
        setOrders(o);
        setUsers(u);
        setModels(m);
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        const itemWithImages = {
            ...item,
            images: item.images || (item.image ? [item.image] : [])
        };
        setFormData(itemWithImages);
        setFiles([]);
        setModelFiles([]);

        setImageSource(item.image && item.image.startsWith('http') && !item.image.includes('localhost') && !item.image.includes('minio') ? 'url' : 'upload');

        const hasModelUrl = item.model3d && item.model3d.startsWith('http');
        setModelSource(hasModelUrl ? 'url' : 'upload');

        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingItem(null);
        setFiles([]);
        setModelFiles([]);
        setImageSource('upload');
        setModelSource('upload');

        if (activeTab === 'products') setFormData({ name: '', price: 0, category: 'Aksesuar', image: '', images: [], description: '', stock: 10, features: [], isNegotiable: false, model3d: '', isEditorsChoice: false, isDealOfTheDay: false });
        else if (activeTab === 'stories') setFormData({ label: '', image: '', color: 'border-orange-500' });
        else if (activeTab === 'categories') setFormData({ name: '', type: 'Aksesuar', image: '', desc: '', count: '0 Model', className: 'col-span-1 row-span-1' });
        else if (activeTab === 'slider') setFormData({ title: '', subtitle: '', image: '', cta: 'İNCELE', action: 'shop', type: 'image', videoUrl: '' });
        else if (activeTab === 'routes') setFormData({ title: '', location: '', difficulty: 'Orta', distance: '', duration: '', image: '', tags: [] });
        else if (activeTab === 'models') setFormData({ name: '', url: '', poster: '', category: 'Genel' });

        setIsModalOpen(true);
    };

    const handleDelete = async (id: any) => {
        if (!confirm('Bu kaydı silmek istediğine emin misin?')) return;

        try {
            if (activeTab === 'products') { await productService.deleteProduct(id); setProducts(products.filter(p => p.id !== id)); }
            else if (activeTab === 'stories') { await storyService.deleteStory(id); setStories(stories.filter(s => s.id !== id)); }
            else if (activeTab === 'categories') { await categoryService.deleteCategory(id); setCategories(categories.filter(c => c.id !== id)); }
            else if (activeTab === 'slider') { await sliderService.deleteSlide(id); setSlides(slides.filter(s => s.id !== id)); }
            else if (activeTab === 'routes') { await routeService.deleteRoute(id); setRoutes(routes.filter(r => r.id !== id)); }
            else if (activeTab === 'users') { await authService.deleteUser(id); setUsers(users.filter(u => u.id !== id)); }
            else if (activeTab === 'models') { await modelService.deleteModel(id); setModels(models.filter(m => m.id !== id)); }

            onShowToast('success', 'Kayıt silindi.');
        } catch (e) {
            onShowToast('error', 'Silme işlemi başarısız.');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            let finalData = { ...formData };
            delete finalData.tempUrlInput;
            delete finalData.tempModelUrlInput;

            if (activeTab === 'products') {
                if (finalData.images && finalData.images.length > 0) {
                    finalData.image = finalData.images[0];
                }
            }

            if (activeTab === 'products') {
                if (editingItem) await productService.updateProduct(finalData);
                else await productService.addProduct(finalData);
            } else if (activeTab === 'stories') {
                if (editingItem) await storyService.updateStory(finalData);
                else await storyService.addStory(finalData);
            } else if (activeTab === 'categories') {
                if (editingItem) await categoryService.updateCategory(finalData);
                else await categoryService.addCategory(finalData);
            } else if (activeTab === 'slider') {
                if (editingItem) await sliderService.updateSlide(finalData);
                else await sliderService.addSlide(finalData);
            } else if (activeTab === 'routes') {
                if (editingItem) await routeService.updateRoute(finalData);
                else await routeService.addRoute(finalData);
            } else if (activeTab === 'models') {
                if (editingItem) await modelService.updateModel(finalData);
                else await modelService.addModel(finalData);
            }

            await loadAllData();
            setIsModalOpen(false);
            onShowToast('success', 'Başarıyla kaydedildi.');
        } catch (e) {
            onShowToast('error', 'Kaydetme hatası oluştu.');
        } finally {
            setIsSaving(false);
        }
    };

    // Helper Handlers
    const handleRemoveImage = (urlToRemove: string) => {
        setFormData((prev: any) => ({
            ...prev,
            images: prev.images.filter((url: string) => url !== urlToRemove),
            image: prev.image === urlToRemove ? (prev.images.length > 1 ? prev.images[1] : '') : prev.image
        }));
    };

    const handleAddUrlImage = () => {
        const url = formData.tempUrlInput;
        if (!url) return;
        setFormData((prev: any) => ({
            ...prev,
            images: [...(prev.images || []), url],
            image: prev.image || url,
            tempUrlInput: ''
        }));
    };

    const handleToggleApiMode = () => {
        const targetMode = !CONFIG.USE_MOCK_API;
        const modeName = targetMode ? "MOCK (Yerel Veri)" : "LIVE (Sunucu)";
        if (confirm(`Veri kaynağını ${modeName} olarak değiştirmek istiyor musunuz? Sayfa yenilenecektir.`)) {
            CONFIG.toggleApiMode(targetMode);
        }
    };

    const handleToggleProductStatus = async (product: Product, field: 'isEditorsChoice' | 'isDealOfTheDay') => {
        try {
            const updatedProduct = { ...product, [field]: !product[field] };
            await productService.updateProduct(updatedProduct);
            setProducts(products.map(p => p.id === product.id ? updatedProduct : p));
            onShowToast('success', 'Durum güncellendi.');
        } catch (e) { onShowToast('error', 'Hata oluştu.'); }
    };

    const handleOrderStatusChange = async (orderId: string, newStatus: string) => {
        try {
            await orderService.updateOrderStatus(orderId, newStatus);
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
            onShowToast('success', 'Sipariş durumu güncellendi');
        } catch (e) { onShowToast('error', 'Hata oluştu'); }
    };

    const handleNegotiationAction = async (id: string, status: 'accepted' | 'rejected') => {
        try {
            await negotiationService.updateOfferStatus(id, status);
            setNegotiations(prev => prev.map(n => n.id === id ? { ...n, status } : n));
            onShowToast('success', `Teklif ${status === 'accepted' ? 'onaylandı' : 'reddedildi'}`);
        } catch (e) { onShowToast('error', 'Hata oluştu'); }
    };

    return (
        <div className="h-screen bg-[#09090b] text-white font-sans flex overflow-hidden selection:bg-[#F2A619] selection:text-black">

            {/* --- SIDEBAR --- */}
            <motion.div
                initial={{ width: 280 }}
                animate={{ width: isSidebarOpen ? 280 : 80 }}
                className="flex-shrink-0 bg-[#121212] border-r border-white/5 flex flex-col transition-all duration-300 relative z-20"
            >
                {/* Logo Area */}
                <div className={`h-20 flex items-center ${isSidebarOpen ? 'px-8 justify-start' : 'justify-center'} border-b border-white/5`}>
                    <div className="w-10 h-10 bg-[#F2A619] rounded-xl flex items-center justify-center text-black shadow-lg shadow-[#F2A619]/20">
                        <Zap className="w-6 h-6 fill-current" />
                    </div>
                    {isSidebarOpen && (
                        <div className="ml-3">
                            <h1 className="font-display font-black text-xl tracking-tight text-white leading-none">MOTO<span className="text-[#F2A619]">VIBE</span></h1>
                            <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Admin Panel</span>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto custom-scrollbar py-6 px-3 space-y-1">
                    <NavItem id="dashboard" label="Genel Bakış" icon={LayoutDashboard} active={activeTab === 'dashboard'} onClick={setActiveTab} />
                    <NavItem id="products" label="Ürün Yönetimi" icon={Package} active={activeTab === 'products'} onClick={setActiveTab} />
                    <NavItem id="orders" label="Siparişler" icon={ShoppingCart} active={activeTab === 'orders'} onClick={setActiveTab} />
                    <NavItem id="users" label="Kullanıcılar" icon={Users} active={activeTab === 'users'} onClick={setActiveTab} />
                    <div className="my-4 border-t border-white/5 mx-2"></div>
                    <NavItem id="negotiations" label="Teklifler" icon={MessageSquare} active={activeTab === 'negotiations'} onClick={setActiveTab} />
                    <NavItem id="routes" label="Rotalar" icon={Map} active={activeTab === 'routes'} onClick={setActiveTab} />
                    <NavItem id="stories" label="Hikayeler" icon={Circle} active={activeTab === 'stories'} onClick={setActiveTab} />
                    <NavItem id="categories" label="Kategoriler" icon={Grid} active={activeTab === 'categories'} onClick={setActiveTab} />
                    <NavItem id="slider" label="Slider" icon={ImageIcon} active={activeTab === 'slider'} onClick={setActiveTab} />
                    <NavItem id="models" label="3D Modeller" icon={Box} active={activeTab === 'models'} onClick={setActiveTab} />
                </div>

                {/* Footer Actions */}
                <div className="p-3 border-t border-white/5">
                    <button onClick={() => onNavigate('home')} className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                        <Globe className="w-5 h-5" />
                    </button>
                    <button onClick={onLogout} className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors mt-1">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </motion.div>

            {/* --- MAIN CONTENT --- */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#09090b]">

                {/* Top Bar */}
                <header className="h-20 border-b border-white/5 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-white capitalize">{activeTab === 'dashboard' ? 'Genel Bakış' : activeTab}</h2>
                        <div className="h-6 w-[1px] bg-white/10 mx-2"></div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2 text-xs text-white focus:border-[#F2A619] outline-none w-64 transition-all focus:w-80"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleToggleApiMode}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                        >
                            <div className={`w-2 h-2 rounded-full ${CONFIG.USE_MOCK_API ? 'bg-yellow-500' : 'bg-green-500'} animate-pulse`}></div>
                            <span className="text-xs font-mono font-bold text-gray-400">{CONFIG.USE_MOCK_API ? 'MOCK' : 'LIVE'}</span>
                            <RotateCcw className="w-3 h-3 text-gray-500" />
                        </button>

                        <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors relative">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#09090b]"></span>
                        </button>

                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#F2A619] to-orange-600 p-[2px]">
                            <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-xs font-bold text-white">AD</div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto">

                        {/* DASHBOARD VIEW */}
                        {activeTab === 'dashboard' && (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <StatCard title="Toplam Ürün" value={products.length} icon={Package} trend={12} color="text-blue-500" />
                                    <StatCard title="Toplam Sipariş" value={orders.length} icon={ShoppingCart} trend={8} color="text-green-500" />
                                    <StatCard title="Kullanıcılar" value={users.length} icon={Users} trend={-3} color="text-purple-500" />
                                    <StatCard title="Bekleyen Teklif" value={negotiations.filter(n => n.status === 'pending').length} icon={MessageSquare} trend={5} color="text-yellow-500" />
                                </div>

                                {/* Recent Activity Section */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Recent Orders */}
                                    <div className="lg:col-span-2 bg-[#1A1A17] border border-white/5 rounded-3xl p-6">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-bold text-white">Son Siparişler</h3>
                                            <button onClick={() => setActiveTab('orders')} className="text-xs font-bold text-[#F2A619] hover:text-white transition-colors">Tümünü Gör</button>
                                        </div>
                                        <div className="space-y-3">
                                            {orders.slice(0, 5).map(order => (
                                                <div key={order.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-gray-500 font-bold group-hover:text-white transition-colors border border-white/10">
                                                            <ShoppingBag className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-white">{order.id}</div>
                                                            <div className="text-xs text-gray-500">{order.date} • {order.items.length} Ürün</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${order.status === 'Teslim Edildi' ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                                            {order.status}
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm font-mono font-bold text-[#F2A619]">₺{order.total.toLocaleString()}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="bg-[#1A1A17] border border-white/5 rounded-3xl p-6">
                                        <h3 className="text-lg font-bold text-white mb-6">Hızlı İşlemler</h3>
                                        <div className="space-y-3">
                                            <button onClick={() => { setActiveTab('products'); handleAddNew(); }} className="w-full p-4 bg-white/5 hover:bg-[#F2A619] hover:text-black rounded-2xl flex items-center gap-3 transition-all group">
                                                <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center group-hover:bg-black/10"><Plus className="w-4 h-4" /></div>
                                                <span className="font-bold text-sm">Ürün Ekle</span>
                                            </button>
                                            <button onClick={() => { setActiveTab('slider'); handleAddNew(); }} className="w-full p-4 bg-white/5 hover:bg-blue-500 hover:text-white rounded-2xl flex items-center gap-3 transition-all group">
                                                <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center group-hover:bg-white/20"><ImageIcon className="w-4 h-4" /></div>
                                                <span className="font-bold text-sm">Slider Ekle</span>
                                            </button>
                                            <button onClick={() => { setActiveTab('negotiations'); }} className="w-full p-4 bg-white/5 hover:bg-green-500 hover:text-white rounded-2xl flex items-center gap-3 transition-all group">
                                                <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center group-hover:bg-white/20"><MessageSquare className="w-4 h-4" /></div>
                                                <span className="font-bold text-sm">Teklifleri İncele</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PRODUCTS VIEW */}
                        {activeTab === 'products' && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <div className="flex justify-end">
                                    <Button onClick={handleAddNew} className="bg-[#F2A619] text-black shadow-lg shadow-[#F2A619]/20 font-bold">
                                        <Plus className="w-4 h-4 mr-2" /> YENİ ÜRÜN
                                    </Button>
                                </div>

                                <div className="bg-[#1A1A17] border border-white/5 rounded-3xl overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-white/5 text-gray-400 text-xs font-bold uppercase tracking-wider">
                                            <tr>
                                                <th className="p-5 pl-8">Ürün</th>
                                                <th className="p-5">Kategori</th>
                                                <th className="p-5">Fiyat</th>
                                                <th className="p-5">Stok</th>
                                                <th className="p-5">Durum</th>
                                                <th className="p-5 text-right pr-8">İşlem</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 text-sm">
                                            {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
                                                <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                                                    <td className="p-5 pl-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-white p-1 overflow-hidden">
                                                                <img src={product.image} className="w-full h-full object-contain" />
                                                            </div>
                                                            <span className="font-bold text-white group-hover:text-[#F2A619] transition-colors">{product.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-5 text-gray-400">{product.category}</td>
                                                    <td className="p-5 font-mono font-bold text-white">₺{product.price.toLocaleString()}</td>
                                                    <td className="p-5">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${product.stock < 5 ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                                                            {product.stock} Adet
                                                        </span>
                                                    </td>
                                                    <td className="p-5">
                                                        <div className="flex gap-2">
                                                            {product.isEditorsChoice && <Award className="w-4 h-4 text-purple-500" />}
                                                            {product.isDealOfTheDay && <Zap className="w-4 h-4 text-red-500" />}
                                                        </div>
                                                    </td>
                                                    <td className="p-5 pr-8 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button onClick={() => handleToggleProductStatus(product, 'isEditorsChoice')} title="Editörün Seçimi" className={`p-2 rounded-lg hover:bg-white/10 ${product.isEditorsChoice ? 'text-purple-500' : 'text-gray-600'}`}><Award className="w-4 h-4" /></button>
                                                            <button onClick={() => handleToggleProductStatus(product, 'isDealOfTheDay')} title="Fırsat Ürünü" className={`p-2 rounded-lg hover:bg-white/10 ${product.isDealOfTheDay ? 'text-red-500' : 'text-gray-600'}`}><Zap className="w-4 h-4" /></button>
                                                            <button onClick={() => handleEdit(product)} className="p-2 rounded-lg hover:bg-blue-500/20 text-gray-400 hover:text-blue-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                            <button onClick={() => handleDelete(product.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* CATEGORIES VIEW */}
                        {activeTab === 'categories' && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <div className="flex justify-end">
                                    <Button onClick={handleAddNew} className="bg-[#F2A619] text-black shadow-lg">
                                        <Plus className="w-4 h-4 mr-2" /> YENİ KATEGORİ
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {categories.map(cat => (
                                        <div key={cat.id} className="bg-[#1A1A17] border border-white/5 rounded-2xl overflow-hidden group">
                                            <div className="relative h-40">
                                                <img src={cat.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                                                <div className="absolute bottom-4 left-4">
                                                    <h3 className="font-bold text-white text-lg">{cat.name}</h3>
                                                    <p className="text-xs text-gray-300">{cat.count}</p>
                                                </div>
                                                <div className="absolute top-2 right-2 flex gap-2">
                                                    <button onClick={() => handleEdit(cat)} className="p-2 bg-black/60 rounded-full text-white hover:bg-blue-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDelete(cat.id)} className="p-2 bg-black/60 rounded-full text-white hover:bg-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                            <div className="p-4 flex justify-between items-center">
                                                <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">{cat.type}</span>
                                                <span className="text-xs text-gray-500 italic">{cat.desc}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SLIDER VIEW */}
                        {activeTab === 'slider' && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <div className="flex justify-end">
                                    <Button onClick={handleAddNew} className="bg-[#F2A619] text-black shadow-lg">
                                        <Plus className="w-4 h-4 mr-2" /> YENİ SLIDE
                                    </Button>
                                </div>
                                <div className="space-y-4">
                                    {slides.map(slide => (
                                        <div key={slide.id} className="bg-[#1A1A17] border border-white/5 rounded-2xl overflow-hidden flex flex-col md:flex-row group">
                                            <div className="w-full md:w-64 h-40 relative flex-shrink-0 bg-black">
                                                {slide.type === 'video' ? (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                                                        <Video className="w-8 h-8 text-gray-500" />
                                                        <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded">VIDEO</span>
                                                    </div>
                                                ) : (
                                                    <img src={slide.image} className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div className="p-6 flex-1 flex flex-col justify-center">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="text-xl font-bold text-white">{slide.title}</h3>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleEdit(slide)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-blue-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                        <button onClick={() => handleDelete(slide.id)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-400 mb-4">{slide.subtitle}</p>
                                                <div className="flex gap-3">
                                                    <span className="text-xs bg-white/10 px-2 py-1 rounded text-white font-mono">CTA: {slide.cta}</span>
                                                    <span className="text-xs bg-white/10 px-2 py-1 rounded text-white font-mono">Action: {slide.action}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ROUTES VIEW */}
                        {activeTab === 'routes' && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <div className="flex justify-end">
                                    <Button onClick={handleAddNew} className="bg-[#F2A619] text-black shadow-lg">
                                        <Plus className="w-4 h-4 mr-2" /> YENİ ROTA
                                    </Button>
                                </div>
                                <div className="bg-[#1A1A17] border border-white/5 rounded-3xl overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-white/5 text-gray-400 text-xs font-bold uppercase tracking-wider">
                                            <tr>
                                                <th className="p-5 pl-8">Rota</th>
                                                <th className="p-5">Lokasyon</th>
                                                <th className="p-5">Zorluk</th>
                                                <th className="p-5">Mesafe/Süre</th>
                                                <th className="p-5 text-right pr-8">İşlem</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 text-sm">
                                            {routes.map(route => (
                                                <tr key={route.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="p-5 pl-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-16 h-12 rounded-lg overflow-hidden">
                                                                <img src={route.image} className="w-full h-full object-cover" />
                                                            </div>
                                                            <span className="font-bold text-white">{route.title}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-5 text-gray-400">{route.location}</td>
                                                    <td className="p-5">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${route.difficulty === 'Kolay' ? 'bg-green-500/20 text-green-500' :
                                                                route.difficulty === 'Orta' ? 'bg-yellow-500/20 text-yellow-500' :
                                                                    'bg-red-500/20 text-red-500'
                                                            }`}>
                                                            {route.difficulty}
                                                        </span>
                                                    </td>
                                                    <td className="p-5 text-gray-400 font-mono">{route.distance} / {route.duration}</td>
                                                    <td className="p-5 pr-8 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button onClick={() => handleEdit(route)} className="p-2 rounded-lg hover:bg-blue-500/20 text-gray-400 hover:text-blue-500 transition-colors"><Edit2 className="w-4 h-4" /></button>
                                                            <button onClick={() => handleDelete(route.id)} className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* STORIES VIEW */}
                        {activeTab === 'stories' && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <div className="flex justify-end">
                                    <Button onClick={handleAddNew} className="bg-[#F2A619] text-black shadow-lg">
                                        <Plus className="w-4 h-4 mr-2" /> YENİ HİKAYE
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                    {stories.map(story => (
                                        <div key={story.id} className="flex flex-col items-center group relative">
                                            <div className={`w-24 h-24 rounded-full p-[2px] bg-gradient-to-tr ${story.color.includes('orange') ? 'from-orange-500 to-yellow-500' : 'from-gray-500 to-gray-300'} mb-3 relative`}>
                                                <div className="w-full h-full rounded-full border-2 border-black overflow-hidden relative">
                                                    <img src={story.image} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <button onClick={() => handleEdit(story)} className="p-1.5 bg-white rounded-full text-black hover:scale-110 transition-transform"><Edit2 className="w-3 h-3" /></button>
                                                        <button onClick={() => handleDelete(story.id)} className="p-1.5 bg-red-600 rounded-full text-white hover:scale-110 transition-transform"><Trash2 className="w-3 h-3" /></button>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-white text-center">{story.label}</span>
                                            <span className="text-[10px] text-gray-500">{story.id}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* GENERIC LIST VIEW (For other tabs) */}
                        {['users', 'orders', 'negotiations', 'models'].includes(activeTab) && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                {activeTab === 'models' && <div className="flex justify-end"><Button onClick={handleAddNew} className="bg-[#F2A619] text-black"><Plus className="w-4 h-4 mr-2" /> Yeni Model</Button></div>}

                                {activeTab === 'orders' && (
                                    <div className="space-y-4">
                                        {orders.map(order => (
                                            <div key={order.id} className="bg-[#1A1A17] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
                                                <div className="flex justify-between items-center mb-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-[#F2A619] font-bold text-xs border border-white/5">#{order.id.slice(-4)}</div>
                                                        <div>
                                                            <div className="text-white font-bold">{order.userId}</div>
                                                            <div className="text-xs text-gray-500">{order.date}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xl font-bold text-white font-mono">₺{order.total}</div>
                                                        <div className={`text-[10px] font-bold uppercase ${order.status === 'Teslim Edildi' ? 'text-green-500' : 'text-yellow-500'}`}>{order.status}</div>
                                                    </div>
                                                </div>
                                                <div className="bg-black/20 rounded-xl p-3 flex gap-2 overflow-x-auto no-scrollbar">
                                                    {order.items.map((item, idx) => (
                                                        <div key={idx} className="flex-shrink-0 w-12 h-12 bg-white rounded-lg overflow-hidden relative" title={item.name}>
                                                            <img src={item.image} className="w-full h-full object-contain" />
                                                            <div className="absolute bottom-0 right-0 bg-black text-white text-[8px] px-1 font-bold">x{item.quantity}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex gap-2 justify-end">
                                                    {['Hazırlanıyor', 'Kargoda', 'Teslim Edildi'].map(s => (
                                                        <button key={s} onClick={() => handleOrderStatusChange(order.id, s)} className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${order.status === s ? 'bg-white text-black border-white' : 'border-white/10 text-gray-500 hover:text-white'}`}>{s}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'users' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                                            <div key={u.id} className="bg-[#1A1A17] border border-white/5 rounded-2xl p-5 flex items-center gap-4 hover:border-white/20 transition-all group">
                                                <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-xl font-bold text-gray-300 group-hover:bg-[#F2A619] group-hover:text-black transition-colors">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-white truncate">{u.name}</h4>
                                                        {u.isAdmin && <ShieldCheck className="w-4 h-4 text-blue-500" />}
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate">{u.email}</div>
                                                    <div className="mt-2 flex gap-2">
                                                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-400 border border-white/5">{u.rank}</span>
                                                        <span className="text-[10px] bg-[#F2A619]/10 text-[#F2A619] px-2 py-0.5 rounded border border-[#F2A619]/20">{u.points} XP</span>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleDelete(u.id)} className="p-2 hover:bg-red-500/10 text-gray-600 hover:text-red-500 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'negotiations' && (
                                    <div className="space-y-4">
                                        {negotiations.map(offer => (
                                            <div key={offer.id} className="bg-[#1A1A17] border border-white/5 rounded-2xl p-5 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <img src={offer.productImage} className="w-16 h-16 bg-white rounded-lg object-contain" />
                                                    <div>
                                                        <h4 className="font-bold text-white">{offer.productName}</h4>
                                                        <div className="text-xs text-gray-400 mt-1">Teklif Eden: <span className="text-white">{offer.userName}</span></div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-8">
                                                    <div className="text-right">
                                                        <div className="text-xs text-gray-500 line-through">₺{offer.originalPrice}</div>
                                                        <div className="text-xl font-bold text-[#F2A619]">₺{offer.offerPrice}</div>
                                                    </div>
                                                    {offer.status === 'pending' ? (
                                                        <div className="flex gap-2">
                                                            <button onClick={() => handleNegotiationAction(offer.id, 'accepted')} className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg transition-colors"><Check className="w-5 h-5" /></button>
                                                            <button onClick={() => handleNegotiationAction(offer.id, 'rejected')} className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                                                        </div>
                                                    ) : (
                                                        <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${offer.status === 'accepted' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>{offer.status === 'accepted' ? 'Onaylandı' : 'Reddedildi'}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* --- MODAL --- */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#1A1A17] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative z-10 flex flex-col"
                        >
                            <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#1A1A17] z-20">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    {editingItem ? <Edit2 className="w-5 h-5 text-[#F2A619]" /> : <Plus className="w-5 h-5 text-[#F2A619]" />}
                                    {editingItem ? 'Kaydı Düzenle' : 'Yeni Kayıt Ekle'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
                            </div>

                            <div className="p-8 space-y-6">
                                {/* DYNAMIC FORM BASED ON TAB */}
                                {Object.keys(formData).map(key => {
                                    // Exclude complex objects or handled fields
                                    if (['id', 'images', 'image', 'tempUrlInput', 'tempModelUrlInput', 'features', 'model3d', 'path', 'coordinates', 'tips', 'tags', 'attendeeList', 'messages'].includes(key)) return null;

                                    // Special inputs
                                    if (key === 'description' || key === 'desc') return (
                                        <div key={key}>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">{key}</label>
                                            <textarea className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-[#F2A619] outline-none h-32 resize-none" value={formData[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })} />
                                        </div>
                                    );

                                    if (key === 'category' && activeTab === 'products') return (
                                        <div key={key}>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Kategori</label>
                                            <select className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-[#F2A619] outline-none appearance-none" value={formData[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })}>
                                                {Object.values(ProductCategory).map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    );

                                    if (typeof formData[key] === 'boolean') return (
                                        <div key={key} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                            <input type="checkbox" className="w-5 h-5 accent-[#F2A619]" checked={formData[key]} onChange={e => setFormData({ ...formData, [key]: e.target.checked })} />
                                            <label className="text-sm font-bold text-white capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                        </div>
                                    );

                                    return (
                                        <div key={key}>
                                            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                                            <input
                                                type={typeof formData[key] === 'number' ? 'number' : 'text'}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white focus:border-[#F2A619] outline-none"
                                                value={formData[key]}
                                                onChange={e => setFormData({ ...formData, [key]: typeof formData[key] === 'number' ? Number(e.target.value) : e.target.value })}
                                            />
                                        </div>
                                    )
                                })}

                                {/* Image Uploader Section */}
                                {(activeTab === 'products' || activeTab === 'slider' || activeTab === 'stories' || activeTab === 'categories' || activeTab === 'routes') && (
                                    <div className="bg-white/5 rounded-2xl p-5 border border-white/5 mt-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Medya Yönetimi</label>
                                            <div className="flex gap-2 bg-black/40 p-1 rounded-lg">
                                                <button onClick={() => setImageSource('upload')} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${imageSource === 'upload' ? 'bg-[#F2A619] text-black' : 'text-gray-400 hover:text-white'}`}>YÜKLE</button>
                                                <button onClick={() => setImageSource('url')} className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${imageSource === 'url' ? 'bg-[#F2A619] text-black' : 'text-gray-400 hover:text-white'}`}>URL</button>
                                            </div>
                                        </div>

                                        {imageSource === 'upload' ? (
                                            <FilePond
                                                files={files}
                                                onupdatefiles={setFiles}
                                                allowMultiple={true}
                                                maxFiles={5}
                                                server={{
                                                    process: async (fieldName: any, file: any, metadata: any, load: any, error: any, progress: any, abort: any) => {
                                                        try {
                                                            const url = await storageService.uploadFile(file);
                                                            setFormData((prev: any) => ({
                                                                ...prev,
                                                                images: [...(prev.images || []), url],
                                                                image: prev.image || url
                                                            }));
                                                            load(url);
                                                        } catch (err) { error('Upload failed'); }
                                                    }
                                                }}
                                                labelIdle='Sürükle bırak veya <span class="filepond--label-action">Gözat</span>'
                                                credits={false}
                                                className="filepond-dark"
                                            />
                                        ) : (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="https://..."
                                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-[#F2A619]"
                                                    value={formData.tempUrlInput || ''}
                                                    onChange={e => setFormData({ ...formData, tempUrlInput: e.target.value })}
                                                />
                                                <button onClick={handleAddUrlImage} className="bg-white/10 hover:bg-white/20 text-white px-4 rounded-xl font-bold text-xs">EKLE</button>
                                            </div>
                                        )}

                                        {/* Preview Gallery */}
                                        <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                                            {(formData.images || (formData.image ? [formData.image] : [])).map((img: string, i: number) => (
                                                <div key={i} className="relative w-20 h-20 flex-shrink-0 group rounded-xl overflow-hidden border border-white/10">
                                                    {img.includes('mp4') || img.includes('webm') ? (
                                                        <video src={img} className="w-full h-full object-cover" muted />
                                                    ) : (
                                                        <img src={img} className="w-full h-full object-cover" />
                                                    )}
                                                    <button onClick={() => handleRemoveImage(img)} className="absolute top-1 right-1 bg-red-500 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3 text-white" /></button>
                                                    {formData.image === img && <div className="absolute bottom-0 left-0 right-0 bg-[#F2A619] text-black text-[8px] font-bold text-center py-0.5">ANA</div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-6 border-t border-white/10 flex justify-end gap-3 sticky bottom-0 bg-[#1A1A17]">
                                    <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-white/10 text-gray-400 hover:text-white">İPTAL</Button>
                                    <Button onClick={handleSave} className="bg-[#F2A619] text-black hover:bg-white shadow-lg shadow-[#F2A619]/20">{isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />} {isSaving ? 'KAYDEDİLİYOR...' : 'KAYDET'}</Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
