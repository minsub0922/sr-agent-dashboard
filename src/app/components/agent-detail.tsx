import { useState, useEffect } from "react";
import { Activity, BookOpen, FolderKanban, Target, Hash, MessageSquare, User } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import type { Note } from "../data";
import { getAgent, getProject, knowledge, timeAgo } from "../data";
import { StatusDot, statusLabel } from "./agent-bits";
import { NoteCard } from "./note-card";
import { AgentChat } from "./agent-chat";
import { cn } from "./ui/utils";

export function AgentDetail({
  agentId,
  notes,
  onClose,
  onOpenProject,
}: {
  agentId: string | null;
  notes: Note[];
  onClose: () => void;
  onOpenProject: (id: string) => void;
}) {
  const [tab, setTab] = useState<"profile" | "chat">("profile");
  useEffect(() => setTab("profile"), [agentId]);

  const agent = getAgent(agentId);
  if (!agent) return null;
  const project = getProject(agent.projectId);
  const handled = notes.filter((n) => n.agentId === agent.id && n.stage === "routed").slice(0, 4);
  const authored = knowledge.filter((k) => k.agentId === agent.id);

  return (
    <Sheet open={!!agentId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto border-border bg-background p-0 sm:max-w-lg">
        {/* 헤더 */}
        <div className="relative border-b border-border p-6">
          <span className="absolute inset-x-0 top-0 h-1" style={{ background: agent.accent }} />
          <SheetHeader className="gap-0 p-0 text-left">
            <div className="flex items-center gap-4">
              <span
                className="grid size-16 place-items-center rounded-2xl"
                style={{
                  fontSize: 34,
                  lineHeight: 1,
                  background: `radial-gradient(circle at 30% 25%, color-mix(in oklab, ${agent.accent} 28%, transparent), color-mix(in oklab, ${agent.accent} 10%, transparent))`,
                  boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${agent.accent} 45%, transparent)`,
                }}
              >
                {agent.emoji}
              </span>
              <div className="leading-tight">
                <SheetTitle className="font-mono text-2xl tracking-tight" style={{ color: agent.accent }}>
                  {agent.codename}
                </SheetTitle>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-sm text-foreground">{agent.name}</span>
                  <StatusDot status={agent.status} label />
                </div>
              </div>
            </div>
            <SheetDescription className="mt-4 text-sm leading-relaxed">{agent.specialty}</SheetDescription>
          </SheetHeader>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <Stat icon={Target} label="라우팅" value={agent.notesRouted.toLocaleString()} />
            <Stat icon={Activity} label="정확도" value={`${agent.accuracy}%`} />
            <Stat icon={Hash} label="상태" value={statusLabel(agent.status)} />
          </div>

          {project && (
            <button
              onClick={() => { onClose(); onOpenProject(project.id); }}
              className="mt-3 flex w-full items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-colors hover:border-primary/40"
            >
              <FolderKanban className="size-4 text-muted-foreground" />
              <span className="text-sm">{project.name}</span>
              <span className="ml-auto font-mono text-[11px] text-muted-foreground">소속 프로젝트 →</span>
            </button>
          )}

          {/* 탭 */}
          <div className="mt-4 flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            <TabButton active={tab === "profile"} onClick={() => setTab("profile")} icon={User} label="프로필" />
            <TabButton active={tab === "chat"} onClick={() => setTab("chat")} icon={MessageSquare} label="대화" />
          </div>
        </div>

        {tab === "chat" ? (
          <div className="p-6 pt-4">
            <AgentChat key={agent.id} agent={agent} />
          </div>
        ) : (
        <div className="space-y-7 p-6">
          {/* 작성한 지식 */}
          <section>
            <SectionTitle icon={BookOpen} title="작성한 지식" />
            <div className="space-y-2.5">
              {authored.map((k) => (
                <div key={k.id} className="rounded-xl border border-border bg-card p-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{k.title}</span>
                    <span className="ml-auto font-mono text-[11px] text-muted-foreground">{timeAgo(k.updatedAt)}</span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{k.summary}</p>
                </div>
              ))}
              {authored.length === 0 && <Empty text="아직 작성한 지식이 없습니다." />}
            </div>
          </section>

          {/* 처리한 노트 */}
          <section>
            <SectionTitle icon={Activity} title="최근 처리한 노트" />
            <div className="space-y-3">
              {handled.map((n) => (
                <NoteCard key={n.id} note={n} />
              ))}
              {handled.length === 0 && <Empty text="최근 처리한 노트가 없습니다." />}
            </div>
          </section>
        </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: typeof Target; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="size-4 text-muted-foreground" />
      <h3 className="tracking-tight">{title}</h3>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">{text}</div>;
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof User; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors",
        active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}
