import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wine, Beer, Database, ArrowRight, Bell, Book, ChevronRight, RefreshCw, Settings, Image, Info, X, Utensils, Box } from 'lucide-react';

export default function TopPage({ onNavigate }) {
  const [showUpdates, setShowUpdates] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showShelfSelect, setShowShelfSelect] = useState(false);

  // 内部ナビゲーション用ラッパー
  const handleNav = (path, mode = null) => {
    if (onNavigate) {
        onNavigate(path, mode); 
        setShowShelfSelect(false);
    }
  };

  const updates = [
    { date: '2026.02.01', tag: 'Major', title: 'Setsu-Phone 2.0', desc: '全在庫を一元管理する「棚管理システム」を実装しました。' },
    { date: '2026.01.25', tag: 'New', title: 'AIマップ機能', desc: '日本酒・焼酎の4タイプ判定マップを実装しました。' },
  ];

  // 汎用モーダル
  const Modal = ({ title, icon: Icon, children, onClose }) => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><Icon size={20} className="text-gray-500"/> {title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-500"/></button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-10">
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 shadow-lg">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold tracking-wider">Setsu-Phone <span className="text-blue-400 text-sm font-normal">ver 2.0</span></h1>
          <p className="text-gray-400 text-xs mt-1">Restaurant Management System</p>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 -mt-4 relative z-10">
        <div className="grid grid-cols-1 gap-4 mb-8">
           
           {/* 棚管理 */}
           <button onClick={() => setShowShelfSelect(true)} className="bg-white p-5 rounded-2xl shadow-md border-l-4 border-blue-600 flex items-center justify-between group active:scale-[0.98] transition-all hover:shadow-lg">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><RefreshCw size={24}/></div>
               <div className="text-left">
                 <h2 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors">Shelf Manager</h2>
                 <p className="text-xs text-gray-500">全在庫・棚卸・業者管理</p>
               </div>
             </div>
             <ArrowRight className="text-gray-300 group-hover:text-blue-600 transition-colors"/>
           </button>

           {/* Sake Manager */}
           <button onClick={() => handleNav('sake')} className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 flex items-center justify-between group active:scale-[0.98] transition-all hover:shadow-lg">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600"><Database size={24}/></div>
               <div className="text-left"><h2 className="font-bold text-lg text-gray-800 group-hover:text-indigo-600 transition-colors">Sake Manager</h2><p className="text-xs text-gray-500">日本酒・焼酎の詳細管理</p></div>
             </div>
             <ArrowRight className="text-gray-300 group-hover:text-indigo-600 transition-colors"/>
           </button>

           {/* Wine Manager */}
           <button onClick={() => handleNav('wine')} className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 flex items-center justify-between group active:scale-[0.98] transition-all hover:shadow-lg">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600"><Wine size={24}/></div>
               <div className="text-left"><h2 className="font-bold text-lg text-gray-800 group-hover:text-red-600 transition-colors">Wine Manager</h2><p className="text-xs text-gray-500">ワインリスト・ストーリー管理</p></div>
             </div>
             <ArrowRight className="text-gray-300 group-hover:text-red-600 transition-colors"/>
           </button>
           
           {/* Other Drinks */}
           <button onClick={() => handleNav('other')} className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 flex items-center justify-between group active:scale-[0.98] transition-all hover:shadow-lg">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600"><Beer size={24}/></div>
               <div className="text-left"><h2 className="font-bold text-lg text-gray-800 group-hover:text-amber-600 transition-colors">Other Drinks</h2><p className="text-xs text-gray-500">その他ドリンク・発注リスト</p></div>
             </div>
             <ArrowRight className="text-gray-300 group-hover:text-amber-600 transition-colors"/>
           </button>
        </div>

        {/* Sub Menu */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button onClick={() => setShowUpdates(true)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
            <Bell size={20} className="text-gray-600"/>
            <span className="text-xs font-bold text-gray-700">更新情報</span>
            {updates.length > 0 && <span className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
          </button>
          <button onClick={() => setShowManual(true)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
            <Book size={20} className="text-gray-600"/>
            <span className="text-xs font-bold text-gray-700">使い方ガイド</span>
          </button>
        </div>

        {/* Shelf Selection Modal */}
        {showShelfSelect && (
          <Modal title="棚管理：カテゴリ選択" icon={RefreshCw} onClose={() => setShowShelfSelect(false)}>
            <div className="grid grid-cols-1 gap-3">
              <button onClick={() => handleNav('shelf', 'drinks')} className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center gap-4 hover:bg-blue-100 transition-colors group">
                <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center"><Wine size={20}/></div>
                <div className="text-left"><h3 className="font-bold text-blue-900">ドリンク全般</h3><p className="text-xs text-blue-700">日本酒・ワイン・その他飲料の在庫を一括管理</p></div>
                <ChevronRight className="ml-auto text-blue-300 group-hover:text-blue-500"/>
              </button>
              <button onClick={() => handleNav('shelf', 'food')} className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-center gap-4 hover:bg-orange-100 transition-colors group">
                <div className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center"><Utensils size={20}/></div>
                <div className="text-left"><h3 className="font-bold text-orange-900">食品・調味料</h3><p className="text-xs text-orange-700">食材、調味料、乾物などの管理</p></div>
                <ChevronRight className="ml-auto text-orange-300 group-hover:text-orange-500"/>
              </button>
              <button onClick={() => handleNav('shelf', 'supplies')} className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex items-center gap-4 hover:bg-gray-100 transition-colors group">
                <div className="w-10 h-10 bg-gray-500 text-white rounded-full flex items-center justify-center"><Box size={20}/></div>
                <div className="text-left"><h3 className="font-bold text-gray-900">消耗品・その他</h3><p className="text-xs text-gray-600">洗剤、ペーパー類、備品など</p></div>
                <ChevronRight className="ml-auto text-gray-300 group-hover:text-gray-500"/>
              </button>
            </div>
          </Modal>
        )}

        {/* Updates Modal */}
        {showUpdates && <Modal title="Update Log" icon={Bell} onClose={() => setShowUpdates(false)}>
            <div className="space-y-4">
              {updates.map((item, idx) => (
                <div key={idx} className="border-l-2 border-gray-200 pl-3 relative">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold bg-gray-100 px-1.5 rounded text-gray-600">{item.date}</span>
                    <span className={`text-[10px] font-bold px-1.5 rounded text-white ${item.tag === 'Major' ? 'bg-purple-600' : 'bg-blue-500'}`}>{item.tag}</span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-800">{item.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
        </Modal>}
        
        {/* Manual Modal (ここにアイコン設定を復活させました) */}
        {showManual && <Modal title="使い方・設定" icon={Settings} onClose={() => setShowManual(false)}>
            <div className="space-y-6">
                
                {/* ▼▼▼ アイコン設定エリア ▼▼▼ */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2"><Image size={16} /> アイコン設定</p>
                    <p className="text-xs text-gray-500 mb-3">好みのデザインをタップし、ブラウザメニューから「ホーム画面に追加」してください。</p>
                    <div className="grid grid-cols-2 gap-3">
                        <a href="/" className="flex flex-col items-center justify-center bg-white border border-gray-300 p-3 rounded-lg hover:bg-gray-100 text-decoration-none">
                            {/* public/icon-192x192.png がある前提 */}
                            <img src="/icon-192x192.png" className="w-10 h-10 rounded-lg mb-2 shadow-sm object-cover" alt="Standard" />
                            <span className="text-xs font-bold text-gray-700">デザインA</span>
                        </a>
                        <a href="/?icon=2nd" className="flex flex-col items-center justify-center bg-white border border-blue-300 p-3 rounded-lg hover:bg-blue-50 relative text-decoration-none">
                            {/* 2ndアイコンとして同じ画像を薄く表示(仮) */}
                            <img src="/icon-192x192.png" className="w-10 h-10 rounded-lg mb-2 shadow-sm object-cover opacity-70" alt="Design B" />
                            <span className="text-xs font-bold text-blue-700">デザインB</span>
                        </a>
                    </div>
                </div>
                {/* ▲▲▲ ここまで ▲▲▲ */}

                <div className="space-y-3">
                    <details className="group"><summary className="flex justify-between items-center font-bold text-xs cursor-pointer list-none bg-gray-50 p-2 rounded hover:bg-gray-100"><span>📦 棚管理の使い方</span><ChevronRight size={14} className="group-open:rotate-90 transition-transform"/></summary><div className="text-xs text-gray-600 p-2 leading-relaxed">Top画面からカテゴリを選んで棚卸しを開始します。「＋」ボタンでAIデータ取込も可能です。</div></details>
                    <details className="group"><summary className="flex justify-between items-center font-bold text-xs cursor-pointer list-none bg-gray-50 p-2 rounded hover:bg-gray-100"><span>🍷 AIマップの見方</span><ChevronRight size={14} className="group-open:rotate-90 transition-transform"/></summary><div className="text-xs text-gray-600 p-2 leading-relaxed">日本酒マネージャーの「マップ」タブでは、AI判定によりタイプ別（青＝爽酒、橙＝醇酒など）に色分けされています。</div></details>
                </div>
            </div>
        </Modal>}

        <div className="text-center mt-10"><p className="text-[10px] text-gray-300">© 2026 Setsu-Phone System</p></div>
      </div>
    </div>
  );
}