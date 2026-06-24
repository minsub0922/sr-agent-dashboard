import { useState, useRef, useEffect } from "react";
import { CornerDownLeft, Sparkles } from "lucide-react";
import type { Agent } from "../data";
import { getProject, knowledge, notes } from "../data";

interface Msg {
  id: string;
  role: "user" | "agent";
  text: string;
}

let mid = 0;

// 에이전트 페르소나에 맞춘 가벼운 모의 응답 생성기
function buildReply(agent: Agent, input: string): string {
  const project = getProject(agent.projectId);
  const lower = input.toLowerCase();
  const handled = notes.filter((n) => n.agentId === agent.id && n.stage === "routed");
  const authored = knowledge.filter((k) => k.agentId === agent.id);

  if (lower.includes("요약") || lower.includes("정리")) {
    if (handled.length) {
      return `최근 ${project?.name}에서 처리한 노트 ${handled.length}건을 요약하면, 핵심은 "${handled[0].excerpt}" 입니다. 더 깊게 볼까요?`;
    }
    return `아직 ${project?.name}에서 제가 처리한 노트가 많지 않아요. 새 노트가 들어오면 바로 정리해 드릴게요.`;
  }
  if (lower.includes("미해결") || lower.includes("질문") || lower.includes("이슈")) {
    return `현재 제가 플래그한 미해결 항목으로는 "${authored[0]?.title ?? "커넥션 풀 점검"}" 관련 후속 조치가 있어요. 담당자를 지정해 드릴까요?`;
  }
  if (lower.includes("분류") || lower.includes("라우팅") || lower.includes("어떻게")) {
    return `저는 ${agent.specialty} 영역의 신호를 우선으로 봅니다. 노트에서 관련 키워드가 잡히면 ${project?.name}(으)로 분류하고, 애매하면 신뢰도를 낮춰 인박스로 올립니다.`;
  }
  if (lower.includes("안녕") || lower.includes("hi") || lower.includes("hello")) {
    return `안녕하세요, ${agent.codename}입니다. ${project ? `${project.name}을(를) 담당하고 있어요.` : "전체 분류를 맡고 있어요."} 무엇을 도와드릴까요?`;
  }
  return `${agent.codename}로서 "${input}"에 대해 ${project?.name ?? "워크스페이스"} 맥락에서 살펴봤어요. 관련 지식 ${authored.length}건과 노트 ${handled.length}건을 참고할 수 있습니다. 더 구체적으로 알려주시면 깊이 파볼게요.`;
}

const suggestions = ["최근 처리한 노트 요약해줘", "미해결 질문은 뭐가 있어?", "노트를 어떻게 분류해?"];

export function AgentChat({ agent }: { agent: Agent }) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: `m-${mid++}`,
      role: "agent",
      text: `안녕하세요, ${agent.codename}입니다. ${agent.specialty} 관련해서 무엇이든 물어보세요.`,
    },
  ]);
  const [value, setValue] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { id: `m-${mid++}`, role: "user", text: trimmed }]);
    setValue("");
    setTyping(true);
    window.setTimeout(() => {
      setMessages((prev) => [...prev, { id: `m-${mid++}`, role: "agent", text: buildReply(agent, trimmed) }]);
      setTyping(false);
    }, 900);
  }

  return (
    <div className="flex h-[calc(100vh-15rem)] min-h-80 flex-col">
      {/* 메시지 목록 */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.map((m) =>
          m.role === "agent" ? (
            <div key={m.id} className="flex items-start gap-2.5">
              <span
                className="grid size-7 shrink-0 place-items-center rounded-lg"
                style={{
                  fontSize: 15,
                  background: `color-mix(in oklab, ${agent.accent} 18%, transparent)`,
                  boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${agent.accent} 40%, transparent)`,
                }}
              >
                {agent.emoji}
              </span>
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-border bg-card px-3.5 py-2.5 text-sm leading-relaxed">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground">
                {m.text}
              </div>
            </div>
          ),
        )}
        {typing && (
          <div className="flex items-center gap-2.5">
            <span
              className="grid size-7 shrink-0 place-items-center rounded-lg"
              style={{ fontSize: 15, background: `color-mix(in oklab, ${agent.accent} 18%, transparent)` }}
            >
              {agent.emoji}
            </span>
            <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-border bg-card px-3.5 py-3">
              <Dot /> <Dot delay={0.15} /> <Dot delay={0.3} />
            </div>
          </div>
        )}
      </div>

      {/* 추천 질문 */}
      {messages.length <= 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* 입력 */}
      <div className="mt-3 flex items-end gap-2 rounded-xl border border-border bg-card p-2">
        <Sparkles className="mb-1.5 ml-1 size-4 shrink-0" style={{ color: agent.accent }} />
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(value);
            }
          }}
          rows={1}
          placeholder={`${agent.codename}에게 메시지…`}
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
    </div>
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
