import React, { useState } from 'react';
import TopPage from './TopPage';
import SakeManager from './SakeManager';
import WineManager from './WineManager';
import OtherManager from './OtherManager'; // Import

// Placeholder for future features
const PlaceholderPage = ({ title, onBack }) => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
    <h1 className="text-2xl font-bold mb-4">{title}</h1>
    <p className="text-gray-500 mb-8">この機能は現在開発中です。</p>
    <button onClick={onBack} className="bg-gray-900 text-white px-6 py-2 rounded-full text-sm font-bold">TOPへ戻る</button>
  </div>
);

export default function App() {
  const [currentPage, setCurrentPage] = useState('top');

  const renderPage = () => {
    switch (currentPage) {
      case 'top':
        return <TopPage onNavigate={setCurrentPage} />;
      
      // === 各マネージャー画面 (共通コンテナでラップ) ===
      case 'sake':
        return <PageContainer><SakeManager /></PageContainer>;
      case 'wine':
        return <PageContainer><WineManager /></PageContainer>;
      case 'other':
        return <PageContainer><OtherManager /></PageContainer>;
        
      default:
        return <PlaceholderPage title={currentPage} onBack={() => setCurrentPage('top')} />;
    }
  };

  // 共通のレイアウトコンテナ（HOME戻るボタン付き）
  const PageContainer = ({ children }) => (
    <div className="relative animate-in fade-in duration-300">
      {children}
      <button 
        onClick={() => setCurrentPage('top')}
        className="fixed bottom-4 left-4 z-50 bg-black/80 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm hover:bg-black transition-all active:scale-95 flex items-center gap-1"
      >
        ← Home
      </button>
    </div>
  );

  return <>{renderPage()}</>;
}
