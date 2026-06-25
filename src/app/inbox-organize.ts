// 인박스 자동 정리 — 미분류 노트를 분석·클러스터링하고, 기존 프로젝트에 배정하거나
// 신규 프로젝트·에이전트를 생성하는 플래너. (데모용 결정론적 휴리스틱)

import type { Agent, Note, Project } from "./data";
import { agents, projects, getAgent, getProject } from "./data";

// 프로젝트별 키워드 (App routeRules와 동일 계열)
const PROJECT_KEYWORDS: Record<string, string[]> = {
  "p-ondevice": ["sft", "checkpoint", "tokenizer", "quantization", "양자화", "kd", "qat", "ptq", "throughput", "압축", "온디바이스", "on-device", "gauss", "학습", "training", "memory", "latency"],
  "p-eval": ["평가", "evaluation", "dataset", "데이터셋", "metric", "jga", "f1", "precision", "recall", "annotation", "leakage", "품질", "failure", "yaml"],
  "p-agent": ["agent", "에이전트", "routing", "라우팅", "mcp", "a2a", "tool", "orchestration", "planner", "hitl", "multi-agent", "delegation", "simulation"],
  "p-srnote": ["srnote", "inbox", "인박스", "dashboard", "대시보드", "wiki", "knowledge graph", "clustering", "ingestion", "fastapi", "react", "e2e", "mock"],
  "p-devplat": ["security", "보안", "ci", "cd", "docker", "performance", "p95", "logging", "tracing", "retry", "fallback", "secret", "dependency", "regression", "injection", "ssrf"],
  "p-teamops": ["월례회", "행사", "보드게임", "상품", "선물", "다과", "구매", "예산", "결제", "증빙", "정산", "공지", "워크숍", "입사자"],
  "p-intern": ["인턴", "intern", "멘토링", "mentoring", "onboarding", "온보딩", "해커톤", "hackathon", "아이디어", "발표", "pitch", "demo", "데모", "debugging"],
};

function noteHay(n: Note) {
  return `${n.fullText} ${n.excerpt} ${n.tags.join(" ")}`.toLowerCase();
}

function classifyNote(n: Note): { projectId: string | null; confidence: number } {
  const hay = noteHay(n);
  let best: { id: string; score: number } | null = null;
  for (const [pid, words] of Object.entries(PROJECT_KEYWORDS)) {
    const score = words.reduce((s, w) => (hay.includes(w) ? s + 1 : s), 0);
    if (score > 0 && (!best || score > best.score)) best = { id: pid, score };
  }
  if (!best) return { projectId: null, confidence: 50 };
  return { projectId: best.id, confidence: Math.min(98, 62 + best.score * 11) };
}

// 프로젝트 팀(리드+서브) 중 노트와 가장 잘 맞는 에이전트 선택
function pickAgent(n: Note, project: Project): string {
  const hay = noteHay(n);
  const team = [project.leadAgentId, ...project.subAgentIds].map((id) => getAgent(id)!).filter(Boolean);
  let best: { id: string; score: number } | null = null;
  for (const a of team) {
    const words = a.specialty.toLowerCase().split(/[,·/\s]+/).filter((w) => w.length > 1);
    const score = words.reduce((s, w) => (hay.includes(w) ? s + 1 : s), 0);
    if (!best || score > best.score) best = { id: a.id, score };
  }
  return best?.id ?? project.leadAgentId;
}

export interface ExistingCluster {
  kind: "existing";
  theme: string;
  projectId: string;
  noteIds: string[];
  similarity: number; // 0-1
}

export interface EmergingCluster {
  kind: "emerging";
  theme: string;
  noteIds: string[];
  similarity: number;
  project: Project;
  lead: Agent;
  sub: Agent;
}

export interface OrganizePlan {
  total: number;
  noteIds: string[];
  existing: ExistingCluster[];
  emerging: EmergingCluster | null;
  assignments: Record<string, { projectId: string; agentId: string; confidence: number }>;
}

let autoSeq = 0;

// 신규 프로젝트 후보 색 (기존 7색과 구분되는 코랄)
const NEW_COLOR = "oklch(0.66 0.2 22)";

