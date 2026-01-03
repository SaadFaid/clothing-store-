import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'user' | 'owner';
  phone: string | null;
  avatar_url: string | null;
  theme: 'light' | 'dark';
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category_id: string | null;
  images: string[];
  sizes: string[];  
  colors: string[];
  stock_quantity: number;
  is_active: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
  tax?: number;
  shipping_cost?: number;
};

export type CartItem = {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  size: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
  product?: Product;
};

export type Address = {
  id: string;
  user_id: string;
  full_name: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
  created_at: string;
};

export type Order = {
  id: string;
  user_id: string;
  order_number: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  tax: number;
  shipping_fee: number;
  total: number;
  shipping_address: any;
  payment_method: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  quantity: number;
  size: string | null;
  color: string | null;
  price: number;
  created_at: string;
};

export type Conversation = {
  id: string;
  user_id: string;
  subject: string | null;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_name: string | null;
  sender_role: 'user' | 'admin' | 'owner';
  body: string;
  is_read: boolean;
  created_at: string;
};

export type Archive = {
  id: string;
  type: string;
  original_id: string | null;
  before_data: any;
  deleted_by: string | null;
  deleted_at: string;
};

export type Payment = {
  id: string;
  order_id: string;
  user_id: string;
  amount: number;
  payment_method: string;
  status: string;
  transaction_id: string;
  created_at: string;
};

 export type MailboxMessage = {
  id: string;
  to_email: string;
  to_user_id: string | null;
  from_name: string;
  from_email: string;
  subject: string;
  message: string;
  is_read: boolean;
  sender_role: 'admin' | 'user';
  created_at: string;
};

