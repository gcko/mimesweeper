import { useCallback, useState } from "react";
import type { DifficultyKey, ScoreboardData, ScoreEntry } from "types.d";

const STORAGE_KEY = "mimesweeper-scoreboard";
const MAX_ENTRIES = 10;

const DEFAULT_ENTRY: ScoreEntry = { name: "JMS", score: 100 };

function createDefaultScoreboard(): ScoreboardData {
  const entries = Array.from({ length: MAX_ENTRIES }, () => ({
    ...DEFAULT_ENTRY,
  }));
  return {
    S: entries.map((e) => ({ ...e })),
    M: entries.map((e) => ({ ...e })),
    L: entries.map((e) => ({ ...e })),
    XL: entries.map((e) => ({ ...e })),
  };
}

function loadScoreboard(): ScoreboardData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as ScoreboardData;
    }
  } catch {
    // Corrupted data — fall back to defaults
  }
  const defaults = createDefaultScoreboard();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  return defaults;
}

function saveScoreboard(data: ScoreboardData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function useScoreboard() {
  const [scores, setScores] = useState<ScoreboardData>(loadScoreboard);

  const getScores = useCallback(
    (difficulty: DifficultyKey): ScoreEntry[] => {
      return scores[difficulty];
    },
    [scores],
  );

  const isHighScore = useCallback(
    (difficulty: DifficultyKey, score: number): boolean => {
      const entries = scores[difficulty];
      if (entries.length < MAX_ENTRIES) return true;
      return score > entries[entries.length - 1].score;
    },
    [scores],
  );

  const addScore = useCallback(
    (difficulty: DifficultyKey, name: string, score: number): void => {
      setScores((prev) => {
        const entries = [...prev[difficulty], { name, score }];
        entries.sort((a, b) => b.score - a.score);
        const trimmed = entries.slice(0, MAX_ENTRIES);
        const next = { ...prev, [difficulty]: trimmed };
        saveScoreboard(next);
        return next;
      });
    },
    [],
  );

  return { scores, getScores, isHighScore, addScore };
}
