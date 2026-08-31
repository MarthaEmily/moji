import { redirect } from "next/navigation";

// 「我的方案」已合并进「时轴」页的抽屉入口；此路由保留为重定向，避免旧书签 404。
export default function SavedRedirect() {
  redirect("/");
}
