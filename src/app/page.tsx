import { ssrFetch, ssrFetchPaginated } from "@/lib/api";
import GoodsListClient from "@/components/GoodsListClient";

export const dynamic = "force-dynamic";

async function fetchGoods(searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  if (searchParams.keyword) params.set("keyword", String(searchParams.keyword));
  if (searchParams.categoryId) params.set("categoryId", String(searchParams.categoryId));
  if (searchParams.minPrice) params.set("minPrice", String(searchParams.minPrice));
  if (searchParams.maxPrice) params.set("maxPrice", String(searchParams.maxPrice));
  if (searchParams.page) params.set("page", String(searchParams.page));
  params.set("pageSize", "12");

  return ssrFetchPaginated("/api/goods?" + params.toString());
}

async function fetchCategories() {
  try {
    const data = await ssrFetch("/api/categories");
    return data as any[];
  } catch { return []; }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  try {
    const [goodsResult, categories] = await Promise.all([
      fetchGoods(sp),
      fetchCategories(),
    ]);

    return (
      <GoodsListClient
        initialData={goodsResult.data || []}
        initialPagination={goodsResult.pagination || { total: 0, page: 1, pageSize: 12, totalPages: 0 }}
        categories={categories || []}
        currentKeyword={String(sp.keyword || "")}
        currentCategoryId={String(sp.categoryId || "")}
        currentMinPrice={String(sp.minPrice || "")}
        currentMaxPrice={String(sp.maxPrice || "")}
      />
    );
  } catch (e: any) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium">加载失败</p>
          <p className="text-red-400 text-sm mt-1">{e.message}</p>
          <a href="/" className="mt-3 inline-block text-blue-600 text-sm hover:underline">刷新页面</a>
        </div>
      </div>
    );
  }
}
