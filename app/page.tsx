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
  const rollIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rollIntervalRef.current !== null) {
        window.clearInterval(rollIntervalRef.current);
      }
    };
  }, []);

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

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#fdf2f8_38%,_#fffaf3_72%,_#f8fafc_100%)] px-6 py-10 text-slate-900 sm:px-10 lg:px-12">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <section className="grid w-full gap-8 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.12)] backdrop-blur md:grid-cols-[1.15fr_0.85fr] md:p-8">
          <div className="flex flex-col justify-between gap-8">
            <div className="space-y-5">
              <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-amber-800">Generator obrolan</div>
              <div className="space-y-3">
                <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">Satu tombol untuk dapat pertanyaan obrolan.</h1>
                <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                  Cocok untuk teman, pacar, keluarga, atau siapa pun yang ingin mulai obrolan dengan cepat. Klik tombol sekali, lalu dapatkan ide pertanyaan yang sesuai topik pilihanmu.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:max-w-xl">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Pilih kategori topik
                <select
                  value={selectedTopicId}
                  onChange={(event) => handleTopicChange(event.target.value)}
                  disabled={isRolling}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                >
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

          <aside className="flex min-h-[280px] flex-col justify-between rounded-[1.75rem] bg-slate-950 p-6 text-white shadow-inner shadow-slate-950/20 sm:p-7">
            <div className="space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/80">Hasil untuk topik</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{generated.topicLabel}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">{generated.description}</p>
              </div>

              <div className={`question-card rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-lg leading-8 text-slate-50 ${isRolling ? "is-rolling" : ""}`}>{generated.prompt}</div>

              <p className="text-sm text-slate-300">Total pertanyaan tersedia: {generated.total}.</p>
            </div>

            <p className="mt-8 text-sm leading-6 text-slate-300">Semua data topik dan pertanyaan disimpan di file JSON terpisah, jadi daftar bisa diperluas tanpa mengubah alur utama aplikasi.</p>
          </aside>
        </section>
      </div>
    </main>
  );
}
