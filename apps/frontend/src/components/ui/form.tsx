import { useEffect, useRef, useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { toast } from "sonner";
import axios from "axios"; //messenger Axios carries the request.
import BACKEND_URL from "@/lib/config";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  GitBranch,
  Lock,
  Mic,
  Sparkles,
} from "lucide-react";

const FEATURES = [
  {
    icon: GitBranch,
    title: "GitHub Analysis",
    description: "AI understands your repositories before asking questions.",
    tone: "lavender",
  },
  {
    icon: Mic,
    title: "Voice Interview",
    description: "Natural real-time technical interview using voice.",
    tone: "sage",
  },
  {
    icon: Sparkles,
    title: "Personalized Questions",
    description: "Questions generated from your own projects.",
    tone: "lavender",
  },
  {
    icon: BarChart3,
    title: "AI Evaluation",
    description: "Receive structured technical feedback and interview insights.",
    tone: "sage",
  },
] as const;

const STEPS = [
  "Paste GitHub Profile",
  "AI analyzes repositories",
  "Personalized technical interview",
  "Detailed AI evaluation",
];

const ANALYSIS_STEPS = [
  "Reading your GitHub profile",
  "Analyzing repositories",
  "Understanding your project patterns",
  "Preparing your interview",
];
const ANALYSIS_LAST_STEP = ANALYSIS_STEPS.length - 1;
// Cosmetic pacing for steps we have no real backend signal for.
const ANALYSIS_STEP_DURATION = 1400;
// Brief pause so the final checkmark is visible before navigating away.
const ANALYSIS_FINAL_PAUSE = 500;

// Matches a GitHub profile URL only (github.com/username), not a repo/org sub-path.
const GITHUB_PROFILE_URL_PATTERN = /^https?:\/\/(www\.)?github\.com\/[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\/?$/;

// Self-contained, extremely low-opacity noise texture (no external asset/request).
const GRAIN_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function Form() {
  const [github, setGithub] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  // True once the pre-interview request has actually resolved.
  const [requestDone, setRequestDone] = useState(false);
  // True once the full step sequence — including the final checkmark — has played out.
  const [sequenceFinished, setSequenceFinished] = useState(false);
  const interviewIdRef = useRef<string | null>(null);
  const navigate = useNavigate();

  // Advances the cosmetic steps on a timer, but never runs ahead of the last
  // step until the real request is done — that step waits on actual progress.
  useEffect(() => {
    if (!loading || sequenceFinished) {
      if (!loading) {
        setAnalysisStep(0);
        setRequestDone(false);
        setSequenceFinished(false);
      }
      return;
    }
    const id = setInterval(() => {
      setAnalysisStep((step) => Math.min(step + 1, ANALYSIS_LAST_STEP));
    }, ANALYSIS_STEP_DURATION);
    return () => clearInterval(id);
  }, [loading, sequenceFinished]);

  // Only once the animation has reached the last step AND the request has
  // actually finished do we mark the sequence complete.
  useEffect(() => {
    if (loading && !sequenceFinished && requestDone && analysisStep === ANALYSIS_LAST_STEP) {
      setSequenceFinished(true);
    }
  }, [loading, sequenceFinished, requestDone, analysisStep]);

  // Give the final checkmark a beat to register before leaving the page.
  useEffect(() => {
    if (!sequenceFinished) return;
    const id = setTimeout(() => {
      if (interviewIdRef.current) navigate(`/interview/${interviewIdRef.current}`);
    }, ANALYSIS_FINAL_PAUSE);
    return () => clearTimeout(id);
  }, [sequenceFinished, navigate]);

  async function onSubmit() {
    const trimmedGithub = github.trim();
    if (!trimmedGithub) {
      toast.error("Please enter a Github URL");
      return;
    }
    if (!GITHUB_PROFILE_URL_PATTERN.test(trimmedGithub)) {
      toast.error("Please enter a valid GitHub profile URL, e.g. https://github.com/username");
      return;
    }
    setLoading(true);
    try {
      //"Axios will take the LinkedIn and GitHub URL
      //  and post it to the backend."
      const response = await axios.post(`${BACKEND_URL}/api/v1/pre-interview`, {
        github: trimmedGithub,
      });
      interviewIdRef.current = response.data.id;
      setRequestDone(true);
    } catch (err) {
      setLoading(false);
      const message =
        axios.isAxiosError(err) && typeof err.response?.data?.message === "string"
          ? err.response.data.message
          : "Something went wrong analyzing that profile. Please try again.";
      toast.error(message);
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-[#FDFCFA] via-[#FAF7F1] to-[#F2EDE3] text-stone-800">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Radial glow behind the hero */}
        <div
          className="absolute inset-x-0 top-0 h-[46rem]"
          style={{
            background:
              "radial-gradient(60% 55% at 50% 0%, rgba(239,234,251,0.55) 0%, rgba(239,234,251,0) 70%)",
          }}
        />
        <div className="absolute left-1/2 top-[-14rem] h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-[#EFEAFB]/60 blur-[140px]" />
        <div className="absolute right-[-12rem] top-[20rem] h-[30rem] w-[30rem] rounded-full bg-[#EAF1EA]/50 blur-[140px]" />
        {/* Faint grain for texture */}
        <div
          className="absolute inset-0 opacity-[0.035] mix-blend-multiply"
          style={{ backgroundImage: GRAIN_BG }}
        />
      </div>

      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-6 py-16 sm:py-20">
        {/* Hero */}
        <h1 className="max-w-2xl text-balance text-center font-serif text-4xl font-normal leading-[1.15] tracking-tight text-stone-900 sm:text-5xl">
          Technical interviews, personalized from your{" "}
          <em className="text-[#6E6390] not-italic">GitHub</em>.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-balance text-center text-base leading-relaxed text-stone-500 sm:text-lg">
          Analyze your public repositories and build a personalized interview
          around your real projects.
        </p>

        {/* Primary card */}
        <div className="mt-10 w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-8 shadow-[0_1px_2px_rgba(41,37,36,0.04),0_12px_32px_-16px_rgba(41,37,36,0.08)] sm:p-10">
          {!loading ? (
            <>
              <label
                htmlFor="github-url"
                className="mb-2 block text-xs font-medium uppercase tracking-wide text-stone-400"
              >
                GitHub Profile URL
              </label>
              <div className="relative">
                <GitBranch className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                <Input
                  id="github-url"
                  placeholder="https://github.com/yourusername"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  className="h-12 rounded-xl border-stone-200 bg-stone-50/60 pl-10 text-sm text-stone-800 placeholder:text-stone-400 focus-visible:border-[#B6ACD6] focus-visible:ring-[#B6ACD6]/25"
                />
              </div>

              <Button
                disabled={loading}
                onClick={onSubmit}
                size="lg"
                className="mt-5 h-12 w-full gap-2 rounded-xl bg-[#5D5980] text-sm font-medium text-white shadow-sm transition-colors duration-300 hover:bg-[#4E4B6E]"
              >
                Analyze GitHub
                <ArrowRight className="size-4" />
              </Button>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-stone-400">
                <Lock className="size-3" />
                We only analyze your public repositories to personalize your interview.
              </p>
            </>
          ) : (
            <div className="flex flex-col gap-4 py-2">
              {ANALYSIS_STEPS.map((step, i) => {
                const isDone = i < analysisStep || (sequenceFinished && i === analysisStep);
                const isActive = i === analysisStep && !sequenceFinished;
                return (
                  <div key={step} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-full transition-all duration-700 ease-out",
                        isDone
                          ? "bg-[#E7F0E9] text-[#5B7B62]"
                          : isActive
                            ? "bg-[#EFEAFB] text-[#6E6390]"
                            : "bg-stone-100 text-stone-300",
                      )}
                    >
                      {isDone ? (
                        <Check className="size-3.5" strokeWidth={2.25} />
                      ) : (
                        <span
                          className={cn(
                            "size-1.5 rounded-full bg-current",
                            isActive && "animate-pulse",
                          )}
                        />
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-sm transition-colors duration-700 ease-out",
                        isDone
                          ? "text-stone-400"
                          : isActive
                            ? "font-medium text-stone-800"
                            : "text-stone-300",
                      )}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Feature grid */}
        <div className="mt-16 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description, tone }) => (
            <div
              key={title}
              className="rounded-2xl border border-stone-200 bg-white/70 p-6 transition-colors duration-500 ease-out hover:border-stone-300 hover:bg-white"
            >
              <div
                className={cn(
                  "mb-4 grid size-10 place-items-center rounded-xl",
                  tone === "lavender"
                    ? "bg-[#F1EEF9] text-[#6E6390]"
                    : "bg-[#EAF1EA] text-[#5B7B62]",
                )}
              >
                <Icon className="size-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-medium text-stone-800">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-500">
                {description}
              </p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-16 w-full">
          <h2 className="text-center text-sm font-medium uppercase tracking-wide text-stone-400">
            How it works
          </h2>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            {STEPS.map((step, i) => (
              <div key={step} className="contents">
                <div className="flex flex-col items-center text-center sm:w-40">
                  <div className="grid size-9 shrink-0 place-items-center rounded-full border border-stone-200 bg-white text-sm font-medium text-stone-500">
                    {i + 1}
                  </div>
                  <p className="mt-3 text-sm text-stone-500">{step}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <>
                    <ChevronDown className="size-4 shrink-0 text-stone-300 sm:hidden" />
                    <ArrowRight className="mt-2.5 hidden size-4 shrink-0 text-stone-300 sm:block" />
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
