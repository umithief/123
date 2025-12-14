
import React, { useState, useEffect, useRef } from 'react';
import { Product, CartItem, ProductCategory, User, AuthMode, Route as RouteType, ViewState, ColorTheme } from './types';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { CartDrawer } from './components/layout/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { PaymentModal } from './components/PaymentModal';
import { UserProfile } from './components/UserProfile';
import { PublicProfile } from './components/PublicProfile';
import { About } from './components/About';
import { Forum } from './components/Forum';
import { AdminPanel } from './components/AdminPanel';
import { ProductQuickViewModal } from './components/ProductQuickViewModal';
import { ToastType, ToastContainer, ToastMessage } from './components/toast';
import { RideMode } from './components/RideMode';
import { MotoTool } from './components/MotoTool';
import { RouteExplorer } from './components/RouteExplorer';
import { MotoMeetup } from './components/MotoMeetup';
import { FlyToCart } from './components/FlyToCart';
import { Blog } from './components/Blog';
import { ServiceFinder } from './components/ServiceFinder';
import { IntroAnimation } from './components/IntroAnimation';
import { OnboardingTour } from './components/OnboardingTour';
import { CompareBar } from './components/CompareBar';
import { CompareModal } from './components/CompareModal';
import { ScrollProgress } from './components/ScrollProgress';
import { ProModal } from './components/ProModal';
import { FeedbackModal } from './components/FeedbackModal';
import { MotoValuation } from './components/MotoValuation';
import { ThemeModal } from './components/ThemeModal';
import { HelmetQRGenerator } from './components/HelmetQRGenerator';
import { MotoVlogMap } from './components/MotoVlogMap';
import { LifeSaver } from './components/LifeSaver';
import { LivingBackground } from './components/LivingBackground';
import { RidersDirectory } from './components/RidersDirectory';
import { authService } from './services/auth';
import { orderService } from './services/orderService';
import { productService } from './services/productService';
import { statsService } from './services/statsService';
import { tourService } from './services/tourService';
import { recordingService } from './services/recordingService';
import { notify } from './services/notificationService';
import { gamificationService } from './services/gamificationService';
import { useAppSounds } from './hooks/useAppSounds';
import { ArrowUp, Zap, Instagram, Twitter, Youtube, Facebook, MapPin, Phone, Mail } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLivingTime } from './hooks/useLivingTime';

// Import Components
import { Home } from './components/Home';
import { Shop } from './components/Shop';
import { Favorites } from './components/Favorites';
import { AIAssistantPage } from './components/AIAssistantPage';
import { ProductDetail } from './components/ProductDetail';

