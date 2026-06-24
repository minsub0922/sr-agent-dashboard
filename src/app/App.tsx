import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import { SidebarNav, type ViewKey } from "./components/sidebar-nav";
import { ChatView } from "./components/chat-view";
import { Overview } from "./components/overview";
import { InboxView } from "./components/inbox-view";
import { ProjectsView } from "./components/projects-view";
import { AgentsView } from "./components/agents-view";
import { LabView } from "./components/lab-view";
import { KnowledgeView } from "./components/knowledge-view";
import { ChannelsView } from "./components/channels-view";
import { ProjectPage } from "./components/project-page";
import { AgentDetail } from "./components/agent-detail";
import { notes as seedNotes, getProject, getAgent, type Note } from "./data";

// 캡처 데모가 살아있게 보이도록 한 가벼운 키워드 라우팅.
const routeRules: { id: string; agentId: string; words: string[] }[] = [
  { id: "p-platform", agentId: "a-vega", words: ["지연", "장애", "인시던트", "배포", "캐시", "인프라", "포스트모템", "아키텍처", "서버", "롤백", "latency", "incident", "deploy", "cache", "infra", "p95"] },
  { id: "p-product", agentId: "a-iris", words: ["사용자", "인터뷰", "피드백", "기능", "리서치", "티켓", "로드맵", "고객", "ux", "user", "feedback", "research"] },
  { id: "p-growth", agentId: "a-echo", words: ["그로스", "캠페인", "실험", "활성화", "가격", "이메일", "라이프사이클", "획득", "전환", "growth", "campaign", "experiment", "pricing"] },
  { id: "p-people", agentId: "a-sol", words: ["채용", "후보자", "팀", "컬처", "온보딩", "디브리핑", "조직", "hire", "candidate", "culture"] },
];

function classify(text: string): { projectId: string; agentId: string; confidence: number } {
  const lower = text.toLowerCase();
  let best = { id: "p-product", agentId: "a-iris", score: 0 };
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
  channels: { title: "채널", sub: "노트가 들어오는 경로" },
};

export default function App() {
  const [view, setView] = useState<ViewKey>("chat");
  const [notes, setNotes] = useState<Note[]>(seedNotes);
  const [openProject, setOpenProject] = useState<string | null>(null);
  const [openAgent, setOpenAgent] = useState<string | null>(null);

  const inboxCount = notes.filter((n) => n.stage === "inbox").length;

  const navigate = useCallback((v: ViewKey) => {
    setOpenProject(null);
    setView(v);
  }, []);

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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <SidebarNav view={view} onChange={navigate} inboxCount={inboxCount} onOpenProject={setOpenProject} />

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
                {view === "inbox" && <InboxView notes={notes} onRoute={handleRoute} />}
                {view === "projects" && <ProjectsView onOpenProject={setOpenProject} />}
                {view === "agents" && <AgentsView onOpenAgent={setOpenAgent} />}
                {view === "lab" && <LabView onOpenAgent={setOpenAgent} />}
                {view === "knowledge" && <KnowledgeView onOpenProject={setOpenProject} />}
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
      <Toaster position="bottom-right" />
    </div>
  );
}
