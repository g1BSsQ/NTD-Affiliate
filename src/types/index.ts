import { UserStatus, OrderStatus, UserRank, WithdrawStatus } from '../constants/enums';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  sponsorCode: string;       // mã giới thiệu của người bảo trợ
  referralCode: string;      // mã giới thiệu của chính user này
  status: UserStatus;
  rank: UserRank;
  avatarUrl?: string;
  cccdUrl?: string;
  rewardWallet: number;      // Ví Điểm Thưởng (VNĐ)
  commissionWallet: number;  // Ví Hoa Hồng (VNĐ)
  totalSales: number;        // Doanh số tích lũy
  thisMonthSales: number;    // Doanh số tháng hiện tại
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;              // e.g. "Gói CTV Nâng cao - 5 hộp"
  boxes: number;             // số hộp
  pricePerBox: number;       // giá 1 hộp chưa VAT (3,000,000)
  coverImageUrl?: string;
}

export interface OrderItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;          // tổng chưa VAT
  vat: number;               // 8%
  total: number;             // subtotal * 1.08
  status: OrderStatus;
  deliveryAddress?: string;
  pickupAtWarehouse: boolean;
  receiptUrl?: string;       // ảnh biên lai
  rejectionReason?: string;
  createdAt: string;
}

export interface NetworkNode {
  id: string;
  username: string;
  fullName: string;
  rank: UserRank;
  status: UserStatus;
  totalSales: number;
  left?: NetworkNode;
  right?: NetworkNode;
}

export interface WalletTransaction {
  id: string;
  type: 'COMMISSION' | 'REWARD' | 'WITHDRAW' | 'PURCHASE';
  amount: number;
  description: string;
  walletType: 'REWARD' | 'COMMISSION';
  status: WithdrawStatus | 'COMPLETED';
  createdAt: string;
}
