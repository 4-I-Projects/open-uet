// components/ShopCard.tsx
import React from 'react';
import Link from 'next/link';

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

type ShopCardProps = {
  shop: Shop;
};

const ShopCard: React.FC<ShopCardProps> = ({ shop }) => {
  return (
    <Link href={`/shop/${shop.id.id}`}>
      <div className="block p-6 border border-gray-200 rounded-lg shadow hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">{shop.name}</h2>
        <p className="font-normal text-gray-700">{shop.description}</p>
      </div>
    </Link>
  );
};

export default ShopCard;
