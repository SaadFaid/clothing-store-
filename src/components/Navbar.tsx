import { ShoppingCart, User, Search, Menu, X, Mail, Heart, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import logo from '../../public/logo.png';

type NavbarProps = {
  onNavigate: (page: string) => void;
  currentPage: string;
  cartItemCount: number;
};

export function Navbar({ onNavigate, currentPage, cartItemCount }: NavbarProps) {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mailboxCount, setMailboxCount] = useState(0);
  const [hasFavorites, setHasFavorites] = useState(false);

  useEffect(() => {
    if (!profile) return;

    fetchMailboxCount();
    fetchHasFavorites();

    const channel = supabase
      .channel('messages_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => fetchMailboxCount())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => fetchMailboxCount())
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [profile?.id, profile?.role]);

  const fetchMailboxCount = async () => {
    try {
      if (!profile) return;

      let count = 0;

      if (profile.role === 'admin' || profile.role === 'owner') {
        const { count: c } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('is_read', false)
          .eq('sender_role', 'user');
        count = c || 0;
      } else {
        const { data, error } = await supabase
          .from('messages')
          .select('id')
          .eq('is_read', false)
          .in('sender_role', ['admin', 'owner']);

        if (!error && data) count = data.length;
      }

      setMailboxCount(count);
    } catch (error) {
      console.error('Error fetching mailbox count:', error);
    }
  };

  const fetchHasFavorites = async () => {
    try {
      if (!profile) return;
      const { count } = await supabase
        .from('favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id);
      setHasFavorites((count || 0) > 0);
    } catch (error) {
      console.error('Error fetching favorites count:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onNavigate('home');
    setUserMenuOpen(false);
  };

  return (
    <nav className="site-header sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
   {/* Logo */}
<button
  onClick={() => onNavigate('home')}
  className="text-2xl font-bold transition-colors"
>
  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm">
    <img
      src={logo}
      alt="Fashion Shop Logo"
      className="h-84 w-auto object-contain" // logo image 3x bigger
    />
  </div>
</button>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center justify-center gap-6 flex-1">
              <button
                onClick={() => onNavigate('home')}
                className={`text-sm font-medium nav-link ${currentPage === 'home' ? 'active' : ''}`}
              >
                New Arrivals
              </button>
              <button
                onClick={() => onNavigate('products')}
                className={`text-sm font-medium nav-link ${currentPage === 'products' ? 'active' : ''}`}
              >
                Shop All
              </button>
              <button
                onClick={() => onNavigate('contact-us')}
                className={`text-sm font-medium nav-link ${currentPage === 'contact-us' ? 'active' : ''}`}
              >
                Contact Us
              </button>
              {isAdmin && (
                <div className="relative">
                  <button
                    onClick={() => onNavigate('admin')}
                    className={`text-sm font-medium transition-colors ${
                      currentPage === 'admin' ? 'text-rose-600' : 'text-rose-500 hover:text-rose-600'
                    }`}
                  >
                    Admin
                  </button>
                  {mailboxCount > 0 && (
                    <span className="absolute -top-2 -right-3 bg-rose-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {mailboxCount}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Side Icons */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="icon-btn"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              ) : (
                <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              )}
            </button>

            <button
              onClick={() => onNavigate('search')}
              className="icon-btn"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>

            {user && (
              <button
                onClick={() => onNavigate('mailbox')}
                className="icon-btn relative"
                aria-label="Mailbox"
              >
                <Mail className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                {mailboxCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {mailboxCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => onNavigate('cart')}
              className="icon-btn relative"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('favorites')}
              className="icon-btn relative"
              aria-label="Favorites"
            >
              <Heart className={`w-5 h-5 ${hasFavorites ? 'text-pink-500 fill-pink-500' : 'text-gray-700 dark:text-gray-300'}`} />
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="icon-btn"
                aria-label="User menu"
              >
                <User className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-gray-200">
                  {user ? (
                    <>
                      <button
                        onClick={() => { onNavigate('profile'); setUserMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        My Profile
                      </button>
                      <button
                        onClick={() => { onNavigate('orders'); setUserMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        My Orders
                      </button>
                      <hr className="my-2" />
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { onNavigate('login'); setUserMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => { onNavigate('register'); setUserMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Create Account
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden icon-btn"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3 space-y-2">
            <button onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              New Arrivals
            </button>
            <button onClick={() => { onNavigate('products'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Shop All
            </button>
            <button onClick={() => { onNavigate('contact-us'); setMobileMenuOpen(false); }} className="block w-full text-left py-2 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Contact Us
            </button>

            {isAdmin && (
              <button
                onClick={() => { onNavigate('admin'); setMobileMenuOpen(false); }}
                className="block w-full text-left py-2 text-sm font-medium text-rose-600"
              >
                Admin Dashboard
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
