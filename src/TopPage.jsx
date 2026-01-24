import React from 'react';
import { Wine, Coffee, Info, Book, ChevronRight, ClipboardList } from 'lucide-react';

const TopPage = ({ onNavigate }) => {
  const menuItems = [
    { id: 'sake', title: 'Sake Manager', sub: '日本酒・焼酎・在庫管理', icon: <ClipboardList size={24} />, color: 'bg-blue-600' },
    { id: 'wine', title: 'Wine Manager', sub: 'ワイン・リスト', icon: <Wine size={24} />, color: 'bg-red-700' },
    { id: 'other', title: 'Other Drinks', sub: 'その他ドリンク', icon: <Coffee size={24} />, color: 'bg-amber-600' },
  ];

  const infoItems = [
    { id: 'updates', title: '更新情報', icon: <Info size={20} /> },
    { id: 'howto', title: 'How to Use', icon: <Book size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      {/* Header */}
      <header className="bg-gray-900 text-white p-6 shadow-lg">
        <h1 className="text-2xl font-bold tracking-widest">Setsu-Phone <span className="text-xs font-normal opacity-70">ver 1.0</span></h1>
        <p className="text-xs text-gray-400 mt-1">Restaurant Operation System</p>
      </header>

      <div className="p-6 max-w-md mx-auto space-y-6">
        
        {/* Main Menu */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Applications</h2>
          {menuItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => onNavigate(item.id)}
              className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 hover:bg-gray-50 hover:shadow-md transition-all active:scale-[0.98]"
            >
              <div className={`${item.color} text-white p-3 rounded-full shadow-inner`}>
                {item.icon}
              </div>
              <div className="text-left flex-grow">
                <h3 className="font-bold text-lg leading-tight">{item.title}</h3>
                <p className="text-xs text-gray-500">{item.sub}</p>
              </div>
              <ChevronRight className="text-gray-300" />
            </button>
          ))}
        </section>

        {/* Info Menu */}
        <section className="space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Information</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
            {infoItems.map(item => (
              <button 
                key={item.id} 
                onClick={() => onNavigate(item.id)}
                className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <div className="text-gray-400">{item.icon}</div>
                <span className="font-medium flex-grow text-left">{item.title}</span>
                <ChevronRight size={16} className="text-gray-300" />
              </button>
            ))}
          </div>
        </section>

        <footer className="text-center text-[10px] text-gray-400 pt-8">
          &copy; 2026 Setsu-Phone System
        </footer>
      </div>
    </div>
  );
};

export default TopPage;