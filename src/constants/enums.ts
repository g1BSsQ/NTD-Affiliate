export enum UserStatus {
  NEW = 'NEW',
  PENDING_PLACEMENT = 'PENDING_PLACEMENT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
}

export enum OrderStatus {
  WAITING_PAYMENT = 'WAITING_PAYMENT',
  PENDING_ADMIN = 'PENDING_ADMIN',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

export enum WithdrawStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum UserRank {
  CTV_TIEU_DUNG = 'CTV_TIEU_DUNG',
  CTV_CO_BAN = 'CTV_CO_BAN',
  CTV_NANG_CAO = 'CTV_NANG_CAO',
  CTV_CHUYEN_NGHIEP = 'CTV_CHUYEN_NGHIEP',
  TDL_3 = 'TDL_3',
  TDL_2 = 'TDL_2',
  TDL_1 = 'TDL_1',
  PHO_PHONG = 'PHO_PHONG',
  TRUONG_PHONG = 'TRUONG_PHONG',
  PHO_GIAM_DOC = 'PHO_GIAM_DOC',
  GIAM_DOC = 'GIAM_DOC',
}

export const UserRankLabel: Record<UserRank, string> = {
  [UserRank.CTV_TIEU_DUNG]: 'CTV Tiêu dùng',
  [UserRank.CTV_CO_BAN]: 'CTV Cơ bản',
  [UserRank.CTV_NANG_CAO]: 'CTV Nâng cao',
  [UserRank.CTV_CHUYEN_NGHIEP]: 'CTV Chuyên nghiệp',
  [UserRank.TDL_3]: 'Tổng Đại Lý cấp 3',
  [UserRank.TDL_2]: 'Tổng Đại Lý cấp 2',
  [UserRank.TDL_1]: 'Tổng Đại Lý cấp 1',
  [UserRank.PHO_PHONG]: 'Phó Phòng',
  [UserRank.TRUONG_PHONG]: 'Trưởng Phòng',
  [UserRank.PHO_GIAM_DOC]: 'Phó Giám đốc',
  [UserRank.GIAM_DOC]: 'Giám đốc',
};

export const UserStatusLabel: Record<UserStatus, string> = {
  [UserStatus.NEW]: 'Mới đăng ký',
  [UserStatus.PENDING_PLACEMENT]: 'Chờ xếp cây',
  [UserStatus.PENDING_APPROVAL]: 'Chờ Admin duyệt',
  [UserStatus.ACTIVE]: 'Đã kích hoạt',
  [UserStatus.BLOCKED]: 'Bị khóa',
};
