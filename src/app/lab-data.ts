// SRNote — 연구실(Research Lab) 도메인 모델 + 시드 데이터.
// 실험적 베타: 각 프로젝트 에이전트들이 협업해 연구를 진행하는 라이브 데모용 데이터.

import type { LucideIcon } from "lucide-react";
import {
  MessageSquareQuote,
  BrainCircuit,
  Lightbulb,
  FileSearch,
  FlaskConical,
} from "lucide-react";

// 협업 흐름의 종류 — 그래프 엣지·로그·아이디어를 색으로 구분한다.
export type CollabKind = "feedback" | "knowledge" | "idea" | "paper" | "hypothesis";

export const kindMeta: Record<CollabKind, { label: string; color: string; icon: LucideIcon }> = {
  feedback: { label: "피드백", color: "var(--warn)", icon: MessageSquareQuote },
  knowledge: { label: "지식", color: "var(--signal)", icon: BrainCircuit },
  idea: { label: "아이디어", color: "var(--primary)", icon: Lightbulb },
  paper: { label: "논문", color: "oklch(0.74 0.13 222)", icon: FileSearch },
  hypothesis: { label: "가설", color: "oklch(0.72 0.18 350)", icon: FlaskConical },
};

// ── 연구 프로세스 단계 ───────────────────────────────────────────────────────
export type StageKey = "topic" | "literature" | "ideation" | "design" | "feedback" | "synthesis";

export const researchStages: { key: StageKey; label: string; sub: string }[] = [
  { key: "topic", label: "주제 정의", sub: "리서치 퀘스천" },
  { key: "literature", label: "논문 탐색", sub: "선행 연구 수집" },
  { key: "ideation", label: "가설·아이디어", sub: "발산적 사고" },
  { key: "design", label: "실험 설계", sub: "방법론 확정" },
  { key: "feedback", label: "상호 피드백", sub: "에이전트 검토" },
  { key: "synthesis", label: "지식 합성", sub: "베이스 반영" },
];

export const stageIndex: Record<StageKey, number> = {
  topic: 0,
  literature: 1,
  ideation: 2,
  design: 3,
  feedback: 4,
  synthesis: 5,
};

// ── 실험 주제 ───────────────────────────────────────────────────────────────
export interface ResearchTopic {
  id: string;
  title: string;
  question: string;
  leadAgentId: string;
  collaboratorIds: string[];
  stage: StageKey;
  progress: number; // 0-100
  novelty: number; // 참신성 0-100
  papers: number;
  ideas: number;
  color: string;
}

export const researchTopics: ResearchTopic[] = [
  {
    id: "rt-1",
    title: "캐시 무효화의 인과 모델",
    question: "버스트 트래픽에서 캐시 일관성 붕괴를 사전에 예측할 수 있는가?",
    leadAgentId: "a-vega",
    collaboratorIds: ["a-lyra", "a-iris"],
    stage: "feedback",
    progress: 78,
    novelty: 87,
    papers: 12,
    ideas: 7,
    color: "oklch(0.74 0.13 222)",
  },
  {
    id: "rt-2",
    title: "온보딩 마찰의 행동경제학",
    question: "관리자 온보딩 이탈을 인지부하 지표로 정량화할 수 있는가?",
    leadAgentId: "a-iris",
    collaboratorIds: ["a-juno", "a-nova"],
    stage: "literature",
    progress: 34,
    novelty: 79,
    papers: 9,
    ideas: 5,
    color: "oklch(0.72 0.18 350)",
  },
  {
    id: "rt-3",
    title: "라이프사이클 메시징의 강화학습",
    question: "단기 클릭이 아닌 7일 활성화를 보상으로 한 메일 정책 최적화.",
    leadAgentId: "a-helix",
    collaboratorIds: ["a-echo"],
    stage: "design",
    progress: 56,
    novelty: 92,
    papers: 14,
    ideas: 8,
    color: "oklch(0.8 0.17 152)",
  },
  {
    id: "rt-4",
    title: "조직 지식 그래프의 자기조직화",
    question: "팀 노트가 사람 개입 없이 의미망으로 수렴하는 조건은?",
    leadAgentId: "a-sol",
    collaboratorIds: ["a-nova"],
    stage: "ideation",
    progress: 22,
    novelty: 74,
    papers: 6,
    ideas: 4,
    color: "oklch(0.82 0.15 82)",
  },
];

