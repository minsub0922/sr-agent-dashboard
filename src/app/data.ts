// SRNote — 에이전트 기반 노트 시스템의 도메인 모델 + 시드 데이터.

export type AgentStatus = "active" | "processing" | "idle" | "training";
export type AgentRole = "lead" | "sub";

export interface Agent {
  id: string;
  codename: string; // 모노 핸들, 예: "ATLAS"
  name: string; // 역할 이름
  emoji: string; // 페르소나 글리프
  role: AgentRole;
  specialty: string;
  status: AgentStatus;
  accent: string;
  projectId: string | null;
  notesRouted: number;
  accuracy: number; // 0-100
}

export type NoteStage = "analyzing" | "inbox" | "routed";
export type Channel = "Slack" | "Email" | "API" | "Web" | "Mobile" | "Notion";

export interface Note {
  id: string;
  excerpt: string;
  fullText: string;
  channel: Channel;
  receivedAt: string;
  stage: NoteStage;
  agentId: string | null;
  projectId: string | null;
  confidence: number | null;
  tags: string[];
}

export type KnowledgeDelta = "added" | "updated" | "merged";

export interface KnowledgeEntry {
  id: string;
  title: string;
  summary: string;
  updatedAt: string;
  agentId: string;
  delta: KnowledgeDelta;
  projectId: string; // 소속 프로젝트 — 에이전트의 projectId와 일치
  tags: string[];
  contributors: number; // 이 지식에 기여한 에이전트/사람 수
  linkedNotes: number; // 이 지식으로 합성된 원천 노트 수
  maturity: number; // 0-100, 검증·정착 정도(성숙도)
}

export interface Project {
  id: string;
  name: string;
  codename: string;
  description: string;
  color: string;
  leadAgentId: string;
  subAgentIds: string[];
  noteCount: number;
  knowledgeCount: number;
  health: number;
  lastUpdated: string;
}

export interface ActivityItem {
  id: string;
  agentId: string;
  action: string;
  target: string;
  at: string;
  kind: "route" | "knowledge" | "merge" | "flag" | "capture";
}

// 프로젝트별 대표 색
const C_ONDEVICE = "oklch(0.74 0.13 222)"; // 블루
const C_EVAL = "oklch(0.8 0.16 152)"; // 그린
const C_AGENT = "oklch(0.7 0.18 291)"; // 바이올렛
const C_SRNOTE = "oklch(0.72 0.18 350)"; // 핑크
const C_DEVPLAT = "oklch(0.77 0.11 195)"; // 틸
const C_TEAMOPS = "oklch(0.83 0.15 85)"; // 앰버
const C_INTERN = "oklch(0.7 0.16 45)"; // 오렌지

