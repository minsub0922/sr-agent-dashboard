import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FileCode, RotateCcw, Save, Cpu, ShieldCheck, Activity } from "lucide-react";
import type { Agent } from "../data";
import { getAgent, getProject } from "../data";
import { cn } from "./ui/utils";

/* 에이전트별 구성 파일 자동 생성 — soul.md, agents.md, memory.md, tools.md, routing.yaml */
function buildConfigs(agent: Agent): Record<string, string> {
  const project = getProject(agent.projectId);
  const roleK = agent.role === "lead" ? "리드" : "서브";
  const lead = project ? getAgent(project.leadAgentId) : undefined;
  const team = project ? [project.leadAgentId, ...project.subAgentIds].map((id) => getAgent(id)!) : [];
  const peers = team.filter((a) => a.id !== agent.id);
  const keywords = agent.specialty
    .split(/[,·]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);

  const soul = `---
codename: ${agent.codename}
role: ${agent.name}
project: ${project?.name ?? "오케스트레이션"}
emoji: ${agent.emoji}
---

# Soul

너는 ${agent.codename}, ${agent.specialty}를 담당하는 ${roleK} 에이전트다.

## 미션
${project ? `${project.name}에서 ${agent.specialty}` : "모든 프로젝트의 노트를 분류·라우팅"}을(를) 책임진다.

## 가치
- 근거 우선 — 모든 결론에 출처 노트와 수치를 남긴다.
- 작게 반복 — 큰 변경보다 검증 가능한 작은 단위로 진행한다.
- 정직 — 실패 케이스를 숨기지 않고 먼저 보고한다.

## 톤
간결하고 기술적. 모르는 것은 모른다고 말한다.
`;

  const agentsMd = `# AGENTS.md

## 본인
- ${agent.codename} (${agent.id}) · ${roleK} · ${agent.specialty}

## 오케스트레이터
- ATLAS (a-atlas) — 노트 분류·라우팅. 모호한 신호는 ATLAS에 위임한다.
${
  agent.role === "sub" && lead
    ? `\n## 리드\n- ${lead.codename} (${lead.id}) — 에스컬레이션·리뷰 담당`
    : agent.role === "lead" && project
      ? `\n## 리드십\n- 본인이 ${project.name}의 리드. 서브를 조율하고 검토한다.`
      : ""
}
${
  peers.length
    ? `\n## 동료\n${peers.map((p) => `- ${p.codename} (${p.id}) — ${p.specialty}`).join("\n")}`
    : ""
}

## 협업 규칙
- 프로젝트 범위를 벗어난 신호는 ATLAS를 통해 라우팅한다.
- 지식 갱신 시 contributors에 본인을 기록한다.
- 상충 시 리드 → ATLAS 순으로 에스컬레이션.
`;

  const memory = `# memory.md

scope:
  session:  대화 단위 · 휘발성
  project:  ${project?.codename ?? "ORG"} 지식 베이스 · 영구
  shared:   조직 공용 · 기본 읽기 전용

retention:
  session_ttl: 24h
  project:     무기한(수동 정리)

write_policy: 검증된 결론만 project memory에 기록한다.
embeddings:   bge-m3 · 1024d
`;

  const tools = `# tools.md — allowed-tools

allow:
  - Read
  - Write
  - Bash
  - Grep
  - WebSearch
${project ? `  - mcp:${project.codename.toLowerCase()}-server` : "  - mcp:orchestrator"}

deny:
  - network.egress   # 외부 송신 차단(기본)
  - secrets.read

hitl_required:
  - delete
  - external_post
`;

  const routing = `# routing.yaml — ${agent.codename} 수신 신호
