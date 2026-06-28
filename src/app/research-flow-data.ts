// SRNote — 연구실 "AI 공동연구 세션" 6단계 시뮬레이션용 시나리오 데이터.
// 실제 LLM 호출 없이 스크립트된 콘텐츠로 멀티 에이전트 연구 과정을 재현한다.

import type { LucideIcon } from "lucide-react";
import {
  HelpCircle,
  Swords,
  ThumbsUp,
  PencilLine,
  ShieldAlert,
} from "lucide-react";

/* ──────────────────────────────────────────────────────────────────────────
 * 1단계 — 주제 탐색 & 큐레이션
 * ────────────────────────────────────────────────────────────────────────── */

// 각 프로젝트 리드/서브 에이전트가 던지는 원시 주제 단상 (큐레이션 전).
export interface ExploreFragment {
  agentId: string;
  text: string;
}

export const topicExploration: ExploreFragment[] = [
  { agentId: "a-forge", text: "INT4 PTQ에서 레이어별 민감도 편차가 큰데, 민감한 레이어만 QAT로 돌리면 정확도를 지킬 수 있지 않을까?" },
  { agentId: "a-prism", text: "JGA가 떨어질 때 원인 유형을 사람이 일일이 라벨링 중 — 실패 모드를 자동 군집화할 수 있을까?" },
  { agentId: "a-nexus", text: "embedding 라우터가 신규 프로젝트에 과적합한다. zero-shot 일반화가 성립하는 조건이 뭘까?" },
  { agentId: "a-canvas", text: "노트가 일정 밀도를 넘으면 지식 그래프가 저절로 만들어지는 듯하다. 임계점이 존재할까?" },
  { agentId: "a-bastion", text: "압축 모델 배포 시 p95 지연 회귀를 통제변수로 분리하고 싶다." },
  { agentId: "a-gauge", text: "평가 표본을 routing 신뢰도로 가중하면 표본을 40%까지 줄일 수 있을지도." },
  { agentId: "a-ember", text: "KV-cache만 INT8로 유지하면 가중치 INT4의 손실을 상쇄할 수 있다는 신호가 보임." },
  { agentId: "a-weave", text: "노트 인용 그래프에 PageRank를 돌리면 '암묵지 허브'가 드러난다." },
];

// 한 가설 후보.
export interface HypothesisCandidate {
  id: string;
  statement: string;
  basis: string;
  byAgentId: string;
  novelty: number;
  feasibility: number;
  testability: number;
  recommended?: boolean;
}

// 오케스트레이터가 큐레이션해 제시하는 주제 후보(4개).
export interface CandidateTopic {
  id: string;
  title: string;
  angle: string; // 한 줄 요약
  question: string; // 리서치 퀘스천
  leadAgentId: string;
  contributorIds: string[];
  keywords: string[];
  novelty: number;
  feasibility: number;
  impact: number;
  recommended?: boolean;
  hypotheses: HypothesisCandidate[]; // 3단계에서 사용
}

export const candidateTopics: CandidateTopic[] = [
  {
    id: "rc-1",
    title: "민감도-인지 하이브리드 양자화",
    angle: "레이어 민감도에 따라 QAT/PTQ를 선택 적용해 정확도-지연을 동시에 잡는다",
    question: "INT4 PTQ에서 민감 레이어만 선택적으로 QAT를 적용하면, 정확도 손실을 최소화하며 on-device 지연을 절반으로 줄일 수 있는가?",
    leadAgentId: "a-forge",
    contributorIds: ["a-atom", "a-ember", "a-bastion"],
    keywords: ["INT4 PTQ", "레이어 민감도", "선택적 QAT", "KV-cache", "p95 지연"],
    novelty: 87,
    feasibility: 82,
    impact: 90,
    recommended: true,
    hypotheses: [
      { id: "h1-1", statement: "레이어 민감도 상위 15%에만 QAT를 적용하면 INT4 PTQ 대비 JGA 손실을 2%p 이내로 막으면서 p95 지연을 45% 절감한다.", basis: "민감도 프로파일이 소수 레이어에 집중된다는 예비 관측", byAgentId: "x-hypo", novelty: 90, feasibility: 84, testability: 88, recommended: true },
      { id: "h1-2", statement: "레이어 민감도는 활성값 분산만으로 근사 가능하며, 보정 데이터 200스텝 이내에서 안정적으로 수렴한다.", basis: "활성값 통계와 양자화 오차의 상관", byAgentId: "x-power", novelty: 82, feasibility: 88, testability: 84 },
      { id: "h1-3", statement: "하이브리드 양자화의 이득은 모델 규모가 커질수록 체감하며, 1B 미만 구간에서 최대가 된다.", basis: "소형 모델일수록 레이어별 용량 여유가 적음", byAgentId: "x-prior", novelty: 78, feasibility: 80, testability: 79 },
      { id: "h1-4", statement: "KV-cache를 INT8로 유지하면 가중치 INT4의 정확도 손실 상당 부분이 상쇄된다.", basis: "디코딩 단계 누적 오차의 주원인이 KV-cache라는 가설", byAgentId: "x-confound", novelty: 85, feasibility: 76, testability: 82 },
    ],
  },
  {
    id: "rc-2",
    title: "Zero-shot 라우팅 일반화",
    angle: "embedding 라우터가 학습하지 않은 신규 프로젝트로 일반화되는 조건을 규명한다",
    question: "embedding 기반 routing 정책이 새 프로젝트에 zero-shot으로 일반화되는 임계 조건은 무엇인가?",
    leadAgentId: "a-nexus",
    contributorIds: ["a-route", "a-relay", "a-gauge"],
    keywords: ["embedding 라우터", "zero-shot", "도메인 시프트", "보정", "폴백 임계값"],
    novelty: 79,
    feasibility: 88,
    impact: 84,
    hypotheses: [
      { id: "h2-1", statement: "신규 프로젝트의 임베딩 분포가 기존 프로젝트의 볼록 껍질 안에 들어오면 라우팅 정확도가 90%를 넘는다.", basis: "분포 내삽 영역에서 일반화가 성립한다는 통념", byAgentId: "x-hypo", novelty: 84, feasibility: 86, testability: 88, recommended: true },
      { id: "h2-2", statement: "온도 보정만으로 도메인 시프트 하의 라우팅 신뢰도 오차(ECE)를 절반으로 줄일 수 있다.", basis: "신뢰도 과대추정이 주된 실패 원인", byAgentId: "x-power", novelty: 80, feasibility: 90, testability: 85 },
      { id: "h2-3", statement: "폴백 임계값을 신뢰도 분위수로 동적 설정하면 미탐 라우팅을 30% 줄인다.", basis: "고정 임계값의 분포 민감성", byAgentId: "x-prior", novelty: 76, feasibility: 88, testability: 83 },
      { id: "h2-4", statement: "프로젝트당 8개 예시만으로 few-shot 보정해도 zero-shot 대비 정확도가 7%p 오른다.", basis: "소수 앵커가 임베딩 공간을 빠르게 정렬", byAgentId: "x-confound", novelty: 78, feasibility: 84, testability: 80 },
    ],
  },
  {
    id: "rc-3",
    title: "JGA 실패 모드 자동 분류",
    angle: "대화 상태추적 평가의 실패 원인을 임베딩 군집으로 자동 라벨링한다",
    question: "JGA 하락을 유발하는 failure 유형을 임베딩 군집화로 사람 개입 없이 자동 분류할 수 있는가?",
    leadAgentId: "a-prism",
    contributorIds: ["a-gauge", "a-sieve", "a-weave"],
    keywords: ["JGA", "실패 군집화", "오류 분류체계", "임베딩", "능동 표집"],
    novelty: 92,
    feasibility: 75,
    impact: 86,
    hypotheses: [
      { id: "h3-1", statement: "실패 발화의 임베딩 군집은 사람이 정의한 오류 분류체계와 NMI 0.6 이상으로 일치한다.", basis: "실패 유형이 표현 공간에서 분리 가능하다는 가정", byAgentId: "x-hypo", novelty: 90, feasibility: 78, testability: 86, recommended: true },
      { id: "h3-2", statement: "군집 경계 사례만 능동 표집하면 동일 정확도를 표본 40%로 달성한다.", basis: "경계 표본의 정보량이 가장 큼", byAgentId: "x-power", novelty: 86, feasibility: 82, testability: 88 },
      { id: "h3-3", statement: "슬롯 유형을 조건으로 주면 군집 순도가 유의하게 상승한다.", basis: "슬롯별 실패 양상의 이질성", byAgentId: "x-prior", novelty: 80, feasibility: 80, testability: 84 },
      { id: "h3-4", statement: "실패 군집의 시간적 드리프트는 데이터 분포 변화의 조기 신호로 쓸 수 있다.", basis: "군집 비율 변화가 분포 시프트에 선행", byAgentId: "x-confound", novelty: 83, feasibility: 72, testability: 78 },
    ],
  },
  {
    id: "rc-4",
    title: "노트 자기조직화 지식그래프",
    angle: "사람 개입 없이 팀 노트가 지식 그래프로 수렴하는 임계 밀도를 찾는다",
    question: "사내 노트가 사람 개입 없이 Knowledge Graph로 자기조직화하는 인용 밀도 임계점은 존재하는가?",
    leadAgentId: "a-canvas",
    contributorIds: ["a-weave", "a-ingest", "a-route"],
    keywords: ["지식 그래프", "자기조직화", "인용 밀도", "PageRank", "군집화"],
    novelty: 74,
    feasibility: 80,
    impact: 82,
    hypotheses: [
      { id: "h4-1", statement: "노트 인용 그래프 밀도가 0.18을 넘으면 모듈성이 급격히 상승하며 자기조직화가 시작된다.", basis: "퍼콜레이션 임계 현상과의 유사성", byAgentId: "x-hypo", novelty: 82, feasibility: 80, testability: 84, recommended: true },
      { id: "h4-2", statement: "PageRank 상위 5% 노트가 전체 지식의 60%를 연결하는 '암묵지 허브'로 작동한다.", basis: "척도 없는 네트워크의 허브 편중", byAgentId: "x-power", novelty: 78, feasibility: 84, testability: 82 },
      { id: "h4-3", statement: "자동 추출한 엔티티 링크만으로도 사람 큐레이션 그래프의 75% 엣지를 복원한다.", basis: "표면적 공출현이 의미적 연결을 근사", byAgentId: "x-prior", novelty: 75, feasibility: 82, testability: 80 },
      { id: "h4-4", statement: "주간 인용 증가율이 일정 값을 넘으면 신규 프로젝트 분기의 선행 지표가 된다.", basis: "주제 응집이 분기에 선행", byAgentId: "x-confound", novelty: 76, feasibility: 76, testability: 78 },
    ],
  },
];

/* ──────────────────────────────────────────────────────────────────────────
 * 2단계 — 논문 탐색 & 지식 그래프
 * ────────────────────────────────────────────────────────────────────────── */

// 키워드별 서브 에이전트 배정(키워드 인덱스 → 에이전트 id 풀, 컴포넌트에서 라운드로빈).
export const keywordAgentPool = ["a-atom", "a-ember", "a-gauge", "a-sieve", "a-route", "a-weave"];

// 키워드 슬롯별 논문 풀 — 선택 주제의 키워드에 인덱스로 매핑.
export interface FlowPaper {
  id: string;
  title: string;
  venue: string;
  relevance: number;
  kwIndex: number; // 어느 키워드 슬롯이 찾았는지
  nodeId: string; // 지식 그래프 노드 id
}

export const flowPapers: FlowPaper[] = [
  { id: "fp-1", title: "Accuracy–Latency Trade-offs in INT4 Post-Training Quantization", venue: "MLSys ’25", relevance: 94, kwIndex: 0, nodeId: "p1" },
  { id: "fp-2", title: "Layer Sensitivity Profiling for Mixed-Precision LLMs", venue: "ICLR ’25", relevance: 91, kwIndex: 1, nodeId: "p2" },
  { id: "fp-3", title: "Selective Quantization-Aware Training under Compute Budgets", venue: "NeurIPS ’24", relevance: 89, kwIndex: 2, nodeId: "p3" },
  { id: "fp-4", title: "KV-Cache Precision and Decoding Error Accumulation", venue: "EMNLP ’25", relevance: 86, kwIndex: 3, nodeId: "p4" },
  { id: "fp-5", title: "Measuring p95 Latency Regressions on Edge Devices", venue: "MLSys ’24", relevance: 83, kwIndex: 4, nodeId: "p5" },
  { id: "fp-6", title: "A Survey of Hybrid Precision Strategies for Sub-1B LMs", venue: "TMLR ’25", relevance: 88, kwIndex: 0, nodeId: "p6" },
];

// 지식 그래프 노드 — 동심 레이어 배치. 라벨 일부는 선택 키워드로 치환.
export type GraphNodeType = "topic" | "keyword" | "concept" | "paper" | "dataset" | "metric";

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string; // keyword/topic는 런타임에 치환
  layer: 0 | 1 | 2;
  kwIndex?: number; // keyword 노드면 어느 슬롯인지
  reveal: number; // 등장 순서(스텝)
}

export const graphNodes: GraphNode[] = [
  { id: "topic", type: "topic", label: "{topic}", layer: 0, reveal: 0 },

  { id: "k0", type: "keyword", label: "{kw0}", layer: 1, kwIndex: 0, reveal: 1 },
  { id: "k1", type: "keyword", label: "{kw1}", layer: 1, kwIndex: 1, reveal: 1 },
  { id: "k2", type: "keyword", label: "{kw2}", layer: 1, kwIndex: 2, reveal: 2 },
  { id: "k3", type: "keyword", label: "{kw3}", layer: 1, kwIndex: 3, reveal: 2 },
  { id: "k4", type: "keyword", label: "{kw4}", layer: 1, kwIndex: 4, reveal: 3 },

  { id: "c1", type: "concept", label: "트레이드오프 곡선", layer: 1, reveal: 3 },

  { id: "p1", type: "paper", label: "INT4 PTQ Trade-offs", layer: 2, reveal: 4 },
  { id: "p2", type: "paper", label: "Layer Sensitivity", layer: 2, reveal: 4 },
  { id: "p3", type: "paper", label: "Selective QAT", layer: 2, reveal: 5 },
  { id: "p4", type: "paper", label: "KV-cache Precision", layer: 2, reveal: 5 },
  { id: "p5", type: "paper", label: "p95 on Edge", layer: 2, reveal: 6 },
  { id: "p6", type: "paper", label: "Hybrid Precision Survey", layer: 2, reveal: 6 },

  { id: "d1", type: "dataset", label: "On-device 벤치셋", layer: 2, reveal: 7 },
  { id: "m1", type: "metric", label: "JGA · p95", layer: 2, reveal: 7 },
];

export type GraphRel = "cites" | "supports" | "refutes" | "extends" | "measures" | "derives";

export const graphRelMeta: Record<GraphRel, { label: string; color: string }> = {
  cites: { label: "인용", color: "oklch(0.74 0.13 222)" },
  supports: { label: "지지", color: "var(--signal)" },
  refutes: { label: "반박", color: "var(--destructive)" },
  extends: { label: "확장", color: "var(--primary)" },
  measures: { label: "측정", color: "var(--warn)" },
  derives: { label: "파생", color: "oklch(0.72 0.18 350)" },
};

export interface GraphEdge {
  from: string;
  to: string;
  rel: GraphRel;
  reveal: number;
}

export const graphEdges: GraphEdge[] = [
  { from: "topic", to: "k0", rel: "extends", reveal: 1 },
  { from: "topic", to: "k1", rel: "extends", reveal: 1 },
  { from: "topic", to: "k2", rel: "extends", reveal: 2 },
  { from: "topic", to: "k3", rel: "extends", reveal: 2 },
  { from: "topic", to: "k4", rel: "extends", reveal: 3 },
  { from: "k0", to: "c1", rel: "derives", reveal: 3 },

  { from: "k0", to: "p1", rel: "cites", reveal: 4 },
  { from: "k1", to: "p2", rel: "cites", reveal: 4 },
  { from: "k2", to: "p3", rel: "cites", reveal: 5 },
  { from: "k3", to: "p4", rel: "cites", reveal: 5 },
  { from: "k4", to: "p5", rel: "cites", reveal: 6 },
  { from: "k0", to: "p6", rel: "cites", reveal: 6 },

  { from: "p1", to: "topic", rel: "supports", reveal: 4 },
  { from: "p2", to: "c1", rel: "supports", reveal: 5 },
  { from: "p4", to: "p1", rel: "refutes", reveal: 6 },
  { from: "p6", to: "p3", rel: "extends", reveal: 6 },
  { from: "d1", to: "m1", rel: "measures", reveal: 7 },
  { from: "m1", to: "topic", rel: "measures", reveal: 7 },
];

/* ──────────────────────────────────────────────────────────────────────────
 * 3단계 — 가설 구체화 (탐색 프래그먼트; 후보는 CandidateTopic.hypotheses)
 * ────────────────────────────────────────────────────────────────────────── */

export const hypothesisExploration: ExploreFragment[] = [
  { agentId: "x-hypo", text: "관측을 검증 가능한 명제로 좁히는 중 — 효과 크기와 임계값을 박아야 반증이 가능하다." },
  { agentId: "x-confound", text: "교란 변수 후보를 나열했다. 배치 시점, 디바이스 종류, 보정 데이터 양." },
  { agentId: "x-power", text: "각 가설의 검정력을 사전 추정 중. 표본이 작으면 2번 가설이 유리하다." },
  { agentId: "x-prior", text: "선행 논문과 충돌하지 않는지 교차 확인 — KV-cache 가설은 EMNLP’25와 정합." },
];

/* ──────────────────────────────────────────────────────────────────────────
 * 4단계 — 실험 설계 (에이전트 그룹이 섹션별 분담)
 * ────────────────────────────────────────────────────────────────────────── */

export interface DesignSection {
  id: string;
  agentId: string;
  title: string;
  lines: string[]; // 항목별 라인 (타이핑되듯 순차 노출)
}

// {hyp} {kw0} {kw1} {topic} 토큰은 컴포넌트에서 치환.
export const designSections: DesignSection[] = [
  {
    id: "ds-var",
    agentId: "x-dvar",
    title: "변수 설계",
    lines: [
      "독립변수: {kw0} 적용 비율 (0 / 15 / 30 / 100%)",
      "종속변수: JGA 정확도, p95 지연(ms)",
      "통제변수: 보정 데이터 양, 디바이스 종류, 시드",
    ],
  },
  {
    id: "ds-base",
    agentId: "x-dbase",
    title: "조건군 · 베이스라인",
    lines: [
      "베이스라인 A: FP16 원본",
      "베이스라인 B: 전구간 INT4 PTQ",
      "처치군: {kw1} 기반 하이브리드 (제안)",
    ],
  },
  {
    id: "ds-data",
    agentId: "x-ddata",
    title: "데이터 · 표본",
    lines: [
      "데이터셋: on-device 대화셋 3종 + 누수 검사 통과본",
      "표본수: 조건당 1,200 발화 · 5 시드 반복",
      "검정력: 0.80 (α=0.05, 효과크기 d=0.4 가정)",
    ],
  },
  {
    id: "ds-metric",
    agentId: "x-dmetric",
    title: "평가 지표 · 분석",
    lines: [
      "1차 지표: ΔJGA (처치군 − 베이스라인 B)",
      "2차 지표: p95 지연 절감률, 메모리 footprint",
      "분석: 혼합효과 모형 + 부트스트랩 CI",
    ],
  },
  {
    id: "ds-threat",
    agentId: "x-dthreat",
    title: "Ablation · 타당도 위협",
    lines: [
      "Ablation: 민감도 추정 방식(분산 vs. Hessian)",
      "내적 타당도: 디바이스 열 스로틀링 통제",
      "외적 타당도: 모델 2종(0.5B/1.3B)로 재현",
    ],
  },
];

/* ──────────────────────────────────────────────────────────────────────────
 * 5단계 — 교수 그룹 상호 피드백 (원형 5인)
 * ────────────────────────────────────────────────────────────────────────── */

export interface Professor {
  id: string;
  codename: string;
  name: string;
  emoji: string;
  accent: string;
}

// 연구실 전용 '교수' 페르소나 — 기존 에이전트 로스터와 별개.
export const professors: Professor[] = [
  { id: "pf-method", codename: "방법론 교수", name: "연구 설계·방법론", emoji: "🧠", accent: "oklch(0.7 0.18 291)" },
  { id: "pf-stat", codename: "통계 교수", name: "검정력·통계 분석", emoji: "📐", accent: "oklch(0.74 0.13 222)" },
  { id: "pf-domain", codename: "도메인 교수", name: "현장 적용·도메인", emoji: "🔭", accent: "oklch(0.8 0.16 152)" },
  { id: "pf-repro", codename: "재현성 교수", name: "재현성·연구윤리", emoji: "♻️", accent: "oklch(0.77 0.11 195)" },
  { id: "pf-critic", codename: "비판 교수", name: "반론·취약점 검증", emoji: "🗡️", accent: "oklch(0.72 0.18 350)" },
];

export type FeedbackKind = "question" | "critique" | "concur" | "revise" | "concern";

export const feedbackKindMeta: Record<FeedbackKind, { label: string; color: string; icon: LucideIcon }> = {
  question: { label: "질문", color: "oklch(0.74 0.13 222)", icon: HelpCircle },
  critique: { label: "반박", color: "var(--destructive)", icon: Swords },
  concur: { label: "동의", color: "var(--signal)", icon: ThumbsUp },
  revise: { label: "수정 제안", color: "var(--primary)", icon: PencilLine },
  concern: { label: "우려", color: "var(--warn)", icon: ShieldAlert },
};

export interface FeedbackEvent {
  from: string;
  to: string;
  kind: FeedbackKind;
  text: string;
  resolved?: boolean; // 합의/반영 표시
}

export const feedbackFeed: FeedbackEvent[] = [
  { from: "pf-critic", to: "pf-method", kind: "critique", text: "15% 임계값이 임의적입니다. 민감도 분포가 디바이스마다 다르면 결론이 무너집니다." },
  { from: "pf-method", to: "pf-critic", kind: "revise", text: "타당한 지적입니다. 임계값을 고정하지 말고 분위수 기반으로 재정의하겠습니다." },
  { from: "pf-stat", to: "pf-method", kind: "question", text: "조건당 5 시드면 분산 추정이 불안정할 수 있어요. 검정력 0.8을 유지하려면 8 시드가 안전합니다." },
  { from: "pf-method", to: "pf-stat", kind: "concur", text: "동의합니다. 시드를 8로 올리고 부트스트랩 CI를 병기하죠." },
  { from: "pf-domain", to: "pf-method", kind: "concern", text: "on-device 열 스로틀링이 p95에 들어가면 처치 효과와 혼동됩니다." },
  { from: "pf-repro", to: "pf-domain", kind: "concur", text: "측정 프로토콜에 쿨다운 90초를 명시하면 통제됩니다. 스크립트도 함께 공개하죠." },
  { from: "pf-stat", to: "pf-domain", kind: "revise", text: "디바이스를 랜덤효과로 넣은 혼합효과 모형이면 그 혼동을 흡수합니다." },
  { from: "pf-critic", to: "pf-stat", kind: "critique", text: "효과크기 d=0.4 가정의 근거가 약합니다. 파일럿 20샘플로 사전 추정합시다." },
  { from: "pf-stat", to: "pf-critic", kind: "concur", text: "수용합니다. 파일럿으로 d를 재추정해 표본수를 확정하겠습니다." },
  { from: "pf-domain", to: "pf-repro", kind: "question", text: "데이터셋 누수 검사는 어느 수준까지 했나요?" },
  { from: "pf-repro", to: "pf-domain", kind: "concur", text: "n-gram 중복 + 임베딩 근접쌍 제거까지 완료. 리포트 첨부합니다.", resolved: true },
  { from: "pf-method", to: "pf-critic", kind: "revise", text: "반론을 모두 반영했습니다. 가설을 '분위수 상위 구간' 표현으로 다듬었어요." },
  { from: "pf-critic", to: "pf-method", kind: "concur", text: "이제 반증 가능하고 통제도 명확합니다. 진행에 동의합니다.", resolved: true },
];

/* ──────────────────────────────────────────────────────────────────────────
 * 6단계 — 지식 합성 (컨텍스트 압축 + 논문 초안)
 * ────────────────────────────────────────────────────────────────────────── */

// 압축 단계에서 보여줄, 지금까지 누적된 컨텍스트 청크.
export interface ContextChunk {
  id: string;
  label: string;
  count: string;
}

export const contextChunks: ContextChunk[] = [
  { id: "cc-topic", label: "선정 주제", count: "1" },
  { id: "cc-paper", label: "탐색 논문", count: "6편" },
  { id: "cc-graph", label: "지식 그래프", count: "15 노드" },
  { id: "cc-hypo", label: "확정 가설", count: "1" },
  { id: "cc-design", label: "실험 설계", count: "5 섹션" },
  { id: "cc-feedback", label: "교수 피드백", count: "13건" },
];

// 논문 초안 섹션 — {topic}{hyp}{kw0}{kw1} 치환. 컴포넌트에서 순차 타이핑.
export interface DraftSection {
  heading: string;
  body: string;
}

export const draftSections: DraftSection[] = [
  {
    heading: "초록 (Abstract)",
    body: "본 연구는 {topic}을(를) 다룬다. 우리는 다음 가설을 검증한다: {hyp} 6편의 선행 연구를 종합해 지식 그래프로 구조화하고, 5개 평가 지표 위에서 통제된 실험을 설계했다. 다섯 명의 검토 에이전트가 방법론·통계·도메인·재현성·비판 관점에서 교차 검증했으며, 그 반영 결과를 본 초안에 담았다.",
  },
  {
    heading: "1. 서론",
    body: "{kw0}와(과) {kw1}의 긴장 관계는 on-device 환경에서 오래된 난제다. 기존 접근은 전역적 단일 정밀도에 의존해 정확도와 지연 중 하나를 희생해 왔다. 본 연구는 레이어 단위의 선택적 처리를 통해 두 목표를 동시에 달성할 수 있다는 관점을 제시한다.",
  },
  {
    heading: "2. 관련 연구",
    body: "지식 그래프 합성 결과, 선행 연구는 (i) 정밀도-지연 트레이드오프, (ii) 레이어 민감도 추정, (iii) 선택적 학습의 세 흐름으로 군집화된다. 본 연구는 세 흐름을 잇는 위치에서 가설을 세운다.",
  },
  {
    heading: "3. 방법 · 실험 설계",
    body: "독립변수는 {kw0} 적용 비율이며, 종속변수는 JGA 정확도와 p95 지연이다. FP16 원본과 전구간 INT4 PTQ를 베이스라인으로 두고, 제안 기법을 처치군으로 비교한다. 디바이스를 랜덤효과로 둔 혼합효과 모형과 부트스트랩 신뢰구간으로 분석한다.",
  },
  {
    heading: "4. 예상 결과",
    body: "가설이 지지되면 처치군은 베이스라인 B 대비 JGA 손실 2%p 이내, p95 지연 45% 절감을 보일 것으로 예상한다. 이득은 소형 모델 구간에서 가장 클 것으로 전망한다.",
  },
  {
    heading: "5. 한계 · 향후 과제",
    body: "민감도 추정 방식의 선택과 디바이스 열 스로틀링이 주요 위협이다. 파일럿으로 효과크기를 재추정하고, 0.5B·1.3B 두 모델에서 재현해 외적 타당도를 확보한다.",
  },
];

export const draftMeta = {
  authorsLabel: "공동 저자: 14 에이전트 · 5 검토 교수",
  venueLabel: "대상 학회: MLSys / EMNLP (예정)",
};
