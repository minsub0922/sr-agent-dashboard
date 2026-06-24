import { useMemo, useState } from "react";
import {
  Boxes,
  Search,
  Wrench,
  Download,
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
  FileType,
  Table,
  LayoutTemplate,
  PenTool,
  Palette,
  BadgeCheck,
  Paintbrush,
  Shapes,
  Clapperboard,
  Megaphone,
  FilePen,
  Code2,
  Bug,
  Wand2,
  Brain,
  Database,
  Globe,
  Mic,
  Activity,
  Lightbulb,
  type LucideIcon,
} from "lucide-react";
import { getAgent, getProject } from "../data";
import { AgentAvatar } from "./agent-bits";
import { cn } from "./ui/utils";

/* ──────────────────────────────────────────────────────────────────────────
 * 스킬 모델 — Claude SKILL.md(frontmatter) 구조.
 *   header = { name, description, license, version, allowed-tools, source }
 * 레퍼런스: anthropics/skills(공식 17종), OpenClaw ClawHub 인기 스킬, 사내 스킬.
 * ────────────────────────────────────────────────────────────────────────── */

type SkillSource = "anthropic" | "internal" | "clawhub" | "github";

interface Skill {
  name: string;
  description: string;
  version: string;
  license: string;
  source: SkillSource;
  allowedTools: string[];
  icon: LucideIcon;
  projectId: string;
  installs?: number;
  usage: { agentId: string; uses: number }[];
}

const sourceMeta: Record<SkillSource, { label: string; color: string }> = {
  anthropic: { label: "Anthropic", color: "oklch(0.72 0.16 50)" },
  internal: { label: "사내", color: "var(--signal)" },
  clawhub: { label: "ClawHub", color: "var(--primary)" },
  github: { label: "GitHub", color: "var(--muted-foreground)" },
};

