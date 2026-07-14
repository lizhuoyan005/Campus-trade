import Link from "next/link";

interface GoodsItem {
  id: number;
  title: string;
  price: number;
  status: string;
  seller_name: string;
  category_name: string;
  created_at: string;
}

export default function GoodsCard({ item }: { item: GoodsItem }) {
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    sold: "bg-gray-100 text-gray-800",
  };
  const statusLabels: Record<string, string> = {
    pending: "待审核",
    approved: "在售",
    rejected: "已驳回",
    sold: "已售",
  };

  return (
    <Link href={"/goods/" + item.id} className="block bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
      <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-4xl">
        {item.category_name === "教材教辅" ? "📚" :
         item.category_name === "电子产品" ? "💻" :
         item.category_name === "生活用品" ? "🏠" :
         item.category_name === "运动户外" ? "⚽" :
         item.category_name === "服饰箱包" ? "👔" : "📦"}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between mb-1">
          <span className={"text-xs px-1.5 py-0.5 rounded " + (statusColors[item.status] || "bg-gray-100")}>
            {statusLabels[item.status] || item.status}
          </span>
        </div>
        <h3 className="font-medium text-sm line-clamp-1 mb-1">{item.title}</h3>
        <p className="text-blue-600 font-bold text-base">¥{item.price.toFixed(2)}</p>
        <div className="flex items-center justify-between mt-1 text-xs text-gray-400">
          <span>{item.seller_name}</span>
          <span>{new Date(item.created_at).toLocaleDateString("zh-CN")}</span>
        </div>
      </div>
    </Link>
  );
}
