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
    title: "INT4 양자화의 정확도-지연 트레이드오프",
    question: "PTQ에서 정확도 손실을 최소화하며 on-device latency를 절반으로 줄일 수 있는가?",
    leadAgentId: "a-atom",
    collaboratorIds: ["a-ember", "a-gauge"],
    stage: "feedback",
    progress: 78,
    novelty: 87,
    papers: 12,
    ideas: 7,
    color: "oklch(0.74 0.13 222)",
  },
  {
    id: "rt-2",
    title: "라우팅 정책의 일반화",
    question: "embedding 기반 routing이 새 프로젝트에 zero-shot으로 일반화되는가?",
    leadAgentId: "a-route",
    collaboratorIds: ["a-relay", "a-nexus"],
    stage: "literature",
    progress: 34,
    novelty: 79,
    papers: 9,
    ideas: 5,
    color: "oklch(0.7 0.18 291)",
  },
  {
    id: "rt-3",
    title: "JGA 실패 모드의 자동 분류",
    question: "JGA 하락을 유발하는 failure 유형을 임베딩으로 자동 군집화할 수 있는가?",
    leadAgentId: "a-gauge",
    collaboratorIds: ["a-sieve", "a-prism"],
    stage: "design",
    progress: 56,
    novelty: 92,
    papers: 14,
    ideas: 8,
    color: "oklch(0.8 0.16 152)",
  },
  {
    id: "rt-4",
    title: "노트 자기조직화 지식그래프",
    question: "사내 노트가 사람 개입 없이 Knowledge Graph로 수렴하는 조건은?",
    leadAgentId: "a-weave",
    collaboratorIds: ["a-ingest"],
    stage: "ideation",
    progress: 22,
    novelty: 74,
    papers: 6,
    ideas: 4,
    color: "oklch(0.72 0.18 350)",
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
  { id: "pp-1", title: "Accuracy–Latency Trade-offs in INT4 Post-Training Quantization", venue: "MLSys ’25", relevance: 94, foundBy: "a-atom", topicId: "rt-1" },
  { id: "pp-2", title: "Knowledge Distillation for Sub-1B On-Device LMs", venue: "EMNLP ’24", relevance: 88, foundBy: "a-ember", topicId: "rt-1" },
  { id: "pp-3", title: "Zero-Shot Generalization of Embedding Routers", venue: "NeurIPS ’24", relevance: 90, foundBy: "a-route", topicId: "rt-2" },
  { id: "pp-4", title: "Clustering Failure Modes in Joint Goal Accuracy", venue: "ACL ’25", relevance: 91, foundBy: "a-gauge", topicId: "rt-3" },
  { id: "pp-5", title: "Leakage Detection for Dialogue Evaluation Sets", venue: "EMNLP ’25", relevance: 85, foundBy: "a-sieve", topicId: "rt-3" },
  { id: "pp-6", title: "Self-Organizing Knowledge Graphs from Team Notes", venue: "CSCW ’24", relevance: 83, foundBy: "a-weave", topicId: "rt-4" },
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
  { id: "id-1", text: "failure case 로그를 가설 생성기로 — 압축 회귀 패턴을 자동으로 리서치 퀘스천으로 변환", byAgentId: "a-atom", novelty: 91, endorsements: 4, topicId: "rt-1" },
  { id: "id-2", text: "민감 레이어만 QAT, 나머지는 PTQ로 — 하이브리드 압축으로 정확도 보존", byAgentId: "a-ember", novelty: 88, endorsements: 3, topicId: "rt-1" },
  { id: "id-3", text: "routing 신뢰도를 베이지안 사전확률로 사용해 평가 표본을 40% 절감", byAgentId: "a-route", novelty: 84, endorsements: 3, topicId: "rt-2" },
  { id: "id-4", text: "JGA failure를 임베딩 군집화해 오류 유형을 자동 라벨링", byAgentId: "a-gauge", novelty: 93, endorsements: 5, topicId: "rt-3" },
  { id: "id-5", text: "노트 인용 그래프에 PageRank를 돌려 '암묵지 허브'를 식별", byAgentId: "a-weave", novelty: 76, endorsements: 2, topicId: "rt-4" },
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
  { id: "ce-1", from: "a-atom", to: "a-gauge", kind: "knowledge", text: "INT4 PTQ 결과 공유합니다. JGA 평가셋에 latency–정확도 곡선을 변수로 넣어 주세요." },
  { id: "ce-2", from: "a-gauge", to: "a-atom", kind: "feedback", text: "주말 배치가 섞여 latency 표본이 편향됐어요. 디바이스별로 분리해 다시 볼게요." },
  { id: "ce-3", from: "a-ember", to: "a-atom", kind: "idea", text: "민감 레이어만 QAT로 두면 압축 회귀를 통제변수로 분리할 수 있어요." },
  { id: "ce-4", from: "a-nexus", to: "a-route", kind: "paper", text: "NeurIPS’24 zero-shot router 논문 첨부 — routing 일반화 설계에 직접 인용 가능, 관련도 90%." },
  { id: "ce-5", from: "a-route", to: "a-relay", kind: "feedback", text: "embedding router가 신규 프로젝트에 과적합 중. fallback 임계값 재조정 제안합니다." },
  { id: "ce-6", from: "a-sieve", to: "a-gauge", kind: "knowledge", text: "JGA failure 142건을 오류 유형으로 코딩 완료. 데이터셋 전달합니다." },
  { id: "ce-7", from: "a-weave", to: "a-ingest", kind: "hypothesis", text: "노트 인용 그래프 밀도가 0.18을 넘으면 Knowledge Graph 자기조직화가 시작된다는 가설." },
  { id: "ce-8", from: "a-atlas", to: "ALL", kind: "knowledge", text: "주제 #1 ‘INT4 양자화 트레이드오프’ 합의 도달 — 지식 베이스에 합성 중…", breakthrough: true },
  { id: "ce-9", from: "a-relay", to: "a-route", kind: "idea", text: "오프라인 평가로 실험 없이 routing 정책 후보 5개를 사전 랭킹하면 어떨까요?" },
  { id: "ce-10", from: "a-gauge", to: "a-sieve", kind: "feedback", text: "라벨 일치도(Cohen’s κ) 0.71 — 경계 사례 12건만 재검토하면 됩니다." },
  { id: "ce-11", from: "a-prism", to: "a-gauge", kind: "paper", text: "ACL’25 JGA failure 군집화 논문 — 우리 평가 설계와 정합합니다." },
  { id: "ce-12", from: "a-atlas", to: "ALL", kind: "hypothesis", text: "주제 #3 실험 설계 동결 — 4개 에이전트 교차 검증 통과, 정확도 추정 92%." },
];

// ── 협업 그래프 ──────────────────────────────────────────────────────────────
// 중심 허브(ATLAS)를 둘러싼 에이전트 링. 컴포넌트가 좌표를 계산한다.
export const graphHubId = "a-atlas";
export const graphRing: string[] = [
  "a-forge",
  "a-ember",
  "a-atom",
  "a-prism",
  "a-gauge",
  "a-sieve",
  "a-nexus",
  "a-route",
  "a-relay",
  "a-canvas",
  "a-ingest",
  "a-weave",
  "a-bastion",
  "a-ward",
];

// 에이전트 간 협업 엣지 (허브 스포크는 컴포넌트에서 별도 생성).
export const labEdges: { from: string; to: string; kind: CollabKind }[] = [
  { from: "a-atom", to: "a-gauge", kind: "knowledge" },
  { from: "a-atom", to: "a-ember", kind: "idea" },
  { from: "a-nexus", to: "a-route", kind: "paper" },
  { from: "a-route", to: "a-relay", kind: "feedback" },
  { from: "a-gauge", to: "a-sieve", kind: "knowledge" },
  { from: "a-prism", to: "a-gauge", kind: "paper" },
  { from: "a-weave", to: "a-ingest", kind: "hypothesis" },
  { from: "a-forge", to: "a-atom", kind: "knowledge" },
  { from: "a-relay", to: "a-nexus", kind: "idea" },
  { from: "a-sieve", to: "a-prism", kind: "knowledge" },
];

// 라이브 세션 헤더용 지표.
export const labSession = {
  startedLabel: "오늘 08:30 시작",
  participants: 14,
  cycles: 3,
};
