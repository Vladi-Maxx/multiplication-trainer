import { useState } from "react";
import FlashCard from "./components/FlashCard.jsx";
import { randomFact } from "./utils/facts.js";

export default function App() {
  const [fact, setFact] = useState(randomFact());
  const [score, setScore] = useState(0);

  const handleAnswer = value => {
    const correct = value === fact.answer;
    setScore(prev => prev + (correct ? 10 : -5));
    setFact(randomFact());
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8">
      <h1 className="text-2xl font-bold">Точки: {score}</h1>
      <FlashCard fact={fact} onAnswer={handleAnswer} />
    </main>
  );
}
