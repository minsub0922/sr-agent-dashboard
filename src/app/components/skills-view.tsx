import { useMemo, useState } from "react";
import {
  Boxes,
  Search,
  Wrench,
  Dumbbell,
  Minimize2,
  ClipboardCheck,
  Filter,
  Route,
  Plug,
  FileInput,
  Network,
  GitBranch,
  ScanSearch,
  CalendarCheck,
  UserPlus,
  Presentation,
  FileText,
  Table,
  type LucideIcon,
} from "lucide-react";
import { getAgent, getProject } from "../data";
import { AgentAvatar } from "./agent-bits";
import { cn } from "./ui/utils";

/* ──────────────────────────────────────────────────────────────────────────
 * 스킬 모델 — Claude SKILL.md(frontmatter) 구조를 따름.
 *   header = { name, description, license, version, allowed-tools, source }
 * ────────────────────────────────────────────────────────────────────────── */

type SkillSource = "official" | "clawhub" | "github";

interface Skill {
  name: string; // kebab-case, Skill 명령으로 사용
  description: string; // 언제 쓰는지 — 트리거 신호 (SKILL.md description)
  version: string;
  license: string;
  source: SkillSource;
  allowedTools: string[];
  icon: LucideIcon;
  projectId: string; // 대표 프로젝트(색/카테고리)
  usage: { agentId: string; uses: number }[]; // 많이 사용한 에이전트 순
}

const sourceMeta: Record<SkillSource, { label: string; color: string }> = {
  official: { label: "공식", color: "var(--signal)" },
  clawhub: { label: "ClawHub", color: "var(--primary)" },
  github: { label: "GitHub", color: "var(--muted-foreground)" },
};

