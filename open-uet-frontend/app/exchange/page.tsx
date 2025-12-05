// app/exchange/page.tsx
"use client";

import { useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";

export default function ExchangePage() {
  const account = useCurrentAccount();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    studentId: "",
    certificateId: "",
    file: null as File | null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account) {
      alert("Vui lòng kết nối ví trước khi gửi yêu cầu!");
      return;
    }

    if (!formData.file) {
      alert("Vui lòng tải lên ảnh minh chứng!");
      return;
    }

    setLoading(true);

    // --- MÔ PHỎNG GỬI API ---
    // Ở đây bạn sẽ dùng fetch() để gửi formData tới Backend của bạn
    // Backend sẽ lưu ảnh, thông tin và chờ Admin duyệt thủ công.
    try {
      // 1. Tạo FormData để gửi file và text
      const data = new FormData();
      data.append("studentId", formData.studentId);
      data.append("certificateId", formData.certificateId);
      data.append("walletAddress", account.address); // Ví lấy từ hook useCurrentAccount
      data.append("file", formData.file);

      // 2. Gọi API Flask
      const response = await fetch("http://localhost:5000/api/submit", {
        method: "POST",
        body: data,
      });

      const result = await response.json();

      if (response.ok) {
        alert("Gửi thành công! Mã đơn: " + result.id);
        setFormData({ studentId: "", certificateId: "", file: null });
      } else {
        alert("Lỗi: " + result.error);
      }

    } catch (error) {
      console.error("Lỗi kết nối:", error);
      alert("Không thể kết nối tới server backend!");
    } finally {
      setLoading(false);
    }

    setTimeout(() => {
      alert("Gửi yêu cầu thành công! Admin sẽ duyệt và gửi token cho bạn sớm.");
      setLoading(false);
      // Reset form
      setFormData({ studentId: "", certificateId: "", file: null });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8">
        <h2 className="text-2xl font-bold text-center text-blue-600 mb-6">
          Đổi Chứng Chỉ Nhận Coin
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mã Sinh Viên */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Mã Sinh Viên</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              placeholder="Ví dụ: 20020001"
              value={formData.studentId}
              onChange={(e) => setFormData({...formData, studentId: e.target.value})}
            />
          </div>

          {/* Mã Giấy Chứng Nhận */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Mã Giấy Chứng Nhận</label>
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              placeholder="Ví dụ: CERT-2024-XYZ"
              value={formData.certificateId}
              onChange={(e) => setFormData({...formData, certificateId: e.target.value})}
            />
          </div>

          {/* Upload Ảnh */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Ảnh Minh Chứng</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                    <span>Tải ảnh lên</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                  </label>
                </div>
                <p className="text-xs text-gray-500">{formData.file ? formData.file.name : "PNG, JPG, GIF up to 10MB"}</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? "Đang gửi..." : "Gửi Yêu Cầu"}
          </button>
        </form>
      </div>
    </div>
  );
}