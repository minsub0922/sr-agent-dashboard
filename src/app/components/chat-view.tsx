import { useState, useRef, useEffect, Fragment } from "react";
import { CornerDownLeft, Plus, X, AtSign } from "lucide-react";
import type { Agent, Project } from "../data";
import { agents as baseAgents, getAgent } from "../data";
import { AgentAvatar } from "./agent-bits";
import { buildReply } from "./agent-chat";
import { ProjectSetupChat, type NewProjectDraft } from "./project-setup-chat";
import { cn } from "./ui/utils";

interface Msg {
  id: string;
  role: "user" | "agent";
  agentId?: string;
  text: string;
}

const ATLAS = "a-atlas";
const codenamePool = ["RIGEL", "MAIA", "CETUS", "DRACO", "PHEN", "LYNX", "ARIA", "ZEPH"];
const emojiPool = ["🛰️", "📦", "⭐", "🧩", "🔧", "🌙", "🪐", "🧠"];
let customSeq = 0;
let mid = 0;

function buildFromDraft(draft: NewProjectDraft): { project: Project; lead: Agent } {
  customSeq += 1;
  const pid = `p-custom-${customSeq}`;
  const aid = `a-custom-${customSeq}`;
  const codename = codenamePool[(customSeq - 1) % codenamePool.length];
  const emoji = emojiPool[(customSeq - 1) % emojiPool.length];
  const lead: Agent = {
    id: aid, codename, name: `리드 · ${draft.name}`, emoji, role: "lead",
    specialty: draft.description || draft.keywords || "새 프로젝트 지식 관리",
    status: "training", accent: draft.color, projectId: pid, notesRouted: 0, accuracy: 80,
  };
  const project: Project = {
    id: pid, name: draft.name,
    codename: (draft.name.replace(/[^A-Za-z가-힣]/g, "").slice(0, 3) || codename.slice(0, 3)).toUpperCase(),
    description: draft.description, color: draft.color, leadAgentId: aid, subAgentIds: [],
    noteCount: 0, knowledgeCount: 0, health: 100, lastUpdated: new Date().toISOString(),
  };
  return { project, lead };
}

const MENTION_RE = /@([A-Za-z0-9가-힣]+)/g;
const TRAILING_MENTION = /@([A-Za-z0-9가-힣]*)$/;