// ── 에이전트 ───────────────────────────────────────────────────────────────
// Main(ATLAS) → 7개 프로젝트 리드 → 각 리드의 서브.
export const agents: Agent[] = [
  { id: "a-atlas", codename: "ATLAS", name: "오케스트레이터", emoji: "🧭", role: "lead", specialty: "모든 프로젝트의 분류 & 라우팅", status: "active", accent: "var(--primary)", projectId: null, notesRouted: 5210, accuracy: 97 },

  // 1. 온디바이스 모델 학습 및 최적화
  { id: "a-forge", codename: "FORGE", name: "리드 · 온디바이스", emoji: "⚙️", role: "lead", specialty: "소형 모델 학습·SFT·압축·최적화 총괄", status: "active", accent: C_ONDEVICE, projectId: "p-ondevice", notesRouted: 1320, accuracy: 95 },
  { id: "a-ember", codename: "EMBER", name: "서브 · 학습/SFT", emoji: "🔥", role: "sub", specialty: "SFT, checkpoint, tokenizer, 학습 데이터", status: "processing", accent: C_ONDEVICE, projectId: "p-ondevice", notesRouted: 642, accuracy: 93 },
  { id: "a-atom", codename: "ATOM", name: "서브 · 압축/벤치", emoji: "⚛️", role: "sub", specialty: "quantization, KD, QAT, PTQ, on-device benchmark", status: "idle", accent: C_ONDEVICE, projectId: "p-ondevice", notesRouted: 471, accuracy: 92 },

  // 2. AI 데이터 및 평가 체계
  { id: "a-prism", codename: "PRISM", name: "리드 · 데이터·평가", emoji: "🔬", role: "lead", specialty: "데이터셋·Task·Metric·평가 워크플로", status: "active", accent: C_EVAL, projectId: "p-eval", notesRouted: 1480, accuracy: 96 },
  { id: "a-gauge", codename: "GAUGE", name: "서브 · 메트릭", emoji: "📊", role: "sub", specialty: "precision/recall/F1/JGA, leaderboard", status: "processing", accent: C_EVAL, projectId: "p-eval", notesRouted: 712, accuracy: 94 },
  { id: "a-sieve", codename: "SIEVE", name: "서브 · 데이터품질", emoji: "🧪", role: "sub", specialty: "dataset 버전·누락/중복/leakage, failure 분석", status: "active", accent: C_EVAL, projectId: "p-eval", notesRouted: 534, accuracy: 93 },

  // 3. 에이전트 시스템 연구 및 오케스트레이션
  { id: "a-nexus", codename: "NEXUS", name: "리드 · 에이전트연구", emoji: "🕸️", role: "lead", specialty: "역할분리·routing·memory·tool use 설계", status: "active", accent: C_AGENT, projectId: "p-agent", notesRouted: 1105, accuracy: 95 },
  { id: "a-route", codename: "ROUTE", name: "서브 · 라우팅/메모리", emoji: "🚦", role: "sub", specialty: "routing 정책, session/project/shared memory", status: "processing", accent: C_AGENT, projectId: "p-agent", notesRouted: 588, accuracy: 92 },
  { id: "a-relay", codename: "RELAY", name: "서브 · 협업/툴", emoji: "🔗", role: "sub", specialty: "MCP, A2A, tool calling, delegation, HITL", status: "idle", accent: C_AGENT, projectId: "p-agent", notesRouted: 402, accuracy: 91 },

  // 4. SRNote 서비스 개발
  { id: "a-canvas", codename: "CANVAS", name: "리드 · 서비스", emoji: "🎨", role: "lead", specialty: "SRNote 설계·구현 총괄", status: "active", accent: C_SRNOTE, projectId: "p-srnote", notesRouted: 1262, accuracy: 94 },
  { id: "a-ingest", codename: "INGEST", name: "서브 · 수집/분류", emoji: "📥", role: "sub", specialty: "ingestion, 요약/Todo/이슈/결정 추출, inbox 분류", status: "active", accent: C_SRNOTE, projectId: "p-srnote", notesRouted: 690, accuracy: 92 },
  { id: "a-weave", codename: "WEAVE", name: "서브 · 지식/대시보드", emoji: "🧩", role: "sub", specialty: "Wiki, Knowledge Graph, Dashboard, 조직도", status: "processing", accent: C_SRNOTE, projectId: "p-srnote", notesRouted: 513, accuracy: 91 },

  // 5. AI 개발 플랫폼·보안·품질
  { id: "a-bastion", codename: "BASTION", name: "리드 · 플랫폼/보안", emoji: "🛡️", role: "lead", specialty: "개발환경·성능·보안·관찰성·품질게이트", status: "active", accent: C_DEVPLAT, projectId: "p-devplat", notesRouted: 980, accuracy: 96 },
  { id: "a-gate", codename: "GATE", name: "서브 · 인프라/CI", emoji: "🚧", role: "sub", specialty: "Docker/Compose/migration, CI/CD, 품질 게이트", status: "idle", accent: C_DEVPLAT, projectId: "p-devplat", notesRouted: 447, accuracy: 93 },
  { id: "a-ward", codename: "WARD", name: "서브 · 보안/관찰성", emoji: "🔒", role: "sub", specialty: "injection·secret·SSRF, logging/tracing/p95", status: "active", accent: C_DEVPLAT, projectId: "p-devplat", notesRouted: 389, accuracy: 94 },

  // 6. 팀 운영 및 사내 행사
  { id: "a-hearth", codename: "HEARTH", name: "리드 · 팀운영", emoji: "🏡", role: "lead", specialty: "반복 운영·행사·구매·공지 관리", status: "idle", accent: C_TEAMOPS, projectId: "p-teamops", notesRouted: 360, accuracy: 90 },
  { id: "a-fete", codename: "FETE", name: "서브 · 행사", emoji: "🎉", role: "sub", specialty: "월례회/워크숍/보드게임/상품/다과", status: "active", accent: C_TEAMOPS, projectId: "p-teamops", notesRouted: 214, accuracy: 89 },
  { id: "a-ledger", codename: "LEDGER", name: "서브 · 구매/정산", emoji: "🧾", role: "sub", specialty: "예산·구매·결제·증빙·정산·공지", status: "idle", accent: C_TEAMOPS, projectId: "p-teamops", notesRouted: 188, accuracy: 90 },

  // 7. 인턴 멘토링 및 해커톤
  { id: "a-beacon", codename: "BEACON", name: "리드 · 멘토링", emoji: "🔆", role: "lead", specialty: "온보딩·멘토링·해커톤 지원 총괄", status: "training", accent: C_INTERN, projectId: "p-intern", notesRouted: 296, accuracy: 89 },
  { id: "a-guide", codename: "GUIDE", name: "서브 · 온보딩", emoji: "🗺️", role: "sub", specialty: "온보딩 체크리스트, 주간 멘토링, 리뷰", status: "active", accent: C_INTERN, projectId: "p-intern", notesRouted: 176, accuracy: 88 },
  { id: "a-spark", codename: "SPARK", name: "서브 · 해커톤", emoji: "✨", role: "sub", specialty: "아이디어/경쟁사 조사/데모/발표", status: "processing", accent: C_INTERN, projectId: "p-intern", notesRouted: 142, accuracy: 87 },
];

