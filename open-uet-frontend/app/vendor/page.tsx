"use client";

import { useState, useEffect } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClientQuery } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

// ⚠️ BẮT BUỘC: Bạn phải điền ID thật vào đây (Lấy từ lần deploy trước)
const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID as string;
const SHOP_REGISTRY = process.env.NEXT_PUBLIC_SHOP_REGISTRY as string;
const MODULE_NAME = "vouchers";

// Hàm tiện ích: Chuyển tiếng Việt sang không dấu (Vì contract cũ chỉ nhận ASCII)
function removeVietnameseTones(str: string) {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9\s-_]/g, ''); // Chỉ giữ lại ký tự an toàn
}

export default function VendorPage() {
  const account = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
  
  const [shopName, setShopName] = useState("");
  const [shopDesc, setShopDesc] = useState("");
  
  // State tạo Service
  const [selectedShopCap, setSelectedShopCap] = useState(""); 
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("");

  // Tự động tìm ShopCap
  const { data: ownedShopCaps, refetch: refetchCaps } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address || "",
      filter: { StructType: `${PACKAGE_ID}::vouchers::ShopCap` },
      options: { showContent: true }
    },
    { enabled: !!account}
  );

  // --- 1. HÀM TẠO SHOP ---
  const handleCreateShop = () => {
    if (!account) return alert("Vui lòng kết nối ví");
    
    // Kiểm tra cấu hình
    if (PACKAGE_ID.includes("...") || SHOP_REGISTRY.includes("...")) {
        return alert("Lỗi: Bạn chưa điền PACKAGE_ID và SHOP_REGISTRY trong code!");
    }

    // Xử lý dữ liệu đầu vào (Quan trọng: Contract cũ chỉ nhận ASCII)
    const safeName = removeVietnameseTones(shopName);
    const safeDesc = removeVietnameseTones(shopDesc);

    if (!safeName) return alert("Vui lòng nhập tên Shop!");

    console.log("Đang tạo Shop:", { safeName, safeDesc });

    const tx = new Transaction();
    
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::register_shop`,
      arguments: [
        tx.object(SHOP_REGISTRY),
        tx.pure.string(safeName), 
        tx.pure.string(safeDesc)
      ]
    });

    signAndExecuteTransaction({ transaction: tx }, {
      onSuccess: (result) => {
        console.log("Thành công:", result);
        alert(`Tạo Shop "${safeName}" thành công! Đợi vài giây để hệ thống cập nhật.`);
        setShopName("");
        setShopDesc("");
        // Load lại danh sách ShopCap sau 2s
        setTimeout(() => refetchCaps(), 2000);
      },
      onError: (err) => {
        console.error("Lỗi tạo shop:", err);
        alert("Lỗi: " + err.message);
      }
    });
  };

  // --- 2. HÀM TẠO SERVICE ---
  const handleAddService = () => {
    if (!account || !selectedShopCap) return alert("Vui lòng chọn Shop của bạn!");
    
    // Tìm Shop ID từ ShopCap đã chọn
    const capObject = ownedShopCaps?.data.find(item => item.data?.objectId === selectedShopCap);
    // @ts-ignore
    const shopId = capObject?.data?.content?.fields?.shop_id; 

    if (!shopId) return alert("Không tìm thấy Shop ID. Hãy thử reload trang.");

    // Xử lý dữ liệu đầu vào
    const safeServiceName = removeVietnameseTones(serviceName);
    
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${PACKAGE_ID}::${MODULE_NAME}::register_service`,
      arguments: [
        tx.object(shopId),          
        tx.object(selectedShopCap), 
        tx.pure.string(safeServiceName),
        tx.pure.u64(Number(servicePrice))
      ]
    });

    signAndExecuteTransaction({ transaction: tx }, {
      onSuccess: () => {
        alert("Thêm dịch vụ thành công!");
        setServiceName("");
        setServicePrice("");
      },
      onError: (err) => {
        console.error(err);
        alert("Lỗi: " + err.message);
      }
    });
  };

  if (!account) return <div className="p-10 text-center">Vui lòng kết nối ví để quản lý cửa hàng</div>;

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8 text-blue-800">Trang Quản Lý Cửa Hàng</h1>

      {/* Form 1: Tạo Shop */}
      <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-gray-200">
        <h2 className="text-xl font-bold mb-4">🏪 Mở Cửa Hàng Mới</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Tên cửa hàng (Tiếng Việt không dấu)</label>
            <input 
                className="w-full border p-2 rounded" 
                placeholder="VD: Tiem Com Sinh Vien"
                value={shopName} onChange={e => setShopName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Mô tả</label>
            <textarea 
                className="w-full border p-2 rounded" 
                placeholder="Mo ta ngan gon..."
                value={shopDesc} onChange={e => setShopDesc(e.target.value)}
            />
          </div>
          <button 
            onClick={handleCreateShop}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-semibold"
          >
            Tạo Cửa Hàng
          </button>
        </div>
      </div>

      {/* Form 2: Thêm Service */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h2 className="text-xl font-bold mb-4">➕ Thêm Dịch Vụ / Voucher</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Shop của bạn:</label>
          <select 
            className="w-full border p-2 rounded bg-gray-50"
            value={selectedShopCap}
            onChange={(e) => setSelectedShopCap(e.target.value)}
          >
            <option value="">-- Chọn Shop --</option>
            {ownedShopCaps?.data.map((cap) => (
              <option key={cap.data?.objectId} value={cap.data?.objectId}>
                ShopCap: {cap.data?.objectId.slice(0, 8)}...
              </option>
            ))}
          </select>
          {ownedShopCaps?.data.length === 0 && <p className="text-xs text-orange-500 mt-1">Bạn chưa có Shop nào. Hãy tạo ở trên trước.</p>}
        </div>

        <div className="space-y-4">
          <input 
            className="w-full border p-2 rounded" 
            placeholder="Tên dịch vụ (VD: Com Trua 25k)"
            value={serviceName} onChange={e => setServiceName(e.target.value)}
          />
          <input 
            className="w-full border p-2 rounded" 
            placeholder="Giá (UET Coin)"
            type="number"
            value={servicePrice} onChange={e => setServicePrice(e.target.value)}
          />
          <button 
            onClick={handleAddService}
            disabled={!selectedShopCap}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 font-semibold disabled:bg-gray-400"
          >
            Đăng Dịch Vụ
          </button>
        </div>
      </div>
    </div>
  );
}