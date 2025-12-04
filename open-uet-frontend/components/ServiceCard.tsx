// src/components/ServiceCard.tsx
import { ServiceItem } from "../data/mock";

interface ServiceCardProps {
  item: ServiceItem;
  onBuy: (item: ServiceItem) => void;
  isProcessing: boolean;
}

export default function ServiceCard({ item, onBuy, isProcessing }: ServiceCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition">
      <div className="h-32 bg-blue-100 flex items-center justify-center text-6xl">
        {item.image}
      </div>
      <div className="p-5">
        <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
        <p className="text-gray-500 text-sm mt-1 h-10">{item.description}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-blue-600 font-bold">{item.price} UET</span>
          <button
            onClick={() => onBuy(item)}
            disabled={isProcessing}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition
              ${isProcessing 
                ? "bg-gray-300 cursor-not-allowed" 
                : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
          >
            {isProcessing ? "Đang xử lý..." : "Mua ngay"}
          </button>
        </div>
      </div>
    </div>
  );
}