// ── 연구실 전용 전문가(experts) ──────────────────────────────────────────────
// 공동연구 세션의 가설·실험설계 단계에서 활동하는, 각 프로세스에 특화된 전문가.
// 기본 로스터(agents)와 분리해 두어 에이전트 탭 집계 등에는 섞이지 않게 하고,
// 이름은 한국어 직무명으로 두어 역할이 바로 읽히게 한다. getAgent가 함께 조회한다.
export const labExperts: Agent[] = [
  // 가설 단계 — 관측을 반증 가능한 명제로 벼리는 전문가들
  { id: "x-hypo", codename: "가설설계자", name: "가설 정식화", emoji: "🎯", role: "sub", specialty: "관측을 반증 가능한 명제로 정식화", status: "processing", accent: "oklch(0.7 0.18 291)", projectId: null, notesRouted: 0, accuracy: 95 },
  { id: "x-confound", codename: "변수통제자", name: "교란·통제 변수", emoji: "🧮", role: "sub", specialty: "교란 변수 식별과 통제 설계", status: "active", accent: "oklch(0.74 0.13 222)", projectId: null, notesRouted: 0, accuracy: 93 },
  { id: "x-power", codename: "검정력분석가", name: "표본·검정력", emoji: "📐", role: "sub", specialty: "검정력·표본수 사전 추정", status: "processing", accent: "oklch(0.8 0.16 152)", projectId: null, notesRouted: 0, accuracy: 94 },
  { id: "x-prior", codename: "선행연구검토자", name: "선행연구 정합", emoji: "📚", role: "sub", specialty: "선행 연구와의 정합성 교차검증", status: "active", accent: "oklch(0.77 0.11 195)", projectId: null, notesRouted: 0, accuracy: 92 },

  // 실험설계 단계 — 프로토콜을 섹션별로 분담하는 전문가들
  { id: "x-dvar", codename: "변수설계자", name: "변수 설계", emoji: "🎚️", role: "sub", specialty: "독립·종속·통제 변수 정의", status: "processing", accent: "oklch(0.7 0.18 291)", projectId: null, notesRouted: 0, accuracy: 94 },
  { id: "x-dbase", codename: "대조군설계자", name: "조건군·베이스라인", emoji: "⚖️", role: "sub", specialty: "베이스라인과 처치군 구성", status: "active", accent: "oklch(0.83 0.15 85)", projectId: null, notesRouted: 0, accuracy: 93 },
  { id: "x-ddata", codename: "표본설계자", name: "데이터·표본", emoji: "🗃️", role: "sub", specialty: "데이터셋·표본수·누수 검사", status: "active", accent: "oklch(0.74 0.13 222)", projectId: null, notesRouted: 0, accuracy: 93 },
  { id: "x-dmetric", codename: "지표분석가", name: "평가 지표·분석", emoji: "📈", role: "sub", specialty: "1·2차 지표와 통계 분석 설계", status: "processing", accent: "oklch(0.8 0.16 152)", projectId: null, notesRouted: 0, accuracy: 94 },
  { id: "x-dthreat", codename: "타당도검토자", name: "타당도·Ablation", emoji: "🔬", role: "sub", specialty: "타당도 위협과 ablation 설계", status: "active", accent: "oklch(0.72 0.18 350)", projectId: null, notesRouted: 0, accuracy: 92 },
];

export function getAgent(id: string | null): Agent | undefined {
  return agents.find((a) => a.id === id) ?? labExperts.find((a) => a.id === id);
}

