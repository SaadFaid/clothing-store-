import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Product } from '../lib/supabase';
import { ProductCard } from '../components/ProductCard';

export function FavoritesPage() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('favorites')
        .select(`
          product_id,
          products (*)
        `)
        .eq('user_id', user.id);

      const products = data?.map((item: any) => item.products).filter(Boolean) as Product[] || [];
      setFavorites(products);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (page: string, productId?: string) => {
    if (productId) {
      window.location.hash = `#${page}/${productId}`;
    } else {
      window.location.hash = `#${page}`;
    }
    window.scrollTo(0, 0);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-luxury-black flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">❤️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Sign in to view favorites</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Create an account or sign in to save and manage your favorite products.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => handleNavigate('register')}
              className="w-full bg-rose-600 text-white py-3 px-4 rounded-md hover:bg-rose-700 transition-colors"
            >
              Create Account
            </button>
            <button
              onClick={() => handleNavigate('login')}
              className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-luxury-black flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading favorites...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">My Favorites</h1>

        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">❤️</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No favorites yet</h2>
            <p className="text-gray-600 dark:text-gray-300">Start browsing and add products to your favorites!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {favorites.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
