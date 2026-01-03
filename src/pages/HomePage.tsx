import { useEffect, useState } from 'react';
import { supabase, Product } from '../lib/supabase';
import { ProductCard } from '../components/ProductCard';
import { ChevronRight } from 'lucide-react';

type HomePageProps = {
  onNavigate: (page: string, productId?: string) => void;
};

export function HomePage({ onNavigate }: HomePageProps) {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data: featured } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('featured', true)
        .limit(4);

      const { data: latest } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(8);

      setFeaturedProducts(featured || []);
      setNewArrivals(latest || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">

      {/* HERO SECTION */}
      <div
        className="relative bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45)), url('/hero.jpg')"
        }}
      >
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-4">
              New Season, New Style
            </h1>
            <p className="text-xl text-white mb-8">
              Discover the latest trends in fashion
            </p>
            <button
              onClick={() => onNavigate('products')}
              className="inline-flex items-center gap-1 btn btn-primary px-8 py-3"
            >
              Shop Now
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* FEATURED PRODUCTS */}
      {featuredProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Featured Products
            </h2>
            <button
              onClick={() => onNavigate('products')}
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      )}

      {/* NEW ARRIVALS */}
      {newArrivals.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              New Arrivals
            </h2>
            <button
              onClick={() => onNavigate('products')}
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white flex items-center gap-1"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center text-gray-500 dark:text-gray-400">
            Loading products...
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && featuredProducts.length === 0 && newArrivals.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center text-gray-500 dark:text-gray-400">
            No products available. Please check back later!
          </div>
        </div>
      )}

      {/* FOOTER FEATURES */}
      <div className="bg-neutral-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="text-2xl font-bold mb-2 text-white/90">Free Shipping</h3>
              <p className="text-white/90">On orders over $50</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2 text-white/90">Easy Returns</h3>
              <p className="text-white/90 text-white/90">30-day return policy</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2 text-white/90">Secure Payment</h3>
              <p className="text-white/90">100% secure transactions</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