// 사내 7개 프로젝트의 에이전트들이 사용하는 스킬.
const skills: Skill[] = [
  {
    name: "sft-trainer",
    description: "소형 모델 SFT 학습을 실행하고 checkpoint·tokenizer·instruction format을 관리할 때 사용. Gauss4 0.6B 등 학습·재현에 트리거.",
    version: "2.4.1",
    license: "사내",
    source: "official",
    allowedTools: ["Bash", "Read", "Write"],
    icon: Dumbbell,
    projectId: "p-ondevice",
    usage: [{ agentId: "a-ember", uses: 412 }, { agentId: "a-forge", uses: 188 }, { agentId: "a-atom", uses: 64 }],
  },
  {
    name: "quant-bench",
    description: "PTQ·QAT·KD로 모델을 압축하고 latency·throughput·memory를 온디바이스에서 측정할 때 사용.",
    version: "1.9.0",
    license: "사내",
    source: "official",
    allowedTools: ["Bash", "Read"],
    icon: Minimize2,
    projectId: "p-ondevice",
    usage: [{ agentId: "a-atom", uses: 356 }, { agentId: "a-forge", uses: 140 }, { agentId: "a-ember", uses: 71 }],
  },
  {
    name: "eval-harness",
    description: "Task/YAML 설정으로 평가 워크플로를 돌리고 precision·recall·F1·JGA를 산출, leaderboard를 갱신할 때 사용.",
    version: "3.1.2",
    license: "Apache-2.0",
    source: "official",
    allowedTools: ["Bash", "Read", "Write"],
    icon: ClipboardCheck,
    projectId: "p-eval",
    usage: [{ agentId: "a-gauge", uses: 503 }, { agentId: "a-prism", uses: 221 }, { agentId: "a-sieve", uses: 96 }],
  },
  {
    name: "data-linter",
    description: "데이터셋의 누락·중복·label inconsistency·leakage를 점검하고 버전 태깅할 때 사용.",
    version: "1.5.4",
    license: "MIT",
    source: "github",
    allowedTools: ["Read", "Grep"],
    icon: Filter,
    projectId: "p-eval",
    usage: [{ agentId: "a-sieve", uses: 288 }, { agentId: "a-prism", uses: 77 }, { agentId: "a-ingest", uses: 41 }],
  },
  {
    name: "agent-router",
    description: "keyword·embedding·LLM 기반 routing 정책을 비교·평가하고 임계값을 튜닝할 때 사용.",
    version: "0.8.3",
    license: "사내",
    source: "official",
    allowedTools: ["Read", "Bash"],
    icon: Route,
    projectId: "p-agent",
    usage: [{ agentId: "a-route", uses: 274 }, { agentId: "a-nexus", uses: 132 }, { agentId: "a-relay", uses: 58 }],
  },
  {
    name: "mcp-toolkit",
    description: "MCP·A2A로 tool calling과 delegation을 구성하고 scope·HITL 게이트를 검증할 때 사용.",
    version: "2.0.0",
    license: "MIT",
    source: "clawhub",
    allowedTools: ["Bash", "Read", "Write"],
    icon: Plug,
    projectId: "p-agent",
    usage: [{ agentId: "a-relay", uses: 241 }, { agentId: "a-nexus", uses: 150 }, { agentId: "a-route", uses: 73 }, { agentId: "a-ward", uses: 34 }],
  },
  {
    name: "note-ingestor",
    description: "수집된 노트에서 요약·Todo·이슈·링크·결정사항을 추출하고 Inbox로 분류할 때 사용.",
    version: "1.3.0",
    license: "사내",
    source: "official",
    allowedTools: ["Read", "Write"],
    icon: FileInput,
    projectId: "p-srnote",
    usage: [{ agentId: "a-ingest", uses: 466 }, { agentId: "a-canvas", uses: 174 }, { agentId: "a-weave", uses: 52 }],
  },
  {
    name: "kg-builder",
    description: "노트를 Project Wiki·Knowledge Graph로 합성하고 관련 프로젝트를 탐색할 때 사용.",
    version: "0.6.1",
    license: "사내",
    source: "official",
    allowedTools: ["Read", "Write", "Bash"],
    icon: Network,
    projectId: "p-srnote",
    usage: [{ agentId: "a-weave", uses: 318 }, { agentId: "a-canvas", uses: 121 }, { agentId: "a-ingest", uses: 64 }],
  },
  {
    name: "ci-gatekeeper",
    description: "lint·typecheck·test·build 품질 게이트를 실행하고 regression을 차단할 때 사용.",
    version: "4.2.0",
    license: "MIT",
    source: "github",
    allowedTools: ["Bash"],
    icon: GitBranch,
    projectId: "p-devplat",
    usage: [{ agentId: "a-gate", uses: 392 }, { agentId: "a-bastion", uses: 165 }, { agentId: "a-ward", uses: 80 }],
  },
  {
    name: "secret-scan",
    description: "prompt injection·secret leakage·SSRF를 점검하고 dependency audit·license check를 수행할 때 사용.",
    version: "1.7.2",
    license: "Apache-2.0",
    source: "official",
    allowedTools: ["Bash", "Grep", "Read"],
    icon: ScanSearch,
    projectId: "p-devplat",
    usage: [{ agentId: "a-ward", uses: 305 }, { agentId: "a-bastion", uses: 142 }, { agentId: "a-gate", uses: 47 }],
  },
  {
    name: "event-runbook",
    description: "월례회·워크숍·행사 준비 체크리스트와 보드게임·상품·다과 발주를 관리할 때 사용.",
    version: "1.1.0",
    license: "사내",
    source: "official",
    allowedTools: ["Read", "Write"],
    icon: CalendarCheck,
    projectId: "p-teamops",
    usage: [{ agentId: "a-fete", uses: 168 }, { agentId: "a-hearth", uses: 96 }, { agentId: "a-ledger", uses: 23 }],
  },
  {
    name: "onboarding-kit",
    description: "신규 입사자·인턴 온보딩 체크리스트와 주간 멘토링·follow-up을 관리할 때 사용.",
    version: "1.0.4",
    license: "사내",
    source: "official",
    allowedTools: ["Read", "Write"],
    icon: UserPlus,
    projectId: "p-intern",
    usage: [{ agentId: "a-guide", uses: 152 }, { agentId: "a-beacon", uses: 74 }, { agentId: "a-spark", uses: 19 }],
  },
  {
    name: "pitch-deck",
    description: "해커톤 발표 논리·데모 시나리오·리스크/fallback을 정리해 슬라이드로 구성할 때 사용.",
    version: "2.2.0",
    license: "MIT",
    source: "clawhub",
    allowedTools: ["Read", "Write"],
    icon: Presentation,
    projectId: "p-intern",
    usage: [{ agentId: "a-spark", uses: 134 }, { agentId: "a-beacon", uses: 58 }, { agentId: "a-fete", uses: 27 }],
  },
  {
    name: "pdf-toolkit",
    description: "PDF에서 텍스트·표를 추출하거나 병합·분할·폼 작성을 할 때 사용. 여러 프로젝트가 공통으로 활용.",
    version: "5.0.1",
    license: "Proprietary",
    source: "official",
    allowedTools: ["Bash", "Read"],
    icon: FileText,
    projectId: "p-srnote",
    usage: [{ agentId: "a-ingest", uses: 211 }, { agentId: "a-sieve", uses: 96 }, { agentId: "a-ledger", uses: 74 }, { agentId: "a-spark", uses: 41 }],
  },
  {
    name: "spreadsheet",
    description: "벤치마크 결과·예산·메트릭을 표/차트로 정리하고 .xlsx로 출력할 때 사용. 여러 프로젝트가 공통으로 활용.",
    version: "5.0.1",
    license: "Proprietary",
    source: "official",
    allowedTools: ["Bash", "Read", "Write"],
    icon: Table,
    projectId: "p-eval",
    usage: [{ agentId: "a-gauge", uses: 183 }, { agentId: "a-ledger", uses: 108 }, { agentId: "a-atom", uses: 52 }],
  },
];

/* ──────────────────────────────────────────────────────────────────────────
 * 스킬 항목
 * ────────────────────────────────────────────────────────────────────────── */

