import React, { useState, useMemo } from 'react';
import { Search, AlertCircle, Camera, Plus, EyeOff, Eye } from 'lucide-react';
import { determineSakeType } from '../utils/sakeLogic';

const MenuView = ({
  data,
  onSelect,
  cloudImages = {}, 
  placeholder,
  onAdd,
  isSommelierMode,
  activeTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [hideSoldOut, setHideSoldOut] = useState(false);
  const [sortOrder, setSortOrder] = useState('default');

  const filteredData = useMemo(() => {
    let result = data.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kana?.includes(searchTerm) ||
        item.tags?.some((tag) => tag.includes(searchTerm))
    );

    // 売り切れ非表示フィルタ
    if (hideSoldOut) {
      result = result.filter(item => {
        const bottles = item.stock_bottles || 0;
        const level = item.stock_level ?? 100;
        return bottles > 0 || level < 100;
      });
    }

    // 並び替えロジック
    switch (sortOrder) {
      case 'stock_asc':
        // 在庫が少ない順
        result.sort((a, b) => (a.stock_bottles || 0) - (b.stock_bottles || 0));
        break;
      case 'price_desc':
        // 価格が高い順
        result.sort((a, b) => (b.price_cost || 0) - (a.price_cost || 0));
        break;
      default:
        // 標準（特に指定なし）
        // ※焼酎タブの時だけ、種類ごとにまとめる（焼酎を先頭に）微調整は残します
        if (activeTab === 'shochu') {
          result.sort((a, b) => {
            const isAShochu = a.type === 'Shochu';
            const isBShochu = b.type === 'Shochu';
            if (isAShochu && !isBShochu) return -1;
            if (!isAShochu && isBShochu) return 1;
            return 0;
          });
        }
        break;
    }
    return result;
  }, [data, searchTerm, activeTab, hideSoldOut, sortOrder]);

  const getTypeColor = (typeId) => {
    switch (typeId) {
      case 'SOSHU': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'JUNSHU': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'KUNSHU': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'JUKUSHU': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'IMOJOCHU': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'MUGIJOCHU': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'KOMEJOCHU': return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'KOKUTO': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'SOBA': return 'bg-stone-100 text-stone-800 border-stone-200';
      case 'AWAMORI': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'LIQUEUR': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (typeId) => {
    switch (typeId) {
      case 'SOSHU': return '🌊';
      case 'JUNSHU': return '🌾';
      case 'KUNSHU': return '💐';
      case 'JUKUSHU': return '🍷';
      case 'IMOJOCHU': return '🍠';
      case 'MUGIJOCHU': return '🍞';
      case 'KOKUTO': return '🍬';
      case 'AWAMORI': return '🦁';
      case 'LIQUEUR': return '🍋';
      default: return '🍶';
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen pb-24 relative animate-in fade-in duration-500">
      
      <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm pb-2 pt-1">
        <div className="relative mb-2">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          <input
            type="text"
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button 
                onClick={() => setHideSoldOut(!hideSoldOut)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors whitespace-nowrap ${
                    hideSoldOut ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200'
                }`}
            >
                {hideSoldOut ? <EyeOff size={14}/> : <Eye size={14}/>}
                {hideSoldOut ? '売り切れを隠す' : '全て表示'}
            </button>

            <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-white border border-gray-200 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-full outline-none focus:border-blue-500"
            >
                {/* ★ 修正: おすすめ順を削除し、標準に変更 */}
                <option value="default">標準</option>
                <option value="stock_asc">在庫が少ない順</option>
                <option value="price_desc">価格が高い順</option>
            </select>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <AlertCircle size={48} className="mb-2 opacity-20" />
          <p>該当する商品がありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredData.map((item) => {
            // 画像決定ロジック (安全策付き)
            const displayImage = (cloudImages && cloudImages[item.id]) ? cloudImages[item.id] : item.image;
            
            const bottles = item.stock_bottles || 0;
            const level = item.stock_level ?? 100;
            const isSoldOut = bottles === 0 && level === 0;
            const sakeType = determineSakeType(item);
            const typeLabel = sakeType.label.split(' ')[0];

            return (
              <div
                key={item.id}
                onClick={() => onSelect(item)}
                className={`bg-white p-3 rounded-xl shadow-sm border border-gray-100 active:scale-[0.99] transition-transform cursor-pointer flex gap-4 ${
                  isSoldOut ? 'opacity-70 bg-gray-50' : ''
                }`}
              >
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden border border-gray-200 relative">
                  {/* 画像表示 (エラーハンドリング付き) */}
                  {displayImage ? (
                    <img
                      src={displayImage}
                      alt={item.name}
                      className={`w-full h-full object-cover ${isSoldOut ? 'grayscale' : ''}`}
                      onError={(e) => {
                          e.target.onerror = null; 
                          e.target.style.display = 'none';
                          e.target.parentElement.classList.add('image-error'); 
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Camera size={24} />
                    </div>
                  )}
                  {/* 画像エラー時のバックアップアイコン */}
                  <div className="hidden image-error:flex w-full h-full absolute inset-0 items-center justify-center text-gray-300 bg-gray-100">
                      <Camera size={24}/>
                  </div>
                  
                  {!isSommelierMode ? (
                    <div className={`absolute bottom-0 left-0 right-0 text-[9px] text-center py-0.5 font-bold text-white ${isSoldOut ? 'bg-red-500' : 'bg-black/60'}`}>
                       {isSoldOut ? '在庫なし' : (bottles > 0 ? `${bottles}本+${level}%` : `開:${level}%`)}
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
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getTypeColor(sakeType.id)} mr-2 flex items-center gap-1 whitespace-nowrap`}>
                      <span>{getTypeIcon(sakeType.id)}</span>
                      {typeLabel}
                    </span>
                    <h3 className={`text-base font-bold truncate flex-grow ${isSoldOut ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                      {item.name}
                    </h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.tags?.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">#{tag}</span>
                    ))}
                  </div>
                  
                  <div className="text-xs text-blue-900 bg-blue-50 p-2 rounded border-l-2 border-blue-400">
                    <p className="leading-relaxed line-clamp-2">{item.sales_talk || '特徴未入力'}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {!isSommelierMode && (
        <button onClick={onAdd} className="fixed bottom-24 right-4 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 active:scale-90 transition-transform z-30">
          <Plus size={24} />
        </button>
      )}
    </div>
  );
};

export default MenuView;