// ── 프로젝트 ───────────────────────────────────────────────────────────────
export const projects: Project[] = [
  {
    id: "p-ondevice",
    name: "온디바이스 모델 학습·최적화",
    codename: "ODV",
    description: "소형 모델의 학습·SFT·압축·최적화로 제한된 디바이스에서 목표 성능과 런타임 효율을 확보합니다.",
    color: C_ONDEVICE,
    leadAgentId: "a-forge",
    subAgentIds: ["a-ember", "a-atom"],
    noteCount: 1620,
    knowledgeCount: 236,
    health: 94,
    lastUpdated: "2026-06-24T08:40:00Z",
  },
  {
    id: "p-eval",
    name: "AI 데이터 및 평가 체계",
    codename: "EVL",
    description: "데이터셋·Task·Metric·평가 워크플로·Failure Analysis로 모델 성능을 신뢰성 있게 측정합니다.",
    color: C_EVAL,
    leadAgentId: "a-prism",
    subAgentIds: ["a-gauge", "a-sieve"],
    noteCount: 1980,
    knowledgeCount: 268,
    health: 96,
    lastUpdated: "2026-06-24T09:02:00Z",
  },
  {
    id: "p-agent",
    name: "에이전트 시스템 연구·오케스트레이션",
    codename: "AGT",
    description: "로컬/사내망 Agent의 역할 분리·routing·memory·tool use·A2A 협업 구조를 연구·검증합니다.",
    color: C_AGENT,
    leadAgentId: "a-nexus",
    subAgentIds: ["a-route", "a-relay"],
    noteCount: 1240,
    knowledgeCount: 198,
    health: 88,
    lastUpdated: "2026-06-24T08:18:00Z",
  },
  {
    id: "p-srnote",
    name: "SRNote 서비스 개발",
    codename: "SRN",
    description: "사내 메모를 Project Agent 중심 지식·업무 상태로 전환하는 Agent Native Note 서비스를 설계·구현합니다.",
    color: C_SRNOTE,
    leadAgentId: "a-canvas",
    subAgentIds: ["a-ingest", "a-weave"],
    noteCount: 1510,
    knowledgeCount: 172,
    health: 91,
    lastUpdated: "2026-06-24T09:10:00Z",
  },
  {
    id: "p-devplat",
    name: "AI 개발 플랫폼·보안·품질",
    codename: "PLT",
    description: "개발 환경·성능·보안·관찰성·품질 게이트로 AI 서비스가 안정적이고 안전하게 운영되게 합니다.",
    color: C_DEVPLAT,
    leadAgentId: "a-bastion",
    subAgentIds: ["a-gate", "a-ward"],
    noteCount: 1180,
    knowledgeCount: 124,
    health: 90,
    lastUpdated: "2026-06-23T17:30:00Z",
  },
  {
    id: "p-teamops",
    name: "팀 운영 및 사내 행사",
    codename: "OPS",
    description: "행사·구매·공지·신규 입사자 지원 등 팀의 반복 운영 업무를 체계적으로 관리합니다.",
    color: C_TEAMOPS,
    leadAgentId: "a-hearth",
    subAgentIds: ["a-fete", "a-ledger"],
    noteCount: 540,
    knowledgeCount: 64,
    health: 82,
    lastUpdated: "2026-06-22T11:20:00Z",
  },
  {
    id: "p-intern",
    name: "인턴 멘토링 및 해커톤",
    codename: "MNT",
    description: "신규 입사자·인턴 온보딩과 해커톤·혁신 과제의 아이디어·검증·발표 준비를 지원합니다.",
    color: C_INTERN,
    leadAgentId: "a-beacon",
    subAgentIds: ["a-guide", "a-spark"],
    noteCount: 430,
    knowledgeCount: 35,
    health: 79,
    lastUpdated: "2026-06-23T14:05:00Z",
  },
];

export function getProject(id: string | null): Project | undefined {
  return projects.find((p) => p.id === id);
}

