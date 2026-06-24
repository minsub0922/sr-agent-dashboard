import { ArrowRight, Loader2, AlertCircle } from "lucide-react";
import type { Note } from "../data";
import { getAgent, getProject, timeAgo } from "../data";
import { AgentAvatar, ChannelBadge, ConfidenceBar } from "./agent-bits";
import { cn } from "./ui/utils";

export function NoteCard({
  note,
  onRoute,
  className,
}: {
  note: Note;
  onRoute?: (note: Note) => void;
  className?: string;
}) {
  const agent = getAgent(note.agentId);
  const project = getProject(note.projectId);

  return (
    <article
      className={cn(
        "rounded-xl border border-border bg-card p-4 transition-colors hover:border-border/80",
        note.stage === "analyzing" && "border-primary/30 bg-primary/[0.03]",
        className,
      )}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <ChannelBadge channel={note.channel} />
        <span className="font-mono text-[11px] text-muted-foreground">{timeAgo(note.receivedAt)}</span>
        <div className="ml-auto flex items-center gap-1.5">
          {note.tags.slice(0, 2).map((t) => (
            <span key={t} className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              #{t}
            </span>
          ))}
        </div>
      </div>

      <p className="text-sm leading-relaxed text-foreground/90">{note.excerpt}</p>

      <div className="mt-3.5 border-t border-border pt-3">
        {note.stage === "analyzing" && agent && (
          <div className="flex items-center gap-2.5">
            <AgentAvatar agent={agent} size={26} showRing={false} />
            <div className="flex items-center gap-1.5 font-mono text-xs text-primary">
              <Loader2 className="size-3 animate-spin" />
              {agent.codename} 분석·분류 중…
            </div>
          </div>
        )}

        {note.stage === "inbox" && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono text-xs text-warn">
              <AlertCircle className="size-3.5" />
              검토 필요
            </div>
            {note.confidence != null && (
              <div className="flex-1">
                <ConfidenceBar value={note.confidence} />
              </div>
            )}
            {onRoute && (
              <button
                onClick={() => onRoute(note)}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 font-mono text-[11px] text-primary-foreground"
              >
                라우팅 <ArrowRight className="size-3" />
              </button>
            )}
          </div>
        )}

        {note.stage === "routed" && agent && project && (
          <div className="flex items-center gap-2.5">
            <AgentAvatar agent={agent} size={26} showRing={false} />
            <span className="font-mono text-xs text-muted-foreground">{agent.codename}</span>
            <ArrowRight className="size-3.5 text-muted-foreground" />
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-mono text-xs"
              style={{ background: `color-mix(in oklab, ${project.color} 16%, transparent)`, color: project.color }}
            >
              <span className="size-1.5 rounded-full" style={{ background: project.color }} />
              {project.name}
            </span>
            {note.confidence != null && (
              <span className="ml-auto font-mono text-[11px] text-signal tabular-nums">{note.confidence}%</span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
