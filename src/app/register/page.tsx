"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ username: "", password: "", nickname: "", contact: "" });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const user = await register(form);
      if (user) {
        setUser(user);
        setMsg("注册成功！");
        setTimeout(() => router.push("/"), 1000);
      }
    } catch (err: any) {
      setMsg(err.message || "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-blue-600">🎗 CampusTrade</h1>
          <p className="text-gray-500 text-sm mt-1">校园二手交易平台</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">注册</h2>
          <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
            placeholder="用户名" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" required />
          <input type="text" value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })}
            placeholder="昵称" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" required />
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
            placeholder="密码（至少6位）" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" required />
          <input type="text" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })}
            placeholder="联系方式（选填）" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
          <button type="submit" disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? "注册中..." : "注册"}
          </button>
          {msg && (
            <div className={"text-sm p-2 rounded-lg " + (msg.includes("成功") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600")}>
              {msg}
            </div>
          )}
          <p className="text-center text-sm text-gray-500">
            已有账号？<Link href="/login" className="text-blue-600 hover:underline">登录</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
