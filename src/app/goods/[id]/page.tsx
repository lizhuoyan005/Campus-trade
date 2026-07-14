import { ssrFetch } from "@/lib/api";
import GoodsDetailClient from "@/components/GoodsDetailClient";

export const dynamic = "force-dynamic";

export default async function GoodsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const goods = await ssrFetch("/api/goods/" + id);
    return <GoodsDetailClient goods={goods} />;
  } catch (e: any) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <span className="text-5xl block mb-4">😙</span>
          <h1 className="text-xl font-semibold text-red-600 mb-2">商品未找到</h1>
          <p className="text-red-400 text-sm">{e.message}</p>
          <a href="/" className="mt-4 inline-block text-blue-600 text-sm hover:underline">返回首页</a>
        </div>
      </div>
    );
  }
}
