import { useCallback, useState } from "react";
import type { DifficultyKey, ScoreEntry } from "types.d";

const DIFFICULTY_LABELS: Record<DifficultyKey, string> = {
  S: "Small",
  M: "Medium",
  L: "Large",
  XL: "XL",
};

const DIFFICULTY_KEYS: DifficultyKey[] = ["S", "M", "L", "XL"];

interface ScoreboardProps {
  getScores: (difficulty: DifficultyKey) => ScoreEntry[];
  onClose: () => void;
}

function Scoreboard({ getScores, onClose }: ScoreboardProps) {
  const [activeDifficulty, setActiveDifficulty] = useState<DifficultyKey>("S");

  const entries = getScores(activeDifficulty);

  const handleTabClick = useCallback((key: DifficultyKey) => {
    setActiveDifficulty(key);
  }, []);

  return (
    <div className="overlay">
      <div className="content scoreboard">
        <h4>Top 10 Scores</h4>
        <div className="scoreboard-tabs">
          {DIFFICULTY_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className={activeDifficulty === key ? "active" : ""}
              onClick={() => handleTabClick(key)}
            >
              {DIFFICULTY_LABELS[key]}
            </button>
          ))}
        </div>
        <ol className="scoreboard-list">
          {entries.map((entry, index) => (
            <li key={`${String(index)}-${entry.name}`}>
              <span className="scoreboard-name">{entry.name}</span>
              <span className="scoreboard-score">{entry.score}</span>
            </li>
          ))}
        </ol>
        <div className="buttons">
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default Scoreboard;
