import React from 'react';

interface FactsStatsProps {
  masteredFacts: number;
  inProgressFacts: number;
  challengingFacts: number;
}

const FactsStats: React.FC<FactsStatsProps> = ({
  masteredFacts,
  inProgressFacts,
  challengingFacts
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4 text-gray-700">Научени факти</h2>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Прогрес</span>
          <span className="font-medium">{masteredFacts}/100</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-green-500 h-2.5 rounded-full" 
            style={{ width: `${masteredFacts}%` }}
          ></div>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span className="text-gray-600">Научени</span>
          </div>
          <span className="font-medium">{masteredFacts}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
            <span className="text-gray-600">В процес на учене</span>
          </div>
          <span className="font-medium">{inProgressFacts}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
            <span className="text-gray-600">Трудни</span>
          </div>
          <span className="font-medium">{challengingFacts}</span>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            <p>Факт се счита за научен при трудност под 3.</p>
            <p className="mt-1">Трудността намалява с 0.2 при верен отговор и се увеличава с 0.5 при грешен.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FactsStats;
