'use client';

import dynamic from 'next/dynamic';

const Scoreboard = dynamic(
  () => import('../../components/scoreboard/Scoreboard'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading scoreboard...</p>
        </div>
      </div>
    ),
  }
);

export default function ScoreboardPage() {
  return <Scoreboard />;
}

