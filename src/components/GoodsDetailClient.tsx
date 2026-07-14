"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Header from "@/components/Header";
import { GoodsDetailSkeleton } from "@/components/Skeleton";

interface GoodsDetail {
  id: number; title: string; description: string; price: number;
  status: string; seller_contact: string; seller_name: string;
  category_name: string; created_at: string; seller_id: number;
}

export default function GoodsDetailClient({ goods: initial }: { goods: GoodsDetail }) {
  const router = useRouter();
  const { user } = useAuth();
  const [goods, setGoods] = useState<GoodsDetail>(initial);
  const [buying, setBuying] = useState(false);
  const [msg, setMsg] = useState("");

  const handleBuy = async () => {
    if (!user) { setMsg("请先登录"); return; }
    if (user.id === goods.seller_id) { setMsg("不能购买自己的商品"); return; }
    setBuying(true);
    setMsg("");
    try {
      const res = await api.post("/api/orders", { goodsId: goods.id });
      setMsg("购买成功！等待卖家确认");
      setGoods({ ...goods, status: "sold" });
    } catch (err: any) {
      setMsg(err.message || "购买失败");
    } finally {
      setBuying(false);
    }
  };

  const handleFavorite = async () => {
    if (!user) { setMsg("请先登录"); return; }
    try {
      await api.post("/api/favorites/" + goods.id);
      setMsg("已收藏");
    } catch { setMsg("收藏失败"); }
  };

  const statusLabels: Record<string, string> = {
    pending: "待审核", approved: "在售", rejected: "已驳回", sold: "已售", offline: "已下架",
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto p-4 w-full">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
          ← 返回
        </button>

        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="h-48 md:h-64 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-6xl">
            {goods.category_name === "教材教辅" ? "📚" :
             goods.category_name === "电子产品" ? "💻" :
             goods.category_name === "生活用品" ? "🏔" :
             goods.category_name === "运动户外" ? "⚽" :
             goods.category_name === "服饰箱包" ? "👔" : "📦"}
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold">{goods.title}</h1>
                <span className={"text-xs px-2 py-0.5 rounded inline-block mt-1 " + (
                  goods.status === "approved" ? "bg-green-100 text-green-700" :
                  goods.status === "sold" ? "bg-gray-100 text-gray-600" :
                  "bg-yellow-100 text-yellow-700"
                )}>
                  {statusLabels[goods.status] || goods.status}
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-600">¥{goods.price.toFixed(2)}</p>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{goods.description}</p>

            <div className="grid grid-cols-2 gap-3 text-sm border-t pt-4">
              <div><span className="text-gray-400">分类：</span>{goods.category_name}</div>
              <div><span className="text-gray-400">卖家：</span>{goods.seller_name}</div>
              <div><span className="text-gray-400">联系方式：</span>{goods.seller_contact || "面议"}</div>
              <div><span className="text-gray-400">发布时间：</span>{new Date(goods.created_at).toLocaleDateString("zh-CN")}</div>
            </div>

            {goods.status === "approved" && (
              <div className="flex gap-3 pt-2">
                <button onClick={handleBuy} disabled={buying}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {buying ? "处理中..." : "立即购买"}
                </button>
                <button onClick={handleFavorite}
                  className="px-4 py-2.5 border rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                  收藏 ♡
                </button>
              </div>
            )}

            {msg && (
              <div className={"text-sm p-3 rounded-lg " + (msg.includes("成功") ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700")}>
                {msg}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
