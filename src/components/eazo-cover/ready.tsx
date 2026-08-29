"use client";

import { useEffect, type ReactNode } from "react";

/**
 * 封面预览就绪标记。挂载后在 <body> 打上标记，供平台封面截图服务识别
 * 「此路由已呈现真实产品视图」。仅用于 /eazo-cover-preview，不触碰任何用户/认证状态。
 */
export function EazoCoverReady({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.body.setAttribute("data-eazo-cover-ready", "true");
    return () => {
      document.body.removeAttribute("data-eazo-cover-ready");
    };
  }, []);
  return <>{children}</>;
}