function fmtInstalls(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "")}k` : String(n);
}

const skills: Skill[] = [
  // ── Anthropic 공식 (anthropics/skills) ──────────────────────────────────
  { name: "pdf", description: "PDF에서 텍스트·표를 추출하거나 병합·분할·회전·워터마크·폼 작성·OCR을 할 때 사용.", version: "1.6.0", license: "Anthropic", source: "anthropic", allowedTools: ["Bash", "Read"], icon: FileText, projectId: "p-srnote", installs: 184000, usage: [{ agentId: "a-ingest", uses: 211 }, { agentId: "a-sieve", uses: 96 }, { agentId: "a-ledger", uses: 74 }, { agentId: "a-spark", uses: 41 }] },
  { name: "docx", description: "Word(.docx) 문서를 생성·편집·분석할 때 사용. 목차·머리글·표·트래킹 변경 등 서식 포함.", version: "1.5.2", license: "Anthropic", source: "anthropic", allowedTools: ["Bash", "Read", "Write"], icon: FileType, projectId: "p-srnote", installs: 167000, usage: [{ agentId: "a-ingest", uses: 130 }, { agentId: "a-guide", uses: 96 }, { agentId: "a-ledger", uses: 54 }] },
  { name: "pptx", description: "슬라이드 덱·발표 자료(.pptx)를 생성·편집하거나 텍스트를 추출할 때 사용.", version: "1.4.0", license: "Anthropic", source: "anthropic", allowedTools: ["Bash", "Read", "Write"], icon: Presentation, projectId: "p-intern", installs: 152000, usage: [{ agentId: "a-spark", uses: 134 }, { agentId: "a-beacon", uses: 58 }, { agentId: "a-fete", uses: 40 }] },
  { name: "xlsx", description: "스프레드시트(.xlsx/.csv)를 생성·편집하고 수식·서식·차트·데이터 정제를 할 때 사용.", version: "1.5.1", license: "Anthropic", source: "anthropic", allowedTools: ["Bash", "Read", "Write"], icon: Table, projectId: "p-eval", installs: 158000, usage: [{ agentId: "a-gauge", uses: 183 }, { agentId: "a-ledger", uses: 108 }, { agentId: "a-atom", uses: 52 }] },
  { name: "mcp-builder", description: "외부 API·서비스를 연동하는 고품질 MCP 서버를 설계·생성할 때 사용.", version: "0.9.0", license: "Anthropic", source: "anthropic", allowedTools: ["Bash", "Read", "Write"], icon: Plug, projectId: "p-agent", installs: 96000, usage: [{ agentId: "a-relay", uses: 241 }, { agentId: "a-nexus", uses: 150 }, { agentId: "a-route", uses: 73 }, { agentId: "a-ward", uses: 34 }] },
  { name: "artifacts-builder", description: "React·Tailwind·shadcn/ui로 복잡한 claude.ai HTML 아티팩트를 구축할 때 사용.", version: "1.2.0", license: "Anthropic", source: "anthropic", allowedTools: ["Read", "Write"], icon: LayoutTemplate, projectId: "p-srnote", installs: 88000, usage: [{ agentId: "a-weave", uses: 188 }, { agentId: "a-canvas", uses: 142 }, { agentId: "a-ingest", uses: 47 }] },
  { name: "frontend-design", description: "UI 요구사항을 디자인 시스템·철학에 따라 프로덕션급 프론트엔드로 전환할 때 사용.", version: "1.1.3", license: "Anthropic", source: "anthropic", allowedTools: ["Read", "Write"], icon: PenTool, projectId: "p-srnote", installs: 74000, usage: [{ agentId: "a-canvas", uses: 166 }, { agentId: "a-weave", uses: 90 }] },
  { name: "canvas-design", description: ".png·.pdf 형식의 비주얼 아트를 디자인 철학에 따라 제작할 때 사용.", version: "1.0.5", license: "Anthropic", source: "anthropic", allowedTools: ["Bash", "Read"], icon: Palette, projectId: "p-intern", installs: 52000, usage: [{ agentId: "a-spark", uses: 72 }, { agentId: "a-fete", uses: 44 }, { agentId: "a-canvas", uses: 38 }] },
  { name: "brand-guidelines", description: "회사 브랜드 가이드라인(색·타이포·로고)을 문서·자료에 일관되게 적용할 때 사용.", version: "1.0.2", license: "Anthropic", source: "anthropic", allowedTools: ["Read"], icon: BadgeCheck, projectId: "p-teamops", installs: 41000, usage: [{ agentId: "a-fete", uses: 88 }, { agentId: "a-hearth", uses: 52 }, { agentId: "a-ingest", uses: 24 }] },
  { name: "theme-factory", description: "슬라이드·문서·리포트·HTML 아티팩트의 테마를 일관되게 스타일링할 때 사용.", version: "1.1.0", license: "Anthropic", source: "anthropic", allowedTools: ["Read", "Write"], icon: Paintbrush, projectId: "p-srnote", installs: 38000, usage: [{ agentId: "a-weave", uses: 96 }, { agentId: "a-canvas", uses: 64 }, { agentId: "a-spark", uses: 30 }] },
  { name: "algorithmic-art", description: "p5.js로 제너러티브·알고리즈믹 아트를 생성할 때 사용.", version: "1.0.1", license: "Anthropic", source: "anthropic", allowedTools: ["Bash", "Read"], icon: Shapes, projectId: "p-intern", installs: 29000, usage: [{ agentId: "a-spark", uses: 58 }, { agentId: "a-fete", uses: 22 }] },
  { name: "slack-gif-creator", description: "Slack 크기 제약에 맞춘 애니메이션 GIF를 제작할 때 사용.", version: "1.0.3", license: "Anthropic", source: "anthropic", allowedTools: ["Bash", "Read"], icon: Clapperboard, projectId: "p-teamops", installs: 33000, usage: [{ agentId: "a-fete", uses: 76 }, { agentId: "a-hearth", uses: 40 }] },
  { name: "internal-comms", description: "사내 공지·업데이트·뉴스레터 등 내부 커뮤니케이션을 작성할 때 사용.", version: "1.0.4", license: "Anthropic", source: "anthropic", allowedTools: ["Read", "Write"], icon: Megaphone, projectId: "p-teamops", installs: 36000, usage: [{ agentId: "a-hearth", uses: 120 }, { agentId: "a-ledger", uses: 56 }, { agentId: "a-beacon", uses: 30 }] },
  { name: "doc-coauthoring", description: "사람과 함께 문서를 공동 작성·검토·개정할 때 사용.", version: "0.7.2", license: "Anthropic", source: "anthropic", allowedTools: ["Read", "Write"], icon: FilePen, projectId: "p-intern", installs: 27000, usage: [{ agentId: "a-guide", uses: 84 }, { agentId: "a-beacon", uses: 52 }, { agentId: "a-canvas", uses: 33 }] },
  { name: "claude-api", description: "Claude API·SDK·tool use를 연동하고 예제를 구성할 때 사용.", version: "1.3.1", license: "Anthropic", source: "anthropic", allowedTools: ["Bash", "Read"], icon: Code2, projectId: "p-devplat", installs: 64000, usage: [{ agentId: "a-bastion", uses: 110 }, { agentId: "a-gate", uses: 64 }, { agentId: "a-nexus", uses: 40 }] },
  { name: "webapp-testing", description: "웹앱을 브라우저 자동화로 E2E 테스트하고 회귀를 검증할 때 사용.", version: "1.2.4", license: "Anthropic", source: "anthropic", allowedTools: ["Bash", "Read"], icon: Bug, projectId: "p-devplat", installs: 58000, usage: [{ agentId: "a-gate", uses: 134 }, { agentId: "a-bastion", uses: 72 }, { agentId: "a-weave", uses: 36 }] },
  { name: "skill-creator", description: "새 스킬을 만들고 기존 스킬을 개선·평가·벤치마크할 때 사용.", version: "1.4.0", license: "Anthropic", source: "anthropic", allowedTools: ["Bash", "Read", "Write"], icon: Wand2, projectId: "p-agent", installs: 102000, usage: [{ agentId: "a-atlas", uses: 240 }, { agentId: "a-nexus", uses: 96 }, { agentId: "a-forge", uses: 52 }] },

  // ── ClawHub 인기 스킬 ────────────────────────────────────────────────────
  { name: "capability-evolver", description: "성과 패턴을 모니터링해 에이전트가 스스로 능력을 개선하도록 하는 자기진화 스킬. ClawHub 최다 설치.", version: "3.2.0", license: "MIT", source: "clawhub", allowedTools: ["Bash", "Read", "Write"], icon: Brain, projectId: "p-agent", installs: 35200, usage: [{ agentId: "a-atlas", uses: 312 }, { agentId: "a-nexus", uses: 140 }, { agentId: "a-forge", uses: 60 }] },
  { name: "persistent-memory", description: "세션을 넘어 컨텍스트·선호를 기억하는 지속 메모리. ClawHub 최고 평점.", version: "2.5.1", license: "MIT", source: "clawhub", allowedTools: ["Read", "Write"], icon: Database, projectId: "p-agent", installs: 28400, usage: [{ agentId: "a-route", uses: 274 }, { agentId: "a-nexus", uses: 150 }, { agentId: "a-ingest", uses: 64 }] },
  { name: "tavily-search", description: "에이전트용으로 최적화된 빠른 웹 검색으로 정제된 구조화 결과를 가져올 때 사용.", version: "1.8.0", license: "MIT", source: "clawhub", allowedTools: ["Bash", "Read"], icon: Globe, projectId: "p-eval", installs: 21900, usage: [{ agentId: "a-sieve", uses: 168 }, { agentId: "a-spark", uses: 96 }, { agentId: "a-prism", uses: 52 }] },
  { name: "elevenlabs-voice", description: "ElevenLabs 음성을 연동해 통화·음성 알림을 보내고 실패 시 전화로 폴백할 때 사용.", version: "1.1.2", license: "MIT", source: "clawhub", allowedTools: ["Bash"], icon: Mic, projectId: "p-teamops", installs: 14300, usage: [{ agentId: "a-fete", uses: 92 }, { agentId: "a-hearth", uses: 48 }] },

  // ── 커뮤니티(GitHub) ─────────────────────────────────────────────────────
  { name: "data-linter", description: "데이터셋의 누락·중복·label inconsistency·leakage를 점검하고 버전 태깅할 때 사용.", version: "1.5.4", license: "MIT", source: "github", allowedTools: ["Read", "Grep"], icon: Filter, projectId: "p-eval", installs: 6400, usage: [{ agentId: "a-sieve", uses: 288 }, { agentId: "a-prism", uses: 77 }, { agentId: "a-ingest", uses: 41 }] },
  { name: "ci-gatekeeper", description: "lint·typecheck·test·build 품질 게이트를 실행하고 regression을 차단할 때 사용.", version: "4.2.0", license: "MIT", source: "github", allowedTools: ["Bash"], icon: GitBranch, projectId: "p-devplat", installs: 9100, usage: [{ agentId: "a-gate", uses: 392 }, { agentId: "a-bastion", uses: 165 }, { agentId: "a-ward", uses: 80 }] },
  { name: "langfuse-tracing", description: "구조화 로그·tracing·metric을 수집하고 p95·benchmark regression을 관찰할 때 사용.", version: "2.1.0", license: "MIT", source: "github", allowedTools: ["Bash", "Read"], icon: Activity, projectId: "p-devplat", installs: 7800, usage: [{ agentId: "a-ward", uses: 110 }, { agentId: "a-bastion", uses: 56 }, { agentId: "a-gate", uses: 30 }] },

  // ── 사내 스킬 ────────────────────────────────────────────────────────────
  { name: "sft-trainer", description: "소형 모델 SFT 학습을 실행하고 checkpoint·tokenizer·instruction format을 관리할 때 사용.", version: "2.4.1", license: "사내", source: "internal", allowedTools: ["Bash", "Read", "Write"], icon: Dumbbell, projectId: "p-ondevice", usage: [{ agentId: "a-ember", uses: 412 }, { agentId: "a-forge", uses: 188 }, { agentId: "a-atom", uses: 64 }] },
  { name: "quant-bench", description: "PTQ·QAT·KD로 모델을 압축하고 latency·throughput·memory를 온디바이스에서 측정할 때 사용.", version: "1.9.0", license: "사내", source: "internal", allowedTools: ["Bash", "Read"], icon: Minimize2, projectId: "p-ondevice", usage: [{ agentId: "a-atom", uses: 356 }, { agentId: "a-forge", uses: 140 }, { agentId: "a-ember", uses: 71 }] },
  { name: "eval-harness", description: "Task/YAML 설정으로 평가 워크플로를 돌리고 precision·recall·F1·JGA를 산출, leaderboard를 갱신할 때 사용.", version: "3.1.2", license: "사내", source: "internal", allowedTools: ["Bash", "Read", "Write"], icon: ClipboardCheck, projectId: "p-eval", usage: [{ agentId: "a-gauge", uses: 503 }, { agentId: "a-prism", uses: 221 }, { agentId: "a-sieve", uses: 96 }] },
  { name: "agent-router", description: "keyword·embedding·LLM 기반 routing 정책을 비교·평가하고 임계값을 튜닝할 때 사용.", version: "0.8.3", license: "사내", source: "internal", allowedTools: ["Read", "Bash"], icon: Route, projectId: "p-agent", usage: [{ agentId: "a-route", uses: 274 }, { agentId: "a-nexus", uses: 132 }, { agentId: "a-relay", uses: 58 }] },
  { name: "note-ingestor", description: "수집된 노트에서 요약·Todo·이슈·링크·결정사항을 추출하고 Inbox로 분류할 때 사용.", version: "1.3.0", license: "사내", source: "internal", allowedTools: ["Read", "Write"], icon: FileInput, projectId: "p-srnote", usage: [{ agentId: "a-ingest", uses: 466 }, { agentId: "a-canvas", uses: 174 }, { agentId: "a-weave", uses: 52 }] },
  { name: "kg-builder", description: "노트를 Project Wiki·Knowledge Graph로 합성하고 관련 프로젝트를 탐색할 때 사용.", version: "0.6.1", license: "사내", source: "internal", allowedTools: ["Read", "Write", "Bash"], icon: Network, projectId: "p-srnote", usage: [{ agentId: "a-weave", uses: 318 }, { agentId: "a-canvas", uses: 121 }, { agentId: "a-ingest", uses: 64 }] },
  { name: "secret-scan", description: "prompt injection·secret leakage·SSRF를 점검하고 dependency audit·license check를 수행할 때 사용.", version: "1.7.2", license: "사내", source: "internal", allowedTools: ["Bash", "Grep", "Read"], icon: ScanSearch, projectId: "p-devplat", usage: [{ agentId: "a-ward", uses: 305 }, { agentId: "a-bastion", uses: 142 }, { agentId: "a-gate", uses: 47 }] },
  { name: "event-runbook", description: "월례회·워크숍·행사 준비 체크리스트와 보드게임·상품·다과 발주를 관리할 때 사용.", version: "1.1.0", license: "사내", source: "internal", allowedTools: ["Read", "Write"], icon: CalendarCheck, projectId: "p-teamops", usage: [{ agentId: "a-fete", uses: 168 }, { agentId: "a-hearth", uses: 96 }, { agentId: "a-ledger", uses: 23 }] },
  { name: "expense-tracker", description: "예산·구매 요청·결제·증빙·정산 상태를 추적하고 공지로 연결할 때 사용.", version: "1.2.1", license: "사내", source: "internal", allowedTools: ["Read", "Write"], icon: Lightbulb, projectId: "p-teamops", usage: [{ agentId: "a-ledger", uses: 142 }, { agentId: "a-hearth", uses: 70 }, { agentId: "a-fete", uses: 28 }] },
  { name: "onboarding-kit", description: "신규 입사자·인턴 온보딩 체크리스트와 주간 멘토링·follow-up을 관리할 때 사용.", version: "1.0.4", license: "사내", source: "internal", allowedTools: ["Read", "Write"], icon: UserPlus, projectId: "p-intern", usage: [{ agentId: "a-guide", uses: 152 }, { agentId: "a-beacon", uses: 74 }, { agentId: "a-spark", uses: 19 }] },
  { name: "pitch-deck", description: "해커톤 발표 논리·데모 시나리오·리스크/fallback을 정리해 슬라이드로 구성할 때 사용.", version: "2.2.0", license: "사내", source: "internal", allowedTools: ["Read", "Write"], icon: Wrench, projectId: "p-intern", usage: [{ agentId: "a-spark", uses: 134 }, { agentId: "a-beacon", uses: 58 }, { agentId: "a-fete", uses: 27 }] },
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
    <article className="skill-rise rounded-xl border border-border bg-card p-4 transition-colors hover:border-border/80" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ background: `color-mix(in oklab, ${accent} 16%, transparent)`, color: accent }}>
          <Icon className="size-5" />
        </span>

        <div className="min-w-0 flex-1">
          {/* 헤더(frontmatter) */}
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
            <span className="ml-auto inline-flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
              {skill.installs != null && (
                <span className="inline-flex items-center gap-1"><Download className="size-3" />{fmtInstalls(skill.installs)}</span>
              )}
              <span>v{skill.version} · {skill.license}</span>
            </span>
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
    const c: Record<SkillSource, number> = { anthropic: 0, internal: 0, clawhub: 0, github: 0 };
    skills.forEach((s) => (c[s.source] += 1));
    return c;
  }, []);

  const sorted = useMemo(() => [...skills].sort((a, b) => b.usage.reduce((s, u) => s + u.uses, 0) - a.usage.reduce((s, u) => s + u.uses, 0)), []);
  const visible = filter === "all" ? sorted : sorted.filter((s) => s.source === filter);

  const chips: { key: SkillSource | "all"; label: string }[] = [
    { key: "all", label: "전체" },
    { key: "anthropic", label: "Anthropic" },
    { key: "internal", label: "사내" },
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
          Anthropic {counts.anthropic} · 사내 {counts.internal} · ClawHub {counts.clawhub} · GitHub {counts.github}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background/40 p-0.5">
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
          <div className="hidden items-center gap-2 rounded-lg border border-border bg-input px-2.5 py-1.5 text-sm text-muted-foreground lg:flex">
            <Search className="size-3.5" />
            <span className="font-mono text-[11px]">스킬 검색</span>
          </div>
        </div>
      </div>

      {/* SKILL.md 구조 안내 */}
      <p className="px-1 font-mono text-[11px] text-muted-foreground">
        각 스킬은 <span className="text-foreground">SKILL.md</span> 헤더(name · description · license · allowed-tools)로 표시됩니다. 항목을 펼치면 본문·scripts·references가 로드됩니다.
      </p>

      {/* 리스트 — 사용량 순 */}
      <div className="space-y-3">
        {visible.map((s, i) => (
          <SkillRow key={s.name} skill={s} delay={i * 28} onOpenAgent={onOpenAgent} />
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
