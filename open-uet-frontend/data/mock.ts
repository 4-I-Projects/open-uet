// data/mock.ts

export type ServiceItem = {
  id: string;
  name: string;
  description: string;
  price: number; // Giá tính bằng UET
  image: string;
};

export type NFTItem = {
  id: string;
  name: string;
  type: "VOUCHER" | "CERTIFICATE";
  status: "ACTIVE" | "USED";
  owner: string;
};

export const MOCK_SERVICES: ServiceItem[] = [
  {
    id: "1",
    name: "Vé thuê xe đạp (4h)",
    description: "Sử dụng xe đạp công cộng trong khuôn viên trường.",
    price: 10,
    image: "🚲",
  },
  {
    id: "2",
    name: "Suất cơm trưa Căng tin",
    description: "Một suất cơm đầy đủ dinh dưỡng tại nhà ăn.",
    price: 25,
    image: "🍱",
  },
  {
    id: "3",
    name: "Voucher In ấn (50 trang)",
    description: "Miễn phí in ấn tài liệu học tập.",
    price: 15,
    image: "🖨️",
  },
];

export const MOCK_INVENTORY: NFTItem[] = [
  {
    id: "nft-001",
    name: "Vé thuê xe đạp (4h)",
    type: "VOUCHER",
    status: "ACTIVE",
    owner: "0x123...abc",
  },
];