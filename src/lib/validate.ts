import { z } from "zod";
import { error, ErrorCode } from "./api-utils";
import { NextResponse } from "next/server";

export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
):
  | { success: true; data: T }
  | { success: false; response: NextResponse } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstError = result.error.issues[0];
  const message = firstError
    ? `${firstError.path.join(".")}: ${firstError.message}`
    : "参数校验失败";
  return {
    success: false,
    response: error(message, ErrorCode.BAD_REQUEST),
  };
}

export const registerSchema = z.object({
  username: z.string().min(2, "用户名至少2个字符").max(50),
  password: z.string().min(6, "密码至少6个字符"),
  nickname: z.string().min(1, "昵称不能为空").max(50),
  contact: z.string().max(100).optional().default(""),
});

export const loginSchema = z.object({
  username: z.string().min(1, "用户名不能为空"),
  password: z.string().min(1, "密码不能为空"),
});

export const publishGoodsSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(100),
  description: z.string().optional().default(""),
  price: z.number().positive("价格必须大于0"),
  original_price: z.number().optional().nullable(),
  category_id: z.number().int().positive().optional().default(6),
  images: z.array(z.string()).max(5).optional().default([]),
  contact: z.string().optional().default(""),
});

export const createOrderSchema = z.object({
  goodsId: z.number().int().positive("商品ID不能为空"),
  remark: z.string().optional().default(""),
});

export const rejectGoodsSchema = z.object({
  reason: z.string().min(1, "驳回原因不能为空"),
});

export const favoriteSchema = z.object({
  goodsId: z.number().int().positive(),
});
