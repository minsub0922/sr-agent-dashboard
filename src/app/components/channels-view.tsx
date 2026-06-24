import { Slack, Mail, Globe, Smartphone, FileText, Webhook } from "lucide-react";
import { channels } from "../data";

const meta: Record<string, { icon: typeof Slack; label: string; desc: string; status: string }> = {
  Slack: { icon: Slack, label: "Slack", desc: "#srnote-capture 및 @SRNote DM", status: "연결됨" },
  Email: { icon: Mail, label: "이메일", desc: "notes@srnote.internal 포워딩", status: "연결됨" },
  API: { icon: Webhook, label: "API", desc: "POST /v1/capture · 서비스 토큰", status: "연결됨" },
  Notion: { icon: FileText, label: "Notion", desc: "동기화된 DB & 콜아웃", status: "연결됨" },
  Web: { icon: Globe, label: "웹", desc: "이 대시보드의 빠른 입력", status: "연결됨" },
  Mobile: { icon: Smartphone, label: "모바일", desc: "iOS / Android 공유 시트", status: "베타" },
};

export function ChannelsView() {
  const total = channels.reduce((s, c) => s + c.volume, 0);
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">누적 수집량</div>
        <div className="mt-1 text-3xl font-semibold tabular-nums">{total.toLocaleString()}</div>
        <div className="mt-4 flex h-2.5 overflow-hidden rounded-full">
          {channels.map((c, i) => (
            <div
              key={c.name}
              style={{ width: `${(c.volume / total) * 100}%`, background: `var(--chart-${(i % 5) + 1})` }}
              title={c.name}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {channels.map((c) => {
          const m = meta[c.name];
          const Icon = m.icon;
          const connected = m.status === "연결됨";
          return (
            <div key={c.name} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-secondary text-foreground">
                  <Icon className="size-5" />
                </span>
                <div className="flex-1 leading-tight">
                  <div className="tracking-tight">{m.label}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">노트 {c.volume.toLocaleString()}건</div>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase"
                  style={{
                    background: connected ? "color-mix(in oklab, var(--signal) 16%, transparent)" : "color-mix(in oklab, var(--warn) 16%, transparent)",
                    color: connected ? "var(--signal)" : "var(--warn)",
                  }}
                >
                  <span className="size-1.5 rounded-full" style={{ background: connected ? "var(--signal)" : "var(--warn)" }} />
                  {m.status}
                </span>
              </div>
              <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">{m.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
