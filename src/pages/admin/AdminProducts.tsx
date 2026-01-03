import { useEffect, useState } from 'react';
import { supabase, Product, Category } from '../../lib/supabase';
import { formatCurrency } from '../../lib/currency';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { DetailsModal } from '../../components/DetailsModal';
import Swal from 'sweetalert2';

export function AdminProducts() {
  const { isAdmin } = useAuth();
  const { theme } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [selectedCategoryToDelete, setSelectedCategoryToDelete] = useState<string>('');
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    description: string;
    price: string;
    compare_at_price: string;
    category_id: string;
    images: string[];
    sizes: string[];
    colors: string[];
    stock_quantity: string;
    is_active: boolean;
    featured: boolean;
    tax: string;
    shipping_cost: string;
  }>({
    name: '',
    slug: '',
    description: '',
    price: '',
    compare_at_price: '',
    category_id: '',
    images: [],
    sizes: [],
    colors: [],
    stock_quantity: '',
    is_active: true,
    featured: false,
    tax: '',
    shipping_cost: '',
  });

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsData, categoriesData] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
      ]);

      setProducts(productsData.data || []);
      setCategories(categoriesData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to fetch data',
        text: 'Failed to fetch products/categories. See console for details.',
      });
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-');
    if (!editingProduct) {
      const baseSlug = slug;
      let counter = 1;
      let uniqueSlug = baseSlug;

      while (true) {
        const { data: existingProduct } = await supabase
          .from('products')
          .select('id')
          .eq('slug', uniqueSlug)
          .maybeSingle();

        if (!existingProduct) break;

        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      slug = uniqueSlug;
    }

    const productData = {
      name: formData.name,
      slug: slug,
      description: formData.description,
      price: parseFloat(formData.price),
      compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
      category_id: formData.category_id || null,
      images: formData.images.filter(img => img.trim() !== ''),
      sizes: formData.sizes.filter(s => s.trim() !== ''),
      colors: formData.colors.filter(c => c.trim() !== ''),
      stock_quantity: parseInt(formData.stock_quantity) || 0,
      is_active: formData.is_active,
      featured: formData.featured,
      tax: formData.tax ? parseFloat(formData.tax) : 0,
      shipping_cost: formData.shipping_cost ? parseFloat(formData.shipping_cost) : 0,
    };

    try {
      if (uploading) {
        Swal.fire({ icon: 'warning', title: 'Upload in progress', text: 'Please wait for image uploads to finish before saving the product.' });
        return;
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (error) throw error;
      }

      await fetchData();
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      const msg = (error && (error as any).message) ? (error as any).message : JSON.stringify(error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to save product',
        text: msg,
      });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price: product.price?.toString?.() || '',
      compare_at_price: product.compare_at_price?.toString?.() || '',
      category_id: product.category_id || '',
      images: Array.isArray(product.images) ? product.images : [],
      sizes: Array.isArray(product.sizes) ? product.sizes : [],
      colors: Array.isArray(product.colors) ? product.colors : [],
      stock_quantity: product.stock_quantity?.toString?.() || '0',
      is_active: product.is_active,
      featured: product.featured,
      tax: product.tax?.toString?.() || '',
      shipping_cost: product.shipping_cost?.toString?.() || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Archive this product?')) return;

    try {
      const { data: prodRow, error: fetchErr } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
      if (fetchErr) throw fetchErr;

      const { error: archErr } = await supabase.from('archive').insert({
        type: 'product',
        original_id: id,
        before_data: prodRow,
        deleted_by: null
      });
      if (archErr) throw archErr;

      // remove product from active table
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;

      await fetchData();
    } catch (error) {
      console.error('Error archiving product:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to archive product',
        text: (error as any)?.message || 'An error occurred while archiving the product.',
      });
    }
  };

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Category name is required',
        text: 'Please enter a name for the category.',
      });
      return;
    }

    try {
      const { error } = await supabase.from('categories').insert({
        name: categoryName.trim(),
        slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
        description: categoryDescription.trim() || null,
      });

      if (error) throw error;

      // Refresh data to show new category
      await fetchData();
      setShowCategoryModal(false);
      setCategoryName('');
      setCategoryDescription('');
      Swal.fire({
        icon: 'success',
        title: 'Category added',
        text: 'The category has been successfully added.',
      });
    } catch (error) {
      console.error('Error adding category:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to add category',
        text: (error as any)?.message || 'An error occurred while adding the category.',
      });
    }
  };


  const handleDeleteCategory = async () => {
    if (!selectedCategoryToDelete) {
      Swal.fire({
        icon: 'warning',
        title: 'No category selected',
        text: 'Please select a category to delete.',
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;

    try {
      const { data: linkedProducts, error: linkedErr } = await supabase
        .from('products')
        .select('id, name')
        .eq('category_id', selectedCategoryToDelete);

      if (linkedErr) throw linkedErr;

      if (linkedProducts && linkedProducts.length > 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Cannot delete category',
          text: `${linkedProducts.length} product(s) are assigned to this category. Reassign or remove them first.`,
        });
        return;
      }

      // 2) Optional: archive category row before deletion
      const { data: categoryRow, error: fetchCatErr } = await supabase
        .from('categories')
        .select('*')
        .eq('id', selectedCategoryToDelete)
        .maybeSingle();

      if (fetchCatErr) throw fetchCatErr;

      if (categoryRow) {
        const { error: archCatErr } = await supabase.from('archive').insert({
          type: 'category',
          original_id: selectedCategoryToDelete,
          before_data: categoryRow,
          deleted_by: null
        });
        if (archCatErr) {
          console.warn('Failed to archive category before deletion:', archCatErr);
        }
      }

      // 3) Delete the category
      const { error: delErr } = await supabase
        .from('categories')
        .delete()
        .eq('id', selectedCategoryToDelete);

      if (delErr) throw delErr;

      // Refresh
      await fetchData();
      setSelectedCategoryToDelete('');
      setShowDeleteCategoryModal(false);
      Swal.fire({
        icon: 'success',
        title: 'Category deleted',
        text: 'The category has been successfully deleted.',
      });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to delete category',
        text: (error?.message || 'An error occurred while deleting the category.'),
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: '',
      compare_at_price: '',
      category_id: '',
      images: [],
      sizes: [],
      colors: [],
      stock_quantity: '',
      is_active: true,
      featured: false,
      tax: '',
      shipping_cost: '',
    });
    setEditingProduct(null);
    setShowForm(false);
  };


  const handleUploadFiles = async (files?: FileList | null) => {
    const fileArray = Array.from(files || []);
    if (fileArray.length === 0) return;

    try {
      setUploading(true);
      setUploadingFiles(fileArray.map((f) => f.name));

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated. Please log in again.');
      }

      // Check if images bucket exists
      try {
        console.log('Checking for images bucket...');
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();

        if (listError) {
          console.error('Error listing buckets:', listError);
          Swal.fire({
            icon: 'error',
            title: 'Storage check failed',
            text: `Could not list storage buckets: ${listError.message}`
          });
          return;
        }

        console.log('Available buckets:', buckets?.map(b => b.name));
        const imagesBucket = buckets?.find(bucket => bucket.name === 'images');

        if (!imagesBucket) {
          console.error('Images bucket does not exist. Available buckets:', buckets?.map(b => b.name));
          Swal.fire({
            icon: 'error',
            title: 'Storage bucket missing',
            html: `
              The 'images' storage bucket does not exist.<br><br>
              Please create it manually in your Supabase dashboard:<br>
              1. Go to your Supabase project dashboard<br>
              2. Navigate to Storage<br>
              3. Click "Create bucket"<br>
              4. Name it "images" (exactly as shown, all lowercase)<br>
              5. Make it public<br>
              6. Set file size limit to 10MB<br>
              7. Allow MIME types: image/*<br><br>
              Available buckets: ${buckets?.map(b => b.name).join(', ') || 'none'}<br><br>
              Or contact your administrator to create the bucket.
            `
          });
          return;
        }

        console.log('Images bucket found:', imagesBucket);
      } catch (bucketError) {
        console.error('Error checking bucket:', bucketError);
        Swal.fire({
          icon: 'error',
          title: 'Storage check failed',
          text: `Could not verify the images storage bucket exists: ${bucketError}`
        });
        return;
      }

      const uploadedUrls: string[] = [];
      const failedFiles: string[] = [];

      for (const file of fileArray) {
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `products/${fileName}`;

          const { error } = await supabase.storage
            .from('images')
            .upload(filePath, file, { cacheControl: '3600', upsert: false });

          if (error) {
            console.error('Upload error for', file.name, error);
            failedFiles.push(file.name);
            continue;
          }

          // try public url first, then signed url fallbacks; be tolerant of different return keys
          const { data: publicData } = await supabase.storage.from('images').getPublicUrl(filePath);
          let finalUrl: string | undefined = (publicData as any)?.publicUrl || (publicData as any)?.publicURL || (publicData as any)?.public_url;

          if (!finalUrl) {
            const { data: signedData, error: signedErr } = await supabase.storage.from('images').createSignedUrl(filePath, 60 * 60 * 24);
            if (signedErr) {
              console.error('Signed URL error for', file.name, signedErr);
            }
            finalUrl = (signedData as any)?.signedUrl || (signedData as any)?.signedURL || (signedData as any)?.signed_url;
          }

          if (!finalUrl) {
            console.error('No usable URL for uploaded file:', file.name);
            failedFiles.push(file.name);
            continue;
          }

          uploadedUrls.push(finalUrl);
        } catch (err) {
          console.error('Unhandled error uploading file', file.name, err);
          failedFiles.push(file.name);
        }
      }

      if (uploadedUrls.length > 0) {
        // use functional update to avoid stale closures
        setFormData((prev) => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
        Swal.fire({ icon: 'success', title: 'Upload complete', text: `${uploadedUrls.length} image(s) uploaded.` });
      }

      if (failedFiles.length > 0) {
        Swal.fire({ icon: 'warning', title: 'Some uploads failed', text: `Failed to upload: ${failedFiles.join(', ')}` });
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      Swal.fire({ icon: 'error', title: 'Upload error', text: (error as any)?.message || 'An error occurred while uploading images.' });
    } finally {
      setUploading(false);
      setUploadingFiles([]);
    }
  };

  if (!isAdmin) {
    return <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
      <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Access Denied</p>
    </div>;
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600 mt-1">{products.length} total products</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowCategoryModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Category
            </button>
            <button
              onClick={() => setShowDeleteCategoryModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              Delete Category
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Product
            </button>
          </div>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`sticky top-0 border-b p-6 flex justify-between items-center ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button onClick={resetForm} className={`p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500' : 'border-gray-300 focus:ring-gray-900'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="Auto-generated from name"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500' : 'border-gray-300 focus:ring-gray-900'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500' : 'border-gray-300 focus:ring-gray-900'}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500' : 'border-gray-300 focus:ring-gray-900'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Compare Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.compare_at_price}
                      onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500' : 'border-gray-300 focus:ring-gray-900'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Tax</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.tax}
                      onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500' : 'border-gray-300 focus:ring-gray-900'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Shipping Cost</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.shipping_cost}
                      onChange={(e) => setFormData({ ...formData, shipping_cost: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500' : 'border-gray-300 focus:ring-gray-900'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500' : 'border-gray-300 focus:ring-gray-900'}`}
                  >
                    <option value="">No category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Images</label>
                  <div className="space-y-2">
                    {formData.images.map((image, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {image && image.startsWith && image.startsWith('http') ? (
                          <div className="w-16 h-16 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                            <img src={image} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ) : null}
                        <input
                          type="text"
                          value={image}
                          onChange={(e) => {
                            const newImages = [...formData.images];
                            newImages[index] = e.target.value;
                            setFormData({ ...formData, images: newImages });
                          }}
                          placeholder="https://example.com/image.jpg"
                          className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500' : 'border-gray-300 focus:ring-gray-900'}`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = formData.images.filter((_, i) => i !== index);
                            setFormData({ ...formData, images: newImages });
                          }}
                          className="p-2 text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, images: [...formData.images, ''] })}
                      className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${theme === 'dark' ? 'text-gray-300 hover:text-white border-gray-600 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 border-gray-300 hover:bg-gray-50'}`}
                    >
                      <Plus className="w-4 h-4" />
                      Add Image URL
                    </button>

                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Sizes</label>
                    <div className="space-y-2">
                      {formData.sizes.map((size, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={size}
                            onChange={(e) => {
                              const newSizes = [...formData.sizes];
                              newSizes[index] = e.target.value;
                              setFormData({ ...formData, sizes: newSizes });
                            }}
                            placeholder="S"
                            className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500' : 'border-gray-300 focus:ring-gray-900'}`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newSizes = formData.sizes.filter((_, i) => i !== index);
                              setFormData({ ...formData, sizes: newSizes });
                            }}
                            className="p-2 text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, sizes: [...formData.sizes, ''] })}
                        className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${theme === 'dark' ? 'text-gray-300 hover:text-white border-gray-600 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 border-gray-300 hover:bg-gray-50'}`}
                      >
                        <Plus className="w-4 h-4" />
                        Add Size
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Colors</label>
                    <div className="space-y-2">
                      {formData.colors.map((color, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={color}
                            onChange={(e) => {
                              const newColors = [...formData.colors];
                              newColors[index] = e.target.value;
                              setFormData({ ...formData, colors: newColors });
                            }}
                            placeholder="Red"
                            className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500' : 'border-gray-300 focus:ring-gray-900'}`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newColors = formData.colors.filter((_, i) => i !== index);
                              setFormData({ ...formData, colors: newColors });
                            }}
                            className="p-2 text-red-600 hover:text-red-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, colors: [...formData.colors, ''] })}
                        className={`flex items-center gap-2 px-3 py-2 border rounded-lg ${theme === 'dark' ? 'text-gray-300 hover:text-white border-gray-600 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 border-gray-300 hover:bg-gray-50'}`}
                      >
                        <Plus className="w-4 h-4" />
                        Add Color
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500' : 'border-gray-300 focus:ring-gray-900'}`}
                  />
                </div>

                <div className="flex gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded"
                    />
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Active</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="rounded"
                    />
                    <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Featured</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={uploading}
                    className={`flex-1 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {uploading ? 'Uploading...' : (editingProduct ? 'Update Product' : 'Create Product')}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <DetailsModal
          isOpen={detailsOpen}
          title={selectedProduct?.name || ''}
          data={selectedProduct || {}}
          itemType="product"
          onClose={() => setDetailsOpen(false)}
        />

        {showCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`rounded-lg max-w-md w-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="p-6">
                <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Add New Category</h2>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Category Name *</label>
                    <input
                      type="text"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500' : 'border-gray-300 focus:ring-blue-500'}`}
                      placeholder="Enter category name"
                    />
                  </div>


                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleAddCategory}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Category
                  </button>
                  <button
                    onClick={() => setShowCategoryModal(false)}
                    className={`flex-1 py-2 border rounded-lg transition-colors ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showDeleteCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`rounded-lg max-w-md w-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="p-6">
                <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Delete Category</h2>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Select Category to Delete</label>
                    <select
                      value={selectedCategoryToDelete}
                      onChange={(e) => setSelectedCategoryToDelete(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white focus:ring-red-500' : 'border-gray-300 focus:ring-red-500'}`}
                    >
                      <option value="">Select a category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleDeleteCategory}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete Category
                  </button>
                  <button
                    onClick={() => setShowDeleteCategoryModal(false)}
                    className={`flex-1 py-2 border rounded-lg transition-colors ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto ${theme === 'dark' ? 'border-white' : 'border-gray-900'}`}></div>
            <p className={`mt-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className={`rounded-lg shadow p-12 text-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>No products yet. Add your first product to get started!</p>
          </div>
        ) : (
          <div className={`rounded-lg shadow overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Product</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Price</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Stock</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Status</th>
                  <th className={`px-6 py-3 text-right text-xs font-medium uppercase ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${theme === 'dark' ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded overflow-hidden flex-shrink-0 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          {product.images?.[0] && (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div>
                          <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{product.name}</div>
                          <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{product.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(product.price)}</td>
                    <td className={`px-6 py-4 text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{product.stock_quantity}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button
                        onClick={() => { setSelectedProduct(product); setDetailsOpen(true); }}
                        className={`mr-4 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
