// data/mock.ts

// data/mock.ts

export interface Shop {
  id: { id: string };
  name: string;
  description: string;
  services: string[];
  owner: string; // <-- THÊM DÒNG NÀY
}

export interface Service {
  id: { id: string };
  name: string;
  description: string;
  price: number;
  image: string;
  shop_id?: string;
}

// Giữ lại các type cũ nếu cần dùng cho phần khác
export type ServiceItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
};

export type NFTItem = {
  id: string;
  name: string;
  type: "VOUCHER" | "CERTIFICATE";
  status: "ACTIVE" | "USED";
  owner: string;
};
