import { useState, useRef } from "react";
import { CornerDownLeft, Sparkles, ChevronDown, Check } from "lucide-react";
import { agents, getProject } from "../data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { cn } from "./ui/utils";

export function CaptureBar({
  onCapture,
  compact = false,
}: {
  onCapture: (text: string, agentId: string | null) => void;
  compact?: boolean;
}) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  // null = 자동 (ATLAS가 분류)
  const [agentId, setAgentId] = useState<string | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);

  const selected = agents.find((a) => a.id === agentId);
  const selectableAgents = agents.filter((a) => a.projectId); // 프로젝트와 1:1 매칭된 에이전트만

  function submit() {
    const text = value.trim();
    if (!text) return;
    onCapture(text, agentId);
    setValue("");
    if (ref.current) ref.current.style.height = "auto";
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card transition-all",
        focused ? "border-primary/60 ring-4 ring-primary/10" : "border-border hover:border-border",
        compact ? "p-2" : "p-3",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1.5 grid size-7 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
          <Sparkles className="size-4" />
        </div>
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
          }}
          onKeyDown={handleKey}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={1}
          placeholder="노트를 붙여넣고 Enter — 담당 에이전트를 고르거나 자동 분류에 맡기세요."
          className="mt-1 max-h-40 flex-1 resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          onClick={submit}
          disabled={!value.trim()}
          className="mt-0.5 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground transition-opacity disabled:opacity-40"
        >
          보내기
          <CornerDownLeft className="size-3.5" />
        </button>
      </div>

      {/* 에이전트 선택 + 힌트 */}
      <div className="mt-2 flex flex-wrap items-center gap-2 pl-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-2.5 py-1 text-xs transition-colors hover:bg-secondary">
              {selected ? (
                <>
                  <span style={{ fontSize: 13 }}>{selected.emoji}</span>
                  <span className="font-mono" style={{ color: selected.accent }}>{selected.codename}</span>
                  <span className="text-muted-foreground">· {getProject(selected.projectId)?.name}</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 13 }}>🧭</span>
                  <span className="font-mono text-primary">자동 분류</span>
                  <span className="text-muted-foreground">· ATLAS</span>
                </>
              )}
              <ChevronDown className="size-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              담당 에이전트
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setAgentId(null)} className="gap-2">
              <span style={{ fontSize: 15 }}>🧭</span>
              <div className="flex-1 leading-tight">
                <div className="font-mono text-primary">자동 분류</div>
                <div className="text-[11px] text-muted-foreground">ATLAS가 알맞은 프로젝트로 라우팅</div>
              </div>
              {agentId === null && <Check className="size-3.5 text-primary" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {selectableAgents.map((a) => {
              const project = getProject(a.projectId);
              return (
                <DropdownMenuItem key={a.id} onClick={() => setAgentId(a.id)} className="gap-2">
                  <span style={{ fontSize: 15 }}>{a.emoji}</span>
                  <div className="flex-1 leading-tight">
                    <div className="font-mono" style={{ color: a.accent }}>
                      {a.codename}
                      <span className="ml-1 text-[10px] text-muted-foreground">{a.role === "lead" ? "리드" : "서브"}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">{project?.name}</div>
                  </div>
                  {agentId === a.id && <Check className="size-3.5 text-primary" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {!compact && (
          <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
            <span className="text-border">·</span>
            <span>Enter 전송</span>
            <span className="text-border">·</span>
            <span>에이전트 지정 시 해당 프로젝트로 바로 전달</span>
          </div>
        )}
      </div>
    </div>
  );
}
