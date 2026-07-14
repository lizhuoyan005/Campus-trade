"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Header from "@/components/Header";
import GoodsCard from "@/components/GoodsCard";
import { GoodsCardSkeleton } from "@/components/Skeleton";
import EmptyState from "@/components/EmptyState";

interface GoodsItem {
  id: number; title: string; price: number; status: string;
  seller_name: string; category_name: string; created_at: string;
}
interface Category { id: number; name: string; icon: string; }
interface Pagination { total: number; page: number; pageSize: number; totalPages: number; }

export default function GoodsListClient({
  initialData, initialPagination, categories, currentKeyword, currentCategoryId, currentMinPrice, currentMaxPrice
}: {
  initialData: GoodsItem[]; initialPagination: Pagination; categories: Category[];
  currentKeyword: string; currentCategoryId: string; currentMinPrice: string; currentMaxPrice: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [goods, setGoods] = useState<GoodsItem[]>(initialData);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [keyword, setKeyword] = useState(currentKeyword);
  const [categoryId, setCategoryId] = useState(currentCategoryId);
  const [minPrice, setMinPrice] = useState(currentMinPrice);
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice);
  const [page, setPage] = useState(initialPagination.page);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = async (p?: number) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (keyword) params.set("keyword", keyword);
      if (categoryId) params.set("categoryId", categoryId);
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      params.set("page", String(p || 1));
      params.set("pageSize", "12");
      const res = await api.get("/api/goods?" + params.toString());
      setGoods(res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, pageSize: 12, totalPages: 0 });
      setPage(p || 1);
    } catch (e: any) {
      setError(e.message || "加载失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />

      <main className="flex-1 max-w-6xl mx-auto p-4 w-full">
        <div className="bg-white border rounded-lg p-4 mb-6 space-y-3">
          <div className="flex gap-2">
            <input type="text" value={keyword} onChange={e => setKeyword(e.target.value)}
              placeholder="搜索商品名称..." className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
              onKeyDown={e => e.key === "Enter" && search(1)} />
            <button onClick={() => search(1)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
              搜索
            </button>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select value={categoryId} onChange={e => { setCategoryId(e.target.value); }}
              className="border rounded-lg px-2 py-1.5 text-sm outline-none">
              <option value="">全部分类</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
            <input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)}
              placeholder="最低价" className="border rounded-lg px-2 py-1.5 text-sm w-20 outline-none" />
            <span className="text-gray-400">-</span>
            <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
              placeholder="最高价" className="border rounded-lg px-2 py-1.5 text-sm w-20 outline-none" />
            <button onClick={() => search(1)}
              className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200">
              筛选
            </button>
            <button onClick={() => { setKeyword(""); setCategoryId(""); setMinPrice(""); setMaxPrice(""); search(1); }}
              className="text-sm text-gray-500 hover:text-gray-700">
              清除筛选
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center mb-6">
            <p className="text-red-600">加载失败: {error}</p>
            <button onClick={() => search(page)} className="mt-2 text-sm text-blue-600 hover:underline">重试</button>
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 8 }).map((_, i) => <GoodsCardSkeleton key={i} />)}
          </div>
        )}

        {!loading && !error && goods.length > 0 && (
          <>
            <div className="text-sm text-gray-500 mb-3">共 {pagination.total} 件商品</div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
              {goods.map(item => <GoodsCard key={item.id} item={item} />)}
            </div>
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 py-4">
                <button disabled={page <= 1} onClick={() => search(page - 1)}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">上一页</button>
                <span className="text-sm text-gray-600">{page} / {pagination.totalPages}</span>
                <button disabled={page >= pagination.totalPages} onClick={() => search(page + 1)}
                  className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50">下一页</button>
              </div>
            )}
          </>
        )}

        {!loading && !error && goods.length === 0 && (
          <EmptyState message="没有找到相关商品" suggestion="试试更换搜索关键词或清除筛选条件" />
        )}
      </main>

      <footer className="border-t py-4 text-center text-sm text-gray-400">
        校园二手交易平台 - CampusTrade
      </footer>
    </>
  );
}
