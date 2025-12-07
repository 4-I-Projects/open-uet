"use client";

import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";

export default function InventoryPage() {
  const account = useCurrentAccount();
  const address = account?.address;
  // if (address) {
  const { data } = useSuiClientQuery('getOwnedObjects', {
    owner: address ? address : "",
    options: {
      showType: true,
      showDisplay: true,
      showContent: true,
    },
  });
  if (!data) return null;
  // }


  return (
    address ? 
      <div>
        {data.data.map((object) => (
          <li className="text-gray-800" key={object.data?.objectId}>
            <a href={`https://suiscan.xyz/testnet/object/${object.data?.objectId}`}>
              <div>
                {object.data?.objectId}
              </div>
              <div>
                {object.data?.type}
              </div>
            </a>
          </li>
        ))}
      </div> :
      <div className="p-8 text-center text-2xl">Trang Túi Đồ Của Tôi (Đang xây dựng)</div>
    
  );
}