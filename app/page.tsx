"use client";

import { useEffect, useRef, useState } from "react";
import topicsDatabase from "@/data/conversation-topics.json";

type Topic = (typeof topicsDatabase.topics)[number];

function pickRandomItem(items: string[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function pickDifferentItem(items: string[], currentItem: string) {
  const differentItems = items.filter((item) => item !== currentItem);

  if (differentItems.length === 0) {
    return currentItem;
  }

  return pickRandomItem(differentItems);
}

function pickTopic(topicId: string) {
  return topicsDatabase.topics.find((topic) => topic.id === topicId) ?? topicsDatabase.topics[0];
}

function buildPrompt(topic: Topic) {
  return {
    topicId: topic.id,
    topicLabel: topic.label,
    description: topic.description,
    prompt: pickRandomItem(topic.questions),
    total: topic.questions.length,
  };
}

export default function Home() {
  const [selectedTopicId, setSelectedTopicId] = useState(topicsDatabase.topics[0]?.id ?? "");
  const [generated, setGenerated] = useState(() => buildPrompt(topicsDatabase.topics[0]));
  const [isRolling, setIsRolling] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const rollIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextThemeIsDark = storedTheme ? storedTheme === "dark" : prefersDark;

    setIsDarkMode(nextThemeIsDark);
    document.documentElement.classList.toggle("dark", nextThemeIsDark);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", isDarkMode);

    return () => {
      if (rollIntervalRef.current !== null) {
        window.clearInterval(rollIntervalRef.current);
      }
    };
  }, [isDarkMode]);

  const handleTopicChange = (topicId: string) => {
    const topic = pickTopic(topicId);

    setSelectedTopicId(topic.id);
    setGenerated(buildPrompt(topic));
  };

  const handleGenerate = () => {
    const topic = pickTopic(selectedTopicId);

    if (isRolling) {
      if (rollIntervalRef.current !== null) {
        window.clearInterval(rollIntervalRef.current);
        rollIntervalRef.current = null;
      }

      setIsRolling(false);
      return;
    }

    setIsRolling(true);

    rollIntervalRef.current = window.setInterval(() => {
      setGenerated((current) => ({
        ...buildPrompt(topic),
        prompt: pickDifferentItem(topic.questions, current.prompt),
      }));
    }, 80);
  };

  const handleThemeToggle = () => {
    setIsDarkMode((current) => !current);
  };

  const shellClasses = isDarkMode
    ? "min-h-screen bg-[radial-gradient(circle_at_top,_#1e293b_0%,_#111827_36%,_#0f172a_70%,_#020617_100%)] px-6 py-10 text-slate-100 sm:px-10 lg:px-12"
    : "min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#fdf2f8_38%,_#fffaf3_72%,_#f8fafc_100%)] px-6 py-10 text-slate-900 sm:px-10 lg:px-12";

  const sectionClasses = isDarkMode
    ? "grid w-full gap-8 rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.45)] backdrop-blur md:grid-cols-[1.15fr_0.85fr] md:p-8"
    : "grid w-full gap-8 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.12)] backdrop-blur md:grid-cols-[1.15fr_0.85fr] md:p-8";

  const titleClasses = isDarkMode ? "max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl" : "max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl";

  const bodyTextClasses = isDarkMode ? "max-w-xl text-base leading-7 text-slate-300 sm:text-lg" : "max-w-xl text-base leading-7 text-slate-600 sm:text-lg";

  const labelClasses = isDarkMode ? "grid gap-2 text-sm font-medium text-slate-200" : "grid gap-2 text-sm font-medium text-slate-700";

  const selectClasses = isDarkMode
    ? "w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-slate-100 shadow-sm outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
    : "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

  const resultCardClasses = isDarkMode
    ? "flex min-h-[280px] flex-col justify-between rounded-[1.75rem] bg-slate-900 p-6 text-white shadow-inner shadow-black/30 sm:p-7"
    : "flex min-h-[280px] flex-col justify-between rounded-[1.75rem] bg-slate-950 p-6 text-white shadow-inner shadow-slate-950/20 sm:p-7";

  const promptCardClasses = isDarkMode
    ? "question-card rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-lg leading-8 text-slate-50"
    : "question-card rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-lg leading-8 text-slate-50";

  const switchTrackClasses = isDarkMode ? "bg-cyan-400/30" : "bg-slate-200";
  const switchThumbClasses = isDarkMode ? "translate-x-6 bg-cyan-100" : "translate-x-1 bg-white";

  return (
    <main className={shellClasses}>
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <section className={sectionClasses}>
          <div className="flex flex-col justify-between gap-8">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className={
                    isDarkMode
                      ? "inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200"
                      : "inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-amber-800"
                  }
                >
                  Generator obrolan
                </div>
                <button
                  type="button"
                  onClick={handleThemeToggle}
                  aria-pressed={isDarkMode}
                  aria-label="Toggle dark mode"
                  className="inline-flex items-center gap-3 rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-950/10"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]">{isDarkMode ? "Dark" : "Light"}</span>
                  <span className={`flex h-7 w-12 items-center rounded-full p-1 transition ${switchTrackClasses}`}>
                    <span className={`h-5 w-5 rounded-full shadow-sm transition-transform duration-300 ${switchThumbClasses}`} />
                  </span>
                </button>
              </div>
              <div className="space-y-3">
                <h1 className={titleClasses}>Satu tombol untuk dapat pertanyaan obrolan.</h1>
                <p className={bodyTextClasses}>Cocok untuk teman, pacar, keluarga, atau siapa pun yang ingin mulai obrolan dengan cepat. Klik tombol sekali, lalu dapatkan ide pertanyaan yang sesuai topik pilihanmu.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:max-w-xl">
              <label className={labelClasses}>
                Pilih kategori topik
                <select value={selectedTopicId} onChange={(event) => handleTopicChange(event.target.value)} disabled={isRolling} className={selectClasses}>
                  {topicsDatabase.topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={handleGenerate}
                className={`inline-flex w-full items-center justify-center rounded-full px-6 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 sm:w-fit ${isRolling ? "bg-rose-600 hover:bg-rose-500" : "bg-slate-950 hover:bg-slate-800"}`}
              >
                {isRolling ? "Stop & pilih yang tampil" : "Generate pertanyaan baru"}
              </button>
            </div>
          </div>

          <aside className={resultCardClasses}>
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/80">Hasil untuk topik</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{generated.topicLabel}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{generated.description}</p>
              </div>

              <div className={`${promptCardClasses} ${isRolling ? "is-rolling" : ""}`}>{generated.prompt}</div>

              <p className="text-sm text-slate-300">Total pertanyaan tersedia: {generated.total}.</p>
            </div>

            <p className="mt-8 text-sm leading-6 text-slate-300">Semua data topik dan pertanyaan disimpan di file JSON terpisah, jadi daftar bisa diperluas tanpa mengubah alur utama aplikasi.</p>
          </aside>
        </section>
      </div>
    </main>
  );
}
