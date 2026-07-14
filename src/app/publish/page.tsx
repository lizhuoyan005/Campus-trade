"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Header from "@/components/Header";

export default function PublishPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState({ title: "", description: "", price: "", contact: "", category_id: "1" });
  const [categories, setCategories] = useState<{ id: number; name: string; icon: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/api/categories").then(r => { if (r.data) setCategories(r.data); }).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setMsg("请先登录"); return; }
    if (!form.title || !form.price) { setMsg("标题和价格不能为空"); return; }
    setSubmitting(true);
    setMsg("");
    try {
      await api.post("/api/goods", {
        title: form.title, description: form.description,
        price: parseFloat(form.price), category_id: parseInt(form.category_id),
        contact: form.contact,
      });
      setMsg("发布成功！等待管理员审核");
      setTimeout(() => router.push("/"), 1500);
    } catch (err: any) {
      setMsg(err.message || "发布失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-2xl mx-auto p-4 w-full">
        <h1 className="text-xl font-bold mb-6">发布闲置物品</h1>

        {!user ? (
          <div className="bg-yellow-50 border rounded-lg p-6 text-center">
            <p className="text-yellow-700">请先登录后再发布商品</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">商品标题 *</label>
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" placeholder="输入商品名称" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">商品描述</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 h-24 resize-none"
                placeholder="描述商品的情况、新旧程度等" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">价格（元）*</label>
                <input type="number" step="0.01" min="0" value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" placeholder="0.00" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">分类</label>
                <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm outline-none">
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">联系方式</label>
              <input type="text" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" placeholder="手机号 / 微信 / QQ" />
            </div>
            <button type="submit" disabled={submitting}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {submitting ? "发布中..." : "提交发布"}
            </button>
            {msg && <div className={"text-sm p-3 rounded-lg " + (msg.includes("成功") ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700")}>{msg}</div>}
          </form>
        )}
      </main>
    </>
  );
}
