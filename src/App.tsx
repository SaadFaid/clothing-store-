import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { StripeProvider } from './contexts/StripeContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { OrdersPage } from './pages/OrdersPage';
import { SearchPage } from './pages/SearchPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminProducts } from './pages/admin/AdminProducts';
import { AdminOrders } from './pages/admin/AdminOrders';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminArchive } from './pages/admin/AdminArchive';
import { ContactUsPage } from './pages/ContactUsPage';
import { MailboxPage } from './pages/MailboxPage';
import { ShippingInfoPage } from './pages/ShippingInfoPage';
import { ReturnsPage } from './pages/ReturnsPage';
import { FAQPage } from './pages/FAQPage';
import { supabase } from './lib/supabase';
import { AdminMessages } from './pages/admin/AdminMessages';
import { FavoritesPage } from './pages/FavoritesPage';
import { BestSellersPage } from './pages/BestSellersPage';
import { SalesPage } from './pages/SalesPage';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [cartItemCount, setCartItemCount] = useState(0);

  // Hash-based routing state (reactive to manual changes)
  const parseHash = () => {
    const hash = window.location.hash.slice(1) || 'home';
    const [page, ...params] = hash.split('/');
    return { page: page || 'home', productId: params[0] || '' };
  };

  const initial = parseHash();
  const [currentPage, setCurrentPage] = useState<string>(initial.page);
  const [selectedProductId, setSelectedProductId] = useState<string>(initial.productId);

  useEffect(() => {
    const onHashChange = () => {
      const { page, productId } = parseHash();
      setCurrentPage(page);
      setSelectedProductId(productId);
    };

    // ensure state matches URL on mount
    onHashChange();
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (user) {
      fetchCartCount();
    } else {
      setCartItemCount(0);
    }
  }, [user]);

  const fetchCartCount = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('user_id', user.id);

      const total = data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      setCartItemCount(total);
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  const handleNavigate = (page: string, productId?: string) => {
    if (productId) {
      window.location.hash = `#${page}/${productId}`;
      setCurrentPage(page);
      setSelectedProductId(productId);
    } else {
      window.location.hash = `#${page}`;
      setCurrentPage(page);
      setSelectedProductId('');
    }
    window.scrollTo(0, 0);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'products':
        return <ProductsPage onNavigate={handleNavigate} />;
      case 'product':
        return <ProductDetailPage productId={selectedProductId} onNavigate={handleNavigate} />;
      case 'cart':
        return <CartPage onNavigate={handleNavigate} onCartUpdate={fetchCartCount} />;
      case 'checkout':
        return <CheckoutPage onNavigate={handleNavigate} />;
      case 'login':
        return <LoginPage onNavigate={handleNavigate} />;
      case 'register':
        return <RegisterPage onNavigate={handleNavigate} />;
      case 'profile':
        return <ProfilePage />;
      case 'orders':
        return <OrdersPage />;
      case 'search':
        return <SearchPage onNavigate={handleNavigate} />;
      case 'admin':
        return <AdminDashboard onNavigate={handleNavigate} />;
      case 'admin-products':
        return <AdminProducts />;
      case 'admin-orders':
        return <AdminOrders />;
      case 'admin-users':
        return <AdminUsers />;
      case 'admin-archive':
        return <AdminArchive />;
      case 'admin-messages':
        return <AdminMessages />;
      case 'mailbox':
        return <MailboxPage />;
      case 'favorites':
        return <FavoritesPage />;
      case 'best-sellers':
        return <BestSellersPage />;
      case 'sales':
        return <SalesPage />;
      case 'contact-us':
        return <ContactUsPage />;
      case 'shipping-info':
        return <ShippingInfoPage />;
      case 'returns':
        return <ReturnsPage />;
      case 'faq':
        return <FAQPage />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar onNavigate={handleNavigate} currentPage={currentPage} cartItemCount={cartItemCount} />
      <main className="flex-1">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <StripeProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </StripeProvider>
  );
}

export default App;
