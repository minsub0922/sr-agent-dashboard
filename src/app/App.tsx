import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import { SidebarNav, type ViewKey } from "./components/sidebar-nav";
import { Tour, tourSteps } from "./components/tour";
import { ChatView } from "./components/chat-view";
import { Overview } from "./components/overview";
import { InboxView } from "./components/inbox-view";
import { ProjectsView } from "./components/projects-view";
import { AgentsView } from "./components/agents-view";
import { LabView } from "./components/lab-view";
import { KnowledgeView } from "./components/knowledge-view";
import { SkillsView } from "./components/skills-view";
import { ChannelsView } from "./components/channels-view";
import { ProjectPage } from "./components/project-page";
import { AgentDetail } from "./components/agent-detail";
import { notes as seedNotes, getProject, getAgent, type Note } from "./data";
import { planOrganize, registerPlan, type OrganizePlan } from "./inbox-organize";

// 캡처 데모가 살아있게 보이도록 한 가벼운 키워드 라우팅.
const routeRules: { id: string; agentId: string; words: string[] }[] = [
  { id: "p-ondevice", agentId: "a-atom", words: ["sft", "checkpoint", "tokenizer", "quantization", "양자화", "kd", "qat", "ptq", "throughput", "압축", "온디바이스", "on-device", "gauss", "학습", "training"] },
  { id: "p-eval", agentId: "a-sieve", words: ["평가", "evaluation", "dataset", "데이터셋", "metric", "jga", "f1", "precision", "recall", "annotation", "leakage", "품질", "failure", "yaml"] },
  { id: "p-agent", agentId: "a-route", words: ["agent", "에이전트", "routing", "라우팅", "memory", "메모리", "mcp", "a2a", "tool", "orchestration", "planner", "hitl", "multi-agent", "delegation", "simulation"] },
  { id: "p-srnote", agentId: "a-ingest", words: ["srnote", "inbox", "인박스", "dashboard", "대시보드", "wiki", "knowledge graph", "clustering", "ingestion", "fastapi", "react", "e2e", "mock"] },
  { id: "p-devplat", agentId: "a-ward", words: ["security", "보안", "ci", "cd", "docker", "performance", "p95", "logging", "tracing", "retry", "fallback", "secret", "dependency", "regression", "injection", "ssrf"] },
  { id: "p-teamops", agentId: "a-fete", words: ["월례회", "행사", "보드게임", "상품", "선물", "다과", "구매", "예산", "결제", "증빙", "정산", "공지", "워크숍", "입사자"] },
  { id: "p-intern", agentId: "a-guide", words: ["인턴", "intern", "멘토링", "mentoring", "onboarding", "온보딩", "해커톤", "hackathon", "아이디어", "idea", "발표", "pitch", "demo", "데모", "debugging"] },
];

function classify(text: string): { projectId: string; agentId: string; confidence: number } {
  const lower = text.toLowerCase();
  let best = { id: "p-srnote", agentId: "a-ingest", score: 0 };
  for (const rule of routeRules) {
    const score = rule.words.reduce((s, w) => (lower.includes(w) ? s + 1 : s), 0);
    if (score > best.score) best = { id: rule.id, agentId: rule.agentId, score };
  }
  const confidence = Math.min(98, 62 + best.score * 11);
  return { projectId: best.id, agentId: best.agentId, confidence };
}

const pageMeta: Record<ViewKey, { title: string; sub: string }> = {
  overview: { title: "개요", sub: "쌓인 지식의 성장 · 분포 · 변경 현황" },
  chat: { title: "채팅", sub: "에이전트와 대화" },
  inbox: { title: "인박스", sub: "라우팅·검토 대기 중인 노트" },
  projects: { title: "프로젝트", sub: "리드 에이전트와 지식 베이스" },
  agents: { title: "에이전트", sub: "오케스트레이터 → 리드 → 서브 조직도" },
  lab: { title: "연구실", sub: "에이전트 공동 연구 세션 · 실험적 베타" },
  knowledge: { title: "지식", sub: "키워드로 보는 지식 지도" },
  skills: { title: "스킬", sub: "에이전트가 사용하는 스킬 · SKILL.md" },
  channels: { title: "채널", sub: "노트가 들어오는 경로" },
};

