"use client";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";

export default function Header() {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-blue-600 flex items-center gap-2">
          <span className="text-xl">🎗</span>
          <span>CampusTrade</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/" className="text-gray-600 hover:text-blue-600">首页</Link>
          <Link href="/publish" className="text-gray-600 hover:text-blue-600">发布商品</Link>
          <Link href="/agent" className="text-gray-600 hover:text-blue-600 font-medium">🤖 AI助手</Link>
          {user?.role === "admin" && (
            <Link href="/admin" className="text-gray-600 hover:text-blue-600">后台管理</Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)}
                className="text-sm text-gray-700 hover:text-blue-600 flex items-center gap-1">
                <span className="w-7 h-7 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium">
                  {user.nickname[0]}
                </span>
                <span className="hidden sm:inline">{user.nickname}</span>
              </button>
              {showMenu && (
                <div className="absolute right-0 mt-2 w-44 bg-white border rounded-lg shadow-lg py-1 text-sm z-50">
                  <Link href="/publish" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setShowMenu(false)}>发布商品</Link>
                  <Link href={`/user/orders`} className="block px-4 py-2 hover:bg-gray-50" onClick={() => setShowMenu(false)}>我的订单</Link>
                  <Link href={`/user/favorites`} className="block px-4 py-2 hover:bg-gray-50" onClick={() => setShowMenu(false)}>我的收藏</Link>
                  <Link href={`/user/my-goods`} className="block px-4 py-2 hover:bg-gray-50" onClick={() => setShowMenu(false)}>我的发布</Link>
                  <hr className="my-1" />
                  <button onClick={() => { logout(); setShowMenu(false); }}
                    className="block w-full text-left px-4 py-2 text-red-500 hover:bg-gray-50">
                    退出登录
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-2 text-sm">
              <Link href="/login" className="px-3 py-1.5 text-gray-600 hover:text-blue-600">登录</Link>
              <Link href="/register" className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">注册</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