// ── 노트 ──────────────────────────────────────────────────────────────────
export const notes: Note[] = [
  {
    id: "n-1",
    excerpt: "Gauss4 0.6B SFT 체크포인트가 3B baseline 대비 JGA 4%p 하락 — 원인 분석 필요.",
    fullText:
      "최신 SFT checkpoint(Gauss4 0.6B)가 3B baseline 대비 JGA 4%p 낮습니다. instruction format 변경 이후 회귀로 의심됩니다. tokenizer 변경분과 학습 데이터 혼입을 먼저 점검해야 합니다.",
    channel: "Slack",
    receivedAt: "2026-06-24T09:12:00Z",
    stage: "analyzing",
    agentId: "a-atlas",
    projectId: null,
    confidence: null,
    tags: ["SFT", "JGA"],
  },
  {
    id: "n-2",
    excerpt: "임베딩 기반 routing이 keyword 대비 오분류 12% 증가 — 임계값 재조정 검토.",
    fullText:
      "새 프로젝트에서 embedding 기반 routing의 오분류가 keyword 방식 대비 12% 증가했습니다. 평가셋 분포가 바뀐 영향으로 보이며, routing 임계값과 fallback 정책을 재조정해야 합니다.",
    channel: "Notion",
    receivedAt: "2026-06-24T08:58:00Z",
    stage: "analyzing",
    agentId: "a-atlas",
    projectId: null,
    confidence: null,
    tags: ["routing", "evaluation"],
  },
  {
    id: "n-3",
    excerpt: "아이디어: PTQ와 QAT를 섞은 하이브리드 압축으로 메모리 30% 절감 가능성.",
    fullText:
      "민감 레이어만 QAT로, 나머지는 PTQ로 처리하는 하이브리드 quantization을 적용하면 정확도 손실을 억제하면서 memory를 30%가량 줄일 수 있을 것 같습니다. 온디바이스 타깃에 검증해볼 가치가 있습니다.",
    channel: "Web",
    receivedAt: "2026-06-24T08:30:00Z",
    stage: "inbox",
    agentId: "a-atlas",
    projectId: null,
    confidence: 56,
    tags: ["quantization"],
  },
  {
    id: "n-4",
    excerpt: "평가 워크플로 p95가 느려짐 — benchmark regression인지 데이터 증가인지 모호.",
    fullText:
      "평가 workflow의 p95 latency가 지난주 대비 늘었습니다. benchmark regression일 수도, 평가 데이터셋 증가 때문일 수도 있어 원인이 모호합니다. 데이터·평가팀과 플랫폼팀이 함께 봐야 합니다.",
    channel: "Email",
    receivedAt: "2026-06-24T07:55:00Z",
    stage: "inbox",
    agentId: "a-atlas",
    projectId: null,
    confidence: 47,
    tags: ["regression", "모호"],
  },
  {
    id: "n-5",
    excerpt: "INT4 PTQ 적용 후 latency 38% 감소, 정확도 손실 1.2%p — 온디바이스 목표 충족.",
    fullText:
      "INT4 PTQ 적용 결과 on-device latency가 38% 감소하고 정확도 손실은 1.2%p에 그쳤습니다. throughput과 memory 모두 목표 내. 압축 전략 기본값으로 채택을 제안합니다.",
    channel: "API",
    receivedAt: "2026-06-24T08:05:00Z",
    stage: "routed",
    agentId: "a-atom",
    projectId: "p-ondevice",
    confidence: 96,
    tags: ["quantization", "latency", "on-device"],
  },
  {
    id: "n-6",
    excerpt: "JGA 평가셋에서 라벨 중복 23건·leakage 의심 5건 발견 — 재정제 필요.",
    fullText:
      "JGA 평가 dataset에서 라벨 중복 23건과 train/test leakage 의심 5건을 발견했습니다. data quality를 보정하지 않으면 metric 신뢰도가 떨어집니다. 버전 태깅 후 재정제하겠습니다.",
    channel: "Slack",
    receivedAt: "2026-06-24T07:40:00Z",
    stage: "routed",
    agentId: "a-sieve",
    projectId: "p-eval",
    confidence: 95,
    tags: ["dataset", "JGA"],
  },
  {
    id: "n-7",
    excerpt: "MCP tool calling에서 권한 scope 누락 — 위험 호출 가능, HITL 게이트 추가 필요.",
    fullText:
      "MCP tool calling 경로에서 일부 도구의 권한 scope가 비어 있어 위험한 호출이 통과될 수 있습니다. A2A delegation 시 scope 검증과 HITL 승인 게이트를 추가해야 합니다.",
    channel: "API",
    receivedAt: "2026-06-23T16:22:00Z",
    stage: "routed",
    agentId: "a-relay",
    projectId: "p-agent",
    confidence: 93,
    tags: ["MCP", "HITL"],
  },
  {
    id: "n-8",
    excerpt: "Inbox 자동 분류 정확도 91% — Project Candidate 추천에 clustering 적용 검토.",
    fullText:
      "SRNote Inbox 자동 분류 정확도가 91%까지 올라왔습니다. 미분류 노트에 clustering을 적용해 Project Candidate를 묶어 추천하면 사용자 라우팅 부담을 더 줄일 수 있습니다.",
    channel: "Mobile",
    receivedAt: "2026-06-23T14:10:00Z",
    stage: "routed",
    agentId: "a-ingest",
    projectId: "p-srnote",
    confidence: 90,
    tags: ["Inbox", "clustering"],
  },
  {
    id: "n-9",
    excerpt: "의존성 audit에서 secret이 로그로 유출되는 경로 발견 — secret scan 게이트 강화.",
    fullText:
      "dependency audit 중 특정 라이브러리가 토큰을 평문 로그로 남기는 경로를 발견했습니다. secret이 tracing 로그로 유출될 수 있어, CI의 secret scan 게이트를 강화하고 마스킹 미들웨어를 추가해야 합니다.",
    channel: "Slack",
    receivedAt: "2026-06-23T13:02:00Z",
    stage: "routed",
    agentId: "a-ward",
    projectId: "p-devplat",
    confidence: 96,
    tags: ["security", "dependency audit"],
  },
];