function SkillRow({ skill, delay, onOpenAgent }: { skill: Skill; delay: number; onOpenAgent: (id: string) => void }) {
  const project = getProject(skill.projectId);
  const accent = project?.color ?? "var(--primary)";
  const Icon = skill.icon;
  const src = sourceMeta[skill.source];
  const totalUses = skill.usage.reduce((s, u) => s + u.uses, 0);
  const top = skill.usage.slice(0, 4);
  const lead = getAgent(skill.usage[0].agentId);

  return (
    <article
      className="skill-rise rounded-xl border border-border bg-card p-4 transition-colors hover:border-border/80"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ background: `color-mix(in oklab, ${accent} 16%, transparent)`, color: accent }}>
          <Icon className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          {/* 헤더(frontmatter) — name · source · category · version/license */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-sm font-semibold text-foreground">{skill.name}</span>
            <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide" style={{ background: `color-mix(in oklab, ${src.color} 16%, transparent)`, color: src.color }}>
              {src.label}
            </span>
            {project && (
              <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                <span className="size-1.5 rounded-full" style={{ background: accent }} />
                {project.name}
              </span>
            )}
            <span className="ml-auto font-mono text-[10px] text-muted-foreground">v{skill.version} · {skill.license}</span>
          </div>

          {/* description (간략히) */}
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{skill.description}</p>

          {/* allowed-tools + 많이 사용한 에이전트 프로필 */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3">
            <div className="flex items-center gap-1.5">
              <Wrench className="size-3 text-muted-foreground" />
              {skill.allowedTools.map((t) => (
                <span key={t} className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{t}</span>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">주요 사용</span>
              <div className="flex -space-x-1.5">
                {top.map((u) => {
                  const a = getAgent(u.agentId);
                  if (!a) return null;
                  return (
                    <button key={u.agentId} onClick={() => onOpenAgent(u.agentId)} title={`${a.codename} · ${u.uses}회`} className="rounded-xl ring-2 ring-card transition-transform hover:z-10 hover:-translate-y-0.5">
                      <AgentAvatar agent={a} size={22} showRing={false} />
                    </button>
                  );
                })}
              </div>
              {lead && (
                <button onClick={() => onOpenAgent(lead.id)} className="font-mono text-[11px] transition-colors hover:underline" style={{ color: lead.accent }}>
                  {lead.codename}
                </button>
              )}
              {skill.usage.length > 1 && <span className="font-mono text-[10px] text-muted-foreground">외 {skill.usage.length - 1}</span>}
              <span className="font-mono text-[11px] tabular-nums text-foreground/70">· {totalUses.toLocaleString()}회</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * 메인
 * ────────────────────────────────────────────────────────────────────────── */

export function SkillsView({ onOpenAgent }: { onOpenAgent: (id: string) => void }) {
  const [filter, setFilter] = useState<SkillSource | "all">("all");
  const counts = useMemo(() => {
    const c: Record<string, number> = { official: 0, clawhub: 0, github: 0 };
    skills.forEach((s) => (c[s.source] += 1));
    return c;
  }, []);
  const visible = filter === "all" ? skills : skills.filter((s) => s.source === filter);

  const chips: { key: SkillSource | "all"; label: string }[] = [
    { key: "all", label: "전체" },
    { key: "official", label: "공식" },
    { key: "clawhub", label: "ClawHub" },
    { key: "github", label: "GitHub" },
  ];

  return (
    <div className="space-y-5">
      {/* 간략 헤더 */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-border bg-card px-4 py-3">
        <span className="inline-flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary"><Boxes className="size-4" /></span>
          <span className="text-sm">설치된 스킬 <span className="font-semibold tabular-nums">{skills.length}</span></span>
        </span>
        <span className="font-mono text-[11px] text-muted-foreground">
          공식 {counts.official} · ClawHub {counts.clawhub} · GitHub {counts.github}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background/40 p-0.5">
            {chips.map((c) => (
              <button
                key={c.key}
                onClick={() => setFilter(c.key)}
                className={cn("rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors", filter === c.key ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="hidden items-center gap-2 rounded-lg border border-border bg-input px-2.5 py-1.5 text-sm text-muted-foreground sm:flex">
            <Search className="size-3.5" />
            <span className="font-mono text-[11px]">스킬 검색</span>
          </div>
        </div>
      </div>

      {/* SKILL.md 구조 안내 */}
      <p className="px-1 font-mono text-[11px] text-muted-foreground">
        각 스킬은 <span className="text-foreground">SKILL.md</span> 헤더(name · description · license · allowed-tools)로 표시됩니다. 항목을 펼치면 본문·scripts·references가 로드됩니다.
      </p>

      {/* 리스트 */}
      <div className="space-y-3">
        {visible.map((s, i) => (
          <SkillRow key={s.name} skill={s} delay={i * 40} onOpenAgent={onOpenAgent} />
        ))}
      </div>

      <style>{`
        @keyframes skill-rise-k { from { opacity:0; transform: translateY(8px);} to { opacity:1; transform:none;} }
        .skill-rise { animation: skill-rise-k .45s cubic-bezier(.2,.7,.2,1) both; }
        @media (prefers-reduced-motion: reduce){ .skill-rise { animation:none !important; } }
      `}</style>
    </div>
  );
}
