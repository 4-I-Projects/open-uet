// components/ServiceCard.tsx
import { Service } from "@/data/mock"; // Use the new Service type

interface ServiceCardProps {
  item: Service; // Changed from ServiceItem to Service
  onBuy: (item: Service) => void;
  isProcessing: boolean;
}

export default function ServiceCard({ item, onBuy, isProcessing }: ServiceCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300 flex flex-col">
      {/* Image/Icon section */}
      <div className="h-40 bg-gray-50 flex items-center justify-center text-7xl">
        {item.image}
      </div>
      
      {/* Content section */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-bold text-xl text-gray-900">{item.name}</h3>
        
        {/* Description - Assuming Service might not have it, but good to have */}
        {item.description && (
          <p className="text-gray-600 text-sm mt-2 flex-grow">{item.description}</p>
        )}
        
        <div className="mt-5 flex items-center justify-between">
          <span className="text-2xl text-blue-600 font-bold">{item.price} UETC</span>
          <button
            onClick={() => onBuy(item)}
            disabled={isProcessing}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-transform transform hover:scale-105
              ${isProcessing 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
              }`}
          >
            {isProcessing ? "Processing..." : "Buy Now"}
          </button>
        </div>
      </div>
    </div>
  );
}