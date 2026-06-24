import { useState } from "react";
import { Inbox as InboxIcon, CheckCircle2, Loader2 } from "lucide-react";
import type { Note, NoteStage } from "../data";
import { NoteCard } from "./note-card";
import { cn } from "./ui/utils";

const tabs: { key: NoteStage | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "analyzing", label: "분석 중" },
  { key: "inbox", label: "검토 필요" },
  { key: "routed", label: "라우팅됨" },
];

export function InboxView({ notes, onRoute }: { notes: Note[]; onRoute: (n: Note) => void }) {
  const [tab, setTab] = useState<NoteStage | "all">("all");
  const counts = {
    all: notes.length,
    analyzing: notes.filter((n) => n.stage === "analyzing").length,
    inbox: notes.filter((n) => n.stage === "inbox").length,
    routed: notes.filter((n) => n.stage === "routed").length,
  };
  const filtered = tab === "all" ? notes : notes.filter((n) => n.stage === tab);

  return (
    <div className="space-y-5">
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
