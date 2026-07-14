"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const user = await login(username, password);
      if (user) {
        setUser(user);
        setMsg("登录成功！");
        setTimeout(() => router.push("/"), 500);
      }
    } catch (err: any) {
      setMsg(err.message || "登录失败");
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
          <h2 className="text-lg font-semibold">登录</h2>
          <input
            type="text" value={username} onChange={e => setUsername(e.target.value)}
            placeholder="用户名" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" required
          />
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="密码" className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" required
          />
          <button type="submit" disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? "登录中..." : "登录"}
          </button>
          {msg && (
            <div className={"text-sm p-2 rounded-lg " + (msg.includes("成功") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600")}>
              {msg}
            </div>
          )}
          <p className="text-center text-sm text-gray-500">
            还没有账号？<Link href="/register" className="text-blue-600 hover:underline">注册</Link>
          </p>
          <div className="text-xs text-gray-400 text-center border-t pt-3">
            演示账号：admin / admin123
          </div>
        </form>
      </div>
    </div>
  );
}
