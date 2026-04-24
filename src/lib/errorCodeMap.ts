const ERROR_MESSAGES: Record<number, string> = {
  40000: "请求参数不合法，请检查输入",
  40001: "请求参数错误，请稍后重试",
  40010: "用户名已存在，请更换后重试",
  40100: "登录状态异常，请重新登录",
  40101: "用户名或密码错误",
  40102: "请先登录",
  40103: "登录已过期，请重新登录",
  50000: "服务开小差了，请稍后重试",
};

export const getErrorMessageByCode = (code?: number, fallback = "操作失败，请稍后重试"): string => {
  if (typeof code !== "number") {
    return fallback;
  }
  return ERROR_MESSAGES[code] ?? fallback;
};
