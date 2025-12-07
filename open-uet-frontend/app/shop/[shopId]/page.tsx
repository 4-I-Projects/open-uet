// app/services/[shopId]/page.tsx
"use client"; 

import Link from "next/link";
import React, { useState, useEffect } from 'react';
import { Service, Shop, MOCK_SHOPS } from '@/data/mock';
import ServiceCard from '@/components/ServiceCard'; // Use the existing ServiceCard component

import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";

const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });

const fetchShopDetails = async (shopId: string): Promise<Shop | undefined> => {
  const servicesData = await client.getObject({
    id: shopId,
    options: { showContent: true, showType: true, showOwner: true }
  });
  return servicesData?.data?.content?.fields;
};

const fetchServicesForShop = async (shopId: string): Promise<Service[]> => {
  const servicesData = await client.getObject({
    id: shopId,
    options: { showContent: true, showType: true, showOwner: true }
  });

  const serviceIds: string[] = servicesData?.data?.content?.fields.services;

  const services = [];
  console.log(serviceIds);
  for (let i = 0; i < serviceIds.length; i++) {
    const serviceData = await client.getObject({
      id: serviceIds[i],
      options: { showContent: true, showType: true, showOwner: true }
    })
    console.log(serviceData?.data?.content?.fields);
    services.push(serviceData?.data?.content?.fields);
  }
  return services;
};

const PACKAGE_ID = "0xfd4f8d31fccbc6941e24621eed63de499b3e04756650ee2807ea9aaddf9e4b53";
const MODULE_NAME = "vouchers";
const BUY_FUNCTION_NAME = "buy_voucher";

// --- The main Service Page Component for a specific shop ---
export default function ShopServicePage({ params }: { params: { shopId: string } }) {
  const { shopId } = React.use(params);

  // State for the shop's details, the services it offers, and loading status
  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();


  // useEffect to fetch all necessary data when the shopId changes
  useEffect(() => {
    // console.log("shop id is: ", params)
    if (shopId) {
      setIsLoading(true);
      Promise.all([
        fetchShopDetails(shopId as string),
        fetchServicesForShop(shopId as string)
      ])
      .then(([shopData, servicesData]) => {
        if (shopData) {
          setShop(shopData);
        }
        setServices(servicesData);
      })
      .catch(error => {
        console.error("Failed to fetch shop data:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
    }
  }, [shopId]);

  async function getUserUETCoins(address: string) {
    const coins = await client.getCoins({
      owner: address,
      coinType: `${PACKAGE_ID}::uet_coin::UET_COIN`, 
    });
    return coins.data; // Array of coin objects
  }

  const handleBuy = async (service: Service) => {
    console.log(`Initiating purchase for ${service.name}...`);
    console.log(service)
    setProcessingId(service.id.id);
    const tx = new Transaction();

    if (!currentAccount) return;

    const coins = await getUserUETCoins(currentAccount.address);
    const coin = coins[0];
    
    const [requiredAmountCoinObject] = tx.splitCoins(
      coin.coinObjectId, 
      [tx.pure('u64', service.price)]
    );
    console.log(requiredAmountCoinObject)

    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::${BUY_FUNCTION_NAME}`,
      arguments: [
        tx.object(service.id.id),
        tx.object(requiredAmountCoinObject)
      ],
    });

    signAndExecuteTransaction({
      transaction: tx,
    });

    setProcessingId(null);
  };

  if (isLoading) {
    return <p className="text-center p-8">Loading services for this shop...</p>;
  }

  if (!shop) {
    return <p className="text-center p-8 text-red-500">Error: Shop not found.</p>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold">{shop.name}</h1>
        <p className="text-lg text-gray-600 mt-2">{shop.description}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {services.length > 0 ? (
          services.map((service) => (
            <ServiceCard 
              key={service.id} 
              item={service} 
              onBuy={handleBuy}
              isProcessing={processingId === service.id}
            />
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">This shop has no services available yet.</p>
        )}
      </div>
    </div>
  );
}