export function ChatView() {
  const [, setVersion] = useState(0); // 동적 에이전트 추가 후 리렌더용
  const [adding, setAdding] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { id: `c-${mid++}`, role: "agent", agentId: ATLAS, text: "안녕하세요, ATLAS입니다. 무엇이든 물어보세요. 특정 에이전트를 부르려면 @를 입력하세요. (예: @NOVA 이번 주 피드백 정리해줘)" },
  ]);
  const [value, setValue] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const mentionAgents = baseAgents;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  // @멘션 자동완성
  const trailing = TRAILING_MENTION.exec(value);
  const mentionQuery = trailing ? trailing[1].toLowerCase() : null;
  const suggestions =
    mentionQuery !== null
      ? mentionAgents.filter((a) => a.codename.toLowerCase().startsWith(mentionQuery)).slice(0, 6)
      : [];

  function applyMention(agent: Agent) {
    setValue((v) => v.replace(TRAILING_MENTION, `@${agent.codename} `));
    inputRef.current?.focus();
  }

  function responders(text: string): Agent[] {
    const found: Agent[] = [];
    let m: RegExpExecArray | null;
    MENTION_RE.lastIndex = 0;
    while ((m = MENTION_RE.exec(text))) {
      const a = mentionAgents.find((x) => x.codename.toLowerCase() === m![1].toLowerCase());
      if (a && !found.includes(a)) found.push(a);
    }
    return found.length ? found : [getAgent(ATLAS)!];
  }

  function send(text: string) {
    const t = text.trim();
    if (!t) return;
    const replyAgents = responders(t);
    setMessages((prev) => [...prev, { id: `c-${mid++}`, role: "user", text: t }]);
    setValue("");
    setTyping(true);
    replyAgents.forEach((agent, i) => {
      window.setTimeout(() => {
        setMessages((prev) => [...prev, { id: `c-${mid++}`, role: "agent", agentId: agent.id, text: buildReply(agent, t) }]);
        if (i === replyAgents.length - 1) setTyping(false);
      }, 700 * (i + 1));
    });
  }

  function handleCreate(draft: NewProjectDraft) {
    const { project, lead } = buildFromDraft(draft);
    baseAgents.push(lead);
    setVersion((v) => v + 1);
    setAdding(false);
    setMessages((prev) => [
      ...prev,
      { id: `c-${mid++}`, role: "agent", agentId: lead.id, text: `'${project.name}' 프로젝트가 준비됐어요. 저는 ${lead.codename}예요. @${lead.codename}로 언제든 불러주세요.` },
    ]);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-3rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card">
      {adding ? (
        <>
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-primary/15 text-primary"><Plus className="size-4" /></span>
              <span className="text-sm">새 프로젝트 만들기</span>
            </div>
            <button onClick={() => setAdding(false)} className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 p-4">
            <ProjectSetupChat onCreate={handleCreate} onCancel={() => setAdding(false)} />
          </div>
        </>
      ) : (
        <>
          {/* 메시지 */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((m) => {
              if (m.role === "user") {
                return (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground">
                      <MentionText text={m.text} onPrimary />
                    </div>
                  </div>
                );
              }
              const agent = getAgent(m.agentId ?? ATLAS)!;
              return (
                <div key={m.id} className="flex items-start gap-2.5">
                  <AgentAvatar agent={agent} size={28} showRing={false} />
                  <div className="max-w-[80%]">
                    <div className="mb-1 font-mono text-[11px]" style={{ color: agent.accent }}>{agent.codename}</div>
                    <div className="rounded-2xl rounded-tl-sm border border-border bg-background px-3.5 py-2.5 text-sm leading-relaxed">
                      {m.text}
                    </div>
                  </div>
                </div>
              );
            })}
            {typing && (
              <div className="flex items-center gap-2.5">
                <span className="grid size-7 place-items-center rounded-lg bg-secondary" style={{ fontSize: 14 }}>💬</span>
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-border bg-background px-3.5 py-3">
                  <Dot /> <Dot delay={0.15} /> <Dot delay={0.3} />
                </div>
              </div>
            )}
          </div>

          {/* 입력 */}
          <div className="relative border-t border-border p-3">
            {/* @ 자동완성 */}
            {suggestions.length > 0 && (
              <div className="absolute bottom-full left-3 mb-2 w-72 overflow-hidden rounded-xl border border-border bg-popover p-1 shadow-xl">
                <div className="px-2 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">에이전트 호출</div>
                {suggestions.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => applyMention(a)}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-secondary"
                  >
                    <span style={{ fontSize: 15 }}>{a.emoji}</span>
                    <span className="font-mono" style={{ color: a.accent }}>{a.codename}</span>
                    <span className="truncate text-[11px] text-muted-foreground">{a.specialty}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2 rounded-xl border border-border bg-background p-2">
              <button
                onClick={() => setAdding(true)}
                title="프로젝트 추가"
                className="mb-0.5 grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Plus className="size-4" />
              </button>
              <textarea
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (suggestions.length > 0) {
                      applyMention(suggestions[0]);
                    } else {
                      send(value);
                    }
                  }
                }}
                rows={1}
                placeholder="메시지를 입력하세요…  @로 에이전트 호출"
                className="max-h-28 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={() => send(value)}
                disabled={!value.trim()}
                className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
              >
                <CornerDownLeft className="size-4" />
              </button>
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 pl-1 font-mono text-[11px] text-muted-foreground">
              <AtSign className="size-3" />
              에이전트를 부르면 대화에 참여해 답합니다
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// @멘션을 강조 렌더
function MentionText({ text, onPrimary }: { text: string; onPrimary?: boolean }) {
  const parts: { t: string; mention: boolean }[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  MENTION_RE.lastIndex = 0;
  while ((m = MENTION_RE.exec(text))) {
    if (m.index > last) parts.push({ t: text.slice(last, m.index), mention: false });
    const known = baseAgents.some((a) => a.codename.toLowerCase() === m![1].toLowerCase());
    parts.push({ t: m[0], mention: known });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ t: text.slice(last), mention: false });

  return (
    <>
      {parts.map((p, i) =>
        p.mention ? (
          <span
            key={i}
            className={cn("rounded px-1 font-mono", onPrimary ? "bg-primary-foreground/20" : "bg-primary/15 text-primary")}
          >
            {p.t}
          </span>
        ) : (
          <Fragment key={i}>{p.t}</Fragment>
        ),
      )}
    </>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <span
      className="size-1.5 animate-bounce rounded-full bg-muted-foreground"
      style={{ animationDelay: `${delay}s`, animationDuration: "1s" }}
    />
  );
}
