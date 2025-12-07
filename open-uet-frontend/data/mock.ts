// data/mock.ts

// Based on the Move struct:
// public struct Shop has key, store {
//     id: UID,
//     name: String,
//     description: String,
//     owner: address,
//     services: vector<ID>,
// }
export type Shop = {
  id: string; // Represents the UID from the struct
  name: string;
  description: string;
  owner: string; // Represents the owner address
  services: string[]; // A vector of Service IDs
};

// Based on the Move struct:
// public struct Service has key, store {
//     id: UID,
//     name: String,
//     price: u64,
//     shop_id: ID,
// }
export type Service = {
  id: string; // Represents the UID from the struct
  name: string;
  price: number; // Represents u64
  shop_id: string; // Represents shop_id: ID
  image: string; // Keeping this for UI purposes
};

// This was the old ServiceItem, renamed and adjusted to match the Service struct
export type ServiceItem = Service;

export type NFTItem = {
  id: string;
  name: string;
  type: "VOUCHER" | "CERTIFICATE";
  status: "ACTIVE" | "USED";
  owner: string;
};

export const MOCK_SHOPS: Shop[] = [
  {
    id: "0xSHOP1", // Example Object ID from Sui
    name: "UET Canteen Services",
    description: "All your daily needs, from food to supplies.",
    owner: "0xOWNER1",
    services: ["0xSERVICE1", "0xSERVICE2"],
  },
  {
    id: "0xSHOP2",
    name: "Library & Print Services",
    description: "Printing, book rentals, and other academic services.",
    owner: "0xOWNER2",
    services: ["0xSERVICE3", "0xSERVICE4"],
  },
];

export const MOCK_SERVICES: Service[] = [
  {
    id: "0xSERVICE1",
    shop_id: "0xSHOP1",

    name: "Lunch Voucher",
    description: "A nutritious and complete lunch set at the canteen.",
    price: 25,
    image: "🍱",
  },
  {
    id: "0xSERVICE2",
    shop_id: "0xSHOP1",
    name: "Bicycle Rental (4h)",
    description: "Use of a public bicycle within the university campus.",
    price: 10,
    image: "🚲",
  },
  {
    id: "0xSERVICE3",
    shop_id: "0xSHOP2",
    name: "Printing Voucher (50 pages)",
    description: "Free printing for academic materials.",
    price: 15,
    image: "🖨️",
  },
  {
    id: "0xSERVICE4",
    shop_id: "0xSHOP2",
    name: "Book Renewal (1 week)",
    description: "Extend the borrowing period for a book by one week.",
    price: 5,
    image: "📚",
  },
];


export const MOCK_INVENTORY: NFTItem[] = [
  {
    id: "nft-001",
    name: "Bicycle Rental (4h)",
    type: "VOUCHER",
    status: "ACTIVE",
    owner: "0x123...abc",
  },
];