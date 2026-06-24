import { useMemo, useState } from "react";
import {
  BrainCircuit,
  Activity,
  Hash,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  Flame,
  Link2,
  Users,
  FolderKanban,
} from "lucide-react";
import {
  knowledge,
  projects,
  getProject,
  timeAgo,
  knowledgeGrowth,
  knowledgeHeatmap,
  knowledgeDeltaWeek,
  knowledgeDeltaLabel,
  knowledgeKeywords,
  type KnowledgeDelta,
} from "../data";
import { CountUp, SectionCard, deltaMeta, maturityColor, KnowledgeStyles } from "./knowledge-bits";
import type { ViewKey } from "./sidebar-nav";
import { cn } from "./ui/utils";

/* ──────────────────────────────────────────────────────────────────────────
 * KPI 스트립
 * ────────────────────────────────────────────────────────────────────────── */

function KpiCard({
  icon: Icon,
  label,
  accent,
  children,
  sub,
  delay = 0,
}: {
  icon: typeof BrainCircuit;
  label: string;
  accent: string;
  children: React.ReactNode;
  sub: React.ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="k-rise relative min-w-[190px] flex-1 overflow-hidden rounded-xl border border-border bg-card p-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full opacity-[0.13] blur-2xl" style={{ background: accent }} />
      <div className="flex items-center gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg" style={{ background: `color-mix(in oklab, ${accent} 18%, transparent)`, color: accent }}>
          <Icon className="size-4" />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      </div>
      <div className="mt-2.5 text-[28px] font-semibold leading-none tracking-tight">{children}</div>
      <div className="mt-1.5 font-mono text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * 성장 추이 (영역 차트)
 * ────────────────────────────────────────────────────────────────────────── */

function GrowthChart({ className }: { className?: string }) {
  const g = knowledgeGrowth;
  const n = g.length;
  const totals = g.map((d) => d.total);
  const minT = Math.min(...totals);
  const maxT = Math.max(...totals);
  const maxAdd = Math.max(...g.map((d) => d.add));
  const growthPct = Math.round(((maxT - minT) / minT) * 100);

  const W = 720, H = 220, padL = 12, padR = 16, padT = 18, padB = 30;
  const x = (i: number) => padL + (i / (n - 1)) * (W - padL - padR);
  const y = (t: number) => padT + (1 - (t - minT) / (maxT - minT)) * (H - padT - padB);
  const baseY = H - padB;
  const line = g.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.total).toFixed(1)}`).join(" ");
  const area = `${line} L${x(n - 1).toFixed(1)},${baseY} L${x(0).toFixed(1)},${baseY} Z`;
  const bw = ((W - padL - padR) / n) * 0.42;
  const lastX = x(n - 1), lastY = y(g[n - 1].total);

  return (
    <SectionCard
      title="지식 성장 추이"
      hint="누적 지식 항목 · 최근 16주"
      className={className}
      right={
        <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 font-mono text-[11px]" style={{ background: "color-mix(in oklab, var(--signal) 16%, transparent)", color: "var(--signal)" }}>
          <TrendingUp className="size-3.5" />+{growthPct}%
        </span>
      }
    >
      <div className="mb-3 flex items-center gap-4 font-mono text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-4 rounded-full" style={{ background: "var(--primary)" }} />누적 지식</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-[3px]" style={{ background: "color-mix(in oklab, var(--primary) 28%, transparent)" }} />주간 신규</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: "auto" }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="kd-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.34" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((p) => (
          <line key={p} x1={padL} x2={W - padR} y1={padT + p * (H - padT - padB)} y2={padT + p * (H - padT - padB)} stroke="var(--border)" strokeWidth="1" />
        ))}
        {g.map((d, i) => {
          const h = (d.add / maxAdd) * 38;
          return <rect key={i} x={x(i) - bw / 2} y={baseY - h} width={bw} height={h} rx={2} fill="color-mix(in oklab, var(--primary) 24%, transparent)" className="k-fade" style={{ animationDelay: `${300 + i * 28}ms` }} />;
        })}
        <path d={area} fill="url(#kd-area)" className="k-fade" style={{ animationDelay: "260ms" }} />
        <path d={line} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="k-draw" />
        <circle cx={lastX} cy={lastY} r="9" fill="var(--primary)" opacity="0.2" className="k-ping" style={{ transformOrigin: `${lastX}px ${lastY}px` }} />
        <circle cx={lastX} cy={lastY} r="4" fill="var(--primary)" stroke="var(--card)" strokeWidth="2" />
        <text x={padL} y={H - 8} fill="var(--muted-foreground)" fontSize="11" fontFamily="var(--font-mono)">16주 전</text>
        <text x={W / 2} y={H - 8} fill="var(--muted-foreground)" fontSize="11" fontFamily="var(--font-mono)" textAnchor="middle">8주 전</text>
        <text x={W - padR} y={H - 8} fill="var(--muted-foreground)" fontSize="11" fontFamily="var(--font-mono)" textAnchor="end">현재</text>
      </svg>
    </SectionCard>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * 프로젝트별 분포 (도넛)
 * ────────────────────────────────────────────────────────────────────────── */

function DistributionDonut({ onOpenProject }: { onOpenProject: (id: string) => void }) {
  const total = projects.reduce((s, p) => s + p.knowledgeCount, 0);
  const r = 70, C = 2 * Math.PI * r;
  let acc = 0;
  const segments = projects.map((p) => {
    const share = p.knowledgeCount / total;
    const seg = { p, share, dash: share * C, offset: -acc * C };
    acc += share;
    return seg;
  });

  return (
    <SectionCard title="프로젝트별 분포" hint={`${projects.length}개 도메인 · 총 ${total.toLocaleString()}`}>
      <div className="flex flex-col items-center gap-5">
        <div className="relative k-pop">
          <svg viewBox="0 0 200 200" className="size-44">
            <circle cx="100" cy="100" r={r} fill="none" stroke="var(--secondary)" strokeWidth="22" />
            {segments.map((s) => (
              <circle key={s.p.id} cx="100" cy="100" r={r} fill="none" stroke={s.p.color} strokeWidth="22" strokeDasharray={`${s.dash} ${C - s.dash}`} strokeDashoffset={s.offset} transform="rotate(-90 100 100)" strokeLinecap="butt" />
            ))}
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="text-2xl font-semibold tracking-tight"><CountUp value={total} thousands /></div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">지식 항목</div>
            </div>
          </div>
        </div>
        <div className="w-full space-y-1">
          {segments.map((s) => (
            <button key={s.p.id} onClick={() => onOpenProject(s.p.id)} className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-secondary/50">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.p.color }} />
              <span className="flex-1 truncate text-sm text-foreground/90 group-hover:text-foreground">{s.p.name}</span>
              <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{s.p.knowledgeCount}</span>
              <span className="w-9 text-right font-mono text-[11px] tabular-nums" style={{ color: s.p.color }}>{Math.round(s.share * 100)}%</span>
            </button>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * 기여 활동 히트맵
 * ────────────────────────────────────────────────────────────────────────── */

const weekdayLabel = ["일", "월", "화", "수", "목", "금", "토"];

function heatColor(v: number) {
  if (v <= 0) return "color-mix(in oklab, var(--muted-foreground) 12%, transparent)";
  if (v <= 2) return "color-mix(in oklab, var(--signal) 26%, transparent)";
  if (v <= 4) return "color-mix(in oklab, var(--signal) 48%, transparent)";
  if (v <= 7) return "color-mix(in oklab, var(--signal) 72%, transparent)";
  return "var(--signal)";
}

function ContributionHeatmap() {
  const flat = knowledgeHeatmap.flat();
  const total = flat.reduce((s, v) => s + v, 0);
  const dayAvg = (total / flat.length).toFixed(1);
  const thisWeek = knowledgeHeatmap[knowledgeHeatmap.length - 1].reduce((s, v) => s + v, 0);
  const weekdayTotals = weekdayLabel.map((_, d) => knowledgeHeatmap.reduce((s, wk) => s + wk[d], 0));
  const busiest = weekdayLabel[weekdayTotals.indexOf(Math.max(...weekdayTotals))];

  return (
    <SectionCard
      title="갱신 활동"
      hint="지식이 갱신된 강도 · 최근 16주"
      right={
        <div className="hidden items-center gap-2 font-mono text-[10px] text-muted-foreground sm:flex">
          적음
          {[0, 2, 4, 7, 10].map((v) => (<span key={v} className="size-3 rounded-[3px]" style={{ background: heatColor(v) }} />))}
          많음
        </div>
      }
    >
      <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
        <div className="flex gap-[5px]">
          <div className="mr-1 flex flex-col gap-[3px]">
            {weekdayLabel.map((w, d) => (<span key={d} className="h-[14px] font-mono text-[9px] leading-[14px] text-muted-foreground">{d % 2 === 1 ? w : ""}</span>))}
          </div>
          {knowledgeHeatmap.map((wk, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {wk.map((v, di) => (<span key={di} className="k-cell size-[14px] rounded-[3px]" title={`${v}건 갱신`} style={{ background: heatColor(v), animationDelay: `${(wi * 7 + di) * 5}ms` }} />))}
            </div>
          ))}
        </div>
        <div className="flex gap-6">
          <HeatStat icon={Activity} label="총 갱신" value={total.toLocaleString()} accent="var(--signal)" />
          <HeatStat icon={Flame} label="이번 주" value={String(thisWeek)} accent="var(--primary)" />
          <HeatStat icon={TrendingUp} label="일 평균" value={dayAvg} accent="var(--chart-3)" />
          <HeatStat icon={Sparkles} label="가장 활발" value={`${busiest}요일`} accent="var(--warn)" />
        </div>
      </div>
    </SectionCard>
  );
}

function HeatStat({ icon: Icon, label, value, accent }: { icon: typeof Activity; label: string; value: string; accent: string }) {
  return (
    <div className="leading-tight">
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <Icon className="size-3" style={{ color: accent }} />
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * 프로젝트별 지식 현황 (에이전트 순위 대체)
 * ────────────────────────────────────────────────────────────────────────── */

function ProjectStatus({ className, onOpenProject }: { className?: string; onOpenProject: (id: string) => void }) {
  const maxK = Math.max(...projects.map((p) => p.knowledgeCount));
  return (
    <SectionCard title="프로젝트별 지식 현황" hint="지식 수 · 건강도" className={className}>
      <div className="space-y-3.5">
        {projects.map((p) => (
          <button key={p.id} onClick={() => onOpenProject(p.id)} className="group block w-full text-left">
            <div className="flex items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
              <span className="text-sm text-foreground/90 group-hover:text-foreground">{p.name}</span>
              <span className="ml-auto font-mono text-[11px] text-muted-foreground">지식 {p.knowledgeCount} · 노트 {p.noteCount.toLocaleString()}</span>
              <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                <span className="k-grow absolute inset-y-0 left-0 rounded-full" style={{ width: `${(p.knowledgeCount / maxK) * 100}%`, background: p.color }} />
              </div>
              <span className="w-16 text-right font-mono text-[10px] tabular-nums" style={{ color: p.health >= 90 ? "var(--signal)" : p.health >= 80 ? "var(--primary)" : "var(--warn)" }}>
                건강도 {p.health}
              </span>
            </div>
          </button>
        ))}
      </div>
    </SectionCard>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * 변경 유형 분포 (이번 주)
 * ────────────────────────────────────────────────────────────────────────── */

function DeltaBreakdown() {
  const order: KnowledgeDelta[] = ["added", "updated", "merged"];
  const weekTotal = order.reduce((s, k) => s + knowledgeDeltaWeek[k], 0);
  return (
    <SectionCard title="변경 유형" hint={`이번 주 ${weekTotal}건`}>
      <div className="mb-4 flex h-2.5 overflow-hidden rounded-full">
        {order.map((k) => (<span key={k} style={{ width: `${(knowledgeDeltaWeek[k] / weekTotal) * 100}%`, background: deltaMeta[k].color }} title={knowledgeDeltaLabel[k]} />))}
      </div>
      <div className="space-y-2.5">
        {order.map((k) => {
          const Icon = deltaMeta[k].icon;
          const color = deltaMeta[k].color;
          const val = knowledgeDeltaWeek[k];
          return (
            <div key={k} className="flex items-center gap-2.5">
              <span className="grid size-7 place-items-center rounded-lg" style={{ background: `color-mix(in oklab, ${color} 16%, transparent)`, color }}>
                <Icon className="size-3.5" />
              </span>
              <span className="text-sm text-foreground/90">{knowledgeDeltaLabel[k]}</span>
              <div className="ml-auto flex items-center gap-2">
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                  <span className="k-grow block h-full rounded-full" style={{ width: `${(val / weekTotal) * 100}%`, background: color }} />
                </div>
                <span className="w-6 text-right font-mono text-xs tabular-nums" style={{ color }}>{val}</span>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * 최근 변경 (필터형 · 에이전트 비표기)
 * ────────────────────────────────────────────────────────────────────────── */

function RecentChanges({ onOpenProject }: { onOpenProject: (id: string) => void }) {
  const [filter, setFilter] = useState<KnowledgeDelta | "all">("all");
  const sorted = useMemo(() => [...knowledge].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)), []);
  const visible = filter === "all" ? sorted : sorted.filter((k) => k.delta === filter);
  const chips: { key: KnowledgeDelta | "all"; label: string }[] = [
    { key: "all", label: "전체" },
    { key: "added", label: "추가" },
    { key: "updated", label: "수정" },
    { key: "merged", label: "병합" },
  ];

  return (
    <SectionCard
      title="최근 변경"
      hint="갱신된 지식 항목"
      right={
        <div className="flex items-center gap-1 rounded-lg border border-border bg-background/40 p-0.5">
          {chips.map((c) => {
            const count = c.key === "all" ? sorted.length : sorted.filter((k) => k.delta === c.key).length;
            const active = filter === c.key;
            return (
              <button key={c.key} onClick={() => setFilter(c.key)} className={cn("rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors", active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {c.label}<span className="ml-1 opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      }
    >
      <div className="grid gap-3 md:grid-cols-2">
        {visible.map((k) => {
          const meta = deltaMeta[k.delta];
          const Icon = meta.icon;
          const project = getProject(k.projectId);
          const mColor = maturityColor(k.maturity);
          return (
            <article key={k.id} className="k-rise group flex flex-col rounded-xl border border-border bg-background/30 p-4 transition-colors hover:border-border/80 hover:bg-secondary/20">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px] uppercase" style={{ background: `color-mix(in oklab, ${meta.color} 16%, transparent)`, color: meta.color }}>
                  <Icon className="size-3" />{knowledgeDeltaLabel[k.delta]}
                </span>
                {project && (
                  <button onClick={() => onOpenProject(project.id)} className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground">
                    <span className="size-1.5 rounded-full" style={{ background: project.color }} />{project.name}
                  </button>
                )}
                <span className="ml-auto font-mono text-[11px] text-muted-foreground">{timeAgo(k.updatedAt)}</span>
              </div>
              <h3 className="mt-2.5 tracking-tight">{k.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{k.summary}</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                {k.tags.map((t) => (<span key={t} className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">#{t}</span>))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">성숙도</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <span className="k-grow block h-full rounded-full" style={{ width: `${k.maturity}%`, background: mColor }} />
                </div>
                <span className="font-mono text-[10px] tabular-nums" style={{ color: mColor }}>{k.maturity}%</span>
              </div>
              <div className="mt-3 flex items-center gap-3 border-t border-border pt-3 font-mono text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Users className="size-3" />기여자 {k.contributors}명</span>
                <span className="inline-flex items-center gap-1"><Link2 className="size-3" />원천 노트 {k.linkedNotes}건</span>
              </div>
            </article>
          );
        })}
      </div>
    </SectionCard>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * 대시보드 (개요 탭 본문)
 * ────────────────────────────────────────────────────────────────────────── */

export function KnowledgeDashboard({
  onOpenProject,
  onNavigate,
}: {
  onOpenProject: (id: string) => void;
  onNavigate: (v: ViewKey) => void;
}) {
  const totalKnowledge = projects.reduce((s, p) => s + p.knowledgeCount, 0);
  const weekTotal = knowledgeDeltaWeek.added + knowledgeDeltaWeek.updated + knowledgeDeltaWeek.merged;
  const avgMaturity = Math.round(knowledge.reduce((s, k) => s + k.maturity, 0) / knowledge.length);

  return (
    <div className="space-y-5">
      <div className="-mx-1 flex flex-wrap gap-3 px-1">
        <KpiCard icon={BrainCircuit} label="총 지식 항목" accent="var(--primary)" sub={<span>이번 주 <span className="text-signal">+{weekTotal}</span></span>} delay={0}>
          <CountUp value={totalKnowledge} thousands />
        </KpiCard>
        <KpiCard icon={Activity} label="이번 주 변경" accent="var(--signal)" sub={`추가 ${knowledgeDeltaWeek.added} · 수정 ${knowledgeDeltaWeek.updated} · 병합 ${knowledgeDeltaWeek.merged}`} delay={60}>
          <CountUp value={weekTotal} />
        </KpiCard>
        <button onClick={() => onNavigate("knowledge")} className="contents">
          <KpiCard icon={Hash} label="핵심 키워드" accent="var(--chart-3)" sub="지식 탭에서 탐색 →" delay={120}>
            <CountUp value={knowledgeKeywords.length} />
          </KpiCard>
        </button>
        <KpiCard icon={ShieldCheck} label="평균 성숙도" accent="var(--warn)" sub="검증·정착도" delay={180}>
          <CountUp value={avgMaturity} suffix="%" />
        </KpiCard>
        <KpiCard icon={Sparkles} label="자동 통합률" accent="var(--chart-5)" sub="최근 7일 · 사람 검토 없이" delay={240}>
          <CountUp value={92} suffix="%" />
        </KpiCard>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <GrowthChart className="xl:col-span-2" />
        <DistributionDonut onOpenProject={onOpenProject} />
      </div>

      <ContributionHeatmap />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <ProjectStatus className="xl:col-span-2" onOpenProject={onOpenProject} />
        <DeltaBreakdown />
      </div>

      <RecentChanges onOpenProject={onOpenProject} />

      <KnowledgeStyles />
    </div>
  );
}
