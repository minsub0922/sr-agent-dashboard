import { getAgent, projects } from "../data";
import { AgentAvatar, StatusDot } from "./agent-bits";
import { AgentGridCard } from "./agent-grid-card";

export function AgentsView({ onOpenAgent }: { onOpenAgent: (id: string) => void }) {
  const atlas = getAgent("a-atlas")!;
  return (
    <div className="space-y-8">
      {/* 오케스트레이터 */}
      <button
        onClick={() => onOpenAgent(atlas.id)}
        className="relative block w-full overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/[0.08] to-transparent p-5 text-left transition-colors hover:border-primary/50"
      >
        <div className="flex items-center gap-4">
          <AgentAvatar agent={atlas} size={56} live />
          <div className="flex-1 leading-tight">
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg" style={{ color: atlas.accent }}>{atlas.codename}</span>
              <StatusDot status={atlas.status} label />
            </div>
            <div className="text-sm text-muted-foreground">{atlas.name} · {atlas.specialty}</div>
          </div>
          <div className="hidden gap-6 sm:flex">
            <KV label="라우팅" value={atlas.notesRouted.toLocaleString()} />
            <KV label="정확도" value={`${atlas.accuracy}%`} />
            <KV label="관할" value={`${projects.length}개`} />
          </div>
        </div>
      </button>

      {/* 프로젝트별 에이전트 그리드 */}
      {projects.map((p) => {
        const team = [getAgent(p.leadAgentId)!, ...p.subAgentIds.map((id) => getAgent(id)!)];
        return (
          <section key={p.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: p.color }} />
              <h2 className="tracking-tight">{p.name}</h2>
              <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                에이전트 {team.length}명
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {team.map((a) => (
                <AgentGridCard key={a.id} agent={a} onOpen={onOpenAgent} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right leading-tight">
      <div className="text-xl font-semibold tabular-nums">{value}</div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
    </div>
  );
}
