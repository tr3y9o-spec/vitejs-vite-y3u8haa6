import React, { useState } from 'react';
import TopPage from './TopPage';
import SakeManager from './SakeManager';
import WineManager from './WineManager';
import OtherManager from './OtherManager';
import ShelfManager from './components/ShelfManager'; // パスを確認

const PlaceholderPage = ({ title, onBack }) => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
    <h1 className="text-2xl font-bold mb-4">{title}</h1>
    <p className="text-gray-500 mb-8">この機能は現在開発中です。</p>
    <button onClick={onBack} className="bg-gray-900 text-white px-6 py-2 rounded-full text-sm font-bold">TOPへ戻る</button>
  </div>
);

export default function App() {
  const [currentPage, setCurrentPage] = useState('top');
  
  // ★追加: 棚管理のモードを記憶するState (初期値はdrinks)
  const [shelfMode, setShelfMode] = useState('drinks'); 

  // ★修正: ページとモードの両方を受け取る関数を作成
  const handleNavigate = (page, mode = null) => {
    setCurrentPage(page);
    if (mode) {
        setShelfMode(mode); // モード指定があれば記憶する
    }
  };

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

  const renderPage = () => {
    switch (currentPage) {
      case 'top':
        // ★修正: setCurrentPageを直接渡さず、handleNavigateを渡す
        return <TopPage onNavigate={handleNavigate} />;

      case 'sake':
        return <PageContainer><SakeManager /></PageContainer>;

      case 'wine':
        return <PageContainer><WineManager /></PageContainer>;

      case 'other':
        return <PageContainer><OtherManager /></PageContainer>;
      
      case 'shelf':
        // ★修正: 記憶したモード(shelfMode)をShelfManagerに渡す
        return <PageContainer><ShelfManager mode={shelfMode} /></PageContainer>;

      default:
        return <PlaceholderPage title={currentPage} onBack={() => setCurrentPage('top')} />;
    }
  };

  return <>{renderPage()}</>;
}