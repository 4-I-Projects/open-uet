// components/Navbar.tsx
"use client";

import Link from "next/link";
import { ConnectButton, useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";

export default function Navbar() {
  // 1. Lấy thông tin tài khoản đang kết nối
  const account = useCurrentAccount();

  // 2. Query lấy số dư (Balance) từ Blockchain
  const { data: balance } = useSuiClientQuery(
    "getBalance",
    { owner: account?.address as string },
    { enabled: !!account } // Chỉ chạy khi đã kết nối ví
  );

  return (
    <nav className="w-full bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      {/* Logo */}
      <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700">
        Open-UET
      </Link>

      {/* Menu Links */}
      <div className="hidden md:flex gap-8 font-medium text-gray-600">
        <Link href="/services" className="hover:text-blue-600 transition">
          Dịch vụ
        </Link>
        <Link href="/marketplace" className="hover:text-blue-600 transition">
          Chợ P2P
        </Link>
        <Link href="/inventory" className="hover:text-blue-600 transition">
          Túi đồ
        </Link>
        <Link href="/exchange" className="text-blue-600 font-semibold hover:text-blue-800 transition">
          Đổi Điểm
        </Link>
      </div>

      {/* Phần bên phải: Hiển thị số dư + Nút Connect */}
      <div className="flex items-center gap-4">
        {/* Nếu đã kết nối thì hiện số dư */}
        {account && balance && (
          <div className="hidden md:block px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold text-gray-700 border border-gray-200">
            {/* Chia cho 1 tỷ vì SUI có 9 số thập phân (MIST) */}
            {(Number(balance.totalBalance) / 1_000_000_000).toFixed(2)} SUI
          </div>
        )}
        
        <ConnectButton />
      </div>
    </nav>
  );
}