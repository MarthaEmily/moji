import { redirect } from "next/navigation";

// 习惯页已成为首页 `/`；此路由保留为重定向，避免旧链接/书签 404。
export default function HabitsRedirect() {
  redirect("/");
}
