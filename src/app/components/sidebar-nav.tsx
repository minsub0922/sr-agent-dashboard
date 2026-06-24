import { useState } from "react";
import { LayoutGrid, Inbox, FolderKanban, Bot, Tags, Radio, Settings, ChevronRight, Search, Command, Bell, MessageSquare, FlaskConical, HelpCircle } from "lucide-react";
import { cn } from "./ui/utils";
import { AgentAvatar, StatusDot } from "./agent-bits";
import { getAgent, projects } from "../data";

export type ViewKey = "overview" | "chat" | "inbox" | "projects" | "agents" | "lab" | "knowledge" | "channels";

const nav: { key: ViewKey; label: string; icon: typeof Inbox }[] = [
  { key: "chat", label: "채팅", icon: MessageSquare },
  { key: "overview", label: "개요", icon: LayoutGrid },
  { key: "inbox", label: "인박스", icon: Inbox },
  { key: "projects", label: "프로젝트", icon: FolderKanban },
  { key: "agents", label: "에이전트", icon: Bot },
  { key: "lab", label: "연구실", icon: FlaskConical },
  { key: "knowledge", label: "지식", icon: Tags },
  { key: "channels", label: "채널", icon: Radio },
];

export function SidebarNav({
  view,
  onChange,
  inboxCount,
  onOpenProject,
  onStartTour,
}: {
  view: ViewKey;
  onChange: (v: ViewKey) => void;
  inboxCount: number;
  onOpenProject: (id: string) => void;
  onStartTour: () => void;
}) {
  const atlas = getAgent("a-atlas")!;
  const [projectsOpen, setProjectsOpen] = useState(true);

  return (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="relative grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
          <span className="font-mono text-sm font-bold">SR</span>
          <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-signal" style={{ boxShadow: "0 0 0 2px var(--sidebar)" }} />
        </div>
        <div className="leading-tight">
          <div className="font-semibold tracking-tight">SRNote</div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">knowledge mesh</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
        <div className="px-2 pb-1 pt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          워크스페이스
        </div>
        {nav.map(({ key, label, icon: Icon }) => {
          const active = view === key;
          const isProjects = key === "projects";
          return (
            <div key={key}>
              <button
                data-tour={`nav-${key}`}
                onClick={() => {
                  onChange(key);
                  if (isProjects) setProjectsOpen((o) => !o);
                }}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
                )}
              >
                <Icon className={cn("size-4 transition-colors", (active || key === "lab") && "text-primary")} />
                <span className="flex-1">{label}</span>
                {key === "lab" && (
                  <span className="rounded-full bg-gradient-to-r from-primary to-chart-5 px-1.5 font-mono text-[9px] uppercase tracking-wide text-primary-foreground">
                    beta
                  </span>
                )}
                {key === "inbox" && inboxCount > 0 && (
                  <span className="rounded-full bg-primary/15 px-1.5 font-mono text-[11px] text-primary tabular-nums">
                    {inboxCount}
                  </span>
                )}
                {isProjects ? (
                  <ChevronRight className={cn("size-3.5 text-muted-foreground transition-transform", projectsOpen && "rotate-90")} />
                ) : (
                  active && <span className="size-1.5 rounded-full bg-primary" />
                )}
              </button>

              {/* 하위 프로젝트 목록 */}
              {isProjects && projectsOpen && (
                <div className="mb-1 mt-0.5 space-y-0.5 pl-3">
                  {projects.map((p) => {
                    const lead = getAgent(p.leadAgentId)!;
                    return (
                      <button
                        key={p.id}
                        onClick={() => onOpenProject(p.id)}
                        className="group flex w-full items-center gap-2.5 rounded-lg py-1.5 pl-4 pr-2 text-left text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-foreground"
                      >
                        <span className="relative flex h-full">
                          <span className="absolute -left-2 top-1/2 h-px w-2 bg-sidebar-border" />
                          <span className="size-2 shrink-0 rounded-full" style={{ background: p.color }} />
                        </span>
                        <span className="flex-1 truncate">{p.name}</span>
                        <span className="font-mono text-[10px] opacity-70">{p.codename}</span>
                        <span title={lead.codename} className="text-[12px]">{lead.emoji}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* 하단: 검색 · 오케스트레이터 · 프로필 */}
      <div className="mt-2 space-y-3 border-t border-sidebar-border p-3">
        {/* 검색 */}
        <button className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-input px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <Search className="size-4" />
          <span className="flex-1 text-left">검색</span>
          <kbd className="flex items-center gap-0.5 rounded border border-border bg-secondary px-1.5 font-mono text-[10px]">
            <Command className="size-2.5" />K
          </kbd>
        </button>

        {/* 오케스트레이터 */}
        <div className="rounded-xl border border-sidebar-border bg-card/60 p-3">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            오케스트레이터
          </div>
          <div className="flex items-center gap-2.5">
            <AgentAvatar agent={atlas} size={34} />
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate font-mono text-sm">{atlas.codename}</div>
              <StatusDot status={atlas.status} label />
            </div>
          </div>
        </div>

        {/* 프로필 + 액션 */}
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-chart-5 font-mono text-xs text-primary-foreground">
            DK
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm">김다혜</div>
            <div className="font-mono text-[10px] text-muted-foreground">플랫폼팀</div>
          </div>
          <button
            onClick={onStartTour}
            title="둘러보기"
            data-tour="help"
            className="grid size-8 place-items-center rounded-lg border border-sidebar-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <HelpCircle className="size-4" />
          </button>
          <button
            title="알림"
            className="relative grid size-8 place-items-center rounded-lg border border-sidebar-border bg-card text-muted-foreground transition-colors hover:text-foreground"
          >
            <Bell className="size-4" />
            <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-signal" />
          </button>
          <button
            title="설정"
            className="grid size-8 place-items-center rounded-lg border border-sidebar-border bg-card text-muted-foreground transition-colors hover:text-foreground"
          >
            <Settings className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
