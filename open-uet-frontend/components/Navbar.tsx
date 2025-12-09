// components/Navbar.tsx
"use client";

import Link from "next/link";
import { ConnectButton, useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";

const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID as string;
const UET_COIN_TYPE = `${PACKAGE_ID}::uet_coin::UET_COIN`;
const REWARD_SYSTEM_CAP_TYPE = `${PACKAGE_ID}::reward_system::RewardSystemCap`;
const SHOP_CAP_TYPE = `${PACKAGE_ID}::vouchers::ShopCap`;

export default function Navbar() {
  const account = useCurrentAccount();

  // 1. Lấy số dư SUI (Native)
  const { data: suiBalance } = useSuiClientQuery(
    "getBalance",
    { owner: account?.address as string },
    { enabled: !!account }
  );

  // 2. Lấy số dư UET COIN (Custom Token)
  const { data: uetBalance } = useSuiClientQuery(
    "getBalance",
    { 
      owner: account?.address as string,
      coinType: UET_COIN_TYPE // <-- Chỉ định rõ loại coin muốn lấy
    },
    { enabled: !!account }
  );

  // 3. Kiểm tra quyền admin hoặc shop
  const { data: rewardSystemCapObjects, isLoading: isLoadingAdmin } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address as string,
      filter: { StructType: REWARD_SYSTEM_CAP_TYPE }
    },
    { enabled: !!account }
  );

  // 4. Kiểm tra quyền shop
  const { data: shopCapObjects, isLoading: isLoadingShop } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address as string,
      filter: { StructType: SHOP_CAP_TYPE }
    },
    { enabled: !!account }
  );

  const isAdmin = rewardSystemCapObjects && rewardSystemCapObjects?.data.length > 0;
  const isShop = shopCapObjects && shopCapObjects?.data.length > 0;

  // Hàm format số dư (SUI có 9 số lẻ, UET có 3 số lẻ theo file move của bạn)
  const formatBalance = (balance: string | undefined, decimals: number) => {
    if (!balance) return "0";
    return (Number(balance) / Math.pow(10, decimals)).toFixed(2);
  };

  return (
    <nav className="w-full bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      <Link href="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700">
        Open-UET
      </Link>

      <div className="hidden md:flex gap-8 font-medium text-gray-600">
        {/* <Link href="/services" className="hover:text-blue-600 transition">Dịch vụ</Link> */}
        <Link href="/shop" className="hover:text-blue-600 transition">Shop</Link>
        <Link href="/vendor" className="hover:text-blue-600 transition">Vendor</Link>

        <Link href="/marketplace" className="hover:text-blue-600 transition">Chợ P2P</Link>
        <Link href="/inventory" className="hover:text-blue-600 transition">Túi đồ</Link>
        <Link href="/exchange" className="text-blue-600 font-semibold hover:text-blue-800 transition">Đổi Điểm</Link>
      </div>

      <div className="flex items-center gap-4">
        {account && (
          <div className="hidden md:flex gap-2 text-sm font-semibold">


            {/* Hiển thị UET Coin */}
            {uetBalance && (
              <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                {formatBalance(uetBalance.totalBalance, 0)} UETC
              </div>
            )}
            
            {/* Hiển thị SUI */}
            {suiBalance && (
              <div className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg border border-gray-200">
                {formatBalance(suiBalance.totalBalance, 9)} SUI
              </div>
            )}

            {/* {Hiển thị quyền admin hoặc shop} */}
            {(isLoadingAdmin || isLoadingShop) ? (
              <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg border border-gray-200 animate-pulse">
                Đang kiểm tra quyền...
              </div>
            ) : isAdmin ? (
              <Link href="/admin" className="px-4 py-2 bg-red-50 text-red-700 rounded-lg border border-red-200 hover:bg-red-100 transition">
                🛡️ Admin
              </Link>
            ) : isShop ? (
              <Link href="/shop/dashboard" className="px-4 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 transition">
                🛒 Shop
              </Link>
            ) : (
              <div className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg border border-gray-200">
                👤 User
              </div>
            ) 
            }
            
          </div>
        )}
        
        <ConnectButton />
      </div>
    </nav>
  );
}