"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Header from "@/components/Header";

export default function AdminPage() {
  const { user } = useAuth();
  const [goods, setGoods] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState("pending");

  useEffect(() => { loadGoods("pending"); }, []);

  const loadGoods = async (status: string) => {
    const res = await api.get("/api/admin/goods?status=" + status);
    if (res.data) setGoods(res.data);
    setTab(status);
  };

  const handleReview = async (id: number, status: string) => {
    const body: any = { status };
    if (status === "rejected") {
      const reason = prompt("请输入驳回原因：");
      if (!reason) return;
      body.reason = reason;
    }
    try {
      const res = await api.patch("/api/admin/goods/" + id, body);
      setMsg(res.data?.message || "操作成功");
      loadGoods(tab);
    } catch (err: any) {
      setMsg(err.message || "操作失败");
    }
  };

  return (
    <>
      <Header />
      <main className="flex-1 max-w-6xl mx-auto p-4 w-full">
        <h1 className="text-xl font-bold mb-4">后台管理</h1>

        {(!user || user.role !== "admin") ? (
          <div className="bg-yellow-50 border rounded-lg p-6 text-center">
            <p className="text-yellow-700">请使用管理员账号登录 (admin / admin123)</p>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              {["pending", "approved", "rejected"].map(s => (
                <button key={s} onClick={() => loadGoods(s)}
                  className={"px-4 py-1.5 text-sm rounded-lg transition-colors " +
                    (tab === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                  {s === "pending" ? "待审核" : s === "approved" ? "已通过" : "已驳回"}
                </button>
              ))}
            </div>

            {msg && <div className="text-sm bg-blue-50 text-blue-700 p-3 rounded-lg mb-4">{msg}</div>}

            {goods.length === 0 ? (
              <div className="text-center py-12 text-gray-400">暂无商品</div>
            ) : (
              <div className="bg-white border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-3">商品</th>
                      <th className="text-left p-3">卖家</th>
                      <th className="text-left p-3">价格</th>
                      <th className="text-left p-3">分类</th>
                      {tab === "pending" && <th className="text-left p-3">操作</th>}
                      {tab === "rejected" && <th className="text-left p-3">驳回原因</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {goods.map((g: any) => (
                      <tr key={g.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <p className="font-medium">{g.title}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{g.description?.substring(0, 40)}...</p>
                        </td>
                        <td className="p-3 text-gray-600">{g.user_name}</td>
                        <td className="p-3 text-blue-600 font-medium">¥{g.price?.toFixed(2)}</td>
                        <td className="p-3 text-gray-600">{g.category_name}</td>
                        {tab === "pending" && (
                          <td className="p-3 flex gap-2">
                            <button onClick={() => handleReview(g.id, "approved")}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">通过</button>
                            <button onClick={() => handleReview(g.id, "rejected")}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">驳回</button>
                          </td>
                        )}
                        {tab === "rejected" && (
                          <td className="p-3 text-red-500 text-xs">{g.reject_reason || "无"}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