// ── 지식 변경 ──────────────────────────────────────────────────────────────
export const knowledge: KnowledgeEntry[] = [
  { id: "k-1", title: "INT4 PTQ 압축 전략", summary: "INT4 PTQ를 온디바이스 기본 압축으로 채택 — latency −38%, 정확도 손실 1.2%p 반영.", updatedAt: "2026-06-24T08:06:00Z", agentId: "a-atom", delta: "updated", projectId: "p-ondevice", tags: ["quantization", "latency"], contributors: 3, linkedNotes: 12, maturity: 88 },
  { id: "k-2", title: "JGA 평가셋 데이터 품질 기준", summary: "라벨 중복·leakage 점검 절차를 표준화하고 evaluation 신뢰도 기준을 병합.", updatedAt: "2026-06-24T07:41:00Z", agentId: "a-sieve", delta: "merged", projectId: "p-eval", tags: ["dataset", "data quality"], contributors: 4, linkedNotes: 17, maturity: 72 },
  { id: "k-3", title: "Gauss4 0.6B SFT 레시피", summary: "instruction format·tokenizer·학습 데이터 구성을 정리한 SFT 기준 레시피 신규 추가.", updatedAt: "2026-06-23T16:25:00Z", agentId: "a-ember", delta: "added", projectId: "p-ondevice", tags: ["SFT", "checkpoint"], contributors: 2, linkedNotes: 6, maturity: 64 },
  { id: "k-4", title: "온디바이스 메모리 예산", summary: "타깃 디바이스별 memory/throughput 예산과 on-device 측정 절차를 업데이트.", updatedAt: "2026-06-24T09:13:00Z", agentId: "a-atom", delta: "updated", projectId: "p-ondevice", tags: ["memory", "on-device"], contributors: 3, linkedNotes: 9, maturity: 58 },
  { id: "k-5", title: "JGA·F1 메트릭 기준", summary: "Task별 evaluation metric(JGA, F1, precision/recall) 산식과 leaderboard 규약을 신규 정리.", updatedAt: "2026-06-24T09:00:00Z", agentId: "a-gauge", delta: "added", projectId: "p-eval", tags: ["evaluation", "metric", "JGA"], contributors: 2, linkedNotes: 5, maturity: 46 },
  { id: "k-6", title: "Routing 정책 비교 (keyword/embedding/LLM)", summary: "세 routing 방식의 정확도·지연·비용을 multi-agent 환경에서 병합·표준화.", updatedAt: "2026-06-22T14:30:00Z", agentId: "a-route", delta: "merged", projectId: "p-agent", tags: ["routing", "multi-agent"], contributors: 5, linkedNotes: 21, maturity: 90 },
  { id: "k-7", title: "MCP/A2A 도구 권한 모델", summary: "tool calling scope·delegation·HITL 승인 게이트 규약을 최신 합의로 업데이트.", updatedAt: "2026-06-20T11:10:00Z", agentId: "a-relay", delta: "updated", projectId: "p-agent", tags: ["MCP", "A2A", "HITL"], contributors: 3, linkedNotes: 14, maturity: 86 },
  { id: "k-8", title: "Agent 메모리 분리 전략", summary: "session/project/shared memory 경계와 orchestration 시 공유 범위를 신규 정의.", updatedAt: "2026-06-19T09:45:00Z", agentId: "a-route", delta: "added", projectId: "p-agent", tags: ["memory", "orchestration"], contributors: 2, linkedNotes: 8, maturity: 70 },
  { id: "k-9", title: "Inbox 자동 분류 규칙", summary: "SRNote Inbox 노트를 Project Candidate로 묶는 clustering·분류 규칙을 신규 추가.", updatedAt: "2026-06-21T13:20:00Z", agentId: "a-ingest", delta: "added", projectId: "p-srnote", tags: ["Inbox", "clustering"], contributors: 2, linkedNotes: 7, maturity: 52 },
  { id: "k-10", title: "Knowledge Graph 스키마", summary: "SRNote Wiki·Knowledge Graph 노드/엣지 스키마와 Dashboard 연동을 업데이트.", updatedAt: "2026-06-18T10:05:00Z", agentId: "a-weave", delta: "updated", projectId: "p-srnote", tags: ["Knowledge Graph", "Dashboard"], contributors: 4, linkedNotes: 11, maturity: 76 },
  { id: "k-11", title: "Secret 유출 차단 가이드", summary: "secret scan·로그 마스킹·dependency audit 대응을 사고 사례 기반으로 병합.", updatedAt: "2026-06-16T15:40:00Z", agentId: "a-ward", delta: "merged", projectId: "p-devplat", tags: ["security", "dependency audit"], contributors: 3, linkedNotes: 19, maturity: 81 },
  { id: "k-12", title: "CI 품질 게이트 구성", summary: "Docker 빌드·lint·typecheck·test를 묶은 CI/CD 품질 게이트 구성을 업데이트.", updatedAt: "2026-06-23T12:15:00Z", agentId: "a-gate", delta: "updated", projectId: "p-devplat", tags: ["CI/CD", "Docker"], contributors: 3, linkedNotes: 10, maturity: 68 },
  { id: "k-13", title: "월례회 운영 체크리스트", summary: "월례회·행사 준비, 보드게임·상품·다과 발주 절차를 템플릿으로 신규 추가.", updatedAt: "2026-06-22T16:30:00Z", agentId: "a-fete", delta: "added", projectId: "p-teamops", tags: ["행사", "월례회"], contributors: 2, linkedNotes: 6, maturity: 60 },
  { id: "k-14", title: "인턴 온보딩 체크리스트", summary: "신규 입사자·인턴 onboarding 체크리스트와 주간 mentoring follow-up 절차를 업데이트.", updatedAt: "2026-06-15T11:00:00Z", agentId: "a-guide", delta: "updated", projectId: "p-intern", tags: ["onboarding", "mentoring"], contributors: 4, linkedNotes: 13, maturity: 78 },
  { id: "k-15", title: "해커톤 2026 아이디어 후보", summary: "해커톤 아이디어 후보와 경쟁사 비교·데모 시나리오 초안을 신규 추가.", updatedAt: "2026-06-21T17:10:00Z", agentId: "a-spark", delta: "added", projectId: "p-intern", tags: ["hackathon", "idea"], contributors: 2, linkedNotes: 4, maturity: 44 },
];

