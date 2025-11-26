'use client';

import { useEffect, useMemo, useState } from "react";

type Player = "X" | "O";
type Winner = Player | "tie" | null;
type Mode = "bot" | "friend";
type Difficulty = "relaxed" | "balanced" | "perfect";

const WINNING_TRIOS: [number, number, number][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const emptyBoard = () => Array<Player | null>(9).fill(null);

const nextPlayer = (player: Player): Player => (player === "X" ? "O" : "X");

function evaluateWinner(board: (Player | null)[]) {
  for (const trio of WINNING_TRIOS) {
    const [a, b, c] = trio;
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return { winner: board[a], line: trio };
    }
  }
  return { winner: null, line: null };
}

function minimax(
  board: (Player | null)[],
  depth: number,
  isMaximising: boolean,
  ai: Player,
  human: Player,
) {
  const { winner } = evaluateWinner(board);
  if (winner === ai) return 10 - depth;
  if (winner === human) return depth - 10;
  if (board.every(Boolean)) return 0;

  const current = isMaximising ? ai : human;
  const scores: number[] = [];

  for (let i = 0; i < board.length; i += 1) {
    if (board[i] !== null) continue;
    board[i] = current;
    scores.push(
      minimax(board, depth + 1, !isMaximising, ai, human),
    );
    board[i] = null;
  }

  return isMaximising ? Math.max(...scores) : Math.min(...scores);
}

function pickBestMove(
  board: (Player | null)[],
  ai: Player,
  human: Player,
  difficulty: Difficulty,
) {
  const available = board
    .map((cell, index) => (cell === null ? index : null))
    .filter((cell) => cell !== null) as number[];

  if (!available.length) return null;

  // Quick tactical check for immediate wins or blocks
  for (const move of available) {
    board[move] = ai;
    if (evaluateWinner(board).winner === ai) {
      board[move] = null;
      return move;
    }
    board[move] = null;
  }

  for (const move of available) {
    board[move] = human;
    if (evaluateWinner(board).winner === human) {
      board[move] = null;
      return move;
    }
    board[move] = null;
  }

  const mistakes: Record<Difficulty, number> = {
    relaxed: 0.55,
    balanced: 0.3,
    perfect: 0,
  };

  if (Math.random() < mistakes[difficulty]) {
    return available[Math.floor(Math.random() * available.length)];
  }

  let bestScore = Number.NEGATIVE_INFINITY;
  let chosenMove = available[0]!;

  for (const move of available) {
    board[move] = ai;
    const score = minimax(board, 0, false, ai, human);
    board[move] = null;
    if (score > bestScore) {
      bestScore = score;
      chosenMove = move;
    }
  }

  return chosenMove;
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("bot");
  const [difficulty, setDifficulty] = useState<Difficulty>("balanced");
  const [humanSymbol, setHumanSymbol] = useState<Player>("X");
  const [startingPlayer, setStartingPlayer] = useState<Player>("X");
  const [board, setBoard] = useState<(Player | null)[]>(() => emptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
  const [winner, setWinner] = useState<Winner>(null);
  const [highlightLine, setHighlightLine] = useState<number[] | null>(null);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [scores, setScores] = useState<Record<Player | "tie", number>>({
    X: 0,
    O: 0,
    tie: 0,
  });

  const botSymbol = useMemo(
    () => (humanSymbol === "X" ? "O" : "X"),
    [humanSymbol],
  );

  const statusLabel = useMemo(() => {
    if (winner === "tie") return "เสมอ! ลองอีกครั้งสิ ✨";
    if (winner) return `ผู้ชนะคือ ${winner} 🎉`;
    if (mode === "bot" && currentPlayer === botSymbol) {
      return isBotThinking ? "บอทกำลังคิด..." : "ถึงตาบอทแล้ว 🤖";
    }
    if (mode === "friend") {
      return currentPlayer === "X"
        ? "ถึงตาผู้เล่น 1 (X)"
        : "ถึงตาผู้เล่น 2 (O)";
    }
    return `ถึงตา ${currentPlayer}`;
  }, [winner, mode, currentPlayer, botSymbol, isBotThinking]);

  const startFreshBoard = (starter: Player) => {
    setBoard(emptyBoard());
    setWinner(null);
    setHighlightLine(null);
    setCurrentPlayer(starter);
    setIsBotThinking(false);
  };

  const applyWin = (result: Winner, line: number[] | null) => {
    setWinner(result);
    setHighlightLine(line);
    if (result === "tie") {
      setScores((prev) => ({ ...prev, tie: prev.tie + 1 }));
      return;
    }
    if (!result) return;
    setScores((prev) => ({ ...prev, [result]: prev[result] + 1 }));
  };

  const makeMove = (index: number, player: Player) => {
    if (winner || board[index]) return;
    const next = board.slice();
    next[index] = player;
    const { winner: outcome, line } = evaluateWinner(next);
    const boardFilled = next.every(Boolean);

    setBoard(next);

    if (outcome || boardFilled) {
      applyWin(outcome ?? "tie", outcome ? line : null);
      return;
    }

    setCurrentPlayer(nextPlayer(player));
  };

  const handleSquareClick = (index: number) => {
    if (winner) return;
    if (board[index]) return;
    if (mode === "bot" && currentPlayer !== humanSymbol) return;
    makeMove(index, currentPlayer);
  };

  const handleModeChange = (nextMode: Mode) => {
    setMode(nextMode);
    const nextStarter = "X";
    setStartingPlayer(nextStarter);
    startFreshBoard(nextStarter);
  };

  const handleHumanSymbolChange = (symbol: Player) => {
    setHumanSymbol(symbol);
    setStartingPlayer("X");
    startFreshBoard("X");
  };

  const handleNewRound = () => {
    const nextStarter = nextPlayer(startingPlayer);
    setStartingPlayer(nextStarter);
    startFreshBoard(nextStarter);
  };

  const handleStarterSelection = (symbol: Player) => {
    setStartingPlayer(symbol);
    startFreshBoard(symbol);
  };

  const handleResetScores = () => {
    setScores({ X: 0, O: 0, tie: 0 });
    setStartingPlayer("X");
    startFreshBoard("X");
  };

  useEffect(() => {
    if (mode !== "bot") return;
    if (winner) return;
    if (currentPlayer !== botSymbol) return;

    setIsBotThinking(true);
    const timeout = setTimeout(() => {
      const move = pickBestMove(
        board.slice(),
        botSymbol,
        humanSymbol,
        difficulty,
      );
      if (move !== null) {
        makeMove(move, botSymbol);
      }
      setIsBotThinking(false);
    }, 450 + Math.random() * 450);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, board, currentPlayer, botSymbol, humanSymbol, winner, difficulty]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-slate-900 py-16 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6">
        <header className="flex flex-col items-center gap-4 text-center">
          <p className="rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm uppercase tracking-[0.4em] text-white/80">
            XO ARENA
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            สร้างตำนานเกม XO
            <span className="block text-white/80">
              เล่นกับเพื่อนหรือท้าดวลบอทสุดฉลาด
            </span>
          </h1>
          <p className="max-w-2xl text-lg text-white/80">
            เปลี่ยนกระดาษธรรมดาให้กลายเป็นบอร์ดเกมสวยหรู พร้อมเอฟเฟกต์
            คะแนนสะสม และโหมดให้เลือกตามสไตล์ของคุณ
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section className="rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    mode === "friend"
                      ? "bg-white text-indigo-600 shadow-lg shadow-indigo-500/40"
                      : "bg-white/10"
                  }`}
                  onClick={() => handleModeChange("friend")}
                >
                  เล่นกับเพื่อน
                </button>
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    mode === "bot"
                      ? "bg-white text-indigo-600 shadow-lg shadow-indigo-500/40"
                      : "bg-white/10"
                  }`}
                  onClick={() => handleModeChange("bot")}
                >
                  ท้าดวลบอท
                </button>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/80">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/20 font-semibold">
                  {currentPlayer}
                </span>
                <span className="hidden sm:inline">ถึงตาเดิน</span>
              </div>
            </div>

            {mode === "bot" ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-white/70">
                    ฉันจะเล่นเป็น
                  </h3>
                  <div className="flex gap-2">
                    {(["X", "O"] as Player[]).map((symbol) => (
                      <button
                        key={symbol}
                        type="button"
                        className={`flex-1 rounded-xl px-4 py-3 font-semibold transition ${
                          humanSymbol === symbol
                            ? "bg-white text-indigo-600 shadow-lg shadow-indigo-500/40"
                            : "bg-white/10"
                        }`}
                        onClick={() => handleHumanSymbolChange(symbol)}
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-white/70">
                    ระดับความฉลาด
                  </h3>
                  <div className="flex gap-2">
                    {(["relaxed", "balanced", "perfect"] as Difficulty[]).map(
                      (level) => {
                        const labels: Record<Difficulty, string> = {
                          relaxed: "ชิลล์",
                          balanced: "เนียน",
                          perfect: "โหดสุด",
                        };
                        return (
                          <button
                            key={level}
                            type="button"
                            className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                              difficulty === level
                                ? "bg-white text-indigo-600 shadow-lg shadow-indigo-500/40"
                                : "bg-white/10"
                            }`}
                            onClick={() => setDifficulty(level)}
                          >
                            {labels[level]}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-white/70">
                    ใครเริ่มก่อน
                  </h3>
                  <div className="flex gap-2">
                    {(["X", "O"] as Player[]).map((symbol) => (
                      <button
                        key={symbol}
                        type="button"
                        className={`flex-1 rounded-xl px-4 py-3 font-semibold transition ${
                          startingPlayer === symbol
                            ? "bg-white text-indigo-600 shadow-lg shadow-indigo-500/40"
                            : "bg-white/10"
                        }`}
                        onClick={() => handleStarterSelection(symbol)}
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white/70">
                  <p>
                    ผลัดกันเล่นที่คีย์บอร์ดหรือแท็บเล็ต
                    สนุกได้ง่ายๆแบบเรียบหรูบนหน้าจอเดียว!
                  </p>
                </div>
              </div>
            )}

            <div className="mt-10 flex flex-col items-center gap-8">
              <div className="grid w-full max-w-md grid-cols-3 gap-3">
                {board.map((cell, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSquareClick(index)}
                    className={`aspect-square rounded-3xl border border-white/20 bg-white/10 text-5xl font-black transition duration-200 hover:border-white/50 hover:bg-white/20 sm:text-6xl ${
                      highlightLine?.includes(index)
                        ? "border-2 border-emerald-300 bg-emerald-400/10 text-emerald-200"
                        : ""
                    } ${isBotThinking && mode === "bot" ? "cursor-wait" : ""}`}
                  >
                    <span
                      className={`drop-shadow-md ${
                        cell === "X" ? "text-white" : "text-amber-200"
                      }`}
                    >
                      {cell ?? ""}
                    </span>
                  </button>
                ))}
              </div>
              <p className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm tracking-wide text-white/80">
                {statusLabel}
              </p>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-3 text-sm font-medium">
              <button
                type="button"
                className="rounded-full bg-white px-5 py-2 text-indigo-600 transition hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/40"
                onClick={handleNewRound}
              >
                เกมถัดไป
              </button>
              <button
                type="button"
                className="rounded-full border border-white/30 px-5 py-2 transition hover:border-white/80"
                onClick={() => startFreshBoard(startingPlayer)}
              >
                เล่นซ้ำรอบนี้
              </button>
              <button
                type="button"
                className="rounded-full border border-rose-200/40 px-5 py-2 text-rose-100 transition hover:border-rose-200 hover:text-white"
                onClick={handleResetScores}
              >
                รีเซ็ตคะแนน
              </button>
            </div>
          </section>

          <aside className="flex flex-col gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
              <h2 className="mb-4 text-xl font-semibold">สถิติการแข่งขัน</h2>
              <div className="grid gap-4">
                {(["X", "O"] as Player[]).map((player) => (
                  <div
                    key={player}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 p-4"
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl text-2xl font-black ${
                          player === "X"
                            ? "bg-white text-indigo-600"
                            : "bg-amber-200 text-amber-800"
                        }`}
                      >
                        {player}
                      </span>
                      <div>
                        <p className="text-sm text-white/70">
                          ชนะทั้งหมด
                        </p>
                        <p className="text-2xl font-semibold">{scores[player]}</p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-white/50">
                      {mode === "bot"
                        ? humanSymbol === player
                          ? "คุณ"
                          : "บอท"
                        : player === "X"
                          ? "ผู้เล่น 1"
                          : "ผู้เล่น 2"}
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 p-4">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl font-black text-white">
                      =
                    </span>
                    <div>
                      <p className="text-sm text-white/70">เสมอ</p>
                      <p className="text-2xl font-semibold">{scores.tie}</p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-white/50">
                    รักษาความสูสีไว้ได้นะ!
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 text-sm text-white/70 backdrop-blur">
              <h3 className="mb-3 text-base font-semibold text-white">
                เคล็ดลับการชนะ
              </h3>
              <ul className="space-y-2 leading-relaxed">
                <li>เริ่มจากมุมหรือกลางเสมอ เพิ่มโอกาสสร้างเส้นสองทาง</li>
                <li>
                  อย่าเผลอปล่อยช่องให้คู่แข่งสร้าง {"'"}fork{"'"}
                  ที่ทำให้มีสองทางชนะ
                </li>
                <li>
                  โหมดบอทโหดสุดใช้กลยุทธ์สมบูรณ์แบบ ลองสลับเล่น O เพื่อตอบโต้มัน
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
