import { useEffect, useState } from "react";
import { Plus, RefreshCw, GitMerge } from "lucide-react";
import type { KnowledgeDelta } from "../data";
import { cn } from "./ui/utils";

/* 지식 화면(개요 대시보드 + 지식 워드맵)에서 공유하는 작은 조각들 */

// ── 숫자 카운트업 ──────────────────────────────────────────────────────────
export function useCountUp(target: number, duration = 1100) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setV(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

export function CountUp({
  value,
  suffix = "",
  thousands = false,
  className,
}: {
  value: number;
  suffix?: string;
  thousands?: boolean;
  className?: string;
}) {
  const v = useCountUp(value);
  const n = Math.round(v);
  return (
    <span className={cn("tabular-nums", className)}>
      {thousands ? n.toLocaleString() : n}
      {suffix}
    </span>
  );
}

// ── 섹션 카드 ──────────────────────────────────────────────────────────────
export function SectionCard({
  title,
  hint,
  right,
  className,
  children,
}: {
  title: React.ReactNode;
  hint?: string;
  right?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="tracking-tight">{title}</h2>
          {hint && <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{hint}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

// ── 변경 유형 메타 / 성숙도 색 ────────────────────────────────────────────────
export const deltaMeta: Record<KnowledgeDelta, { icon: typeof Plus; color: string }> = {
  added: { icon: Plus, color: "var(--signal)" },
  updated: { icon: RefreshCw, color: "var(--primary)" },
  merged: { icon: GitMerge, color: "var(--chart-3)" },
};

export function maturityColor(v: number) {
  return v >= 80 ? "var(--signal)" : v >= 60 ? "var(--primary)" : "var(--warn)";
}

// ── 키프레임 (마운트 시 1회 주입) ─────────────────────────────────────────────
export function KnowledgeStyles() {
  return (
    <style>{`
      @keyframes k-rise-k { from { opacity:0; transform: translateY(8px);} to { opacity:1; transform:none;} }
      .k-rise { animation: k-rise-k .5s cubic-bezier(.2,.7,.2,1) both; }
      @keyframes k-fade-k { from { opacity:0;} to { opacity:1;} }
      .k-fade { animation: k-fade-k .7s ease-out both; }
      @keyframes k-draw-k { from { stroke-dashoffset:1;} to { stroke-dashoffset:0;} }
      .k-draw { stroke-dasharray:1; animation: k-draw-k 1.5s cubic-bezier(.4,.1,.2,1) both; }
      @keyframes k-grow-k { from { transform: scaleX(0);} to { transform: scaleX(1);} }
      .k-grow { transform-origin:left; animation: k-grow-k .9s cubic-bezier(.2,.7,.2,1) both; }
      @keyframes k-pop-k { from { opacity:0; transform: scale(.86);} to { opacity:1; transform:none;} }
      .k-pop { animation: k-pop-k .7s cubic-bezier(.2,.7,.2,1) both; }
      @keyframes k-cell-k { from { opacity:0; transform: scale(.4);} to { opacity:1; transform:none;} }
      .k-cell { animation: k-cell-k .4s ease-out both; }
      @keyframes k-ping-k { 0% { transform: scale(1); opacity:.35;} 70%,100% { transform: scale(2.4); opacity:0;} }
      .k-ping { animation: k-ping-k 2.4s ease-out infinite; }
      @keyframes k-word-k { from { opacity:0; transform: scale(.5);} to { opacity:1; transform:none;} }
      .k-word { animation: k-word-k .55s cubic-bezier(.2,.8,.2,1) both; }
      @keyframes k-selglow-k { 0%,100% { opacity:.5;} 50% { opacity:.92;} }
      .k-selglow { animation: k-selglow-k 2.6s ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) {
        .k-rise,.k-fade,.k-draw,.k-grow,.k-pop,.k-cell,.k-ping,.k-word,.k-selglow { animation: none !important; stroke-dashoffset:0 !important; transform:none !important; opacity:1 !important; }
      }
    `}</style>
  );
}
