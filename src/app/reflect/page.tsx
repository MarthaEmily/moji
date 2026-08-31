import { redirect } from "next/navigation";

// 心得已改为全局悬浮泡泡（左下角猫猫），此独立页面不再使用，重定向回首页。
export default function ReflectPage() {
  redirect("/");
}