// ── 지식 집계 (대시보드용) ───────────────────────────────────────────────────
export const knowledgeDeltaLabel: Record<KnowledgeDelta, string> = {
  added: "추가",
  updated: "수정",
  merged: "병합",
};

// 이번 주 변경 유형 분포
export const knowledgeDeltaWeek: Record<KnowledgeDelta, number> = {
  added: 18,
  updated: 15,
  merged: 8,
};

// 16주 누적 성장 추이 (total = 누적 지식 수, add = 해당 주 신규)
export const knowledgeGrowth: { week: number; total: number; add: number }[] = [
  { week: 16, total: 560, add: 24 },
  { week: 15, total: 591, add: 31 },
  { week: 14, total: 619, add: 28 },
  { week: 13, total: 654, add: 35 },
  { week: 12, total: 676, add: 22 },
  { week: 11, total: 716, add: 40 },
  { week: 10, total: 749, add: 33 },
  { week: 9, total: 778, add: 29 },
  { week: 8, total: 823, add: 45 },
  { week: 7, total: 861, add: 38 },
  { week: 6, total: 891, add: 30 },
  { week: 5, total: 939, add: 48 },
  { week: 4, total: 975, add: 36 },
  { week: 3, total: 1017, add: 42 },
  { week: 2, total: 1056, add: 39 },
  { week: 1, total: 1097, add: 41 },
];

// 최근 16주 일별 지식 기여 강도 — [주][요일], 0=기여 없음. 결정론적 시드.
export const knowledgeHeatmap: number[][] = Array.from({ length: 16 }, (_, w) =>
  Array.from({ length: 7 }, (_, d) => {
    const weekend = d === 0 || d === 6;
    const seed = Math.sin((w * 7 + d) * 99.13 + 17.7) * 43758.5453;
    const base = seed - Math.floor(seed); // 0..1
    const recency = 0.55 + (w / 15) * 0.75; // 최근 주가 더 활발
    let v = Math.round(base * (weekend ? 3.2 : 8.4) * recency);
    if (weekend && base < 0.45) v = 0;
    return Math.max(0, Math.min(11, v));
  }),
);

// 누적 지식에서 추출한 핵심 키워드 + 등장 빈도 (워드클라우드용)
export interface Keyword {
  term: string;
  count: number;
  projectId: string;
}

