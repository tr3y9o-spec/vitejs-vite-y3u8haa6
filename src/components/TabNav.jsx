import React from 'react';
import { Wine, GlassWater, Map, Database, Calculator } from 'lucide-react';

const TabNav = ({ activeTab, setActiveTab, isSommelierMode }) => (
  <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm overflow-x-auto no-scrollbar">
    <button onClick={() => setActiveTab('sake')} className={`flex-1 min-w-[70px] py-3 flex flex-col md:flex-row justify-center items-center gap-1 text-xs font-medium transition-colors ${activeTab === 'sake' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}><Wine size={18} /> 日本酒</button>
    <button onClick={() => setActiveTab('shochu')} className={`flex-1 min-w-[70px] py-3 flex flex-col md:flex-row justify-center items-center gap-1 text-xs font-medium transition-colors ${activeTab === 'shochu' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-500 hover:bg-gray-50'}`}><GlassWater size={18} /> 焼酎、他</button>
    <button onClick={() => setActiveTab('map')} className={`flex-1 min-w-[70px] py-3 flex flex-col md:flex-row justify-center items-center gap-1 text-xs font-medium transition-colors ${activeTab === 'map' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:bg-gray-50'}`}><Map size={18} /> マップ</button>
    {!isSommelierMode && (<>
      <button onClick={() => setActiveTab('stock')} className={`flex-1 min-w-[70px] py-3 flex flex-col md:flex-row justify-center items-center gap-1 text-xs font-medium transition-colors ${activeTab === 'stock' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:bg-gray-50'}`}><Database size={18} /> 資産</button>
      <button onClick={() => setActiveTab('calc')} className={`flex-1 min-w-[70px] py-3 flex flex-col md:flex-row justify-center items-center gap-1 text-xs font-medium transition-colors ${activeTab === 'calc' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:bg-gray-50'}`}><Calculator size={18} /> 計算</button>
    </>)}
  </div>
);

export default TabNav;