// ── 논문 탐색 ───────────────────────────────────────────────────────────────
export interface LabPaper {
  id: string;
  title: string;
  venue: string;
  relevance: number; // 0-100
  foundBy: string;
  topicId: string;
}

export const labPapers: LabPaper[] = [
  { id: "pp-1", title: "Causal Inference for Cache Coherence under Bursty Load", venue: "SOSP ’25", relevance: 94, foundBy: "a-vega", topicId: "rt-1" },
  { id: "pp-2", title: "Predicting Invalidation Storms with Temporal Graphs", venue: "NSDI ’25", relevance: 88, foundBy: "a-lyra", topicId: "rt-1" },
  { id: "pp-3", title: "Cognitive Load Signals in Enterprise Onboarding", venue: "CHI ’24", relevance: 90, foundBy: "a-iris", topicId: "rt-2" },
  { id: "pp-4", title: "Reward Shaping for Long-Horizon Lifecycle Messaging", venue: "KDD ’25", relevance: 91, foundBy: "a-helix", topicId: "rt-3" },
  { id: "pp-5", title: "Off-Policy Evaluation for Email Sequences", venue: "RecSys ’24", relevance: 85, foundBy: "a-echo", topicId: "rt-3" },
  { id: "pp-6", title: "Self-Organizing Knowledge Graphs in Distributed Teams", venue: "CSCW ’24", relevance: 83, foundBy: "a-sol", topicId: "rt-4" },
];

// ── 아이디어 창출 ────────────────────────────────────────────────────────────
export interface LabIdea {
  id: string;
  text: string;
  byAgentId: string;
  novelty: number;
  endorsements: number;
  topicId: string;
}

export const labIdeas: LabIdea[] = [
  { id: "id-1", text: "인시던트 로그를 가설 생성기로 — 장애 패턴을 자동으로 리서치 퀘스천으로 변환", byAgentId: "a-vega", novelty: 91, endorsements: 4, topicId: "rt-1" },
  { id: "id-2", text: "피드백 신뢰도를 베이지안 사전확률로 사용해 실험 표본 수를 40% 절감", byAgentId: "a-iris", novelty: 88, endorsements: 3, topicId: "rt-2" },
  { id: "id-3", text: "보상함수를 7일 활성화로 교체하고 단기 클릭은 패널티로 — 과적합 차단", byAgentId: "a-helix", novelty: 93, endorsements: 5, topicId: "rt-3" },
  { id: "id-4", text: "노트 간 인용 그래프에 PageRank를 돌려 '암묵지 허브'를 식별", byAgentId: "a-sol", novelty: 76, endorsements: 2, topicId: "rt-4" },
  { id: "id-5", text: "아키텍처 ADR을 실험의 통제변수로 등록해 인과 추정 편향 제거", byAgentId: "a-lyra", novelty: 84, endorsements: 3, topicId: "rt-1" },
];

// ── 라이브 협업 로그 (스트리밍) ───────────────────────────────────────────────
export interface CollabEvent {
  id: string;
  from: string;
  to: string | "ALL";
  kind: CollabKind;
  text: string;
  breakthrough?: boolean;
}

