import { useEffect, useMemo, useRef, useState } from "react";
import { Hash, Quote, Layers, Sparkles, Link2, ArrowUpRight, Search, FileText, BrainCircuit, X } from "lucide-react";
import {
  knowledge,
  notes,
  projects,
  getProject,
  timeAgo,
  knowledgeKeywords,
  knowledgeDeltaLabel,
  type Keyword,
  type Note,
  type KnowledgeEntry,
} from "../data";
import { CountUp, SectionCard, deltaMeta, maturityColor, KnowledgeStyles } from "./knowledge-bits";
import { ChannelBadge } from "./agent-bits";

/* ──────────────────────────────────────────────────────────────────────────
 * 워드클라우드 배치 (결정론적 스파이럴 패킹)
 * ────────────────────────────────────────────────────────────────────────── */

const CLOUD_W = 820;
const CLOUD_H = 440;

interface PlacedWord extends Keyword {
  x: number;
  y: number;
  size: number;
  op: number;
}

function estWidth(s: string, size: number) {
  let u = 0;
  for (const ch of s) {
    if (/[가-힣]/.test(ch)) u += 1.0; // 한글 전각
    else if (/[A-Za-z]/.test(ch)) u += 0.6;
    else if (/[0-9]/.test(ch)) u += 0.56;
    else u += 0.42;
  }
  return u * size;
}

// 중심에서 바깥으로 정렬된 조밀 그리드 탐색 — 결정론적, 겹침 없이 모든 단어 배치.
function layoutCloud(words: Keyword[]): PlacedWord[] {
  const FS_MAX = 50, FS_MIN = 15, EX = 1.5, PAD_X = 8, PAD_Y = 5, STEP = 9;
  const sorted = [...words].sort((a, b) => b.count - a.count);
  const counts = sorted.map((w) => w.count);
  const cmin = Math.min(...counts);
  const cmax = Math.max(...counts);
  const sq = (c: number) => Math.sqrt(c);
  const fs = (c: number) => FS_MIN + ((sq(c) - sq(cmin)) / (sq(cmax) - sq(cmin))) * (FS_MAX - FS_MIN);
  const op = (c: number) => 0.58 + ((c - cmin) / (cmax - cmin)) * 0.42;

  const cx = CLOUD_W / 2;
  const cy = CLOUD_H / 2;

  // 후보 중심점: 그리드 → 중심 거리(가로로 늘린 타원) + 약한 지터로 정렬
  const cands: { x: number; y: number; d: number }[] = [];
  for (let gx = 8; gx <= CLOUD_W - 8; gx += STEP) {
    for (let gy = 8; gy <= CLOUD_H - 8; gy += STEP) {
      const dx = (gx - cx) / EX;
      const dy = gy - cy;
      const jitter = (Math.sin(gx * 1.7) + Math.cos(gy * 1.3)) * 0.6;
      cands.push({ x: gx, y: gy, d: Math.hypot(dx, dy) + jitter });
    }
  }
  cands.sort((a, b) => a.d - b.d);

  const placed: { x: number; y: number; w: number; h: number }[] = [];
  const out: PlacedWord[] = [];

  for (const w of sorted) {
    const base = fs(w.count);
    let done = false;
    for (let attempt = 0; attempt < 5 && !done; attempt++) {
      const size = base * Math.pow(0.92, attempt); // 안전망: 자리 없으면 살짝 축소
      const bw = estWidth(w.term, size) + PAD_X;
      const bh = size * 1.04 + PAD_Y;
      for (const c of cands) {
        const box = { x: c.x - bw / 2, y: c.y - bh / 2, w: bw, h: bh };
        if (box.x < 6 || box.y < 6 || box.x + box.w > CLOUD_W - 6 || box.y + box.h > CLOUD_H - 6) continue;
        const hit = placed.some((p) => !(box.x + box.w < p.x || box.x > p.x + p.w || box.y + box.h < p.y || box.y > p.y + p.h));
        if (!hit) {
          placed.push(box);
          out.push({ ...w, x: c.x, y: c.y, size, op: op(w.count) });
          done = true;
          break;
        }
      }
    }
  }
  return out;
}

/* ──────────────────────────────────────────────────────────────────────────
 * 관련 지식 매칭
 * ────────────────────────────────────────────────────────────────────────── */

function relatedEntries(term: string) {
  return knowledge
    .filter((k) => k.tags.includes(term) || k.title.includes(term) || k.summary.includes(term))
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
}

function relatedNotes(term: string) {
  return notes
    .filter((n) => n.tags.includes(term) || n.fullText.includes(term) || n.excerpt.includes(term))
    .sort((a, b) => +new Date(b.receivedAt) - +new Date(a.receivedAt));
}

