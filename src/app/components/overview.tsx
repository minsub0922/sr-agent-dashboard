import { KnowledgeDashboard } from "./knowledge-dashboard";
import type { ViewKey } from "./sidebar-nav";

// 개요 = 쌓인 지식의 정량 대시보드 (에이전트·팀 요소 제외)
export function Overview({
  onNavigate,
  onOpenProject,
}: {
  onNavigate: (v: ViewKey) => void;
  onOpenProject: (id: string) => void;
}) {
  return <KnowledgeDashboard onOpenProject={onOpenProject} onNavigate={onNavigate} />;
}