export default function App() {
  const [view, setView] = useState<ViewKey>("chat");
  const [notes, setNotes] = useState<Note[]>(seedNotes);
  const [openProject, setOpenProject] = useState<string | null>(null);
  const [openAgent, setOpenAgent] = useState<string | null>(null);
  const [tourStep, setTourStep] = useState<number | null>(null);

  const inboxCount = notes.filter((n) => n.stage === "inbox").length;

  const navigate = useCallback((v: ViewKey) => {
    setOpenProject(null);
    setView(v);
  }, []);

  // 첫 방문 시 가이드 투어 자동 표시 (이후엔 사이드바 ? 버튼으로 재실행)
  useEffect(() => {
    try {
      if (localStorage.getItem("srnote.tourSeen") !== "1") {
        setTourStep(0);
        localStorage.setItem("srnote.tourSeen", "1");
      }
    } catch {
      setTourStep(0);
    }
  }, []);

  // 투어 단계에 맞춰 화면 전환
  useEffect(() => {
    if (tourStep == null) return;
    const v = tourSteps[tourStep].view;
    if (v) navigate(v);
  }, [tourStep, navigate]);

  const startTour = useCallback(() => setTourStep(0), []);
  const closeTour = useCallback(() => setTourStep(null), []);
  const nextTour = useCallback(() => setTourStep((s) => (s == null ? null : s >= tourSteps.length - 1 ? null : s + 1)), []);
  const prevTour = useCallback(() => setTourStep((s) => (s == null ? null : Math.max(0, s - 1))), []);

  const finalizeRoute = useCallback((noteId: string, projectId: string, agentId: string, confidence: number) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, stage: "routed", projectId, agentId, confidence } : n)),
    );
    const project = getProject(projectId);
    const agent = getAgent(agentId);
    toast.success(`${project?.name}(으)로 라우팅됨`, {
      description: `${agent?.codename}이(가) 지식 베이스를 업데이트했습니다 · 신뢰도 ${confidence}%`,
    });
  }, []);

  const handleRoute = useCallback(
    (note: Note) => {
      const result = classify(note.fullText);
      finalizeRoute(note.id, result.projectId, result.agentId, Math.max(result.confidence, 90));
    },
    [finalizeRoute],
  );

  // 인박스 자동 정리: 미분류 노트 분석·클러스터링 → 기존 배정 또는 신규 프로젝트/에이전트 생성
  const buildPlan = useCallback(() => planOrganize(notes), [notes]);
  const commitPlan = useCallback((plan: OrganizePlan) => {
    registerPlan(plan);
    setNotes((prev) =>
      prev.map((n) => {
        const a = plan.assignments[n.id];
        return a ? { ...n, stage: "routed" as const, projectId: a.projectId, agentId: a.agentId, confidence: a.confidence } : n;
      }),
    );
    toast.success("인박스 자동 정리 완료", {
      description: `${plan.total}건 라우팅${plan.emerging ? " · 신규 프로젝트 1개 · 에이전트 2명 생성" : ""}`,
    });
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <SidebarNav view={view} onChange={navigate} inboxCount={inboxCount} onOpenProject={setOpenProject} onStartTour={startTour} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto">
          <main className="px-7 py-6">
            {openProject ? (
              <ProjectPage
                projectId={openProject}
                notes={notes}
                onBack={() => setOpenProject(null)}
                onOpenAgent={setOpenAgent}
              />
            ) : view === "chat" ? (
              <ChatView />
            ) : (
              <>
                <div className="mb-6">
                  <h1 className="tracking-tight">{pageMeta[view].title}</h1>
                  <p className="font-mono text-xs text-muted-foreground">{pageMeta[view].sub}</p>
                </div>
                {view === "overview" && <Overview onNavigate={navigate} onOpenProject={setOpenProject} />}
                {view === "inbox" && <InboxView notes={notes} onRoute={handleRoute} onBuildPlan={buildPlan} onCommitPlan={commitPlan} />}
                {view === "projects" && <ProjectsView onOpenProject={setOpenProject} />}
                {view === "agents" && <AgentsView onOpenAgent={setOpenAgent} />}
                {view === "lab" && <LabView onOpenAgent={setOpenAgent} />}
                {view === "knowledge" && <KnowledgeView onOpenProject={setOpenProject} />}
                {view === "skills" && <SkillsView onOpenAgent={setOpenAgent} />}
                {view === "channels" && <ChannelsView />}
              </>
            )}
          </main>
        </div>
      </div>

      <AgentDetail
        agentId={openAgent}
        notes={notes}
        onClose={() => setOpenAgent(null)}
        onOpenProject={setOpenProject}
      />
      {tourStep !== null && <Tour stepIndex={tourStep} onNext={nextTour} onPrev={prevTour} onClose={closeTour} />}
      <Toaster position="bottom-right" />
    </div>
  );
}