project: ${project?.id ?? "null"}
agent: ${agent.id}
keywords:
${keywords.map((k) => `  - ${k}`).join("\n")}
threshold: 0.62
fallback: a-atlas
confidence_floor: 0.55
`;

  return {
    "soul.md": soul,
    "agents.md": agentsMd,
    "memory.md": memory,
    "tools.md": tools,
    "routing.yaml": routing,
  };
}

const FILES = ["soul.md", "agents.md", "memory.md", "tools.md", "routing.yaml"];

const MODEL_OPTIONS = ["Gauss4-0.6B", "Gauss4-1.7B", "claude-sonnet-4-6", "local-llm-8B"];
const AUTONOMY = [
  { key: "manual", label: "수동 승인" },
  { key: "semi", label: "반자동" },
  { key: "auto", label: "자율" },
] as const;
const STATUS_OPTIONS: { key: Agent["status"]; label: string }[] = [
  { key: "active", label: "활성" },
  { key: "processing", label: "분석 중" },
  { key: "idle", label: "대기" },
  { key: "training", label: "학습 중" },
];

export function AgentSettings({ agent }: { agent: Agent }) {
  const base = useMemo(() => buildConfigs(agent), [agent]);
  const [saved, setSaved] = useState<Record<string, string>>(base);
  const [draft, setDraft] = useState<Record<string, string>>(base);
  const [file, setFile] = useState(FILES[0]);

  const defaultModel = agent.projectId === "p-ondevice" ? "Gauss4-0.6B" : "claude-sonnet-4-6";
  const [model, setModel] = useState(defaultModel);
  const [autonomy, setAutonomy] = useState<(typeof AUTONOMY)[number]["key"]>(agent.role === "lead" ? "auto" : "semi");
  const [status, setStatus] = useState<Agent["status"]>(agent.status);

  const dirty = (f: string) => draft[f] !== saved[f];
  const dirtyCount = FILES.filter(dirty).length;

  const saveFile = () => {
    setSaved((s) => ({ ...s, [file]: draft[file] }));
    toast.success(`${file} 저장됨`, { description: `${agent.codename} 구성이 업데이트되었습니다.` });
  };
  const revertFile = () => setDraft((d) => ({ ...d, [file]: saved[file] }));
  const saveAll = () => {
    setSaved({ ...draft });
    toast.success("모든 구성 저장됨", { description: `${agent.codename} · ${dirtyCount}개 파일` });
  };

  return (
    <div className="space-y-5 p-6">
      {/* 구조화 설정 */}
      <section className="space-y-3">
        <div className="grid grid-cols-1 gap-3">
          <Field icon={Cpu} label="모델">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full rounded-lg border border-border bg-input px-2.5 py-1.5 font-mono text-xs text-foreground outline-none focus:border-primary/50"
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m} value={m} className="bg-card">{m}</option>
              ))}
            </select>
          </Field>

          <Field icon={ShieldCheck} label="자율성 (HITL)">
            <div className="flex items-center gap-1 rounded-lg border border-border bg-input p-0.5">
              {AUTONOMY.map((a) => (
                <button
                  key={a.key}
                  onClick={() => setAutonomy(a.key)}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1 font-mono text-[11px] transition-colors",
                    autonomy === a.key ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </Field>

          <Field icon={Activity} label="상태">
            <div className="flex flex-wrap items-center gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStatus(s.key)}
                  className={cn(
                    "rounded-md border px-2 py-1 font-mono text-[11px] transition-colors",
                    status === s.key ? "border-primary/50 bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </section>

      {/* 구성 파일 편집기 */}
      <section>
        <div className="mb-2 flex items-center gap-2">
          <FileCode className="size-4 text-muted-foreground" />
          <h3 className="tracking-tight">구성 파일</h3>
          {dirtyCount > 0 && (
            <button onClick={saveAll} className="ml-auto inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 font-mono text-[10px] text-primary-foreground transition-opacity hover:opacity-90">
              <Save className="size-3" />모두 저장 ({dirtyCount})
            </button>
          )}
        </div>

        {/* 파일 선택 */}
        <div className="flex flex-wrap items-center gap-1.5">
          {FILES.map((f) => (
            <button
              key={f}
              onClick={() => setFile(f)}
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-[11px] transition-colors",
                f === file ? "border-primary/50 bg-secondary text-foreground" : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
              {dirty(f) && <span className="size-1.5 rounded-full bg-primary" />}
            </button>
          ))}
        </div>

        {/* 경로 + 액션 */}
        <div className="mt-3 flex items-center gap-2 rounded-t-lg border border-b-0 border-border bg-card px-3 py-2">
          <span className="truncate font-mono text-[11px] text-muted-foreground">
            agents/{agent.codename.toLowerCase()}/{file}
          </span>
          {dirty(file) && <span className="font-mono text-[10px] text-primary">● 수정됨</span>}
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={revertFile}
              disabled={!dirty(file)}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 font-mono text-[10px] text-muted-foreground transition-colors enabled:hover:text-foreground disabled:opacity-40"
            >
              <RotateCcw className="size-3" />되돌리기
            </button>
            <button
              onClick={saveFile}
              disabled={!dirty(file)}
              className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 font-mono text-[10px] text-primary-foreground transition-opacity enabled:hover:opacity-90 disabled:opacity-40"
            >
              <Save className="size-3" />저장
            </button>
          </div>
        </div>

        {/* 에디터 */}
        <textarea
          value={draft[file]}
          onChange={(e) => setDraft((d) => ({ ...d, [file]: e.target.value }))}
          spellCheck={false}
          className="block h-[340px] w-full resize-none rounded-b-lg border border-border bg-input/40 p-3 font-mono text-[12px] leading-relaxed text-foreground/90 outline-none focus:border-primary/40"
        />
        <p className="mt-2 font-mono text-[10px] text-muted-foreground">
          데모 환경 — 저장은 세션 내 메모리에만 반영됩니다.
        </p>
      </section>
    </div>
  );
}

function Field({ icon: Icon, label, children }: { icon: typeof Cpu; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      {children}
    </div>
  );
}
