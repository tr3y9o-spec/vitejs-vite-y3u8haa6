import React, { useState, useEffect } from 'react';
import { Lightbulb, Info } from 'lucide-react';
import {
  PROPOSAL_THEMES_SAKE,
  PROPOSAL_THEMES_SHOCHU,
} from '../data/knowledgeBase';
import { determineSakeType } from '../utils/sakeLogic';

const MapView = ({ data, cloudImages, onSelect }) => {
  const [mapType, setMapType] = useState('Sake');
  const [activeThemeId, setActiveThemeId] = useState(null);

  const currentThemes =
    mapType === 'Sake' ? PROPOSAL_THEMES_SAKE : PROPOSAL_THEMES_SHOCHU;
  
  const activeTheme = currentThemes.find((t) => t.id === activeThemeId);

  useEffect(() => {
    setActiveThemeId(null);
  }, [mapType]);

  const displayData = data.filter(d => {
    if (mapType === 'Sake') return d.type === 'Sake';
    return d.type === 'Shochu'; 
  });

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col pb-32 animate-in fade-in duration-500">
      
      {/* タブ切り替え */}
      <div className="flex justify-center py-4 bg-white shadow-sm sticky top-0 z-30">
        <div className="bg-gray-100 p-1 rounded-lg flex">
          <button
            onClick={() => setMapType('Sake')}
            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
              mapType === 'Sake'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            日本酒
          </button>
          <button
            onClick={() => setMapType('Shochu')}
            className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${
              mapType === 'Shochu'
                ? 'bg-white text-amber-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            焼酎
          </button>
        </div>
      </div>

      {/* マップエリア (フルワイド & 9分割) */}
      <div className="relative w-full aspect-square bg-white overflow-hidden border-b border-gray-200">
        
        {/* --- 9分割グリッド背景 --- */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
          {/* 左上 */} <div className="border-r border-b border-gray-100 bg-gray-50/30"></div>
          {/* 中上 */} <div className="border-r border-b border-gray-100"></div>
          {/* 右上 */} <div className="border-b border-gray-100 bg-gray-50/30"></div>
          {/* 左中 */} <div className="border-r border-b border-gray-100"></div>
          {/* 中心 */} <div className="border-r border-b border-gray-100 bg-blue-50/10"></div>
          {/* 右中 */} <div className="border-b border-gray-100"></div>
          {/* 左下 */} <div className="border-r border-gray-100 bg-gray-50/30"></div>
          {/* 中下 */} <div className="border-r border-gray-100"></div>
          {/* 右下 */} <div className="bg-gray-50/30"></div>
        </div>

        {/* --- 軸ラベル (端に配置) --- */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-400 bg-white/80 px-2 py-0.5 rounded-full z-10">華やか (Aroma)</div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-gray-400 bg-white/80 px-2 py-0.5 rounded-full z-10">穏やか (Quiet)</div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-bold text-gray-400 bg-white/80 px-2 py-0.5 rounded-full z-10">甘・旨</div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 rotate-90 text-xs font-bold text-gray-400 bg-white/80 px-2 py-0.5 rounded-full z-10">辛・キレ</div>

        {/* --- プロット --- */}
        {displayData.map((item) => {
            const displayImage = cloudImages[item.id] || item.image;
            const isDimmed = activeTheme && !activeTheme.filter(item);
            const aiType = determineSakeType(item);
            
            // 色分け
            let borderColor = 'border-gray-400';
            let labelBg = 'bg-gray-100 text-gray-600';
            if (aiType.id === 'SOSHU') { borderColor = 'border-blue-500'; labelBg = 'bg-blue-50 text-blue-800 border-blue-100'; }
            if (aiType.id === 'JUNSHU') { borderColor = 'border-orange-500'; labelBg = 'bg-orange-50 text-orange-800 border-orange-100'; }
            if (aiType.id === 'KUNSHU') { borderColor = 'border-pink-500'; labelBg = 'bg-pink-50 text-pink-800 border-pink-100'; }
            if (aiType.id === 'JUKUSHU') { borderColor = 'border-amber-800'; labelBg = 'bg-amber-50 text-amber-900 border-amber-100'; }
            if (aiType.id === 'SHOCHU') { borderColor = 'border-purple-600'; labelBg = 'bg-purple-50 text-purple-900 border-purple-100'; }

            return (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer transition-all duration-300 ${
                  isDimmed
                    ? 'opacity-20 grayscale scale-75 z-0'
                    : 'hover:z-50 hover:scale-110 z-20'
                }`}
                style={{
                  left: `${item.axisX || 50}%`,
                  top: `${100 - (item.axisY || 50)}%`, 
                }}
              >
                {/* アイコン */}
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-[3px] overflow-hidden shadow-lg bg-white ${borderColor}`}>
                  {displayImage ? (
                    <img src={displayImage} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 font-bold">
                      {item.name.slice(0,1)}
                    </div>
                  )}
                </div>
                
                {/* 名前ラベル */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md border mt-[-6px] relative z-30 whitespace-nowrap max-w-[100px] truncate ${labelBg}`}>
                  {item.name}
                </span>
              </div>
            );
          })}
      </div>

      {/* 色の凡例 & ガイド */}
      <div className="p-4 space-y-4">
        {/* 色の説明 */}
        <div className="flex flex-wrap justify-center gap-3 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
          {mapType === 'Sake' ? (
            <>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div><span className="text-xs font-bold text-gray-600">爽酒</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div><span className="text-xs font-bold text-gray-600">醇酒</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-pink-500"></div><span className="text-xs font-bold text-gray-600">薫酒</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-800"></div><span className="text-xs font-bold text-gray-600">熟酒</span></div>
            </>
          ) : (
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-purple-600"></div><span className="text-xs font-bold text-gray-600">焼酎</span></div>
          )}
        </div>

        {/* 提案テーマ */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 flex items-center gap-2 border-b border-gray-100">
            <Lightbulb className="text-yellow-500" size={18} />
            <span className="text-sm font-bold text-gray-700">
              提案ナビ
            </span>
          </div>
          <div className="p-3 flex gap-2 overflow-x-auto pb-4 no-scrollbar">
            {currentThemes.map((theme) => (
              <button
                key={theme.id}
                onClick={() =>
                  setActiveThemeId(activeThemeId === theme.id ? null : theme.id)
                }
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-lg border text-xs font-bold transition-all shadow-sm ${
                  activeThemeId === theme.id
                    ? theme.color
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {theme.icon}
                {theme.label}
              </button>
            ))}
          </div>
          
          {activeTheme && (
            <div className={`mx-4 mb-4 p-4 rounded-xl text-sm leading-relaxed animate-in slide-in-from-top-2 duration-300 ${activeTheme.color.replace('text-', 'bg-').replace('border-', '').split(' ')[0]} bg-opacity-20`}>
              {activeTheme.guide}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapView;