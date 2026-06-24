import { useState, useRef, useEffect } from "react";
import { CornerDownLeft, Check } from "lucide-react";

export interface NewProjectDraft {
  name: string;
  description: string;
  keywords: string;
  color: string;
}

interface Msg {
  id: string;
  role: "user" | "bot";
  text: string;
}

const colorPalette = [
  { label: "블루", value: "oklch(0.74 0.13 222)" },
  { label: "핑크", value: "oklch(0.72 0.18 350)" },
  { label: "그린", value: "oklch(0.8 0.17 152)" },
  { label: "앰버", value: "oklch(0.82 0.15 82)" },
  { label: "바이올렛", value: "oklch(0.685 0.18 291)" },
  { label: "시안", value: "oklch(0.78 0.13 195)" },
];

type Step = "name" | "description" | "keywords" | "color" | "done";

let sid = 0;

export function ProjectSetupChat({
  onCreate,
  onCancel,
}: {
  onCreate: (draft: NewProjectDraft) => void;
  onCancel: () => void;
}) {
  const [messages, setMessages] = useState<Msg[]>([
    { id: `s-${sid++}`, role: "bot", text: "새 프로젝트를 만들어 볼게요. 먼저 프로젝트 이름을 알려주세요. (예: 보안 대응)" },
  ]);
  const [step, setStep] = useState<Step>("name");
  const [draft, setDraft] = useState<NewProjectDraft>({ name: "", description: "", keywords: "", color: colorPalette[0].value });
  const [value, setValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, step]);

  function pushBot(text: string) {
    setMessages((prev) => [...prev, { id: `s-${sid++}`, role: "bot", text }]);
  }
  function pushUser(text: string) {
    setMessages((prev) => [...prev, { id: `s-${sid++}`, role: "user", text }]);
  }

  function answer(text: string) {
    const t = text.trim();
    if (!t) return;
    pushUser(t);

    if (step === "name") {
      setDraft((d) => ({ ...d, name: t }));
      setStep("description");
      setTimeout(() => pushBot(`'${t}' 좋네요! 이 프로젝트는 어떤 내용을 다루나요? 한 줄로 설명해 주세요.`), 350);
    } else if (step === "description") {
      setDraft((d) => ({ ...d, description: t }));
      setStep("keywords");
      setTimeout(() => pushBot("이 프로젝트로 모을 노트의 키워드를 쉼표로 알려주세요. (예: 인시던트, 배포, 장애)"), 350);
    } else if (step === "keywords") {
      setDraft((d) => ({ ...d, keywords: t }));
      setStep("color");
      setTimeout(() => pushBot("마지막으로 대표 색상을 골라주세요."), 350);
    }
    setValue("");
  }

  function chooseColor(c: { label: string; value: string }) {
    pushUser(`${c.label} 색상`);
    const finalDraft = { ...draft, color: c.value };
    setDraft(finalDraft);
    setStep("done");
    setTimeout(() => {
      pushBot(`완료했어요! '${finalDraft.name}' 프로젝트를 만들고 전담 에이전트를 배정했어요. 이제 이 프로젝트와 대화할 수 있습니다.`);
      setTimeout(() => onCreate(finalDraft), 700);
    }, 350);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.map((m) =>
          m.role === "bot" ? (
            <div key={m.id} className="flex items-start gap-2.5">
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/15" style={{ fontSize: 15 }}>
                🧭
              </span>
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-border bg-background px-3.5 py-2.5 text-sm leading-relaxed">
                {m.text}
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground">
                {m.text}
              </div>
            </div>
          ),
        )}

        {/* 색상 선택 단계 — 빠른 선택 */}
        {step === "color" && (
          <div className="flex flex-wrap gap-2 pl-9">
            {colorPalette.map((c) => (
              <button
                key={c.value}
                onClick={() => chooseColor(c)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs transition-colors hover:bg-secondary"
              >
                <span className="size-3 rounded-full" style={{ background: c.value }} />
                {c.label}
              </button>
            ))}
          </div>
        )}

        {step === "done" && (
          <div className="flex items-center gap-2 pl-9 font-mono text-xs text-signal">
            <Check className="size-4" /> 프로젝트가 생성되었습니다
          </div>
        )}
      </div>

      {/* 입력 */}
      <div className="mt-3 flex items-end gap-2 rounded-xl border border-border bg-background p-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              answer(value);
            }
          }}
          rows={1}
          disabled={step === "color" || step === "done"}
          placeholder={
            step === "color"
              ? "위에서 색상을 선택하세요"
              : step === "done"
                ? "생성 완료"
                : "답변을 입력하세요…"
          }
          className="max-h-28 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
        />
        <button
          onClick={() => answer(value)}
          disabled={!value.trim() || step === "color" || step === "done"}
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
        >
          <CornerDownLeft className="size-4" />
        </button>
      </div>

      <button
        onClick={onCancel}
        className="mt-2 self-start font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        취소
      </button>
    </div>
  );
}
