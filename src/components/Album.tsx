import React from 'react';

const Album: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  // Засега само едно драконче
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-yellow-100 to-pink-100">
      <h2 className="text-2xl font-bold mb-4">Албум с дракончета</h2>
      <img src={require('../../Pics/Dragon 1.png')} alt="Драконче" className="w-48 h-48 mb-4" />
      <div className="mb-8 text-lg">Тук ще виждаш всички спечелени дракончета!</div>
      <button onClick={onClose} className="bg-gray-400 hover:bg-gray-600 text-white px-6 py-2 rounded">Назад</button>
    </div>
  );
};

export default Album;
