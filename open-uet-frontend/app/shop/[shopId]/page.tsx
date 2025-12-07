// app/shop/[shopId]/page.tsx
"use client"; 

import React, { useState, useEffect } from 'react';
import { Service, Shop } from '@/data/mock';
import ServiceCard from '@/components/ServiceCard'; 

import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";

const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });

const fetchShopDetails = async (shopId: string): Promise<Shop | null> => {
  const data = await client.getObject({
    id: shopId,
    options: { showContent: true }
  });
  // @ts-ignore
  const fields = data?.data?.content?.fields;
  if (!fields) return null;
  return { ...fields, id: { id: shopId } } as Shop;
};

const fetchServicesForShop = async (shopId: string): Promise<Service[]> => {
  const shopData = await client.getObject({
    id: shopId,
    options: { showContent: true }
  });

  // @ts-ignore
  const serviceIds: string[] = shopData?.data?.content?.fields?.services || [];
  const services: Service[] = [];

  for (const id of serviceIds) {
    const sData = await client.getObject({
      id,
      options: { showContent: true }
    });
    // @ts-ignore
    const fields = sData?.data?.content?.fields;
    if (fields) {
        services.push({
            ...fields,
            id: { id: id } // Map đúng cấu trúc { id: { id: string } }
        } as Service);
    }
  }
  return services;
};

const PACKAGE_ID = "0xfd4f8d31fccbc6941e24621eed63de499b3e04756650ee2807ea9aaddf9e4b53";
const MODULE_NAME = "vouchers";
const BUY_FUNCTION_NAME = "buy_voucher";
const COIN_DECIMALS = 6;

// --- QUAN TRỌNG: Định nghĩa params là Promise cho Next.js 15 ---
export default function ShopServicePage({ params }: { params: Promise<{ shopId: string }> }) {
  // Unwrap params bằng React.use()
  const resolvedParams = React.use(params);
  const shopId = resolvedParams.shopId;

  const [shop, setShop] = useState<Shop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  useEffect(() => {
    if (shopId) {
      setIsLoading(true);
      Promise.all([
        fetchShopDetails(shopId),
        fetchServicesForShop(shopId)
      ])
      .then(([shopData, servicesData]) => {
        setShop(shopData);
        setServices(servicesData);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
    }
  }, [shopId]);

  async function getUserUETCoins(address: string) {
    const coins = await client.getCoins({
      owner: address,
      coinType: `${PACKAGE_ID}::uet_coin::UET_COIN`, 
    });
    return coins.data; 
  }

  const handleBuy = async (service: Service) => {
    // Sửa lỗi truy cập id: service.id.id
    console.log(`Initiating purchase for ${service.name}...`);
    setProcessingId(service.id.id);
    const tx = new Transaction();

    if (!currentAccount) {
        alert("Vui lòng kết nối ví");
        setProcessingId(null);
        return;
    }

    try {
        const coins = await getUserUETCoins(currentAccount.address);
        if (coins.length === 0) throw new Error("Không có UET Coin");
        
        const coin = coins[0];
        
        // Tính toán amount với decimals
        const amount = BigInt(service.price * Math.pow(10, COIN_DECIMALS));

        const [paymentCoin] = tx.splitCoins(
          tx.object(coin.coinObjectId), 
          [tx.pure.u64(amount)]
        );

        tx.moveCall({
          target: `${PACKAGE_ID}::${MODULE_NAME}::${BUY_FUNCTION_NAME}`,
          arguments: [
            tx.object(service.id.id), // Truy cập đúng id
            paymentCoin
          ],
        });

        signAndExecuteTransaction({
          transaction: tx,
        }, {
            onSuccess: () => {
                alert("Mua thành công!");
                setProcessingId(null);
            },
            onError: (err) => {
                console.error(err);
                alert("Giao dịch thất bại");
                setProcessingId(null);
            }
        });
    } catch (e) {
        console.error(e);
        setProcessingId(null);
    }
  };

  if (isLoading) return <p className="text-center p-8">Loading...</p>;
  if (!shop) return <p className="text-center p-8 text-red-500">Shop not found.</p>;

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
              key={service.id.id} // Sửa key
              item={service} 
              onBuy={handleBuy}
              isProcessing={processingId === service.id.id} // Sửa so sánh
            />
          ))
        ) : (
          <p className="col-span-full text-center text-gray-500">No services available.</p>
        )}
      </div>
    </div>
  );
}