// src/app/page.tsx
"use client";
import { ConnectButton } from "@mysten/dapp-kit";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold text-blue-600 mb-8">
          Open-UET Gateway
        </h1>
        
        <div className="p-6 bg-white rounded-xl shadow-lg flex flex-col items-center gap-4">
          <p className="text-gray-600">Kết nối ví để bắt đầu đổi điểm rèn luyện</p>
          {/* Nút kết nối ví thần thánh */}
          <ConnectButton />
        </div>
      </div>
    </main>
  );
}