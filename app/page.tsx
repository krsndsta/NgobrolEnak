"use client";

import { useEffect, useRef, useState } from "react";
import topicsDatabase from "@/data/conversation-topics.json";

type Topic = (typeof topicsDatabase.topics)[number];

const RANDOM_TOPIC_ID = "random";

function pickRandomItem(items: string[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffleItems(items: string[]) {
  const shuffledItems = [...items];

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const temporaryItem = shuffledItems[index];

    shuffledItems[index] = shuffledItems[swapIndex];
    shuffledItems[swapIndex] = temporaryItem;
  }

  return shuffledItems;
}

function pickTopic(topicId: string) {
  return topicsDatabase.topics.find((topic) => topic.id === topicId) ?? topicsDatabase.topics[0];
}

function getAllQuestions() {
  return topicsDatabase.topics.flatMap((topic) => topic.questions);
}

function buildPrompt(selection: { topicId: string; topicLabel: string; description: string; questions: string[] }) {
  return {
    topicId: selection.topicId,
    topicLabel: selection.topicLabel,
    description: selection.description,
    prompt: pickRandomItem(selection.questions),
    total: selection.questions.length,
  };
}

function getSelection(topicId: string) {
  if (topicId === RANDOM_TOPIC_ID) {
    const questions = getAllQuestions();

    return {
      topicId: RANDOM_TOPIC_ID,
      topicLabel: "Random",
      description: "Pertanyaan acak dari semua topik yang tersedia.",
      questions,
    };
  }

  const topic = pickTopic(topicId);

  return {
    topicId: topic.id,
    topicLabel: topic.label,
    description: topic.description,
    questions: topic.questions,
  };
}

export default function Home() {
  const [selectedTopicId, setSelectedTopicId] = useState(topicsDatabase.topics[0]?.id ?? "");
  const [generated, setGenerated] = useState(() => buildPrompt(getSelection(topicsDatabase.topics[0]?.id ?? "")));
  const [rollingPrompt, setRollingPrompt] = useState(generated.prompt);
  const [isRolling, setIsRolling] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    const storedTheme = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    return storedTheme ? storedTheme === "dark" : prefersDark;
  });
  const generateTimeoutRef = useRef<number | null>(null);
  const rollingIntervalRef = useRef<number | null>(null);
  const usedQuestionsRef = useRef<string[]>(generated.prompt ? [generated.prompt] : []);

  useEffect(() => {
    window.localStorage.setItem("theme", isDarkMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    return () => {
      if (generateTimeoutRef.current !== null) {
        window.clearTimeout(generateTimeoutRef.current);
      }

      if (rollingIntervalRef.current !== null) {
        window.clearInterval(rollingIntervalRef.current);
      }
    };
  }, []);

  const generateUniquePrompt = (questions: string[]) => {
    if (usedQuestionsRef.current.length >= questions.length) {
      usedQuestionsRef.current = [];
    }

    const availableQuestions = questions.filter((question) => !usedQuestionsRef.current.includes(question));
    const nextPrompt = pickRandomItem(availableQuestions);

    usedQuestionsRef.current = [...usedQuestionsRef.current, nextPrompt];

    return nextPrompt;
  };

  const handleTopicChange = (topicId: string) => {
    const selection = getSelection(topicId);
    const nextPrompt = buildPrompt(selection);

    setSelectedTopicId(selection.topicId);
    setGenerated(nextPrompt);
    setRollingPrompt(nextPrompt.prompt);
    usedQuestionsRef.current = [nextPrompt.prompt];
  };

  const handleGenerate = () => {
    const selection = getSelection(selectedTopicId);

    if (isRolling) {
      return;
    }

    setIsRolling(true);

    const previewQuestions = shuffleItems(selection.questions);
    let previewIndex = 0;

    setRollingPrompt(previewQuestions[previewIndex] ?? selection.questions[0]);

    if (rollingIntervalRef.current !== null) {
      window.clearInterval(rollingIntervalRef.current);
    }

    rollingIntervalRef.current = window.setInterval(() => {
      previewIndex = (previewIndex + 1) % previewQuestions.length;
      setRollingPrompt(previewQuestions[previewIndex]);
    }, 90);

    if (generateTimeoutRef.current !== null) {
      window.clearTimeout(generateTimeoutRef.current);
    }

    generateTimeoutRef.current = window.setTimeout(() => {
      const nextPrompt = generateUniquePrompt(selection.questions);

      if (rollingIntervalRef.current !== null) {
        window.clearInterval(rollingIntervalRef.current);
        rollingIntervalRef.current = null;
      }

      setGenerated({
        topicId: selection.topicId,
        topicLabel: selection.topicLabel,
        description: selection.description,
        prompt: nextPrompt,
        total: selection.questions.length,
      });
      setRollingPrompt(nextPrompt);
      setIsRolling(false);
      generateTimeoutRef.current = null;
    }, 1000);
  };

  const handleThemeToggle = () => {
    setIsDarkMode((current) => !current);
  };

  const shellClasses = isDarkMode
    ? "min-h-screen bg-[radial-gradient(circle_at_top,_#0f2a4d_0%,_#0a1f39_34%,_#07172d_68%,_#020816_100%)] px-6 py-10 text-slate-100 sm:px-10 lg:px-12"
    : "min-h-screen bg-[radial-gradient(circle_at_top,_#FFFBEC_0%,_#f9dc5c_34%,_#FFFBEC_72%,_#eefbf9_100%)] px-6 py-10 text-[#011936] sm:px-10 lg:px-12";

  const sectionClasses = isDarkMode
    ? "grid w-full gap-8 rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.45)] backdrop-blur md:grid-cols-[1.15fr_0.85fr] md:p-8"
    : "grid w-full gap-8 rounded-[2rem] border border-[#011936]/10 bg-[#FFFBEC]/90 p-6 shadow-[0_20px_80px_rgba(1,25,54,0.08)] backdrop-blur md:grid-cols-[1.15fr_0.85fr] md:p-8";

  const titleClasses = isDarkMode ? "max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl" : "max-w-xl text-4xl font-semibold tracking-tight text-[#011936] sm:text-5xl lg:text-6xl";

  const bodyTextClasses = isDarkMode ? "max-w-xl text-base leading-7 text-slate-300 sm:text-lg" : "max-w-xl text-base leading-7 text-[#011936]/75 sm:text-lg";

  const labelClasses = isDarkMode ? "grid gap-2 text-sm font-medium text-slate-200" : "grid gap-2 text-sm font-medium text-[#011936]";

  const selectClasses = isDarkMode
    ? "w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-base text-slate-100 shadow-sm outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
    : "w-full rounded-2xl border border-[#011936]/15 bg-[#FFFBEC] px-4 py-3 text-base text-[#011936] shadow-sm outline-none transition focus:border-[#011936] focus:ring-2 focus:ring-[#011936]/10 disabled:cursor-not-allowed disabled:bg-[#eefbf9] disabled:text-[#011936]/50";

  const resultCardClasses = isDarkMode
    ? "flex min-h-[280px] flex-col justify-between rounded-[1.75rem] bg-slate-900 p-6 text-white shadow-inner shadow-black/30 sm:p-7"
    : "flex min-h-[280px] flex-col justify-between rounded-[1.75rem] border border-[#011936]/10 bg-[#f9dc5c]/25 p-6 text-[#011936] shadow-[0_16px_40px_rgba(1,25,54,0.08)] sm:p-7";

  const promptCardClasses = isDarkMode
    ? "question-card rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-lg leading-8 text-slate-50"
    : "question-card rounded-[1.5rem] border border-[#011936]/10 bg-[#FFFBEC] p-5 text-lg leading-8 text-[#011936] shadow-inner shadow-white/40";

  const switchTrackClasses = isDarkMode ? "bg-[#070b1d]/90" : "bg-[#011936]/10";
  const switchThumbClasses = isDarkMode ? "translate-x-[15px] bg-[#85c8d3]" : "translate-x-[-3px] bg-[#f9dc5c]";

  return (
    <main className={shellClasses}>
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl flex-col items-center justify-center gap-4">
        <section className={sectionClasses}>
          <div className="flex flex-col justify-between gap-8">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className={
                    isDarkMode
                      ? "inline-flex items-center rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1 text-base font-semibold uppercase tracking-[0.28em] text-cyan-200"
                      : "inline-flex items-center rounded-full border border-[#011936]/10 bg-[#f9dc5c]/30 px-4 py-1 text-base font-semibold uppercase tracking-[0.28em] text-[#011936]"
                  }
                >
                  Ngobrolin Apa Nih?
                </div>
                <button
                  type="button"
                  onClick={handleThemeToggle}
                  aria-pressed={isDarkMode}
                  aria-label="Ubah tema"
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-2 py-1 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-950/10"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">{isDarkMode ? "Gelap" : "Terang"}</span>
                  <span className={`flex h-5 w-9 items-center rounded-full p-1 transition ${switchTrackClasses}`}>
                    <span className={`h-4 w-4 rounded-full shadow-sm transition-transform duration-300 ${switchThumbClasses}`} />
                  </span>
                </button>
              </div>
              <div className="space-y-3">
                <h1 className={titleClasses}>Ngomongin apa kita hari ini?</h1>
                <p className={bodyTextClasses}>Lagi ngumpul tapi malah liatin HP masing-masing. Mendingan ngobrol aja. Web simpel aja sih.. semua bisa bikin pake AI, buat bantu kamu ngobrol biar ga mati topik kayak yang buat</p>
                {/* <p className={bodyTextClasses}>
                  Kalau obrolan lagi seret atau topik mendadak habis, tinggal pilih suasana yang kamu mau lalu klik sekali. Nanti kamu bakal dapat pertanyaan yang lebih enak dipakai buat teman, pasangan, keluarga, atau siapa pun yang lagi
                  pengin ngobrol santai.
                </p> */}
              </div>
            </div>

            <div className="grid gap-4 sm:max-w-xl">
              <label className={labelClasses}>
                Pilih topik obrolan
                <select value={selectedTopicId} onChange={(event) => handleTopicChange(event.target.value)} disabled={isRolling} className={selectClasses}>
                  <option value={RANDOM_TOPIC_ID}>Random</option>
                  {topicsDatabase.topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.label}
                    </option>
                  ))}
                </select>
              </label>

              {/* <button
                type="button"
                onClick={handleGenerate}
                disabled={isRolling}
                className={`inline-flex w-full items-center justify-center rounded-full px-6 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 sm:w-fit ${isRolling ? "cursor-wait bg-rose-500 opacity-90" : "bg-gray-800 hover:bg-gray-700"}`}
              >
                {isRolling ? "Lagi muter cari ide..." : "Kasih aku ide baru"}
              </button> */}
            </div>
          </div>

          <aside className={resultCardClasses}>
            <div className="space-y-6">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${isDarkMode ? "text-cyan-200/80" : "text-[#011936]/70"}`}>Topik yang lagi dipilih</p>
                <h2 className={`mt-2 text-2xl font-semibold ${isDarkMode ? "text-white" : "text-[#011936]"}`}>{generated.topicLabel}</h2>
                <p className={`mt-2 text-sm leading-6 ${isDarkMode ? "text-slate-300" : "text-[#011936]/75"}`}>{generated.description}</p>
              </div>
              <div className={`${promptCardClasses} ${isRolling ? "is-rolling" : ""}`}>{isRolling ? rollingPrompt : generated.prompt}</div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isRolling}
                  className={`inline-flex w-full items-center justify-center rounded-full px-6 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 sm:w-fit ${isRolling ? "cursor-wait bg-rose-500 opacity-90" : "bg-gray-800 hover:bg-gray-700"}`}
                >
                  {isRolling ? "Lagi muter cari ide..." : "Kasih aku ide baru"}
                </button>
              </div>
              <p className={`text-sm ${isDarkMode ? "text-slate-300" : "text-[#011936]/70"}`}>Masih ada banyak pertanyaan yang bisa kamu jelajahi di topik ini.</p>
            </div>
          </aside>
        </section>
        <p className={`text-center text-xs sm:text-sm ${isDarkMode ? "text-slate-400" : "text-[#011936]/60"}`}>© Dibuat oleh pasangan mati topik, supaya yang lain ga ikutan mati topik.</p>
      </div>
    </main>
  );
}
