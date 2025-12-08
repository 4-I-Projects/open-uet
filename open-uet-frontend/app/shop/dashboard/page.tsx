"use client";
import { Transaction } from '@mysten/sui/transactions';
import { useCurrentAccount, useSuiClientQuery, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Voucher } from '@/data/mock';
import { SuiClient } from '@mysten/sui/client';

import { useState } from 'react';

const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID as string;

const VOUCHER_TYPE = `${PACKAGE_ID}::vouchers::Voucher`;
const SHOP_CAP_TYPE = `${PACKAGE_ID}::vouchers::ShopCap`;

const client = new SuiClient({ url: 'https://fullnode.testnet.sui.io:443' });
export default function InventoryPage() {
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: shopCapObjects, isLoading: isLoadingShop } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address as string,
      filter: { StructType: SHOP_CAP_TYPE },
      options: {
        showContent: true
      }
    },
    { enabled: !!account }
  );

  const checkVoucher = async (voucher) => {
    console.log(shopCapObjects)
    console.log(voucher)
    const content = voucher.data?.content as any;
    const fields = content?.fields; 

    // Voucher struct có: id, value, service_id
    const value = fields?.value;
    const serviceId = fields?.service_id;
    const objectId = voucher.data?.objectId;
    setProcessingId(objectId);

    const shop = await client.getObject({
        id: serviceId,
        options: { showContent: true, showType: true }
    });
    console.log('shop is ', shop);

    let shopCap;
    if (!shopCapObjects) return 
    for (let i = 0; i < shopCapObjects?.data.length; i++) {
        if (shopCapObjects.data[i].data?.content?.fields?.shop_id == shop?.data?.content.fields.shop_id) { 
            shopCap = shopCapObjects.data[i];
        }
    }
    console.log('shop cap is ', shopCap)
    // console.log(voucehr)

    const tx = new Transaction();
    try {
        tx.moveCall({
          target: `${PACKAGE_ID}::vouchers::check_voucher`,
          arguments: [
            // service
            tx.object(serviceId),
            // shop cap
            tx.object(shopCap?.data?.content.fields.id.id),
            //voucher
            tx.object(objectId), // Truy cập đúng id
          ],
        });

        signAndExecuteTransaction({
          transaction: tx,
        }, {
            onSuccess: () => {
                alert("Kiểm tra thành công, voucher dùng được");
                setProcessingId(null);
            },
            onError: (err) => {
                console.error(err);
                alert("Kiểm tra thất bại");
                setProcessingId(null);
            }
        });
    } catch (e) {
        console.error(e);
        setProcessingId(null);
    }
  }

  // Gọi trực tiếp Blockchain để lấy các object Voucher mà ví này đang sở hữu
  const { data, isPending, error } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address || "",
      filter: { StructType: VOUCHER_TYPE }, // Chỉ lọc lấy các object là Voucher
      options: {
        showContent: true, // Để xem nội dung bên trong (value, service_id)
        showDisplay: true,
      },
    },
    {
      enabled: !!account, // Chỉ chạy khi đã kết nối ví
      refetchInterval: 5000, // Tự động làm mới mỗi 5 giây để thấy voucher mới mua
    }
  );

  if (!account) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <h2 className="text-xl font-semibold text-gray-600">
          Vui lòng kết nối ví để xem túi đồ
        </h2>
      </div>
    );
  }

  if (isPending) return <div className="p-10 text-center">Đang tải túi đồ từ Blockchain...</div>;
  if (error) return <div className="p-10 text-center text-red-500">Lỗi: {error.message}</div>;

  const vouchers = data?.data || [];
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-2">
          🎒 Túi Đồ Blockchain
          <span className="text-sm font-normal text-white bg-blue-600 px-3 py-1 rounded-full">
            {vouchers.length} món
          </span>
        </h1>

        {vouchers.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xl text-gray-500 mb-4">Bạn chưa có voucher nào.</p>
            <a href="/shop" className="text-blue-600 font-semibold hover:underline">
              → Đến cửa hàng đổi quà ngay
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vouchers.map((obj) => {
              // Lấy dữ liệu từ object fields
              const content = obj.data?.content as any;
              const fields = content?.fields; 
              
              // Voucher struct có: id, value, service_id
              const value = fields?.value;
              const serviceId = fields?.service_id;
              const objectId = obj.data?.objectId;

              return (
                <div
                  key={objectId}
                  className="relative p-6 rounded-xl border-2 bg-white border-blue-200 shadow-lg hover:scale-105 transition-all"
                >
                  <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                    SẴN SÀNG
                  </div>

                  <div className="mb-4 text-4xl">🎟️</div>

                  {/* Hiện tại struct Voucher không lưu tên Service, chỉ lưu ID. 
                      Để hiện tên, cần fetch thêm Service object, nhưng tạm thời hiện ID */}
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    Voucher Dịch vụ
                  </h3>
                  
                  <div className="text-sm text-gray-500 mb-2 truncate">
                    Service ID: {serviceId}
                  </div>

                  <div className="mt-4 bg-gray-50 p-3 rounded-lg border border-dashed border-gray-300 text-center">
                    <p className="text-xs text-gray-500 uppercase mb-1">
                      Giá trị Voucher
                    </p>
                    <p className="text-xl font-mono font-black text-blue-700">
                      {/* Chia 1 triệu để ra số UET gốc */}
                      {value ? Number(value) / 1000000 : 0} UET
                    </p>
                  </div>

                  <div className="mt-4 text-center">
                    <a
                      href={`https://suiscan.xyz/testnet/object/${objectId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline"
                    >
                      Xem trên SuiScan ↗
                    </a>
                  </div>
                  <div>
                    <button onClick={() => checkVoucher(obj)}>Check</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}