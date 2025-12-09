"use client";

import { useEffect, useState } from "react";
import { 
  useCurrentAccount, 
  useSuiClient, 
  useSignAndExecuteTransaction // <-- 1. Đổi tên Hook
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions"; // <-- 2. Import từ @mysten/sui (bản mới)
import { useRouter } from "next/navigation";

// ⚠️ Đảm bảo chuỗi này khớp với Navbar và Contract của bạn
const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID as string;
const UET_COIN_TYPE = `${PACKAGE_ID}::uet_coin::UET_COIN`;
const UET_DECIMALS = 6;

type ExchangeRequest = {
  id: number;
  student_id: string;
  wallet_address: string;
  certificate_id: string;
  image_url: string;
  status: string;
  created_at: string;
};

export default function AdminPage() {
  const account = useCurrentAccount();
  const client = useSuiClient(); 
  const { mutate: signAndExecute } = useSignAndExecuteTransaction(); // <-- 3. Sử dụng Hook mới
  const router = useRouter();

  const [requests, setRequests] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pointsInput, setPointsInput] = useState<{ [key: number]: string }>({});

  const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS;

  useEffect(() => {
    if (!account) return;
    if (account.address !== ADMIN_ADDRESS) {
      alert("Bạn không có quyền truy cập trang quản trị!");
      router.push("/");
      return;
    }
    fetchRequests();
  }, [account, ADMIN_ADDRESS, router]);

  const fetchRequests = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/requests");
      const data = await res.json();
      setRequests(data);
    } catch (error) {
      console.error("Lỗi tải đơn:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (req: ExchangeRequest) => {
    const amountStr = pointsInput[req.id];
    if (!amountStr || Number(amountStr) <= 0) {
      alert("Vui lòng nhập số điểm hợp lệ!");
      return;
    }
    
    // Lưu ý: SUI SDK mới yêu cầu BigInt rõ ràng
    const amountToSend = BigInt(Number(amountStr));

    try {
      const { data: coins } = await client.getCoins({
        owner: account!.address,
        coinType: UET_COIN_TYPE,
      });

      if (!coins || coins.length === 0) {
        alert("Ví Admin đã hết UET Coin!");
        return;
      }

      const coinToSplit = coins.find(c => BigInt(c.balance) >= amountToSend);
      if (!coinToSplit) {
        alert("Không có coin object nào đủ số dư để chia nhỏ.");
        return;
      }

      // --- 4. Sử dụng Transaction (thay vì TransactionBlock) ---
      const tx = new Transaction();
      
      // Lệnh: Tách (Split) coin
      const [coinToSend] = tx.splitCoins(
        tx.object(coinToSplit.coinObjectId), 
        [tx.pure.u64(amountToSend)] // <-- Dùng tx.pure.u64 cho số lớn
      );
      
      // Lệnh: Chuyển (Transfer)
      tx.transferObjects([coinToSend], tx.pure.address(req.wallet_address));

      // --- 5. Gọi hàm ký (Cập nhật tham số) ---
      signAndExecute(
        { transaction: tx }, // <-- Tham số đổi từ 'transactionBlock' thành 'transaction'
        {
          onSuccess: async (result) => { // 'result' đã được type tự động bởi hook
            console.log("Giao dịch thành công:", result);
            alert(`Đã chuyển ${amountStr} UET cho SV ${req.student_id}!`);
            
            await fetch("http://localhost:5000/api/admin/update-status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: req.id, status: "APPROVED" })
            });

            fetchRequests();
          },
          onError: (err) => { // 'err' đã được type tự động
            console.error("Lỗi Blockchain:", err);
            alert("Giao dịch thất bại! Xem console để biết chi tiết.");
          }
        }
      );

    } catch (err) {
      console.error(err);
      alert("Có lỗi xảy ra khi tạo giao dịch.");
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm("Bạn chắc chắn muốn từ chối đơn này?")) return;
    
    await fetch("http://localhost:5000/api/admin/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "REJECTED" })
    });
    fetchRequests();
  };

  if (!account) return <div className="p-10 text-center">Đang chờ kết nối ví...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* ... (Phần giao diện giữ nguyên như cũ) ... */}
       <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-2">
          🛡️ Admin Dashboard
          <span className="text-sm font-normal text-gray-500 bg-white px-3 py-1 rounded-full border">
            Ví: {account.address.slice(0, 6)}...{account.address.slice(-4)}
          </span>
        </h1>

        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : requests.length === 0 ? (
          <div className="bg-white p-10 rounded-xl text-center shadow">
            <p className="text-gray-500 text-lg">Không có yêu cầu nào đang chờ xử lý.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {requests.map((req) => (
              <div key={req.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 flex flex-col">
                <div className="h-56 bg-gray-200 relative group cursor-pointer" onClick={() => window.open(req.image_url, '_blank')}>
                  <img src={req.image_url} alt="Minh chứng" className="w-full h-full object-cover transition group-hover:opacity-90"/>
                </div>
                
                <div className="p-5 flex-1 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-semibold">Mã Sinh Viên</p>
                      <p className="font-bold text-xl text-blue-700">{req.student_id}</p>
                    </div>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">{req.status}</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">Chứng chỉ</p>
                    <p className="font-medium text-gray-800">{req.certificate_id}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded text-xs font-mono text-gray-600 truncate">Ví: {req.wallet_address}</div>

                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điểm thưởng (UETC)</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        placeholder="VD: 50"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={pointsInput[req.id] || ""}
                        onChange={(e) => setPointsInput({...pointsInput, [req.id]: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleApprove(req)} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold shadow-sm">✅ Duyệt</button>
                      <button onClick={() => handleReject(req.id)} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium">❌ Hủy</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}