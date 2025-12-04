// app/services/page.tsx
"use client";

import { MOCK_SERVICES, ServiceItem } from "../../data/mock"; // Chú ý đường dẫn import
import ServiceCard from "../../components/ServiceCard";
import { useSignAndExecuteTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions"; // Cập nhật import cho bản mới nhất
import { useState } from "react";

export default function ServicesPage() {
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleBuy = (item: ServiceItem) => {
    if (!account) {
      alert("Vui lòng kết nối ví trước!");
      return;
    }

    setProcessingId(item.id);

    // 1. Tạo giao dịch
    const tx = new Transaction();
    
    // 2. Chia nhỏ coin (UET giả lập bằng SUI) để chuyển
    // Lưu ý: Đây là logic CHUYỂN SUI (tiền thật testnet).
    // Sau này sẽ đổi thành logic gọi Smart Contract.
    const [coin] = tx.splitCoins(tx.gas, [item.price * 1_000_000_000]); // Chuyển sang MIST
    
    // 3. Chuyển tiền đến ví của Nhà trường (Ví dụ ví admin)
    // Bạn có thể thay địa chỉ này bằng địa chỉ ví phụ của bạn để test
    tx.transferObjects([coin], "0x_DIA_CHI_VI_NHAN_TIEN_CUA_TRUONG_O_DAY");

    // 4. Gửi lên mạng
    signAndExecuteTransaction(
      {
        transaction: tx,
      },
      {
        onSuccess: (result) => {
          console.log("Mua thành công:", result);
          alert(`Đã mua ${item.name} thành công!`);
          setProcessingId(null);
        },
        onError: (error) => {
          console.error("Lỗi:", error);
          alert("Giao dịch thất bại");
          setProcessingId(null);
        },
      }
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Dịch vụ Sinh viên</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_SERVICES.map((item) => (
          <ServiceCard 
            key={item.id} 
            item={item} 
            onBuy={handleBuy}
            isProcessing={processingId === item.id}
          />
        ))}
      </div>
    </div>
  );
}