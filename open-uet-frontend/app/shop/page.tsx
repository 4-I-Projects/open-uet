// app/shop/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { Shop } from '@/data/mock';
import ShopCard from '@/components/ShopCard'; 
import { SuiClient } from '@mysten/sui/client';

const SHOP_REGISTRY_ADDRESS = "0x73fdfa00d7c18340767100d75980cb3a501ee21efda0921412f463ec103091ea"; 
const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });

async function fetchShops(): Promise<Shop[]> {
  const shopAddresses = await client.getObject({
    id: SHOP_REGISTRY_ADDRESS,
    options: { showContent: true }
  });

  // @ts-ignore
  const shopIds: string[] = shopAddresses?.data?.content?.fields?.shops || [];

  const shops: Shop[] = [];
  for (let i = 0; i < shopIds.length; i++) {
    const shopData = await client.getObject({
      id: shopIds[i],
      options: { showContent: true, showOwner: true } // Quan trọng: showOwner: true
    });
    
    // @ts-ignore
    const fields = shopData?.data?.content?.fields;
    const ownerData = shopData?.data?.owner;
    
    // Xử lý lấy địa chỉ Owner (vì Sui trả về dạng object phức tạp)
    let ownerAddress = "Unknown";
    if (ownerData && typeof ownerData === 'object') {
        if ('AddressOwner' in ownerData) ownerAddress = (ownerData as any).AddressOwner;
        if ('Shared' in ownerData) ownerAddress = "Shared Object";
    }

    if (fields) {
        shops.push({
            ...fields,
            id: { id: shopIds[i] },
            owner: ownerAddress // Gán owner vào đây
        } as Shop);
    }
  }
  return shops;
}

const ShopPage = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchShops()
      .then(setShops)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-blue-700">🏪 Cửa Hàng Sinh Viên</h1>
      
      {isLoading ? (
        <p className="text-center text-gray-500">Đang tải danh sách cửa hàng...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map(shop => (
            <ShopCard key={shop.id.id} shop={shop} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopPage;