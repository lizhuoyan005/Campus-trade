"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Header from "@/components/Header";
import EmptyState from "@/components/EmptyState";

const statusLabels: Record<string, string> = {
  pending_pay: "待付款", paid: "待确认", completed: "已完成", cancelled: "已取消",
};
const statusColors: Record<string, string> = {
  pending_pay: "bg-yellow-100 text-yellow-800",
  paid: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-500",
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("buyer");

  const loadOrders = async (r: string) => {
    setRole(r);
    setLoading(true);
    try {
      const res = await api.get("/api/orders?role=" + r);
      setOrders(res.data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { if (user) loadOrders("buyer"); else setLoading(false); }, [user]);

  const handleAction = async (id: number, action: string) => {
    try {
      await api.patch("/api/orders/" + id, { action });
      loadOrders(role);
    } catch (err: any) { alert(err.message); }
  };

  if (!user) return <> <Header /><main className="max-w-6xl mx-auto p-4"><div className="bg-yellow-50 rounded-lg p-6 text-center text-yellow-700">请先登录</div></main></>;

  return (
    <>
      <Header />
      <main className="flex-1 max-w-4xl mx-auto p-4 w-full">
        <h1 className="text-xl font-bold mb-4">我的订单</h1>
        <div className="flex gap-2 mb-4">
          <button onClick={() => loadOrders("buyer")}
            className={"px-4 py-1.5 text-sm rounded-lg " + (role === "buyer" ? "bg-blue-600 text-white" : "bg-gray-100")}>作为买家</button>
          <button onClick={() => loadOrders("seller")}
            className={"px-4 py-1.5 text-sm rounded-lg " + (role === "seller" ? "bg-blue-600 text-white" : "bg-gray-100")}>作为卖家</button>
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <EmptyState message="暂无订单" />
        ) : (
          <div className="space-y-3">
            {orders.map((o: any) => (
              <div key={o.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{o.goods_title}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {role === "buyer" ? `卖家: ${o.seller_name}` : `买家: ${o.buyer_name}`}
                    {" | "}¥{o.price?.toFixed(2)}
                    {" | "}{new Date(o.created_at).toLocaleDateString("zh-CN")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={"text-xs px-2 py-0.5 rounded " + (statusColors[o.status] || "bg-gray-100")}>
                    {statusLabels[o.status] || o.status}
                  </span>
                  {role === "buyer" && o.status === "pending_pay" && (
                    <button onClick={() => handleAction(o.id, "pay")}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">付款</button>
                  )}
                  {role === "buyer" && (o.status === "pending_pay" || o.status === "paid") && (
                    <button onClick={() => handleAction(o.id, o.status === "paid" ? "complete" : "cancel")}
                      className="px-3 py-1 border rounded text-xs hover:bg-gray-50">
                      {o.status === "paid" ? "确认完成" : "取消"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
