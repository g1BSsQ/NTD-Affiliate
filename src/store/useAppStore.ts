import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// ---- Types ----
export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  sponsor_code: string | null;
  package_id: string | null;
  address: string | null;
  status: string;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  type: 'REWARD' | 'COMMISSION';
  balance: number;
}

export interface Order {
  id: string;
  package_id: string;
  boxes: number;
  total_price: number;
  points_used: number; // Added points_used
  status: string;
  receipt_url: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  wallet_type: string;
  type: string;
  amount: number;
  description: string | null;
  status: string;
  created_at: string;
}

export interface NetworkNode {
  id: string;
  user_id: string;
  parent_id: string | null;
  sponsor_id: string | null;
  position: string | null;
  left_sales: number;
  right_sales: number;
  total_sales: number;
  rank: string;
}

export interface Subordinate {
  user_id: string;
  full_name: string;
  position: string;
  status: string;
  total_sales: number;
}


// ---- Store ----
interface AppState {
  // Data
  profile: Profile | null;
  wallets: Wallet[];
  orders: Order[];
  transactions: Transaction[];
  networkNode: NetworkNode | null;
  subordinates: Subordinate[];
  loading: boolean;


  // Actions
  fetchProfile: () => Promise<void>;
  fetchWallets: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  fetchNetworkNode: () => Promise<void>;
  fetchSubordinates: () => Promise<void>;
  createOrder: (packageId: string, boxes: number, totalPrice: number, receiptUrl: string, pointsUsed: number) => Promise<void>; // Added createOrder
  fetchAll: () => Promise<void>;

  reset: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  profile: null,
  wallets: [],
  orders: [],
  transactions: [],
  networkNode: null,
  subordinates: [],
  loading: false,


  fetchProfile: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) console.warn('fetchProfile error:', error.message);
      if (data) set({ profile: data });
    } catch (e) { console.warn('fetchProfile failed:', e); }
  },

  fetchWallets: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id);
      if (error) console.warn('fetchWallets error:', error.message);
      if (data) set({ wallets: data });
    } catch (e) { console.warn('fetchWallets failed:', e); }
  },

  fetchOrders: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('orders')
        .select('*, points_used') // Added points_used to select
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) console.warn('fetchOrders error:', error.message);
      if (data) set({ orders: data });
    } catch (e) { console.warn('fetchOrders failed:', e); }
  },

  fetchTransactions: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) console.warn('fetchTransactions error:', error.message);
      if (data) set({ transactions: data });
    } catch (e) { console.warn('fetchTransactions failed:', e); }
  },

  fetchNetworkNode: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('network_nodes')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) console.warn('fetchNetworkNode error:', error.message);
      if (data) set({ networkNode: data });
    } catch (e) { console.warn('fetchNetworkNode failed:', e); }
  },

  fetchSubordinates: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('network_nodes')
        .select(`
          user_id,
          position,
          total_sales,
          profiles:network_nodes_user_id_fkey(full_name, status)
        `)
        .eq('sponsor_id', user.id);
      
      if (error) console.warn('fetchSubordinates error:', error.message);
      if (data) {
        const mapped = data.map((item: any) => {
          const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
          return {
            user_id: item.user_id,
            position: item.position,
            total_sales: item.total_sales,
            full_name: profile?.full_name || 'Hội viên mới',
            status: profile?.status || 'NEW'
          };
        });
        set({ subordinates: mapped });
      }
    } catch (e) {
      console.warn('fetchSubordinates failed:', e);
    }
  },

  createOrder: async (packageId, boxes, totalPrice, receiptUrl, pointsUsed = 0, shippingAddress = '', deliveryMethod = 'PICKUP', shippingName = '', shippingPhone = '') => {
    const { profile: user } = get();
    if (!user) return;
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        user_id: user.id,
        package_id: packageId,
        boxes,
        total_price: totalPrice,
        points_used: pointsUsed,
        status: 'PENDING_ADMIN',
        receipt_url: receiptUrl,
        shipping_address: shippingAddress,
        delivery_method: deliveryMethod,
        shipping_name: shippingName,
        shipping_phone: shippingPhone
      }])
      .select()
      .single();
    if (error) throw error;
    await get().fetchOrders();
  },

  fetchAll: async () => {
    set({ loading: true });
    const store = get();
    await Promise.all([
      store.fetchProfile(),
      store.fetchWallets(),
      store.fetchOrders(),
      store.fetchTransactions(),
      store.fetchNetworkNode(),
      store.fetchSubordinates(),
    ]);

    set({ loading: false });
  },

  reset: () => set({
    profile: null,
    wallets: [],
    orders: [],
    transactions: [],
    networkNode: null,
    subordinates: [],
    loading: false,
  }),

}));
