import { useState } from "react";
import { Inbox as InboxIcon, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import type { Note, NoteStage } from "../data";
import type { OrganizePlan } from "../inbox-organize";
import { NoteCard } from "./note-card";
import { InboxOrganizeFlow } from "./inbox-organize-flow";
import { cn } from "./ui/utils";

const tabs: { key: NoteStage | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "analyzing", label: "분석 중" },
  { key: "inbox", label: "검토 필요" },
  { key: "routed", label: "라우팅됨" },
];

export function InboxView({
  notes,
  onRoute,
  onBuildPlan,
  onCommitPlan,
}: {
  notes: Note[];
  onRoute: (n: Note) => void;
  onBuildPlan: () => OrganizePlan;
  onCommitPlan: (plan: OrganizePlan) => void;
}) {
  const [tab, setTab] = useState<NoteStage | "all">("all");
  const [flowPlan, setFlowPlan] = useState<OrganizePlan | null>(null);

  const counts = {
    all: notes.length,
    analyzing: notes.filter((n) => n.stage === "analyzing").length,
    inbox: notes.filter((n) => n.stage === "inbox").length,
    routed: notes.filter((n) => n.stage === "routed").length,
  };
  const unclassified = counts.analyzing + counts.inbox;
  const filtered = tab === "all" ? notes : notes.filter((n) => n.stage === tab);

  return (
    <div className="space-y-5 pb-20">
      <div className="grid grid-cols-3 gap-4">
        <Pill icon={Loader2} spin label="분석 중" value={counts.analyzing} accent="var(--primary)" />
        <Pill icon={InboxIcon} label="검토 필요" value={counts.inbox} accent="var(--warn)" />
        <Pill icon={CheckCircle2} label="라우팅됨" value={counts.routed} accent="var(--signal)" />
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
              tab === t.key ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {filtered.map((n) => (
          <NoteCard key={n.id} note={n} onRoute={onRoute} />
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="grid place-items-center rounded-xl border border-dashed border-border py-16 text-center">
          <CheckCircle2 className="mb-2 size-6 text-signal" />
          <p className="text-sm text-muted-foreground">비어 있습니다 — 에이전트가 모두 처리했어요.</p>
        </div>
      )}

      {/* 플로팅 자동 정리 버튼 */}
      {unclassified > 0 && !flowPlan && (
        <button
          onClick={() => setFlowPlan(onBuildPlan())}
          className="organize-fab group fixed bottom-6 left-1/2 z-40 inline-flex -translate-x-1/2 items-center gap-2.5 rounded-full border border-primary/40 bg-gradient-to-r from-primary to-chart-5 py-3 pl-4 pr-5 text-primary-foreground shadow-xl shadow-primary/30 transition-transform hover:-translate-x-1/2 hover:-translate-y-0.5"
        >
          <span className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-primary/40 blur-md" />
          <span className="relative grid size-7 place-items-center rounded-full bg-white/15">
            <Sparkles className="size-4" />
          </span>
          <span className="text-sm font-semibold">미분류 {unclassified}건 자동 정리</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide">AI</span>
        </button>
      )}

      {flowPlan && (
        <InboxOrganizeFlow
          plan={flowPlan}
          notes={notes}
          onCommit={() => onCommitPlan(flowPlan)}
          onClose={() => setFlowPlan(null)}
        />
      )}

      <style>{`
        @keyframes fab-glow { 0%,100% { box-shadow: 0 10px 30px -8px color-mix(in oklab, var(--primary) 50%, transparent); } 50% { box-shadow: 0 14px 40px -6px color-mix(in oklab, var(--primary) 75%, transparent); } }
        .organize-fab { animation: fab-glow 2.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce){ .organize-fab { animation:none !important; } }
      `}</style>
    </div>
  );
}

function Pill({
  icon: Icon,
  label,
  value,
  accent,
  spin,
}: {
  icon: typeof InboxIcon;
  label: string;
  value: number;
  accent: string;
  spin?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
      <span className="grid size-9 place-items-center rounded-lg" style={{ background: `color-mix(in oklab, ${accent} 16%, transparent)`, color: accent }}>
        <Icon className={cn("size-4", spin && value > 0 && "animate-spin")} />
      </span>
      <div className="leading-tight">
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
