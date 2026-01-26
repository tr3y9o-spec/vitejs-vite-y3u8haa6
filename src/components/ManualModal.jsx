import React, { useState } from 'react';
import { Book, X, Database, Map as MapIcon, Wine, Settings, Smartphone, FileText, ChevronRight } from 'lucide-react';

const ManualModal = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('basic');

  const tabs = [
    { id: 'basic', label: '基本・設定', icon: <Settings size={18} /> },
    { id: 'sake', label: '日本酒・AIマップ', icon: <MapIcon size={18} /> },
    { id: 'wine', label: 'ワイン管理', icon: <Wine size={18} /> },
    { id: 'report', label: '日報・在庫', icon: <Database size={18} /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
        
        {/* 左側：サイドメニュー */}
        <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 flex-shrink-0 flex flex-col">
          <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-white">
            <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              <Book className="text-blue-600"/> 使い方ガイド
            </h2>
            <button onClick={onClose} className="md:hidden p-1 bg-gray-100 rounded-full"><X size={16}/></button>
          </div>
          <div className="p-3 space-y-1 overflow-y-auto flex-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && <ChevronRight size={16} className="ml-auto opacity-50"/>}
              </button>
            ))}
          </div>
        </div>

        {/* 右側：コンテンツエリア */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 hidden md:block p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-400"/>
          </button>

          {/* === 基本・設定 === */}
          {activeTab === 'basic' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-2xl font-bold text-gray-800 border-b pb-2">📱 アプリの導入と設定</h3>
              
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h4 className="font-bold text-blue-800 flex items-center gap-2 mb-2">
                  <Smartphone size={18}/> ホーム画面への追加
                </h4>
                <p className="text-sm text-blue-900 leading-relaxed">
                  このアプリはインストール不要で使えますが、iPhone/iPadのホーム画面に追加することで、フルスクリーンで快適に動作します。<br/>
                  ブラウザのメニューから<strong>「ホーム画面に追加」</strong>を選択してください。
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-700 mb-3">アイコンの着せ替え</h4>
                <p className="text-sm text-gray-600 mb-4">
                  以下のボタンをタップしてデザインを切り替えた後、「ホーム画面に追加」を行うと、アイコンを変更できます。
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <a href="/" className="flex flex-col items-center justify-center p-4 border rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl mb-2 flex items-center justify-center font-bold text-gray-500 text-xs">基本</div>
                    <span className="text-sm font-bold text-gray-700">「雪月本店」ver</span>
                  </a>
                  <a href="/?icon=2nd" className="flex flex-col items-center justify-center p-4 border border-blue-200 bg-blue-50/50 rounded-xl hover:bg-blue-50 transition-colors relative overflow-hidden">
                    <div className="w-12 h-12 bg-blue-500 rounded-xl mb-2 flex items-center justify-center font-bold text-white text-xs">2nd</div>
                    <span className="text-sm font-bold text-blue-700">シンプルver</span>
                    <span className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-bl">NEW</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* === 日本酒・AIマップ === */}
          {activeTab === 'sake' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-2xl font-bold text-gray-800 border-b pb-2">🍶 Sake Manager & AI Map</h3>
              
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">1</div>
                  <div>
                    <h4 className="font-bold text-gray-800">AIによる4タイプ判定</h4>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      商品を登録すると、AIが自動的に「爽酒・醇酒・薫酒・熟酒」の4タイプに分類します。リスト画面ではバッジで、マップ画面では色で識別できます。
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h5 className="font-bold text-sm text-gray-700 mb-2">マップの色の意味</h5>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> <strong>青 (爽酒):</strong> 脂を切るウォッシュ効果。焼肉や揚げ物に。</li>
                    <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"></span> <strong>橙 (醇酒):</strong> 旨味の同調。煮込みやタレ料理に。</li>
                    <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-pink-500"></span> <strong>桃 (薫酒):</strong> 華やかな香り。乾杯や前菜に。</li>
                    <li className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-600"></span> <strong>紫 (焼酎):</strong> 原料や飲み方の提案を表示。</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* === ワイン管理 === */}
          {activeTab === 'wine' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-2xl font-bold text-gray-800 border-b pb-2">🍷 Wine Manager</h3>
              <p className="text-sm text-gray-600">
                ワインリストの管理に加え、原価率からの売価シミュレーションが可能です。
              </p>
              
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <h4 className="font-bold text-red-800 mb-2">詳細データの活用</h4>
                <p className="text-sm text-red-900 leading-relaxed">
                  各ワインには「Sales Talk（接客トーク）」や「Pairing Hint（合う料理）」を登録できます。<br/>
                  AI一括登録機能を使えば、産地や品種の特徴も含めたリッチなデータを瞬時に作成可能です。
                </p>
              </div>
            </div>
          )}

          {/* === 日報・在庫 === */}
          {activeTab === 'report' && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-2xl font-bold text-gray-800 border-b pb-2">📉 日報と在庫管理</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-xl">
                  <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2"><FileText size={18}/> 日報の保存</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    業務終了時に「日報を記録保存」ボタンを押してください。その時点の在庫数と、当日の納品数がクラウドに永久保存されます。
                  </p>
                </div>
                <div className="p-4 border rounded-xl">
                  <h4 className="font-bold text-gray-700 mb-2 flex items-center gap-2"><Database size={18}/> 履歴の確認</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    「過去の履歴を見る」ボタンから、過去の日報をいつでも閲覧できます。納品日のチェック等に活用してください。
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ManualModal;