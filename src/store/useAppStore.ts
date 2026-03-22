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
  full_name: string;
  position: string;
  status: string;
  total_sales: number;
}

export interface BinaryTreeNode {
  user_id: string;
  parent_id: string | null;
  node_position: 'LEFT' | 'RIGHT' | null;
  total_sales: number;
  full_name: string;
  status: string;
  depth: number;
}

export interface UnplacedMember {
  user_id: string;
  full_name: string;
  status: string;
  created_at: string;
}

export interface PlacementRequest {
  id: string;
  sponsor_id: string;
  member_id: string;
  parent_id: string;
  position: 'LEFT' | 'RIGHT';
  status: 'PLANNING' | 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
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
  binaryTree: BinaryTreeNode[];
  unplacedMembers: UnplacedMember[];
  placementRequests: PlacementRequest[];
  loading: boolean;


  // Actions
  fetchProfile: () => Promise<void>;
  fetchWallets: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  fetchNetworkNode: () => Promise<void>;
  fetchSubordinates: () => Promise<void>;
  fetchBinaryTree: () => Promise<void>;
  fetchUnplacedMembers: () => Promise<void>;
  fetchPlacementRequests: () => Promise<void>;
  cancelPlacementRequest: (requestId: string) => Promise<void>;
  submitPlacementRequest: (memberId: string, parentId: string, position: 'LEFT' | 'RIGHT') => Promise<void>;
  submitAllPlacements: () => Promise<void>;
  createOrder: (packageId: string, boxes: number, totalPrice: number, receiptUrl: string, pointsUsed: number, shippingAddress?: string, deliveryMethod?: string, shippingName?: string, shippingPhone?: string) => Promise<void>;
  uploadOrderReceipt: (orderId: string, receiptUrl: string) => Promise<void>;
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
  binaryTree: [],
  unplacedMembers: [],
  placementRequests: [],
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

  fetchUnplacedMembers: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('network_nodes')
        .select(`
          user_id,
          profiles:network_nodes_user_id_fkey(full_name, status, created_at)
        `)
        .eq('sponsor_id', user.id)
        .is('parent_id', null);

      if (error) console.warn('fetchUnplacedMembers error:', error.message);
      if (data) {
        const mapped = data.map((item: any) => {
          const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
          return {
            user_id: item.user_id,
            full_name: profile?.full_name || 'Hội viên mới',
            status: profile?.status || 'NEW',
            created_at: profile?.created_at || new Date().toISOString()
          };
        });
        set({ unplacedMembers: mapped });
      }
    } catch (e) { console.warn('fetchUnplacedMembers failed:', e); }
  },

  fetchPlacementRequests: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('placement_requests')
        .select('*')
        .or(`sponsor_id.eq.${user.id},member_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      if (error) console.warn('fetchPlacementRequests error:', error.message);
      if (data) set({ placementRequests: data });
    } catch (e) { console.warn('fetchPlacementRequests failed:', e); }
  },

  cancelPlacementRequest: async (requestId) => {
    try {
      const { error } = await supabase.from('placement_requests').delete().eq('id', requestId);
      if (error) throw error;
      // Also refresh unplaced members since the member is now "free" again
      await Promise.all([
        get().fetchPlacementRequests(),
        get().fetchUnplacedMembers(),
        get().fetchBinaryTree() // Refresh tree just in case
      ]);
    } catch (e) { console.warn('cancelPlacementRequest failed:', e); }
  },

  submitPlacementRequest: async (memberId, parentId, position) => {
    try {
      const { profile: user } = get();
      if (!user) return;

      // 1. Delete any existing PLANNING or PENDING request for this member (Repositioning)
      await supabase
        .from('placement_requests')
        .delete()
        .eq('member_id', memberId)
        .in('status', ['PLANNING', 'PENDING']);

      // 2. Submit as PLANNING (Draft)
      const { error } = await supabase.from('placement_requests').insert([{
        sponsor_id: user.id,
        member_id: memberId,
        parent_id: parentId,
        position: position,
        status: 'PLANNING'
      }]);
      if (error) throw error;
      
      await Promise.all([
        get().fetchPlacementRequests(),
        get().fetchUnplacedMembers(),
        get().fetchBinaryTree()
      ]);
    } catch (e: any) {
      console.warn('submitPlacementRequest failed:', e);
      throw e;
    }
  },

  submitAllPlacements: async () => {
    try {
      const { profile: user } = get();
      if (!user) return;
      
      const { error } = await supabase
        .from('placement_requests')
        .update({ status: 'PENDING' })
        .eq('sponsor_id', user.id)
        .eq('status', 'PLANNING');
      
      if (error) throw error;
      await get().fetchPlacementRequests();
    } catch (e: any) { 
      console.warn('submitAllPlacements failed:', e); 
      throw e;
    }
  },

  fetchBinaryTree: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.rpc('get_binary_tree', { root_user_id: user.id });
      if (error) console.warn('fetchBinaryTree error:', error.message);
      if (data) set({ binaryTree: data });
    } catch (e) { console.warn('fetchBinaryTree failed:', e); }
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

  uploadOrderReceipt: async (orderId, receiptUrl) => {
    const { error } = await supabase
      .from('orders')
      .update({
        receipt_url: receiptUrl,
        status: 'PENDING_ADMIN'
      })
      .eq('id', orderId);
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
      store.fetchBinaryTree(),
      store.fetchUnplacedMembers(),
      store.fetchPlacementRequests(),
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
    unplacedMembers: [],
    placementRequests: [],
    loading: false,
  }),

}));
