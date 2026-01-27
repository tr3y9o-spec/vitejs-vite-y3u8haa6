import React, { useState } from 'react';
import TopPage from './TopPage';
import SakeManager from './SakeManager';
import WineManager from './WineManager';
import OtherManager from './OtherManager';
// 棚管理コンポーネントの読み込み（まだファイルがない場合はエラーになりますが、後で作ります）
import ShelfManager from './components/ShelfManager'; 

// 開発中ページ用のプレースホルダー
const PlaceholderPage = ({ title, onBack }) => (
  <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
    <h1 className="text-2xl font-bold mb-4">{title}</h1>
    <p className="text-gray-500 mb-8">この機能は現在開発中です。</p>
    <button onClick={onBack} className="bg-gray-900 text-white px-6 py-2 rounded-full text-sm font-bold">TOPへ戻る</button>
  </div>
);

export default function App() {
  const [currentPage, setCurrentPage] = useState('top');
  
  // ★重要: 棚管理の「モード（ドリンク/食品/消耗品）」を記憶する変数
  const [shelfMode, setShelfMode] = useState('drinks');

  // ページ切り替え関数（モード指定対応版）
  const handleNavigate = (page, mode = null) => {
    setCurrentPage(page);
    if (mode) {
      setShelfMode(mode); // 食品などのモード指定があればセット
    }
  };

  // 共通のレイアウト（背景色や戻るボタン）
  const PageContainer = ({ children }) => (
    <div className="relative min-h-screen bg-gray-50 animate-in fade-in duration-300">
      {children}
      <button
        onClick={() => setCurrentPage('top')}
        className="fixed bottom-4 left-4 z-50 bg-black/80 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm hover:bg-black transition-all active:scale-95 flex items-center gap-1"
      >
        ← Home
      </button>
    </div>
  );

  // ページ表示の分岐
  const renderPage = () => {
    switch (currentPage) {
      case 'top':
        return <TopPage onNavigate={handleNavigate} />;

      case 'sake':
        return <PageContainer><SakeManager /></PageContainer>;

      case 'wine':
        return <PageContainer><WineManager /></PageContainer>;

      case 'other':
        return <PageContainer><OtherManager /></PageContainer>;
      
      case 'shelf':
        // ★修正: 記憶したモード(shelfMode)をShelfManagerに渡す
        // ShelfManagerファイルがまだない場合は、一時的にPlaceholderPageを表示してもOK
        return <PageContainer><ShelfManager mode={shelfMode} /></PageContainer>;

      default:
        return <PlaceholderPage title={currentPage} onBack={() => setCurrentPage('top')} />;
    }
  };

  return <>{renderPage()}</>;
}