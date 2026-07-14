import { NextResponse } from "next/server";

/**
 * 错误码定义
 * 0      成功
 * 40001  参数校验失败
 * 40101  未登录/Token过期
 * 40301  无权限
 * 40401  资源不存在
 * 40901  并发冲突（乐观锁重试失败）
 * 40902  重复操作（如重复下单）
 * 50001  服务器内部错误
 */
export const ErrorCode = {
  SUCCESS: 0,
  BAD_REQUEST: 40001,
  UNAUTHORIZED: 40101,
  FORBIDDEN: 40301,
  NOT_FOUND: 40401,
  CONFLICT: 40901,
  DUPLICATE: 40902,
  INTERNAL: 50001,
} as const;

/** 成功响应 */
export function success(data: any, status = 200) {
  return NextResponse.json(
    { code: 0, message: "success", data },
    { status }
  );
}

/** 错误响应 */
export function error(
  message: string,
  code: number = ErrorCode.BAD_REQUEST,
  status = 400
) {
  return NextResponse.json(
    { code, message, data: null },
    { status }
  );
}

/** 分页响应 */
export function paginated(data: any[], total: number, page: number, pageSize: number) {
  return NextResponse.json(
    {
      code: 0,
      message: "success",
      data,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    },
    { status: 200 }
  );
}

/** 从 URLSearchParams 解析分页参数 */
export function getPagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(searchParams.get("pageSize") || "12"))
  );
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
}