export const App: React.FC = () => {
    const [view, setView] = useState<ViewState>('home');
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [initialShopCategory, setInitialShopCategory] = useState<ProductCategory | 'ALL'>('ALL');

    const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
    const [compareList, setCompareList] = useState<Product[]>([]);
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

    const [showScrollTop, setShowScrollTop] = useState(false);

    const [bootState, setBootState] = useState<'idle' | 'complete'>('idle');
    const [showTour, setShowTour] = useState(false);

    const [user, setUser] = useState<User | null>(null);
    const [viewingUser, setViewingUser] = useState<User | null>(null);

    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState<AuthMode>('login');
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isProModalOpen, setIsProModalOpen] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
    const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
    const [activeRoute, setActiveRoute] = useState<RouteType | null>(null);

    const [flyingItems, setFlyingItems] = useState<Array<{ id: number; image: string; startRect: any; targetRect: any }>>([]);

    // Fixed Light Mode
    useEffect(() => {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
    }, []);

    const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
        const saved = localStorage.getItem('mv_color_theme');
        return (saved as ColorTheme) || 'orange';
    });

    const [animKey, setAnimKey] = useState(0);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const sessionStartTime = useRef(Date.now());
    const userRef = useRef<User | null>(null);

    const { playSuccess, playClick } = useAppSounds();

    useEffect(() => { userRef.current = user; }, [user]);

    useEffect(() => {
        const root = window.document.documentElement;
        root.setAttribute('data-theme', colorTheme);
        localStorage.setItem('mv_color_theme', colorTheme);
    }, [colorTheme]);

    useEffect(() => {
        const handleAnimChange = () => setAnimKey(prev => prev + 1);
        window.addEventListener('anim-settings-changed', handleAnimChange);

        const handlePointsUpdate = async () => {
            const freshUser = await authService.getCurrentUser();
            if (freshUser) setUser(freshUser);
        };
        window.addEventListener('user-points-updated', handlePointsUpdate);

        // Toast Event Listener
        const handleToastEvent = (e: any) => {
            const { type, message } = e.detail;
            addToast(type, message);
        };
        window.addEventListener('show-toast', handleToastEvent);

        // Listener for external navigation (e.g. from Navbar popover)
        const handleViewUserProfile = (e: CustomEvent) => {
            handleViewProfile(e.detail);
        };
        window.addEventListener('view-user-profile' as any, handleViewUserProfile);

        recordingService.start();

        return () => {
            window.removeEventListener('anim-settings-changed', handleAnimChange);
            window.removeEventListener('user-points-updated', handlePointsUpdate);
            window.removeEventListener('show-toast', handleToastEvent);
            window.removeEventListener('view-user-profile' as any, handleViewUserProfile);
            recordingService.stop();
        };
    }, []);

    const addToast = (type: ToastType, message: string) => {
        const newToast: ToastMessage = { id: Date.now(), type, message };
        setToasts(prev => [...prev.slice(-3), newToast]);
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    useEffect(() => {
        const checkBoot = async () => {
            const hasBooted = sessionStorage.getItem('mv_intro_seen_v2');

            const initData = async () => {
                try {
                    statsService.recordVisit();
                    const sessionUser = await authService.getCurrentUser();
                    if (sessionUser) {
                        setUser(sessionUser);
                        gamificationService.checkDailyLogin(sessionUser);
                    }
                    const loadedProducts = await productService.getProducts();
                    setProducts(loadedProducts);
                    const savedFavs = localStorage.getItem('mv_favorites');
                    if (savedFavs) setFavoriteIds(JSON.parse(savedFavs));
                } catch (e) { console.error(e); }
            };
            initData();

            if (hasBooted) {
                setBootState('complete');
                if (!tourService.hasSeenTour()) {
                    setTimeout(() => setShowTour(true), 1000);
                }
            }
        };
        checkBoot();

        const trackSession = () => {
            const duration = Math.round((Date.now() - sessionStartTime.current) / 1000);
            if (duration > 0) statsService.trackEvent('session_duration', { duration, userId: userRef.current?.id });
            recordingService.stop();
        };
        const handleScroll = () => setShowScrollTop(window.scrollY > 400);

        window.addEventListener('beforeunload', trackSession);
        window.addEventListener('scroll', handleScroll);
        return () => { window.removeEventListener('beforeunload', trackSession); window.removeEventListener('scroll', handleScroll); trackSession(); };
    }, []);

    const handleIntroComplete = () => {
        setBootState('complete');
        sessionStorage.setItem('mv_intro_seen_v2', 'true');
        if (!tourService.hasSeenTour()) {
            setTimeout(() => setShowTour(true), 1000);
        }
    };

    const handleTourComplete = () => {
        setShowTour(false);
        tourService.completeTour();
    };

    useEffect(() => {
        productService.getProducts().then(setProducts);
    }, [view]);

    const navigateTo = (newView: ViewState, data?: any) => {
        if (newView === 'shop' && data) {
            setInitialShopCategory(data);
        } else {
            setInitialShopCategory('ALL');
        }

        if (newView === 'product-detail' && data) {
            setSelectedProduct(data);
        }

        setView(newView);
        setIsMobileMenuOpen(false);
    };

    const addToCart = (product: Product, event?: React.MouseEvent) => {
        playSuccess();

        if (event) {
            const img = document.createElement('img');
            img.src = product.image;
            const startRect = (event.target as HTMLElement).closest('.group')?.querySelector('img')?.getBoundingClientRect();
            const cartIcon = document.getElementById('tour-cart');
            const targetRect = cartIcon?.getBoundingClientRect();

            if (startRect && targetRect) {
                setFlyingItems(prev => [...prev, { id: Date.now(), image: product.image, startRect, targetRect }]);
            }
        }

        setCartItems(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1 }];
        });

        statsService.trackEvent('add_to_cart', { productId: product.id, productName: product.name, userId: user?.id });
        addToast('success', 'Ürün sepete eklendi');
    };

    const updateQuantity = (id: number, delta: number) => {
        setCartItems(prev => prev.map(item => {
            if (item.id === id) {
                const newQuantity = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQuantity };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const toggleFavorite = (product: Product) => {
        setFavoriteIds(prev => {
            const newIds = prev.includes(product.id) ? prev.filter(id => id !== product.id) : [...prev, product.id];
            localStorage.setItem('mv_favorites', JSON.stringify(newIds));
            return newIds;
        });
        addToast('info', favoriteIds.includes(product.id) ? 'Favorilerden çıkarıldı' : 'Favorilere eklendi');
    };

    const toggleCompare = (product: Product) => {
        setCompareList(prev => {
            const exists = prev.find(p => p.id === product.id);
            if (exists) {
                return prev.filter(p => p.id !== product.id);
            } else {
                if (prev.length >= 3) {
                    addToast('info', 'En fazla 3 ürün karşılaştırabilirsiniz.');
                    return prev;
                }
                return [...prev, product];
            }
        });
    };

    const handleCheckout = async () => {
        if (!user) {
            setIsCartOpen(false);
            setAuthMode('login');
            setIsAuthOpen(true);
            return;
        }
        setIsCartOpen(false);
        setIsPaymentOpen(true);
        statsService.trackEvent('checkout_start', { userId: user.id });
    };

    const handlePaymentComplete = async () => {
        let total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (user?.rank === 'Yol Kaptanı') {
            total = total * 0.95;
        }

        await orderService.createOrder(user!, cartItems, total);
        setCartItems([]);
        setIsPaymentOpen(false);
        playSuccess();
        addToast('success', 'Siparişiniz başarıyla alındı!');
        navigateTo('profile');
    };

    const handleStartRide = (route: RouteType | null) => {
        setActiveRoute(route);
        navigateTo('ride-mode');
    };

    const handleViewProfile = async (userId: string) => {
        if (user && user.id === userId) {
            navigateTo('profile');
            return;
        }

        const targetUser = await authService.getUserById(userId);
        if (targetUser) {
            setViewingUser(targetUser);
            navigateTo('public-profile');
        } else {
            notify.error('Kullanıcı bulunamadı.');
        }
    };

    const renderView = () => {
        switch (view) {
            case 'home': return <Home products={products} onAddToCart={addToCart} onProductClick={(p) => navigateTo('product-detail', p)} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} onQuickView={setQuickViewProduct} onCompare={toggleCompare} compareList={compareList} onNavigate={navigateTo} onToggleMenu={() => setIsMobileMenuOpen(true)} />;
            case 'shop': return <Shop products={products} onAddToCart={addToCart} onProductClick={(p) => navigateTo('product-detail', p)} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} onQuickView={setQuickViewProduct} onCompare={toggleCompare} compareList={compareList} onNavigate={navigateTo} initialCategory={initialShopCategory} />;
            case 'product-detail': return <ProductDetail product={selectedProduct} allProducts={products} onAddToCart={addToCart} onNavigate={navigateTo} onProductClick={(p) => navigateTo('product-detail', p)} onCompare={toggleCompare} isCompared={compareList.some(p => p.id === selectedProduct?.id)} />;
            case 'favorites': return <Favorites products={products} favoriteIds={favoriteIds} onAddToCart={addToCart} onProductClick={(p) => navigateTo('product-detail', p)} onToggleFavorite={toggleFavorite} onQuickView={setQuickViewProduct} onNavigate={navigateTo} />;
            case 'routes': return <RouteExplorer user={user} onOpenAuth={() => setIsAuthOpen(true)} onStartRide={handleStartRide} />;
            case 'meetup': return <MotoMeetup user={user} onOpenAuth={() => setIsAuthOpen(true)} onNavigate={navigateTo} />;
            case 'service-finder': return <ServiceFinder onNavigate={navigateTo} />;
            case 'ride-mode': return <RideMode route={activeRoute} onNavigate={navigateTo} />;
            case 'mototool': return <MotoTool onNavigate={navigateTo} />;
            case 'valuation': return <MotoValuation onNavigate={navigateTo} />;
            case 'qr-generator': return <HelmetQRGenerator onNavigate={navigateTo} />;
            case 'vlog-map': return <MotoVlogMap onNavigate={navigateTo} onAddToCart={addToCart} onProductClick={(p) => navigateTo('product-detail', p)} />;
            case 'lifesaver': return <LifeSaver onClose={() => navigateTo('home')} />;
            case 'profile': return user ? <UserProfile user={user} onLogout={() => { authService.logout(); setUser(null); navigateTo('home'); }} onUpdateUser={setUser} onNavigate={navigateTo} colorTheme={colorTheme} onColorChange={setColorTheme} /> : <div className="pt-32 text-center text-gray-500">Lütfen giriş yapın.</div>;
            case 'public-profile': return viewingUser ? <PublicProfile user={viewingUser} onBack={() => navigateTo('riders')} currentUserId={user?.id} /> : <div className="pt-32 text-center text-gray-500">Kullanıcı yüklenemedi.</div>;
            case 'admin': return user?.isAdmin ? <AdminPanel onLogout={() => { authService.logout(); setUser(null); navigateTo('home'); }} onShowToast={addToast} onNavigate={navigateTo} /> : <div className="pt-32 text-center text-gray-500">Yetkisiz erişim.</div>;
            case 'blog': return <Blog onNavigate={navigateTo} />;
            case 'about': return <About onNavigate={navigateTo} />;
            case 'ai-assistant': return <AIAssistantPage />;
            case 'forum': return <Forum user={user} onOpenAuth={() => setIsAuthOpen(true)} onViewProfile={handleViewProfile} onOpenPro={() => setIsProModalOpen(true)} />;
            case 'riders': return <RidersDirectory onViewProfile={handleViewProfile} onNavigate={navigateTo} />;
            default: return <Home products={products} onAddToCart={addToCart} onProductClick={(p) => navigateTo('product-detail', p)} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} onQuickView={setQuickViewProduct} onCompare={toggleCompare} compareList={compareList} onNavigate={navigateTo} onToggleMenu={() => setIsMobileMenuOpen(true)} />;
        }
    };

    if (bootState === 'idle') {
        return <IntroAnimation onComplete={handleIntroComplete} />;
    }

    const isFullScreenMode = view === 'ride-mode' || view === 'mototool' || view === 'admin' || view === 'meetup' || view === 'valuation' || view === 'qr-generator' || view === 'vlog-map' || view === 'lifesaver';

    return (
        <div key={animKey} className={`flex flex-col min-h-[100dvh] bg-[#f9fafb] text-gray-900 transition-colors duration-1000 ${isFullScreenMode ? 'overflow-hidden h-screen bg-black text-white' : ''}`}>

            <div className="bg-noise opacity-5"></div>

            {!isFullScreenMode && <LivingBackground />}

            {!isFullScreenMode && <ScrollProgress />}

            {/* Global Toast Container */}
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            <AnimatePresence>
                {flyingItems.map(item => (
                    <FlyToCart
                        key={item.id}
                        image={item.image}
                        startRect={item.startRect}
                        targetRect={item.targetRect}
                        onComplete={() => setFlyingItems(prev => prev.filter(i => i.id !== item.id))}
                    />
                ))}

                {showTour && <OnboardingTour onComplete={handleTourComplete} />}
            </AnimatePresence>

            <AuthModal
                isOpen={isAuthOpen}
                onClose={() => setIsAuthOpen(false)}
                initialMode={authMode}
                onLogin={(u) => { setUser(u); setIsAuthOpen(false); addToast('success', `Hoş geldin, ${u.name}`); }}
            />

            <CartDrawer
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                items={cartItems}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={(id) => setCartItems(prev => prev.filter(item => item.id !== id))}
                onCheckout={handleCheckout}
                user={user}
            />

            <PaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                totalAmount={cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * (user?.rank === 'Yol Kaptanı' ? 0.95 : 1)}
                items={cartItems}
                user={user}
                onPaymentComplete={handlePaymentComplete}
            />

            <ThemeModal
                isOpen={isThemeModalOpen}
                onClose={() => setIsThemeModalOpen(false)}
                currentTheme={colorTheme}
                onThemeChange={setColorTheme}
            />

            {!isFullScreenMode && (
                <>
                    <Navbar
                        cartCount={cartItems.reduce((a, b) => a + b.quantity, 0)}
                        favoritesCount={favoriteIds.length}
                        onCartClick={() => setIsCartOpen(true)}
                        onFavoritesClick={() => navigateTo('favorites')}
                        onSearch={() => navigateTo('shop')}
                        user={user}
                        onOpenAuth={() => setIsAuthOpen(true)}
                        onLogout={() => { authService.logout(); setUser(null); }}
                        onNavigate={navigateTo}
                        currentView={view}
                        colorTheme={colorTheme}
                        onColorChange={setColorTheme}
                        onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    />
                    <BottomNav
                        currentView={view}
                        onNavigate={navigateTo}
                        cartCount={cartItems.reduce((a, b) => a + b.quantity, 0)}
                        isOpen={isMobileMenuOpen}
                        onClose={() => setIsMobileMenuOpen(false)}
                        user={user}
                        onOpenAuth={() => setIsAuthOpen(true)}
                        onOpenFeedback={() => setIsFeedbackOpen(true)}
                        onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        onOpenThemeModal={() => setIsThemeModalOpen(true)}
                    />
                </>
            )}

            {/* Main Content */}
            <main className={`relative w-full flex-1 z-10 transition-all duration-300 ${isFullScreenMode ? 'h-full' : 'pb-20 md:pb-0'}`}>
                <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
                    <motion.div
                        key={view}
                        initial={{ opacity: 0, filter: 'blur(10px)', scale: 0.98 }}
                        animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                        exit={{ opacity: 0, filter: 'blur(10px)', scale: 1.02 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="w-full h-full"
                    >
                        {renderView()}
                    </motion.div>
                </AnimatePresence>
            </main>

            <AnimatePresence>
                {compareList.length > 0 && (
                    <CompareBar
                        items={compareList}
                        onRemove={(id) => setCompareList(prev => prev.filter(p => p.id !== id))}
                        onCompare={() => setIsCompareModalOpen(true)}
                        onClear={() => setCompareList([])}
                    />
                )}
            </AnimatePresence>

            <CompareModal
                isOpen={isCompareModalOpen}
                onClose={() => setIsCompareModalOpen(false)}
                products={compareList}
                onAddToCart={addToCart}
            />

            <FeedbackModal
                isOpen={isFeedbackOpen}
                onClose={() => setIsFeedbackOpen(false)}
                user={user}
            />

            <ProductQuickViewModal
                isOpen={!!quickViewProduct}
                onClose={() => setQuickViewProduct(null)}
                product={quickViewProduct}
                onAddToCart={(p, e) => { addToCart(p, e); setQuickViewProduct(null); }}
                onViewDetail={(p) => { navigateTo('product-detail', p); setQuickViewProduct(null); }}
            />

            {!isFullScreenMode && (
                <footer className="bg-white text-gray-900 pt-20 pb-24 md:pb-10 border-t border-gray-200 relative overflow-hidden z-10">
                    <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">

                            <div className="space-y-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-moto-accent rounded-xl flex items-center justify-center shadow-lg shadow-moto-accent/20 text-white">
                                        <Zap className="w-6 h-6 fill-current" />
                                    </div>
                                    <span className="text-2xl font-display font-bold tracking-tighter text-gray-900">
                                        MOTO<span className="text-moto-accent">VIBE</span>
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                                    Geleceğin sürüş deneyimini tasarlıyoruz. Yapay zeka destekli ekipman seçimi ve premium motosiklet kültürü.
                                </p>
                                <div className="flex gap-4 pt-2">
                                    {[
                                        { icon: Instagram, href: "#" },
                                        { icon: Twitter, href: "#" },
                                        { icon: Youtube, href: "#" },
                                        { icon: Facebook, href: "#" }
                                    ].map((social, idx) => (
                                        <a
                                            key={idx}
                                            href={social.href}
                                            className="group relative w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 border border-gray-200 hover:border-moto-accent hover:bg-moto-accent transition-all duration-300 hover:-translate-y-1"
                                        >
                                            <social.icon className="w-5 h-5 text-gray-500 group-hover:text-white relative z-10 transition-colors" />
                                        </a>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-bold mb-6 flex items-center gap-2 text-gray-900">
                                    <span className="w-1 h-4 bg-moto-accent rounded-full"></span>
                                    HIZLI ERİŞİM
                                </h4>
                                <ul className="space-y-3 text-sm text-gray-500">
                                    {['Koleksiyon', 'Rotalar', 'Etkinlikler', 'Blog', 'Hakkımızda', 'İletişim'].map((item) => (
                                        <li key={item}>
                                            <button
                                                onClick={() => navigateTo(
                                                    item === 'Koleksiyon' ? 'shop' :
                                                        item === 'Rotalar' ? 'routes' :
                                                            item === 'Etkinlikler' ? 'meetup' :
                                                                item === 'Blog' ? 'blog' :
                                                                    item === 'Hakkımızda' ? 'about' : 'home'
                                                )}
                                                className="hover:text-moto-accent hover:translate-x-1 transition-all duration-200 flex items-center gap-2"
                                            >
                                                <div className="w-1 h-1 bg-gray-300 rounded-full"></div> {item}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-bold mb-6 flex items-center gap-2 text-gray-900">
                                    <span className="w-1 h-4 bg-moto-accent rounded-full"></span>
                                    İLETİŞİM
                                </h4>
                                <ul className="space-y-4 text-sm text-gray-500">
                                    <li className="flex items-start gap-3">
                                        <MapPin className="w-5 h-5 text-moto-accent shrink-0" />
                                        <span>Maslak, Büyükdere Cd. No:123<br />34398 Sarıyer/İstanbul</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <Phone className="w-5 h-5 text-moto-accent shrink-0" />
                                        <span>+90 (212) 555 01 23</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <Mail className="w-5 h-5 text-moto-accent shrink-0" />
                                        <span>hello@motovibe.com</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400 font-mono">
                            <p>© 2024 MotoVibe Inc. All rights reserved.</p>
                            <div className="flex gap-6">
                                <a href="#" className="hover:text-moto-accent transition-colors">Gizlilik</a>
                                <a href="#" className="hover:text-moto-accent transition-colors">Şartlar</a>
                                <a href="#" className="hover:text-moto-accent transition-colors">KVKK</a>
                            </div>
                        </div>
                    </div>
                </footer>
            )}

            {showScrollTop && (
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-24 md:bottom-6 right-6 bg-moto-accent text-white p-3 rounded-full shadow-lg z-40 hover:bg-black transition-colors animate-in fade-in slide-in-from-bottom-4 hidden md:flex">
                    <ArrowUp className="w-6 h-6" />
                </button>
            )}
        </div>
    );
};