const noteStageMeta: Record<Note["stage"], { label: string; color: string }> = {
  analyzing: { label: "분석 중", color: "var(--primary)" },
  inbox: { label: "검토 대기", color: "var(--warn)" },
  routed: { label: "분류됨", color: "var(--signal)" },
};

/* ──────────────────────────────────────────────────────────────────────────
 * 미니 카드 — 관련 지식 / 관련 노트
 * ────────────────────────────────────────────────────────────────────────── */

function KnowledgeMiniCard({ k, onOpenProject, onSelectTag, delay = 0 }: { k: KnowledgeEntry; onOpenProject: (id: string) => void; onSelectTag: (t: string) => void; delay?: number }) {
  const meta = deltaMeta[k.delta];
  const Icon = meta.icon;
  const project = getProject(k.projectId);
  const mColor = maturityColor(k.maturity);
  return (
    <article className="k-rise group flex flex-col rounded-xl border border-border bg-background/30 p-4 transition-all hover:-translate-y-0.5 hover:border-border/80 hover:bg-secondary/20 hover:shadow-lg hover:shadow-black/20" style={{ animationDelay: `${delay}ms` }}>
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
        {k.tags.map((t) => (
          <button key={t} onClick={() => onSelectTag(t)} className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:text-foreground">#{t}</button>
        ))}
        <span className="inline-flex items-center gap-1 font-mono text-[10px] text-muted-foreground"><Link2 className="size-3" />노트 {k.linkedNotes}건</span>
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">성숙도</span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
          <span className="block h-full rounded-full" style={{ width: `${k.maturity}%`, background: mColor }} />
        </div>
        <span className="font-mono text-[10px] tabular-nums" style={{ color: mColor }}>{k.maturity}%</span>
        <ArrowUpRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </article>
  );
}

