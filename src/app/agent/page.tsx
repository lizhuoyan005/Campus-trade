"use client";
import { useState, useRef, useEffect } from "react";

type Message = {
  role: "user" | "agent";
  content: string;
  data?: any;
};

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "agent", content: "你好！我是校园二手平台智能助手。你可以对我说：\n\n- 「搜索 200 元以下的教材」\n- 「看看高等数学」\n- 「发布《计算机网络》50元」" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // 从 localStorage 读取登录 Token
  useEffect(() => {
    const t = localStorage.getItem("campus_trade_token");
    if (t) setToken(t);
  }, []);

  const authHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  };

  const addMessage = (msg: Message) => setMessages(prev => [...prev, msg]);

  // 简单的自然语言理解——关键词匹配
  function parseIntent(text: string): { action: string; params: any } {
    const t = text.trim();

    // 搜索意图：搜索/找/查找/有没有
    if (/^(搜索|找|查找|有没有)/.test(t)) {
      const params: any = {};
      const priceMatch = t.match(/(\d+(\.\d+)?)\s*元/);
      if (priceMatch) params.maxPrice = Number(priceMatch[1]);
      if (/教材/.test(t)) params.categoryId = 1;
      else if (/电子/.test(t) || /电脑/.test(t) || /键盘/.test(t) || /数码/.test(t)) params.categoryId = 2;
      else if (/生活/.test(t) || /台灯/.test(t) || /风扇/.test(t)) params.categoryId = 3;
      else if (/运动/.test(t) || /户外/.test(t)) params.categoryId = 4;
      else if (/服饰/.test(t) || /衣服/.test(t) || /包/.test(t)) params.categoryId = 5;
      const keywordMatch = t.replace(/搜索|找|查找|有没有|的|以下|以内|二手|商品|东西/, "")
        .replace(/\d+(\.\d+)?\s*元/, "").replace(/\d+/, "").trim();
      if (keywordMatch && keywordMatch.length > 0 && !priceMatch && !params.categoryId) {
        params.keyword = keywordMatch;
      }
      return { action: "search", params };
    }

    // 查看意图：看/看看/查看
    if (/^(看|看看|查看)/.test(t)) {
      const name = t.replace(/看|看看|查看|的详情|一下/, "").trim();
      return { action: "detail", params: { keyword: name } };
    }

    // 发布意图：发布/上架/卖
    if (/^(发布|上架|卖)/.test(t)) {
      const titleMatch = t.match(/《(.+?)》/);
      const priceMatch = t.match(/(\d+(\.\d+)?)\s*元/);
      return {
        action: "publish",
        params: {
          title: titleMatch ? titleMatch[1] : t.replace(/发布|上架|卖|一本/, "").replace(/\d+(\.\d+)?\s*元/, "").trim(),
          price: priceMatch ? Number(priceMatch[1]) : 0,
        },
      };
    }

    return { action: "unknown", params: {} };
  }

  async function handleSend() {
    if (!input.trim() || loading) return;
    const userText = input;
    setInput("");
    addMessage({ role: "user", content: userText });
    setLoading(true);

    const { action, params } = parseIntent(userText);

    try {
      if (action === "search") {
        const qs = new URLSearchParams();
        qs.set("status", "approved");
        if (params.keyword) qs.set("keyword", params.keyword);
        if (params.categoryId) qs.set("categoryId", String(params.categoryId));
        if (params.maxPrice) qs.set("maxPrice", String(params.maxPrice));
        qs.set("pageSize", "5");

        const res = await fetch(`/api/goods?${qs}`);
        const json = await res.json();
        const goods = json.data || [];

        if (goods.length === 0) {
          addMessage({ role: "agent", content: "没有找到符合条件的商品，试试换一个关键词？" });
        } else {
          const list = goods.map((g: any) =>
            `• ${g.title} — **¥${g.price.toFixed(2)}**（${g.category_name}，卖家: ${g.seller_name}）`
          ).join("\n");
          addMessage({ role: "agent", content: `找到 ${json.pagination?.total || goods.length} 件商品：\n\n${list}` });
        }
      } else if (action === "detail") {
        const res = await fetch(`/api/goods?keyword=${encodeURIComponent(params.keyword)}&status=approved`);
        const json = await res.json();
        const goods = json.data || [];
        if (goods.length === 0) {
          addMessage({ role: "agent", content: `没有找到"${params.keyword}"相关的商品` });
        } else {
          // 取第一个匹配的商品
          const g = goods[0];
          addMessage({
            role: "agent",
            content: `**${g.title}**\n\n价格：¥${g.price.toFixed(2)}\n分类：${g.category_name}\n卖家：${g.seller_name}\n联系方式：${g.seller_contact || "面议"}\n描述：${g.description || "暂无描述"}`,
          });
        }
      } else if (action === "publish") {
        if (!token) {
          addMessage({ role: "agent", content: "请先登录后再发布商品（右上角登录）" });
        } else if (!params.price || params.price <= 0) {
          addMessage({ role: "agent", content: "请告诉我价格，例如「发布《计算机网络》50元」" });
        } else {
          const res = await fetch("/api/goods", {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify({ title: params.title, price: params.price, category_id: 1 }),
          });
          const json = await res.json();
          if (res.ok) {
            addMessage({ role: "agent", content: `✅ 发布成功！「${params.title}」已提交，等待管理员审核。` });
          } else {
            addMessage({ role: "agent", content: `❌ 发布失败：${json.message || json.error || "未知错误"}` });
          }
        }
      } else {
        addMessage({
          role: "agent",
          content: "我没理解你的意思。试试说：\n- 「搜索 200 元以下的教材」\n- 「看看高等数学」\n- 「发布《计算机网络》50元」",
        });
      }
    } catch (err: any) {
      addMessage({ role: "agent", content: `调用接口时出错：${err.message}` });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <span className="font-bold text-gray-800">校园二手 AI 助手</span>
        </div>
        <div className="text-xs text-gray-400">API Agent 演示</div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-md"
                  : "bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm text-sm text-gray-400">
              思考中...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-white px-4 py-3">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="输入指令，例如：搜索200元以下的教材"
            className="flex-1 border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}