export function planOrganize(allNotes: Note[]): OrganizePlan {
  const unclassified = allNotes.filter((n) => n.stage === "inbox" || n.stage === "analyzing");
  const assignments: OrganizePlan["assignments"] = {};

  const strong: { note: Note; projectId: string; confidence: number }[] = [];
  const weak: Note[] = [];
  for (const n of unclassified) {
    const c = classifyNote(n);
    if (c.projectId && c.confidence >= 90) strong.push({ note: n, projectId: c.projectId, confidence: c.confidence });
    else weak.push(n);
  }

  // 기존 프로젝트 클러스터 (프로젝트별 그룹)
  const byProject = new Map<string, { note: Note; confidence: number }[]>();
  for (const s of strong) {
    if (!byProject.has(s.projectId)) byProject.set(s.projectId, []);
    byProject.get(s.projectId)!.push({ note: s.note, confidence: s.confidence });
  }
  const existing: ExistingCluster[] = [];
  for (const [pid, items] of byProject) {
    const project = getProject(pid);
    if (!project) continue;
    for (const { note, confidence } of items) {
      assignments[note.id] = { projectId: pid, agentId: pickAgent(note, project), confidence };
    }
    existing.push({
      kind: "existing",
      theme: project.name,
      projectId: pid,
      noteIds: items.map((i) => i.note.id),
      similarity: items.reduce((s, i) => s + i.confidence, 0) / items.length / 100,
    });
  }

  // 신규(emerging) 클러스터 — 모호하게 분산된 노트를 묶어 새 프로젝트 생성
  let emerging: EmergingCluster | null = null;
  if (weak.length > 0) {
    autoSeq += 1;
    const pid = `p-auto-${autoSeq}`;
    const leadId = `a-auto-${autoSeq}-l`;
    const subId = `a-auto-${autoSeq}-s`;
    const tags = Array.from(new Set(weak.flatMap((n) => n.tags))).slice(0, 4);

    const project: Project = {
      id: pid,
      name: "회귀·평가 신뢰성 감시",
      codename: "RWT",
      description: "여러 프로젝트에 걸친 회귀·평가 신뢰성 신호를 모아 지속적으로 감시합니다.",
      color: NEW_COLOR,
      leadAgentId: leadId,
      subAgentIds: [subId],
      noteCount: weak.length,
      knowledgeCount: 0,
      health: 100,
      lastUpdated: new Date().toISOString(),
    };
    const lead: Agent = {
      id: leadId, codename: "SENTRY", name: "리드 · 회귀 감시", emoji: "🛰️", role: "lead",
      specialty: "회귀·드리프트 모니터링, 평가 신뢰성", status: "training", accent: NEW_COLOR,
      projectId: pid, notesRouted: 0, accuracy: 80,
    };
    const sub: Agent = {
      id: subId, codename: "DRIFT", name: "서브 · 드리프트", emoji: "📉", role: "sub",
      specialty: "benchmark regression·p95 추적, 알림 임계값", status: "training", accent: NEW_COLOR,
      projectId: pid, notesRouted: 0, accuracy: 78,
    };

    weak.forEach((n, i) => {
      assignments[n.id] = { projectId: pid, agentId: i === 0 ? leadId : subId, confidence: 90 };
    });

    emerging = {
      kind: "emerging",
      theme: tags.length ? tags.join(" · ") : "신규 테마",
      noteIds: weak.map((n) => n.id),
      similarity: 0.79,
      project,
      lead,
      sub,
    };
  }

  return { total: unclassified.length, noteIds: unclassified.map((n) => n.id), existing, emerging, assignments };
}

// 신규 프로젝트·에이전트를 전역 데이터에 등록 (모듈 배열 변형)
export function registerPlan(plan: OrganizePlan) {
  if (plan.emerging) {
    if (!getAgent(plan.emerging.lead.id)) agents.push(plan.emerging.lead);
    if (!getAgent(plan.emerging.sub.id)) agents.push(plan.emerging.sub);
    if (!getProject(plan.emerging.project.id)) projects.push(plan.emerging.project);
  }
}
