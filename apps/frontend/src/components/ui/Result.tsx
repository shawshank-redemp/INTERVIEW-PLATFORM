import BACKEND_URL from "@/lib/config";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
    AlertTriangle,
    Bot,
    CalendarDays,
    Check,
    Lightbulb,
    Loader2,
    Sparkles,
    Target,
    User,
} from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface CategoryScores {
    technicalKnowledge: number;
    projectUnderstanding: number;
    problemSolving: number;
    communication: number;
    confidence: number;
}

interface StructuredFeedback {
    summary: string;
    categories: CategoryScores;
    strengths: string[];
    areasForImprovement: string[];
    learningRecommendations: string[];
    feedbackSections: {
        technicalFeedback: string;
        communicationFeedback: string;
        overallVerdict: string;
    };
}

interface ResultData {
    transcript: { type: "Assistant" | "User"; content: string; createdAt: string }[];
    score: number;
    feedback: string | null;
    status: "Done" | "InProgress" | "Pre" | "Incomplete";
}

const CATEGORY_LABELS: Record<keyof CategoryScores, string> = {
    technicalKnowledge: "Technical Knowledge",
    projectUnderstanding: "Project Understanding",
    problemSolving: "Problem Solving",
    communication: "Communication",
    confidence: "Confidence",
};

// The `feedback` column stores a JSON-encoded structured report. Older records
// (evaluated before this shape existed) stored a plain paragraph instead — fall
// back to rendering that as-is rather than breaking the page.
function parseStructuredFeedback(raw: string | null): StructuredFeedback | null {
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && parsed.categories && parsed.feedbackSections) {
            return parsed as StructuredFeedback;
        }
        return null;
    } catch {
        return null;
    }
}

function ScoreRing({ score }: { score: number }) {
    const clamped = Math.max(0, Math.min(10, score));
    const radius = 68;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - clamped / 10);

    return (
        <div className="relative grid size-44 shrink-0 place-items-center">
            <svg width="176" height="176" viewBox="0 0 176 176" className="-rotate-90">
                <circle cx="88" cy="88" r={radius} fill="none" stroke="#EDE9F5" strokeWidth="12" />
                <circle
                    cx="88"
                    cy="88"
                    r={radius}
                    fill="none"
                    stroke="#6E6390"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 1s ease-out" }}
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-semibold tracking-tight text-stone-900">{clamped}</span>
                <span className="text-xs text-stone-400">out of 10</span>
            </div>
        </div>
    );
}

