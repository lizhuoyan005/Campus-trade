"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Header from "@/components/Header";
import GoodsCard from "@/components/GoodsCard";
import EmptyState from "@/components/EmptyState";

export default function FavoritesPage() {
  const { user } = useAuth();
  const [goods, setGoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.get("/api/favorites").then(r => { setGoods(r.data || []); }).catch(() => {}).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  if (!user) return <> <Header /><main className="max-w-6xl mx-auto p-4"><div className="bg-yellow-50 rounded-lg p-6 text-center text-yellow-700">请先登录</div></main></>;

  return (
    <>
      <Header />
      <main className="flex-1 max-w-6xl mx-auto p-4 w-full">
        <h1 className="text-xl font-bold mb-6">我的收藏</h1>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : goods.length === 0 ? (
          <EmptyState message="还没有收藏任何商品" suggestion="去首页逛逛吧" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {goods.map((item: any) => <GoodsCard key={item.id} item={item} />)}
          </div>
        )}
      </main>
    </>
  );
}
