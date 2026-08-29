"use client";

/**
 * 暖光背景层：全屏渐变底 + 两团缓慢呼吸的暖光晕。
 * 复刻自选定设计的 .bg / .aura。固定定位、指针穿透、置于内容之下。
 */
export function WarmAura() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-background" />
      <div
        className="absolute left-1/2 top-[8%] h-60 w-60 -translate-x-1/2 rounded-full blur-[34px] cc-breathe"
        style={{ background: "rgba(255, 209, 102, .45)" }}
      />
      <div
        className="absolute -right-20 bottom-[10%] h-[300px] w-[260px] rounded-full blur-[34px] cc-breathe-alt"
        style={{ background: "rgba(232, 128, 64, .28)" }}
      />
    </div>
  );
}
