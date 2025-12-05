"use client";
import { useState } from "react";

export default function PartnerPage() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<any>(null);

  const checkVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!code) return;
    try {
      const res = await fetch("http://localhost:5000/api/partner/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert("Lỗi kết nối server");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Cổng Đối Tác</h2>
        <form onSubmit={checkVoucher} className="space-y-4">
          <input 
            type="text" 
            placeholder="Nhập mã Voucher (VD: UET-X1Y2)" 
            className="w-full p-3 border rounded text-center text-xl uppercase tracking-widest"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700">
            KIỂM TRA
          </button>
        </form>

        {result && (
          <div className={`mt-6 p-4 rounded text-center border-2 ${result.valid ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'}`}>
            <h3 className="text-xl font-bold">{result.valid ? "✅ HỢP LỆ" : "❌ KHÔNG HỢP LỆ"}</h3>
            <p className="mt-1">{result.message}</p>
            {result.valid && <p className="font-semibold mt-2">Dịch vụ: {result.service}</p>}
          </div>
        )}
      </div>
    </div>
  );
}