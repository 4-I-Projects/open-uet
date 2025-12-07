// app/shop/page.tsx
"use client"; // This is a client-side component

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shop } from '@/data/mock';
import ShopCard from '@/components/ShopCard'; // Import ShopCard from its new location

import { SuiClient } from '@mysten/sui/client';

const SHOP_REGISTRY_ADDRESS = "0x73fdfa00d7c18340767100d75980cb3a501ee21efda0921412f463ec103091ea"

const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });

async function fetchShops() {
  const shopAddresses = await client.getObject({
    id: SHOP_REGISTRY_ADDRESS,
    options: { showContent: true, showType: true, showOwner: true }
  });

  const shopIds: string[] = shopAddresses?.data?.content?.fields.shops;

  const shops = [];
  console.log(shopIds);
  for (let i = 0; i < shopIds.length; i++) {
    const shopData = await client.getObject({
      id: shopIds[i],
      options: { showContent: true, showType: true, showOwner: true }
    })
    console.log(shopData?.data?.content?.fields);
    shops.push(shopData?.data?.content?.fields);
  }
  return shops;
}


// --- The main Shop Page Component ---
const ShopPage = () => {
  // `useState` hook to store the list of shops.
  // It's initialized with an empty array.
  const [shops, setShops] = useState<Shop[]>([]);
  // `useState` hook to manage the loading state.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchShops()
      .then(data => {
        setShops(data);
      })
      .catch(error => {
        console.error("Failed to fetch shops:", error);
        // You could add state to display an error message to the user
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Explore Shops</h1>
      
      {isLoading ? (
        <p className="text-center">Loading shops...</p>
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
