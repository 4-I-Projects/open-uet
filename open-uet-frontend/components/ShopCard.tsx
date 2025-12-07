// components/ShopCard.tsx
import React from 'react';
import Link from 'next/link';
// 👇 IMPORT Type từ nguồn chính, KHÔNG định nghĩa lại ở đây
import { Shop } from '@/data/mock'; 

type ShopCardProps = {
  shop: Shop;
};

const ShopCard: React.FC<ShopCardProps> = ({ shop }) => {
  return (
    // 👇 Truy cập shop.id.id là hợp lệ vì Shop import từ mock.ts có id là object
    <Link href={`/shop/${shop.id.id}`}>
      <div className="block p-6 border border-gray-200 rounded-lg shadow hover:bg-gray-100 transition-colors duration-200 cursor-pointer bg-white">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">{shop.name}</h2>
        <p className="font-normal text-gray-700 min-h-[3rem] line-clamp-2">
          {shop.description}
        </p>
        
        {/* Hiển thị thêm Owner nếu cần */}
        <div className="mt-4 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 truncate">
            Chủ: <span className="font-mono">{shop.owner}</span>
          </p>
        </div>
      </div>
    </Link>
  );
};

export default ShopCard;