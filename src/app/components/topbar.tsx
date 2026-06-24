import { Search, Command, Bell } from "lucide-react";
import type { ViewKey } from "./sidebar-nav";

const titles: Record<ViewKey, { title: string; sub: string }> = {
  overview: { title: "개요", sub: "지식 메시의 실시간 상태" },
  inbox: { title: "인박스", sub: "라우팅·검토 대기 중인 노트" },
  projects: { title: "프로젝트", sub: "리드 에이전트와 지식 베이스" },
  agents: { title: "에이전트", sub: "구성, 상태, 라우팅 성과" },
  knowledge: { title: "지식", sub: "전체 프로젝트의 최근 변경" },
  channels: { title: "채널", sub: "노트가 들어오는 경로" },
};

export function Topbar({ view }: { view: ViewKey }) {
  const { title, sub } = titles[view];
  return (
    <header className="flex items-center gap-4 border-b border-border bg-background/80 px-7 py-4 backdrop-blur">
      <div className="min-w-0">
        <h1 className="truncate tracking-tight">{title}</h1>
        <p className="font-mono text-xs text-muted-foreground">{sub}</p>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <div className="hidden items-center gap-2 rounded-lg border border-border bg-input px-3 py-2 text-sm text-muted-foreground md:flex">
          <Search className="size-4" />
          <span className="w-40">노트·지식 검색…</span>
          <kbd className="flex items-center gap-0.5 rounded border border-border bg-secondary px-1.5 font-mono text-[10px]">
            <Command className="size-2.5" />K
          </kbd>
        </div>

        <button className="relative grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground">
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-signal" />
        </button>

        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card py-1 pl-1 pr-3">
          <div className="grid size-7 place-items-center rounded-md bg-gradient-to-br from-primary to-chart-5 font-mono text-xs text-primary-foreground">
            DK
          </div>
          <div className="hidden leading-tight sm:block">
            <div className="text-sm">김다혜</div>
            <div className="font-mono text-[10px] text-muted-foreground">플랫폼팀</div>
          </div>
        </div>
      </div>
    </header>
  );
}
