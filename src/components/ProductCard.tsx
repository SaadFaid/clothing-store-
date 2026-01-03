import { useState, useEffect } from 'react';
import { Product } from '../lib/supabase';
import { formatCurrency } from '../lib/currency';
import { Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

type ProductCardProps = {
  product: Product;
  onNavigate: (page: string, productId?: string) => void;
};

export function ProductCard({ product, onNavigate }: ProductCardProps) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  const discount = product.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  useEffect(() => {
    if (user) {
      checkIfFavorite();
    }
  }, [user, product.id]);

  const checkIfFavorite = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .single();

      setIsFavorite(!!data);
    } catch (error) {

    }
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onNavigate('login');
      return;
    }

    setLoading(true);
    try {
      if (isFavorite) {
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id);
        setIsFavorite(false);
      } else {
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            product_id: product.id
          });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`group cursor-pointer ${isFavorite ? 'bg-pink-50 dark:bg-pink-900/20 border-2 border-pink-200 dark:border-pink-700' : ''}`} onClick={() => onNavigate('product', product.id)}>
      <div className={`relative aspect-[3/4] product-image mb-3 ${isFavorite ? 'ring-2 ring-pink-300 dark:ring-pink-600' : ''}`}>
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
            No Image
          </div>
        )}
        {discount > 0 && (
          <div className="absolute top-2 left-2 bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded">
            -{discount}%
          </div>
        )}
        <button
          onClick={(e) => toggleFavorite(e)}
          className="absolute top-2 right-2 icon-btn bg-white dark:bg-gray-800 shadow-md"
          aria-label="Add to wishlist"
          disabled={loading}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'text-pink-600 fill-pink-600' : 'text-gray-600 dark:text-gray-400'}`} />
        </button>
      </div>
      <div>
        <h3 className="product-title text-sm font-medium mb-1 line-clamp-2 group-hover:text-rose-600 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(product.price)}</span>
          {product.compare_at_price && (
            <span className="text-sm line-through text-gray-500 dark:text-gray-400">
              {formatCurrency(product.compare_at_price)}
            </span>
          )}
        </div>
        {product.colors && product.colors.length > 0 && (
          <div className="flex gap-1 mt-2">
            {product.colors.slice(0, 5).map((color, index) => (
              <div
                key={index}
                className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
