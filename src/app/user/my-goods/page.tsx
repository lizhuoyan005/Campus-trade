"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Header from "@/components/Header";
import GoodsCard from "@/components/GoodsCard";
import EmptyState from "@/components/EmptyState";

export default function MyGoodsPage() {
  const { user } = useAuth();
  const [goods, setGoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const loadGoods = async (status?: string) => {
    setLoading(true);
    setFilter(status || "");
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      params.set("pageSize", "50");
      params.set("sortBy", "newest");
      const res = await api.get("/api/goods?" + params.toString());
      // Filter by current user as seller
      const myGoods = (res.data || []).filter((g: any) => g.seller_id === user?.id);
      setGoods(myGoods);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { if (user) loadGoods(); else setLoading(false); }, [user]);

  if (!user) return <> <Header /><main className="max-w-6xl mx-auto p-4"><div className="bg-yellow-50 rounded-lg p-6 text-center text-yellow-700">请先登录</div></main></>;

  const filtered = filter ? goods.filter((g: any) => g.status === filter) : goods;

  return (
    <>
      <Header />
      <main className="flex-1 max-w-6xl mx-auto p-4 w-full">
        <h1 className="text-xl font-bold mb-4">我的发布</h1>
        <div className="flex gap-2 mb-4">
          {["", "pending", "approved", "rejected", "sold"].map(s => (
            <button key={s} onClick={() => loadGoods(s)}
              className={"px-3 py-1.5 text-sm rounded-lg " + (filter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
              {s || "全部"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState message="还没有发布商品" suggestion="去发布一件闲置物品吧" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((item: any) => <GoodsCard key={item.id} item={item} />)}
          </div>
        )}
      </main>
    </>
  );
}
