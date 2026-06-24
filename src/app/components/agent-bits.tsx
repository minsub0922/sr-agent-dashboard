import { Slack, Mail, Globe, Smartphone, FileText, Webhook } from "lucide-react";
import type { Agent, AgentStatus, Channel } from "../data";
import { channelLabel } from "../data";
import { cn } from "./ui/utils";

// ── Agent avatar — an emoji persona carrying the agent's accent ───────────
export function AgentAvatar({
  agent,
  size = 36,
  showRing = true,
  live = false,
}: {
  agent: Agent;
  size?: number;
  showRing?: boolean;
  live?: boolean;
}) {
  const pulsing = live && (agent.status === "processing" || agent.status === "training");
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center rounded-xl"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.5,
        lineHeight: 1,
        background: `radial-gradient(circle at 30% 25%, color-mix(in oklab, ${agent.accent} 26%, transparent), color-mix(in oklab, ${agent.accent} 10%, transparent))`,
        boxShadow: showRing
          ? `inset 0 0 0 1px color-mix(in oklab, ${agent.accent} 45%, transparent)`
          : undefined,
      }}
    >
      {pulsing && (
        <span
          className="absolute inset-0 animate-ping rounded-xl opacity-40"
          style={{ background: `color-mix(in oklab, ${agent.accent} 30%, transparent)` }}
        />
      )}
      <span className="relative" style={{ filter: "saturate(1.1)" }}>{agent.emoji}</span>
      {agent.role === "lead" && (
        <span
          className="absolute -right-1 -top-1 grid place-items-center rounded-full"
          style={{
            width: Math.max(10, size * 0.34),
            height: Math.max(10, size * 0.34),
            background: agent.accent,
            color: "var(--card)",
            fontSize: Math.max(7, size * 0.2),
            boxShadow: `0 0 0 2px var(--card)`,
          }}
        >
          ★
        </span>
      )}
    </span>
  );
}

const statusMeta: Record<AgentStatus, { label: string; color: string; pulse: boolean }> = {
  active: { label: "활성", color: "var(--signal)", pulse: false },
  processing: { label: "분석 중", color: "var(--primary)", pulse: true },
  idle: { label: "대기", color: "var(--muted-foreground)", pulse: false },
  training: { label: "학습 중", color: "var(--warn)", pulse: true },
};

export function StatusDot({ status, label = false }: { status: AgentStatus; label?: boolean }) {
  const meta = statusMeta[status];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex size-2">
        {meta.pulse && (
          <span
            className="absolute inline-flex size-full animate-ping rounded-full opacity-60"
            style={{ background: meta.color }}
          />
        )}
        <span className="relative inline-flex size-2 rounded-full" style={{ background: meta.color }} />
      </span>
      {label && (
        <span className="font-mono text-xs uppercase tracking-wide" style={{ color: meta.color }}>
          {meta.label}
        </span>
      )}
    </span>
  );
}

export function statusLabel(status: AgentStatus) {
  return statusMeta[status].label;
}

// ── Channel glyph ─────────────────────────────────────────────────────────
const channelIcon: Record<Channel, typeof Slack> = {
  Slack: Slack,
  Email: Mail,
  API: Webhook,
  Web: Globe,
  Mobile: Smartphone,
  Notion: FileText,
};

export function ChannelBadge({ channel }: { channel: Channel }) {
  const Icon = channelIcon[channel];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/40 px-2 py-0.5 font-mono text-xs text-muted-foreground">
      <Icon className="size-3" />
      {channelLabel[channel]}
    </span>
  );
}

export function ConfidenceBar({ value, className }: { value: number; className?: string }) {
  const color = value >= 80 ? "var(--signal)" : value >= 60 ? "var(--primary)" : "var(--warn)";
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="font-mono text-xs tabular-nums" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}