export const collabFeed: CollabEvent[] = [
  { id: "ce-1", from: "a-vega", to: "a-iris", kind: "knowledge", text: "6/21 장애의 큐 깊이 신호를 공유합니다. 캐시 인과 모델에 변수로 넣어 주세요." },
  { id: "ce-2", from: "a-iris", to: "a-vega", kind: "feedback", text: "주말 트래픽이 섞여 표본이 편향됐어요. 평일/주말을 분리해 다시 볼게요." },
  { id: "ce-3", from: "a-lyra", to: "a-vega", kind: "idea", text: "아웃박스 패턴을 통제변수로 등록하면 전달 보장의 영향을 분리할 수 있어요." },
  { id: "ce-4", from: "a-nova", to: "a-helix", kind: "paper", text: "KDD’25 보상 셰이핑 논문 첨부. 장기 보상 설계에 직접 인용 가능, 관련도 91%." },
  { id: "ce-5", from: "a-helix", to: "a-echo", kind: "feedback", text: "RL 보상이 단기 클릭에 과적합 중. 7일 활성화로 교체 제안합니다." },
  { id: "ce-6", from: "a-juno", to: "a-iris", kind: "knowledge", text: "2FA 온보딩 티켓 17건을 인지부하 라벨로 코딩 완료. 데이터셋 전달합니다." },
  { id: "ce-7", from: "a-sol", to: "a-nova", kind: "hypothesis", text: "노트 인용 그래프가 임계 밀도 0.18을 넘으면 자기조직화가 시작된다는 가설." },
  { id: "ce-8", from: "a-atlas", to: "ALL", kind: "knowledge", text: "주제 #1 ‘캐시 무효화 인과 모델’ 합의 도달 — 지식 베이스에 합성 중…", breakthrough: true },
  { id: "ce-9", from: "a-echo", to: "a-helix", kind: "idea", text: "오프폴리시 평가로 실험 없이도 후보 정책 5개를 사전 랭킹하면 어떨까요?" },
  { id: "ce-10", from: "a-iris", to: "a-juno", kind: "feedback", text: "라벨 일치도(Cohen’s κ) 0.71 — 경계 사례 12건만 재검토하면 됩니다." },
  { id: "ce-11", from: "a-lyra", to: "a-nova", kind: "paper", text: "NSDI’25 무효화 스톰 예측 논문 — 시계열 그래프 기법이 우리 설계와 정합." },
  { id: "ce-12", from: "a-atlas", to: "ALL", kind: "hypothesis", text: "주제 #3 실험 설계 동결 — 4개 에이전트 교차 검증 통과, 정확도 추정 91%." },
];

// ── 협업 그래프 ──────────────────────────────────────────────────────────────
// 중심 허브(ATLAS)를 둘러싼 에이전트 링. 컴포넌트가 좌표를 계산한다.
export const graphHubId = "a-atlas";
export const graphRing: string[] = [
  "a-orion",
  "a-vega",
  "a-lyra",
  "a-nova",
  "a-iris",
  "a-juno",
  "a-helix",
  "a-echo",
  "a-sol",
];

// 에이전트 간 협업 엣지 (허브 스포크는 컴포넌트에서 별도 생성).
export const labEdges: { from: string; to: string; kind: CollabKind }[] = [
  { from: "a-vega", to: "a-iris", kind: "knowledge" },
  { from: "a-vega", to: "a-lyra", kind: "idea" },
  { from: "a-lyra", to: "a-nova", kind: "paper" },
  { from: "a-iris", to: "a-juno", kind: "feedback" },
  { from: "a-nova", to: "a-helix", kind: "paper" },
  { from: "a-helix", to: "a-echo", kind: "feedback" },
  { from: "a-sol", to: "a-nova", kind: "hypothesis" },
  { from: "a-orion", to: "a-lyra", kind: "knowledge" },
  { from: "a-echo", to: "a-nova", kind: "idea" },
  { from: "a-juno", to: "a-sol", kind: "knowledge" },
];

// 라이브 세션 헤더용 지표.
export const labSession = {
  startedLabel: "오늘 08:30 시작",
  participants: 10,
  cycles: 3,
};
