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

export interface KnowledgeEntry {
  id: string;
  title: string;
  summary: string;
  updatedAt: string;
  agentId: string;
  delta: "added" | "updated" | "merged";
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

// ── 에이전트 ───────────────────────────────────────────────────────────────
export const agents: Agent[] = [
  { id: "a-atlas", codename: "ATLAS", name: "오케스트레이터", emoji: "🧭", role: "lead", specialty: "모든 프로젝트의 분류 & 라우팅", status: "active", accent: "var(--primary)", projectId: null, notesRouted: 4821, accuracy: 97 },

  { id: "a-orion", codename: "ORION", name: "리드 · 플랫폼", emoji: "🛰️", role: "lead", specialty: "인프라 & 안정성 지식", status: "active", accent: "oklch(0.74 0.13 222)", projectId: "p-platform", notesRouted: 1204, accuracy: 96 },
  { id: "a-vega", codename: "VEGA", name: "서브 · 인시던트", emoji: "🚨", role: "sub", specialty: "포스트모템, 온콜 신호", status: "processing", accent: "oklch(0.74 0.13 222)", projectId: "p-platform", notesRouted: 612, accuracy: 94 },
  { id: "a-lyra", codename: "LYRA", name: "서브 · 아키텍처", emoji: "📐", role: "sub", specialty: "ADR, 설계 결정", status: "idle", accent: "oklch(0.74 0.13 222)", projectId: "p-platform", notesRouted: 388, accuracy: 92 },

  { id: "a-nova", codename: "NOVA", name: "리드 · 프로덕트", emoji: "🔭", role: "lead", specialty: "로드맵, 디스커버리 & 사용자 인사이트", status: "active", accent: "oklch(0.72 0.18 350)", projectId: "p-product", notesRouted: 1542, accuracy: 95 },
  { id: "a-iris", codename: "IRIS", name: "서브 · 리서치", emoji: "🔬", role: "sub", specialty: "인터뷰, 설문 분석", status: "processing", accent: "oklch(0.72 0.18 350)", projectId: "p-product", notesRouted: 731, accuracy: 93 },
  { id: "a-juno", codename: "JUNO", name: "서브 · 피드백", emoji: "💬", role: "sub", specialty: "지원 티켓, NPS 의견", status: "active", accent: "oklch(0.72 0.18 350)", projectId: "p-product", notesRouted: 905, accuracy: 91 },

  { id: "a-helix", codename: "HELIX", name: "리드 · 그로스", emoji: "📈", role: "lead", specialty: "획득, 라이프사이클 & 실험", status: "idle", accent: "oklch(0.8 0.17 152)", projectId: "p-growth", notesRouted: 877, accuracy: 94 },
  { id: "a-echo", codename: "ECHO", name: "서브 · 캠페인", emoji: "📣", role: "sub", specialty: "채널 성과, 크리에이티브 노트", status: "idle", accent: "oklch(0.8 0.17 152)", projectId: "p-growth", notesRouted: 402, accuracy: 90 },

  { id: "a-sol", codename: "SOL", name: "리드 · 피플", emoji: "🌱", role: "lead", specialty: "채용, 컬처 & 조직 지식", status: "training", accent: "oklch(0.82 0.15 82)", projectId: "p-people", notesRouted: 311, accuracy: 89 },
];

export function getAgent(id: string | null): Agent | undefined {
  return agents.find((a) => a.id === id);
}

// ── 프로젝트 ───────────────────────────────────────────────────────────────
export const projects: Project[] = [
  {
    id: "p-platform",
    name: "플랫폼 & 인프라",
    codename: "PLT",
    description: "코어 플랫폼의 안정성, 아키텍처, 운영 지식을 관리합니다.",
    color: "oklch(0.74 0.13 222)",
    leadAgentId: "a-orion",
    subAgentIds: ["a-vega", "a-lyra"],
    noteCount: 1840,
    knowledgeCount: 312,
    health: 96,
    lastUpdated: "2026-06-24T08:42:00Z",
  },
  {
    id: "p-product",
    name: "프로덕트 디스커버리",
    codename: "PRD",
    description: "로드맵 신호, 사용자 리서치, 정리된 피드백 스트림.",
    color: "oklch(0.72 0.18 350)",
    leadAgentId: "a-nova",
    subAgentIds: ["a-iris", "a-juno"],
    noteCount: 2613,
    knowledgeCount: 488,
    health: 92,
    lastUpdated: "2026-06-24T09:05:00Z",
  },
  {
    id: "p-growth",
    name: "그로스 & 라이프사이클",
    codename: "GRW",
    description: "획득 채널, 실험, 캠페인 학습 내용.",
    color: "oklch(0.8 0.17 152)",
    leadAgentId: "a-helix",
    subAgentIds: ["a-echo"],
    noteCount: 1129,
    knowledgeCount: 201,
    health: 81,
    lastUpdated: "2026-06-23T17:20:00Z",
  },
  {
    id: "p-people",
    name: "피플 & 조직",
    codename: "PPL",
    description: "채용 루프, 컬처 노트, 팀 운영 지식.",
    color: "oklch(0.82 0.15 82)",
    leadAgentId: "a-sol",
    subAgentIds: [],
    noteCount: 487,
    knowledgeCount: 96,
    health: 74,
    lastUpdated: "2026-06-22T11:48:00Z",
  },
];

export function getProject(id: string | null): Project | undefined {
  return projects.find((p) => p.id === id);
}

// ── 노트 ──────────────────────────────────────────────────────────────────
export const notes: Note[] = [
  {
    id: "n-1",
    excerpt: "체크아웃 지연이 캐시 롤아웃 이후 p95 2.4초로 급증 — 롤백 진행 중.",
    fullText:
      "08:10 Redis 캐시 레이어 롤아웃 직후 체크아웃 지연이 p95 2.4초로 급증했습니다. 온콜이 배포를 롤백했습니다. 새 클라이언트의 커넥션 풀 고갈이 의심됩니다. 재시도 전에 풀 사이즈 점검이 필요합니다.",
    channel: "Slack",
    receivedAt: "2026-06-24T09:12:00Z",
    stage: "analyzing",
    agentId: "a-atlas",
    projectId: null,
    confidence: null,
    tags: ["인시던트", "지연"],
  },
  {
    id: "n-2",
    excerpt: "사용자 인터뷰 #42: 엔터프라이즈 관리자가 CSV로 역할 일괄 할당을 원함.",
    fullText:
      "400석 고객과의 인터뷰 #42. 가장 큰 불편은 신규 입사자 온보딩 — 사용자를 일일이 클릭하는 대신 CSV를 업로드해 역할을 일괄 할당하길 원합니다. 다음 좌석 확장의 블로커라고 언급했습니다.",
    channel: "Notion",
    receivedAt: "2026-06-24T08:58:00Z",
    stage: "analyzing",
    agentId: "a-atlas",
    projectId: null,
    confidence: null,
    tags: ["리서치", "엔터프라이즈"],
  },
  {
    id: "n-3",
    excerpt: "아이디어: 프로젝트별 지식 변경을 요약하는 주간 다이제스트 이메일.",
    fullText:
      "스탠드업에서 나온 아이디어 — SRNote가 월요일마다 프로젝트별로 지난주 변경된 지식, 기여자, 에이전트가 플래그한 미해결 질문을 보내주면 어떨까?",
    channel: "Web",
    receivedAt: "2026-06-24T08:30:00Z",
    stage: "inbox",
    agentId: "a-atlas",
    projectId: null,
    confidence: 58,
    tags: ["아이디어"],
  },
  {
    id: "n-4",
    excerpt: "Q3 가격 실험 결과를 재무팀과 다시 검토할 것.",
    fullText:
      "연간 플랜 할인을 확정하기 전에 Q3 가격 실험 결과를 재무팀과 다시 검토해야 합니다. 그로스와 관련 있지만 다른 곳에 속할 수도 있습니다.",
    channel: "Email",
    receivedAt: "2026-06-24T07:55:00Z",
    stage: "inbox",
    agentId: "a-atlas",
    projectId: null,
    confidence: 44,
    tags: ["가격", "모호"],
  },
  {
    id: "n-5",
    excerpt: "ADR: 서비스 간 이벤트에 아웃박스 패턴 채택.",
    fullText:
      "결정 기록 — 서비스 간 이벤트에 트랜잭셔널 아웃박스 패턴을 채택해 최소 1회 전달을 보장합니다. 3월의 직접 발행 방식을 대체합니다.",
    channel: "API",
    receivedAt: "2026-06-24T08:05:00Z",
    stage: "routed",
    agentId: "a-lyra",
    projectId: "p-platform",
    confidence: 98,
    tags: ["아키텍처", "ADR"],
  },
  {
    id: "n-6",
    excerpt: "지원: 이번 주 2FA 재설정 플로우가 혼란스럽다는 티켓 3건.",
    fullText:
      "이번 주 별도 티켓 3건이 2FA 재설정 플로우가 혼란스럽다고 합니다 — 백업 코드를 재생성하는 위치를 찾지 못합니다. 프로덕트에 알릴 만한 반복 주제입니다.",
    channel: "Slack",
    receivedAt: "2026-06-24T07:40:00Z",
    stage: "routed",
    agentId: "a-juno",
    projectId: "p-product",
    confidence: 95,
    tags: ["피드백", "인증"],
  },
  {
    id: "n-7",
    excerpt: "온보딩 이메일 v3가 홀드아웃 대비 활성화 +6.2%.",
    fullText:
      "v3 온보딩 이메일 시퀀스가 홀드아웃 대비 7일차 활성화를 6.2% 높였습니다. 95% 신뢰수준에서 유의미. 100% 롤아웃을 권장합니다.",
    channel: "API",
    receivedAt: "2026-06-23T16:22:00Z",
    stage: "routed",
    agentId: "a-echo",
    projectId: "p-growth",
    confidence: 93,
    tags: ["실험", "라이프사이클"],
  },
  {
    id: "n-8",
    excerpt: "후보자 디브리핑: 강한 스태프 엔지니어, 시스템 설계 깊이는 우려.",
    fullText:
      "스태프 엔지니어링 후보자 디브리핑 — 협업과 코드 품질은 강하지만, 패널은 대규모 시스템 설계 깊이를 우려했습니다. 후속 인터뷰와 함께 채용 쪽으로 기울었습니다.",
    channel: "Mobile",
    receivedAt: "2026-06-23T14:10:00Z",
    stage: "routed",
    agentId: "a-sol",
    projectId: "p-people",
    confidence: 88,
    tags: ["채용"],
  },
  {
    id: "n-9",
    excerpt: "6월 21일 부분 장애 포스트모템 액션 아이템이 미할당 상태.",
    fullText:
      "6월 21일 부분 장애 포스트모템에 큐 깊이 메트릭 알림 공백을 포함해 미할당 액션 아이템 3건이 남아 있습니다. 담당자가 필요합니다.",
    channel: "Slack",
    receivedAt: "2026-06-23T13:02:00Z",
    stage: "routed",
    agentId: "a-vega",
    projectId: "p-platform",
    confidence: 96,
    tags: ["인시던트", "포스트모템"],
  },
];

// ── 지식 변경 ──────────────────────────────────────────────────────────────
export const knowledge: KnowledgeEntry[] = [
  { id: "k-1", title: "이벤트 전달 전략", summary: "트랜잭셔널 아웃박스 패턴 채택을 반영해 업데이트.", updatedAt: "2026-06-24T08:06:00Z", agentId: "a-lyra", delta: "updated" },
  { id: "k-2", title: "2FA / 백업 코드 UX", summary: "지원 티켓 3건에서 새 불편 사항을 병합.", updatedAt: "2026-06-24T07:41:00Z", agentId: "a-juno", delta: "merged" },
  { id: "k-3", title: "온보딩 이메일 성과", summary: "v3 시퀀스 결과 추가: 7일차 활성화 +6.2%.", updatedAt: "2026-06-23T16:25:00Z", agentId: "a-echo", delta: "added" },
  { id: "k-4", title: "캐시 레이어 롤아웃 리스크", summary: "커넥션 풀 고갈을 미해결 질문으로 플래그.", updatedAt: "2026-06-24T09:13:00Z", agentId: "a-vega", delta: "updated" },
  { id: "k-5", title: "엔터프라이즈 온보딩 요구사항", summary: "CSV 역할 일괄 할당을 반복 요청으로 추가.", updatedAt: "2026-06-24T09:00:00Z", agentId: "a-iris", delta: "added" },
];

// ── 활동 피드 ──────────────────────────────────────────────────────────────
export const activity: ActivityItem[] = [
  { id: "act-1", agentId: "a-vega", action: " 노트 분석 중 ·", target: "Slack", at: "2026-06-24T09:12:00Z", kind: "capture" },
  { id: "act-2", agentId: "a-lyra", action: " 지식 업데이트 ·", target: "이벤트 전달 전략", at: "2026-06-24T08:06:00Z", kind: "knowledge" },
  { id: "act-3", agentId: "a-juno", action: " 노트 3건 병합 ·", target: "2FA / 백업 코드 UX", at: "2026-06-24T07:41:00Z", kind: "merge" },
  { id: "act-4", agentId: "a-atlas", action: " 노트 라우팅 ·", target: "프로덕트 디스커버리", at: "2026-06-24T07:38:00Z", kind: "route" },
  { id: "act-5", agentId: "a-iris", action: " 검토 플래그 ·", target: "Q3 가격 리마인더", at: "2026-06-24T07:30:00Z", kind: "flag" },
  { id: "act-6", agentId: "a-echo", action: " 지식 추가 ·", target: "온보딩 이메일 성과", at: "2026-06-23T16:25:00Z", kind: "knowledge" },
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
