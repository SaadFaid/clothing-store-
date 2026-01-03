import { useState } from 'react';
import { supabase, Product } from '../lib/supabase';
import { ProductCard } from '../components/ProductCard';
import { Search } from 'lucide-react';

type SearchPageProps = {
  onNavigate: (page: string, productId?: string) => void;
};

export function SearchPage({ onNavigate }: SearchPageProps) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .ilike('name', `%${query}%`);

      setProducts(data || []);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* PAGE TITLE */}
        <div className="max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Search Products
          </h1>

          {/* SEARCH BAR */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for products..."
              className="
                flex-1 px-4 py-3 border rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-gray-900 
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:border-gray-700
              "
            />
            <button
              type="submit"
              className="
                px-6 py-3 bg-gray-900 text-white rounded-lg flex items-center gap-2
                hover:bg-gray-800 transition-colors
                dark:bg-gray-700 dark:hover:bg-gray-600
              "
            >
              <Search className="w-5 h-5" />
              Search
            </button>
          </form>
        </div>

        {/* SEARCH RESULTS */}
        {loading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Searching...
          </div>
        ) : searched ? (
          products.length > 0 ? (
            <div>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Found {products.length} products
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600 dark:text-gray-300">
                No products found for "{query}"
              </p>
              <button
                onClick={() => onNavigate('products')}
                className="mt-4 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 font-medium"
              >
                Browse all products
              </button>
            </div>
          )
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Enter a search term to find products
          </div>
        )}
      </div>
    </div>
  );
}
