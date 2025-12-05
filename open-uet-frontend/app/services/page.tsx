"use client";

import { useState } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

// ⚠️ ĐIỀN ĐỊA CHỈ VÍ CỦA ADMIN/QUỸ NHÀ TRƯỜNG VÀO ĐÂY ĐỂ NHẬN TIỀN
const TREASURY_WALLET = "0x_DIA_CHI_VI_NHAN_TIEN_CUA_BAN"; 

// Dữ liệu dịch vụ mẫu
const SERVICES = [
  { id: 1, name: "Suất Cơm Trưa", price: 50, image: "🍱" },
  { id: 2, name: "Vé Xe Tháng", price: 100, image: "🛵" },
  { id: 3, name: "Voucher In Ấn", price: 20, image: "🖨️" },
];

export default function ServicesPage() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const handleBuy = async (service: any) => {
    if (!account) return alert("Vui lòng kết nối ví trước!");
    setLoadingId(service.id);

    try {
      // 1. Tạo giao dịch chuyển tiền (SUI hoặc UET)
      const tx = new Transaction();
      
      // Demo: Chuyển 0.00... SUI tượng trưng (Vì logic chọn UET Coin hơi dài)
      // Nếu bạn muốn chuyển UET thật, cần query coin object giống bên Admin Dashboard
      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(1000)]); 
      tx.transferObjects([coin], tx.pure.address(TREASURY_WALLET));

      // 2. Ký và gửi lên Blockchain
      signAndExecute(
        { transaction: tx },
        {
          onSuccess: async (result) => {
            console.log("Thanh toán thành công:", result);
            
            // 3. Gọi Backend để lấy Voucher
            const res = await fetch("http://localhost:5000/api/buy-voucher", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                wallet_address: account.address,
                service_name: service.name,
                price: service.price,
                tx_digest: result.digest // Gửi mã giao dịch để xác thực
              })
            });

            const data = await res.json();
            if (res.ok) {
              alert(`🎉 Mua thành công! Mã Voucher của bạn là: ${data.voucher.code}`);
            } else {
              alert("Lỗi Backend: " + data.error);
            }
            setLoadingId(null);
          },
          onError: (err) => {
            console.error(err);
            alert("Giao dịch thất bại hoặc bị hủy.");
            setLoadingId(null);
          }
        }
      );
    } catch (err) {
      console.error(err);
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-center mb-2 text-blue-700">Dịch Vụ & Tiện Ích</h1>
      <p className="text-center text-gray-500 mb-8">Dùng UET Coin đổi lấy các dịch vụ quanh trường</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {SERVICES.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition text-center border border-gray-100">
            <div className="text-6xl mb-4">{item.image}</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">{item.name}</h3>
            <p className="text-blue-600 font-bold text-2xl mb-4">{item.price} UET</p>
            <button 
              disabled={loadingId === item.id}
              onClick={() => handleBuy(item)}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold transition"
            >
              {loadingId === item.id ? "Đang xử lý..." : "Đổi Ngay"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}