function CategoryBar({ label, value }: { label: string; value: number }) {
    const pct = (Math.max(0, Math.min(10, value)) / 10) * 100;
    return (
        <div>
            <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-stone-700">{label}</span>
                <span className="text-sm text-stone-400">{value}/10</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                <div
                    className="h-full rounded-full bg-[#6E6390] transition-[width] duration-700 ease-out"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

const CARD = "rounded-2xl border border-stone-200 bg-white shadow-[0_1px_2px_rgba(41,37,36,0.04),0_12px_32px_-16px_rgba(41,37,36,0.08)]";

export function Result() {
    const { interviewId } = useParams();
    const navigate = useNavigate();
    const [result, setResult] = useState<ResultData>({
        score: 0,
        feedback: "",
        transcript: [],
        status: "Pre",
    });

    useEffect(() => {
        const fetchResult = () =>
            axios.get(`${BACKEND_URL}/api/v1/result/${interviewId}`).then((response) => {
                setResult(response.data);
                return response.data.status as ResultData["status"];
            });

        fetchResult();
        const intervalId = setInterval(async () => {
            const s = await fetchResult();
            if (s === "Done" || s === "Incomplete") clearInterval(intervalId);
        }, 5000);

        return () => clearInterval(intervalId);
    }, [interviewId]);

    const incomplete = result.status === "Incomplete";
    const ready = result.status === "Done";
    const structured = ready ? parseStructuredFeedback(result.feedback) : null;

    const completedDate =
        result.transcript.length > 0
            ? new Date(
                  Math.max(...result.transcript.map((m) => new Date(m.createdAt).getTime())),
              ).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
            : null;

    return (
        <main className="min-h-screen w-full bg-[#FAF8F5] text-stone-800">
            <div className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">
                {/* Header */}
                <header className="mb-12 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="font-serif text-3xl font-normal tracking-tight text-stone-900">
                            Interview Report
                        </h1>
                        {completedDate && (
                            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-stone-400">
                                <CalendarDays className="size-3.5" />
                                Completed {completedDate}
                            </p>
                        )}
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => navigate("/")}
                        className="rounded-xl border-stone-200 text-stone-700 hover:bg-stone-50"
                    >
                        Start New Interview
                    </Button>
                </header>

                {!ready && !incomplete && (
                    <div className={cn(CARD, "flex flex-col items-center justify-center gap-4 py-24 text-center")}>
                        <Loader2 className="size-6 animate-spin text-stone-300" />
                        <div>
                            <p className="font-medium text-stone-800">Analyzing your interview…</p>
                            <p className="mt-1 text-sm text-stone-400">This usually takes a few seconds.</p>
                        </div>
                    </div>
                )}

                {incomplete && (
                    <div className={cn(CARD, "flex flex-col items-center gap-4 py-20 text-center")}>
                        <span className="grid size-12 place-items-center rounded-full bg-[#FBF3E7] text-[#A97C3D]">
                            <AlertTriangle className="size-5" />
                        </span>
                        <div>
                            <p className="font-serif text-xl text-stone-900">Interview Incomplete</p>
                            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-stone-500">
                                There wasn't enough interview data to generate an evaluation.
                            </p>
                        </div>
                        <Button
                            onClick={() => navigate("/")}
                            className="mt-2 rounded-xl bg-[#5D5980] text-white hover:bg-[#4E4B6E]"
                        >
                            Start New Interview
                        </Button>
                    </div>
                )}

                {ready && (
                    <div className="flex flex-col gap-6">
                        {/* Overall Performance */}
                        <section className={cn(CARD, "flex flex-col items-center gap-6 p-8 text-center sm:p-10")}>
                            <span className="text-xs font-medium uppercase tracking-wide text-stone-400">
                                Overall Score
                            </span>
                            <ScoreRing score={result.score} />
                            {structured?.summary && (
                                <p className="max-w-md text-sm leading-relaxed text-stone-500">
                                    {structured.summary}
                                </p>
                            )}
                        </section>

                        {/* Performance Breakdown */}
                        {structured && (
                            <section className={cn(CARD, "p-8 sm:p-10")}>
                                <h2 className="mb-6 text-sm font-medium uppercase tracking-wide text-stone-400">
                                    Performance Breakdown
                                </h2>
                                <div className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
                                    {(Object.keys(CATEGORY_LABELS) as (keyof CategoryScores)[]).map((key) => (
                                        <CategoryBar
                                            key={key}
                                            label={CATEGORY_LABELS[key]}
                                            value={structured.categories[key]}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Strengths + Areas for Improvement */}
                        {structured && (
                            <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div className={cn(CARD, "p-6 sm:p-8")}>
                                    <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-stone-400">
                                        Strengths
                                    </h2>
                                    <ul className="flex flex-col gap-3">
                                        {structured.strengths.map((s, i) => (
                                            <li
                                                key={i}
                                                className="flex items-start gap-2.5 text-sm leading-relaxed text-stone-700"
                                            >
                                                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#EAF1EA] text-[#5B7B62]">
                                                    <Check className="size-3" strokeWidth={2.5} />
                                                </span>
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className={cn(CARD, "p-6 sm:p-8")}>
                                    <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-stone-400">
                                        Areas for Improvement
                                    </h2>
                                    <ul className="flex flex-col gap-3">
                                        {structured.areasForImprovement.map((a, i) => (
                                            <li
                                                key={i}
                                                className="flex items-start gap-2.5 text-sm leading-relaxed text-stone-700"
                                            >
                                                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#F1EEF9] text-[#6E6390]">
                                                    <Target className="size-3" strokeWidth={2.5} />
                                                </span>
                                                {a}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </section>
                        )}

                        {/* Personalized Learning Recommendations */}
                        {structured && structured.learningRecommendations.length > 0 && (
                            <section className={cn(CARD, "p-6 sm:p-8")}>
                                <h2 className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-stone-400">
                                    <Lightbulb className="size-3.5" />
                                    Personalized Learning Recommendations
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {structured.learningRecommendations.map((topic, i) => (
                                        <span
                                            key={i}
                                            className="rounded-full border border-[#E3DEF3] bg-[#F1EEF9] px-3.5 py-1.5 text-sm font-medium text-[#6E6390]"
                                        >
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* AI Feedback */}
                        <section className={cn(CARD, "p-8 sm:p-10")}>
                            <h2 className="mb-6 flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-stone-400">
                                <Sparkles className="size-3.5 text-[#8A81AD]" />
                                AI Feedback
                            </h2>
                            {structured ? (
                                <div className="flex flex-col gap-6">
                                    <div>
                                        <h3 className="mb-1.5 text-sm font-medium text-stone-800">
                                            Technical Feedback
                                        </h3>
                                        <p className="text-sm leading-relaxed text-stone-500">
                                            {structured.feedbackSections.technicalFeedback}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="mb-1.5 text-sm font-medium text-stone-800">
                                            Communication Feedback
                                        </h3>
                                        <p className="text-sm leading-relaxed text-stone-500">
                                            {structured.feedbackSections.communicationFeedback}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="mb-1.5 text-sm font-medium text-stone-800">
                                            Overall Verdict
                                        </h3>
                                        <p className="text-sm leading-relaxed text-stone-500">
                                            {structured.feedbackSections.overallVerdict}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-500">
                                    {result.feedback}
                                </p>
                            )}
                        </section>

                        {/* Conversation Transcript */}
                        <section>
                            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-stone-400">
                                Conversation Transcript
                            </h2>
                            <div className={cn(CARD, "flex flex-col gap-5 p-6 sm:p-8")}>
                                {result.transcript.length === 0 && (
                                    <p className="text-sm text-stone-400">
                                        No messages were recorded for this interview.
                                    </p>
                                )}
                                {result.transcript.map((m, i) => {
                                    const isAi = m.type === "Assistant";
                                    return (
                                        <div
                                            key={i}
                                            className={cn("flex gap-3", isAi ? "justify-start" : "flex-row-reverse")}
                                        >
                                            <div
                                                className={cn(
                                                    "grid size-8 shrink-0 place-items-center rounded-full",
                                                    isAi
                                                        ? "bg-[#F1EEF9] text-[#6E6390]"
                                                        : "bg-[#EAF1EA] text-[#5B7B62]",
                                                )}
                                            >
                                                {isAi ? <Bot className="size-4" /> : <User className="size-4" />}
                                            </div>
                                            <div
                                                className={cn(
                                                    "flex max-w-[75%] flex-col gap-1",
                                                    isAi ? "items-start" : "items-end",
                                                )}
                                            >
                                                <span className="text-xs font-medium text-stone-400">
                                                    {isAi ? "Interviewer" : "Candidate"}
                                                </span>
                                                <div
                                                    className={cn(
                                                        "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                                                        isAi
                                                            ? "rounded-tl-sm bg-stone-50 text-stone-700"
                                                            : "rounded-tr-sm bg-[#5D5980] text-white",
                                                    )}
                                                >
                                                    {m.content}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </main>
    );
}
