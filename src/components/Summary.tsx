import React from 'react';
import HeatMap from './HeatMap';
import { getTrainings } from '../services/storage';

interface Props {
  score: number
  onRestart: () => void
}

export default function Summary({ score, onRestart }: Props) {
  // DEBUG: Печатаме данните, които се подават към HeatMap
  const trainings = getTrainings();
  const lastTraining = trainings.length > 0 ? trainings[trainings.length - 1] : null;
  // Връщаме snapshot-ите от последната тренировка (само задачите, които са се паднали)
  // Подаваме към HeatMap масив от {i, j, isCorrect}, за да може HeatMap да знае кои са верни/грешни
  const facts = lastTraining ? lastTraining.facts.map(fr => ({ i: fr.fact.i, j: fr.fact.j, isCorrect: fr.isCorrect })) : [];
  console.log('[SUMMARY DEBUG] trainings:', trainings);
  console.log('[SUMMARY DEBUG] lastTraining:', lastTraining);
  console.log('[SUMMARY DEBUG] facts for HeatMap:', facts);
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">Браво! 🎉</h1>
      <p className="text-xl">Събра {score} точки</p>
      <button onClick={onRestart} className="bg-purple-600 text-white px-6 py-3 rounded">
        Играй пак
      </button>
      <div className="mt-6">
        <HeatMap facts={facts} />
      </div>
    </div>
  )
}