function NoteMiniCard({ note, onOpenProject, onSelectTag, delay = 0 }: { note: Note; onOpenProject: (id: string) => void; onSelectTag: (t: string) => void; delay?: number }) {
  const project = getProject(note.projectId);
  const stage = noteStageMeta[note.stage];
  return (
    <article className="k-rise group flex flex-col rounded-xl border border-border bg-background/30 p-4 transition-all hover:-translate-y-0.5 hover:border-border/80 hover:bg-secondary/20 hover:shadow-lg hover:shadow-black/20" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-2">
        <ChannelBadge channel={note.channel} />
        <span className="font-mono text-[11px] text-muted-foreground">{timeAgo(note.receivedAt)}</span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[10px]" style={{ background: `color-mix(in oklab, ${stage.color} 16%, transparent)`, color: stage.color }}>
          <span className="size-1.5 rounded-full" style={{ background: stage.color }} />{stage.label}
        </span>
      </div>
      <p className="mt-2.5 text-sm leading-relaxed text-foreground/90">{note.excerpt}</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
        {note.tags.map((t) => (
          <button key={t} onClick={() => onSelectTag(t)} className="rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:text-foreground">#{t}</button>
        ))}
        {project && (
          <button onClick={() => onOpenProject(project.id)} className="inline-flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground transition-colors hover:text-foreground">
            <span className="size-1.5 rounded-full" style={{ background: project.color }} />{project.name}
          </button>
        )}
        {note.confidence != null && (
          <span className="ml-auto font-mono text-[10px] tabular-nums" style={{ color: noteStageMeta[note.stage].color }}>신뢰도 {note.confidence}%</span>
        )}
      </div>
    </article>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * 작은 통계 칩
 * ────────────────────────────────────────────────────────────────────────── */

function StatChip({ icon: Icon, label, accent, children }: { icon: typeof Hash; label: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="k-rise flex min-w-[170px] flex-1 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg" style={{ background: `color-mix(in oklab, ${accent} 18%, transparent)`, color: accent }}>
        <Icon className="size-4" />
      </span>
      <div className="leading-tight">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="text-xl font-semibold tracking-tight">{children}</div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * 메인
 * ────────────────────────────────────────────────────────────────────────── */

export function KnowledgeView({ onOpenProject }: { onOpenProject: (id: string) => void }) {
  const words = useMemo(() => layoutCloud(knowledgeKeywords), []);
  const ranked = useMemo(() => [...knowledgeKeywords].sort((a, b) => b.count - a.count), []);
  const totalMentions = useMemo(() => knowledgeKeywords.reduce((s, k) => s + k.count, 0), []);
  const topTerm = ranked[0].term;
  const maxCount = ranked[0].count;

  const [selected, setSelected] = useState(topTerm);
  const [hovered, setHovered] = useState<string | null>(null);

  const pColor = (pid: string) => getProject(pid)?.color ?? "var(--primary)";
  const selectedKw = knowledgeKeywords.find((k) => k.term === selected)!;
  const related = useMemo(() => relatedEntries(selected), [selected]);
  const relNotes = useMemo(() => relatedNotes(selected), [selected]);

  // 마우스 옆 관련 노트 팝오버
  const [pop, setPop] = useState<{ term: string; x: number; y: number } | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const popNotes = pop ? relatedNotes(pop.term) : [];

  const openPop = (term: string, e: React.MouseEvent) => {
    setSelected(term);
    setPop({ term, x: e.clientX, y: e.clientY });
  };

  useEffect(() => {
    if (!pop) return;
    const onDown = (ev: PointerEvent) => {
      const t = ev.target as HTMLElement | null;
      if (popRef.current && t && popRef.current.contains(t)) return;
      if (t && t.closest && t.closest("[data-kw]")) return; // 키워드 클릭 → 재배치(닫지 않음)
      setPop(null);
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setPop(null);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pop]);

  return (
    <div className="space-y-5">
      {/* 한눈에 요약 */}
      <div className="-mx-1 flex flex-wrap gap-3 px-1">
        <StatChip icon={Hash} label="고유 키워드" accent="var(--primary)">
          <CountUp value={knowledgeKeywords.length} />개
        </StatChip>
        <StatChip icon={Quote} label="총 언급" accent="var(--signal)">
          <CountUp value={totalMentions} thousands />회
        </StatChip>
        <StatChip icon={Sparkles} label="최다 키워드" accent="var(--chart-5)">
          {topTerm}
        </StatChip>
        <StatChip icon={Layers} label="지식 도메인" accent="var(--chart-3)">
          <CountUp value={projects.length} />개
        </StatChip>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* 워드클라우드 */}
        <SectionCard
          title="지식 키워드 맵"
          hint="단어 크기 = 등장 빈도 · 색 = 프로젝트"
          className="xl:col-span-2"
          right={
            <div className="hidden flex-wrap items-center justify-end gap-x-3 gap-y-1 sm:flex">
              {projects.map((p) => (
                <button key={p.id} onClick={() => onOpenProject(p.id)} className="inline-flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground transition-colors hover:text-foreground">
                  <span className="size-2 rounded-full" style={{ background: p.color }} />
                  {p.name}
                </button>
              ))}
            </div>
          }
        >
          <div className="relative overflow-hidden rounded-lg border border-border bg-background/40">
            <div className="pointer-events-none absolute left-1/2 top-1/2 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.10] blur-3xl" style={{ background: pColor(selectedKw.projectId) }} />
            <svg viewBox={`0 0 ${CLOUD_W} ${CLOUD_H}`} className="relative w-full" style={{ height: "auto" }}>
              {words.map((w, i) => {
                const isSel = w.term === selected;
                const isHov = w.term === hovered;
                const dimmed = hovered !== null && !isHov;
                const opacity = dimmed ? w.op * 0.22 : w.op;
                return (
                  <g
                    key={w.term}
                    data-kw
                    className="k-word"
                    style={{ animationDelay: `${i * 22}ms`, cursor: "pointer" }}
                    onClick={(e) => openPop(w.term, e)}
                    onMouseEnter={() => setHovered(w.term)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {isSel && (
                      <rect
                        className="k-selglow"
                        x={w.x - (estWidth(w.term, w.size) + 16) / 2}
                        y={w.y - (w.size * 1.06 + 10) / 2}
                        width={estWidth(w.term, w.size) + 16}
                        height={w.size * 1.06 + 10}
                        rx={8}
                        fill={`color-mix(in oklab, ${pColor(w.projectId)} 16%, transparent)`}
                        stroke={`color-mix(in oklab, ${pColor(w.projectId)} 55%, transparent)`}
                        strokeWidth="1"
                      />
                    )}
                    <text
                      x={w.x}
                      y={w.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={w.size}
                      fontFamily="var(--font-sans)"
                      fontWeight={isSel || isHov ? 700 : 600}
                      fill={pColor(w.projectId)}
                      opacity={opacity}
                      style={{
                        transition: "opacity .2s ease, transform .2s cubic-bezier(.2,.8,.2,1)",
                        transformBox: "fill-box",
                        transformOrigin: "center",
                        transform: isHov ? "scale(1.12)" : isSel ? "scale(1.05)" : "scale(1)",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {w.term}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </SectionCard>

        {/* 빈도 Top */}
        <SectionCard title="키워드 빈도" hint={`상위 ${Math.min(14, ranked.length)} · 등장 횟수`}>
          <div className="space-y-2">
            {ranked.slice(0, 14).map((k, i) => {
              const active = k.term === selected;
              return (
                <button
                  key={k.term}
                  data-kw
                  onClick={(e) => openPop(k.term, e)}
                  onMouseEnter={() => setHovered(k.term)}
                  onMouseLeave={() => setHovered(null)}
                  className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-secondary/40"
                >
                  <span className="w-4 shrink-0 text-center font-mono text-[11px] text-muted-foreground">{i + 1}</span>
                  <span className={`w-[84px] shrink-0 truncate text-sm ${active ? "font-semibold text-foreground" : "text-foreground/85"}`}>{k.term}</span>
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <span className="k-grow absolute inset-y-0 left-0 rounded-full" style={{ width: `${(k.count / maxCount) * 100}%`, background: pColor(k.projectId), animationDelay: `${i * 45}ms`, opacity: active ? 1 : 0.85 }} />
                  </div>
                  <span className="w-7 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground">{k.count}</span>
                </button>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {/* 선택 키워드 — 관련 지식 (노트는 마우스 옆 팝오버로) */}
      <div key={selected} className="space-y-5">
        {/* 선택 배너 */}
        <div className="k-rise flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-card p-4">
          <span className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-lg font-semibold" style={{ background: `color-mix(in oklab, ${pColor(selectedKw.projectId)} 16%, transparent)`, color: pColor(selectedKw.projectId) }}>
            <Hash className="size-4" />{selected}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground">{getProject(selectedKw.projectId)?.name} · {selectedKw.count}회 등장</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
              <BrainCircuit className="size-3.5" style={{ color: "var(--primary)" }} />지식 {related.length}
            </span>
            <button data-kw onClick={(e) => openPop(selected, e)} className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground" style={{ borderColor: pop ? "color-mix(in oklab, var(--signal) 50%, transparent)" : undefined }}>
              <FileText className="size-3.5" style={{ color: "var(--signal)" }} />노트 {relNotes.length}
            </button>
            <button onClick={() => onOpenProject(selectedKw.projectId)} className="font-mono text-[11px] text-primary transition-colors hover:underline">프로젝트 →</button>
          </div>
        </div>

        {/* 관련 지식 */}
        <SectionCard
          title={<span className="inline-flex items-center gap-2"><BrainCircuit className="size-4" style={{ color: "var(--primary)" }} />관련 지식</span>}
          hint="이 키워드로 합성된 지식 항목 · 단어를 클릭하면 관련 노트가 마우스 옆에 떠요"
          right={<span className="font-mono text-[11px] text-muted-foreground">{related.length}건</span>}
        >
          {related.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Search className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">‘{selected}’로 합성된 지식이 아직 없어요.</p>
              <button onClick={() => onOpenProject(selectedKw.projectId)} className="font-mono text-[11px] text-primary hover:underline">{getProject(selectedKw.projectId)?.name} 열기 →</button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {related.map((k, i) => (<KnowledgeMiniCard key={k.id} k={k} onOpenProject={onOpenProject} onSelectTag={setSelected} delay={i * 50} />))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* 마우스 옆 관련 노트 팝오버 */}
      {pop && (() => {
        const PW = 340, PH = 380;
        const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
        const vh = typeof window !== "undefined" ? window.innerHeight : 800;
        let left = pop.x + 18;
        let top = pop.y - 16;
        if (left + PW > vw - 12) left = pop.x - PW - 18;
        if (left < 12) left = 12;
        if (top + PH > vh - 12) top = Math.max(12, vh - PH - 12);
        if (top < 12) top = 12;
        const kw = knowledgeKeywords.find((k) => k.term === pop.term);
        const col = kw ? pColor(kw.projectId) : "var(--primary)";
        return (
          <div ref={popRef} role="dialog" className="k-pop fixed z-50 w-[340px] overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/50" style={{ left, top }}>
            <div className="flex items-center gap-2 border-b border-border px-3.5 py-2.5">
              <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-sm font-semibold" style={{ background: `color-mix(in oklab, ${col} 16%, transparent)`, color: col }}>
                <Hash className="size-3.5" />{pop.term}
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground"><FileText className="size-3" />관련 노트 {popNotes.length}건</span>
              <button onClick={() => setPop(null)} className="ml-auto grid size-6 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"><X className="size-3.5" /></button>
            </div>
            {popNotes.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <Search className="size-5 text-muted-foreground" />
                <p className="text-[13px] text-muted-foreground">‘{pop.term}’가 등장한 노트가 없어요.</p>
                {kw && <button onClick={() => onOpenProject(kw.projectId)} className="font-mono text-[11px] text-primary hover:underline">{getProject(kw.projectId)?.name} 열기 →</button>}
              </div>
            ) : (
              <div className="max-h-[min(60vh,360px)] space-y-2.5 overflow-y-auto p-2.5">
                {popNotes.map((n, i) => (
                  <NoteMiniCard
                    key={n.id}
                    note={n}
                    onOpenProject={onOpenProject}
                    onSelectTag={(t) => { setSelected(t); setPop((p) => (p ? { ...p, term: t } : p)); }}
                    delay={i * 40}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })()}

      <KnowledgeStyles />
    </div>
  );
}