export const knowledgeKeywords: Keyword[] = [
  // 1. 온디바이스 모델 학습·최적화
  { term: "SFT", count: 96, projectId: "p-ondevice" },
  { term: "quantization", count: 78, projectId: "p-ondevice" },
  { term: "on-device", count: 60, projectId: "p-ondevice" },
  { term: "latency", count: 54, projectId: "p-ondevice" },
  { term: "checkpoint", count: 41, projectId: "p-ondevice" },
  { term: "tokenizer", count: 33, projectId: "p-ondevice" },
  // 2. AI 데이터 및 평가 체계
  { term: "evaluation", count: 110, projectId: "p-eval" },
  { term: "dataset", count: 86, projectId: "p-eval" },
  { term: "metric", count: 57, projectId: "p-eval" },
  { term: "JGA", count: 49, projectId: "p-eval" },
  { term: "F1", count: 40, projectId: "p-eval" },
  { term: "failure analysis", count: 31, projectId: "p-eval" },
  // 3. 에이전트 시스템 연구·오케스트레이션
  { term: "multi-agent", count: 92, projectId: "p-agent" },
  { term: "routing", count: 68, projectId: "p-agent" },
  { term: "orchestration", count: 64, projectId: "p-agent" },
  { term: "memory", count: 50, projectId: "p-agent" },
  { term: "MCP", count: 45, projectId: "p-agent" },
  { term: "A2A", count: 34, projectId: "p-agent" },
  // 4. SRNote 서비스 개발
  { term: "SRNote", count: 95, projectId: "p-srnote" },
  { term: "Inbox", count: 52, projectId: "p-srnote" },
  { term: "Knowledge Graph", count: 47, projectId: "p-srnote" },
  { term: "Dashboard", count: 44, projectId: "p-srnote" },
  { term: "Project Agent", count: 36, projectId: "p-srnote" },
  { term: "clustering", count: 30, projectId: "p-srnote" },
  // 5. AI 개발 플랫폼·보안·품질
  { term: "security", count: 58, projectId: "p-devplat" },
  { term: "CI/CD", count: 50, projectId: "p-devplat" },
  { term: "reliability", count: 45, projectId: "p-devplat" },
  { term: "Docker", count: 35, projectId: "p-devplat" },
  { term: "p95 latency", count: 33, projectId: "p-devplat" },
  { term: "dependency audit", count: 23, projectId: "p-devplat" },
  // 6. 팀 운영 및 사내 행사
  { term: "행사", count: 50, projectId: "p-teamops" },
  { term: "구매", count: 39, projectId: "p-teamops" },
  { term: "예산", count: 34, projectId: "p-teamops" },
  { term: "월례회", count: 30, projectId: "p-teamops" },
  { term: "공지", count: 25, projectId: "p-teamops" },
  { term: "정산", count: 21, projectId: "p-teamops" },
  // 7. 인턴 멘토링 및 해커톤
  { term: "intern", count: 64, projectId: "p-intern" },
  { term: "onboarding", count: 57, projectId: "p-intern" },
  { term: "hackathon", count: 50, projectId: "p-intern" },
  { term: "mentoring", count: 45, projectId: "p-intern" },
  { term: "demo", count: 36, projectId: "p-intern" },
  { term: "pitch", count: 27, projectId: "p-intern" },
];

// ── 활동 피드 ──────────────────────────────────────────────────────────────
export const activity: ActivityItem[] = [
  { id: "act-1", agentId: "a-ember", action: " 노트 분석 중 ·", target: "SFT 체크포인트", at: "2026-06-24T09:12:00Z", kind: "capture" },
  { id: "act-2", agentId: "a-atom", action: " 지식 업데이트 ·", target: "INT4 PTQ 압축 전략", at: "2026-06-24T08:06:00Z", kind: "knowledge" },
  { id: "act-3", agentId: "a-sieve", action: " 노트 3건 병합 ·", target: "JGA 평가셋 데이터 품질", at: "2026-06-24T07:41:00Z", kind: "merge" },
  { id: "act-4", agentId: "a-atlas", action: " 노트 라우팅 ·", target: "에이전트 시스템 연구", at: "2026-06-24T07:38:00Z", kind: "route" },
  { id: "act-5", agentId: "a-route", action: " 검토 플래그 ·", target: "routing 임계값 재조정", at: "2026-06-24T07:30:00Z", kind: "flag" },
  { id: "act-6", agentId: "a-ward", action: " 지식 추가 ·", target: "Secret 유출 차단 가이드", at: "2026-06-23T16:25:00Z", kind: "knowledge" },
];

export const channels: { name: Channel; volume: number }[] = [
  { name: "Slack", volume: 1840 },
  { name: "Email", volume: 1102 },
  { name: "API", volume: 920 },
  { name: "Notion", volume: 611 },
  { name: "Web", volume: 388 },
  { name: "Mobile", volume: 274 },
];

export const channelLabel: Record<Channel, string> = {
  Slack: "Slack",
  Email: "이메일",
  API: "API",
  Web: "웹",
  Mobile: "모바일",
  Notion: "Notion",
};

// 최근 7일 인입 추이
export const intakeTrend = [
  { day: "수", captured: 142, routed: 128 },
  { day: "목", captured: 168, routed: 151 },
  { day: "금", captured: 134, routed: 130 },
  { day: "토", captured: 61, routed: 58 },
  { day: "일", captured: 48, routed: 47 },
  { day: "월", captured: 193, routed: 174 },
  { day: "화", captured: 176, routed: 162 },
];

export function timeAgo(iso: string): string {
  const now = new Date("2026-06-24T09:20:00Z").getTime();
  const then = new Date(iso).getTime();
  const mins = Math.round((now - then) / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}시간 전`;
  const days = Math.round(hrs / 24);
  return `${days}일 전`;
}
