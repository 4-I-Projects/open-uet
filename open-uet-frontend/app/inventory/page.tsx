// app/inventory/page.tsx
"use client";

import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";

// ID Package của bạn
const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID as string;

// Struct type đầy đủ của Voucher
const VOUCHER_TYPE = `${PACKAGE_ID}::vouchers::Voucher`;

export default function InventoryPage() {
  const account = useCurrentAccount();

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
                      {value ? Number(value) / 1 : 0} UET
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}