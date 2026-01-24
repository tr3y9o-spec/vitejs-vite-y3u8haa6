import React, { useState, useMemo } from 'react';
import { Search, AlertCircle, Camera, Plus } from 'lucide-react';
// ★ AIロジックをインポート
import { determineSakeType } from '../utils/sakeLogic';

const MenuView = ({
  data,
  onSelect,
  cloudImages,
  placeholder,
  onAdd,
  isSommelierMode,
  activeTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    const searched = data.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kana?.includes(searchTerm) ||
        item.tags?.some((tag) => tag.includes(searchTerm))
    );
    if (activeTab === 'shochu') {
      return searched.sort((a, b) => {
        const isAShochu = a.type === 'Shochu';
        const isBShochu = b.type === 'Shochu';
        if (isAShochu && !isBShochu) return -1;
        if (!isAShochu && isBShochu) return 1;
        return 0;
      });
    }
    return searched;
  }, [data, searchTerm, activeTab]);

  // ★ タイプごとの色定義ヘルパー
  const getTypeColor = (typeId) => {
    switch (typeId) {
      case 'SOSHU':
        return 'bg-blue-100 text-blue-800 border-blue-200'; // 爽酒
      case 'JUNSHU':
        return 'bg-orange-100 text-orange-800 border-orange-200'; // 醇酒
      case 'KUNSHU':
        return 'bg-pink-100 text-pink-800 border-pink-200'; // 薫酒
      case 'JUKUSHU':
        return 'bg-amber-100 text-amber-800 border-amber-200'; // 熟酒
      case 'SHOCHU':
        return 'bg-purple-100 text-purple-800 border-purple-200'; // 焼酎
      case 'LIQUEUR':
        return 'bg-green-100 text-green-800 border-green-200'; // リキュール
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen pb-24 relative animate-in fade-in duration-500">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <AlertCircle size={48} className="mb-2 opacity-20" />
          <p>該当する商品がありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredData.map((item) => {
            const displayImage = cloudImages[item.id] || item.image;
            const bottles = item.stock_bottles || 0;
            const level = item.stock_level ?? 100;
            const isSoldOut = bottles === 0 && level === 0;

            // ★ AI判定を実行
            const sakeType = determineSakeType(item);
            // ラベルの整形（例: "爽酒 (Soshu)" -> "爽酒"）
            const typeLabel = sakeType.label.split(' ')[0];

            return (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                className={`bg-white p-3 rounded-xl shadow-sm border border-gray-100 active:scale-[0.99] transition-transform cursor-pointer flex gap-4 ${
                  isSoldOut && isSommelierMode ? 'opacity-60 grayscale' : ''
                }`}
              >
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden border border-gray-200 relative">
                  {displayImage ? (
                    <img
                      src={displayImage}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Camera size={24} />
                    </div>
                  )}
                  {!isSommelierMode ? (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                      残: {bottles > 0 ? `${bottles}本+${level}%` : `${level}%`}
                    </div>
                  ) : (
                    isSoldOut && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white font-bold text-xs">
                        SOLD OUT
                      </div>
                    )
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center mb-1">
                    {/* ★ ここを変更：松竹梅 -> AIタイプ判定バッジ */}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getTypeColor(
                        sakeType.id
                      )} mr-2`}
                    >
                      {typeLabel}
                    </span>
                    <h3 className="text-base font-bold text-gray-800 truncate flex-grow">
                      {item.name}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.tags?.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="text-xs text-blue-900 bg-blue-50 p-2 rounded border-l-2 border-blue-400">
                    <p className="leading-relaxed line-clamp-2">
                      {item.sales_talk || '特徴未入力'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!isSommelierMode && (
        <button
          onClick={onAdd}
          className="fixed bottom-24 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 active:scale-90 transition-transform z-30"
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  );
};

export default MenuView;
