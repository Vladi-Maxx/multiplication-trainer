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
      <div className="stats-row grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6 max-w-3xl w-full mx-auto">
        <div className="stat-item bg-purple-50 p-3 rounded-md shadow-sm flex flex-col items-center min-w-0">
          <div className="text-sm text-purple-700">Общо задачи</div>
          <div className="text-2xl font-bold text-purple-900">{facts.length}</div>
        </div>
        <div className="stat-item bg-green-50 p-3 rounded-md shadow-sm flex flex-col items-center min-w-0">
          <div className="text-sm text-green-700">Правилни</div>
          <div className="text-2xl font-bold text-green-900">{facts.filter(f => f.isCorrect).length}</div>
        </div>
        <div className="stat-item bg-blue-50 p-3 rounded-md shadow-sm flex flex-col items-center min-w-0">
          <div className="text-sm text-blue-700">Точност</div>
          <div className="text-2xl font-bold text-blue-900">
            {facts.length > 0 ? Math.round(facts.filter(f => f.isCorrect).length / facts.length * 100) : 0}%
          </div>
        </div>
        <div className="stat-item bg-yellow-50 p-3 rounded-md shadow-sm flex flex-col items-center min-w-0">
          <div className="text-sm text-yellow-700">Общо време</div>
          <div className="text-2xl font-bold text-yellow-900">{lastTraining ? lastTraining.totalResponseTime.toFixed(1) : '0.0'} сек</div>
        </div>
        <div className="stat-item bg-orange-50 p-3 rounded-md shadow-sm flex flex-col items-center min-w-0">
          <div className="text-sm text-orange-700">Средно време</div>
          <div className="text-2xl font-bold text-orange-900">{lastTraining && facts.length > 0 ? (lastTraining.totalResponseTime / facts.length).toFixed(1) : '0.0'} сек</div>
        </div>
      </div>
      <div className="mt-6">
        <HeatMap facts={facts} />
      </div>
    </div>
  )
}
