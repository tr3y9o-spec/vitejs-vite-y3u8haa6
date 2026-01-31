import React, { useRef, useState } from 'react';
import {
  Camera,
  Loader,
  X,
  Pencil,
  Utensils,
  BookOpen,
  BarChart3,
  Sparkles,
  Upload,
  Trash2,
  Save,
  ChevronDown,
  ChevronRight,
  History,
  Info,
  TrendingUp // ★追加
} from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

import { getRankColor } from '../data/constants';
import { PREFECTURES, TAG_SUGGESTIONS } from '../data/knowledgeBase';
import {
  analyzeHistory,
  getTriviaList,
  getPairingProfile,
} from '../utils/sakeLogic';

const SakeModal = ({
  item,
  onClose,
  isEditMode,
  isSommelierMode,
  isUploading,
  cloudImages,
  onStartEdit,
  onSave,
  onDelete,
  onFileUpload,
  editForm,
  setEditForm,
  showJsonInput,
  setShowJsonInput,
  jsonInput,
  setJsonInput,
}) => {
  const fileInputRef = useRef(null);
  const specInputRef = useRef(null);
  const [showHistoryLog, setShowHistoryLog] = useState(false);
  const [showTypeDetail, setShowTypeDetail] = useState(false);

  // データ準備
  // 旧来の履歴分析（納品サイクルなど）はそのまま活用
  const stats = item ? analyzeHistory(item.order_history) : null;
  const triviaList = item ? getTriviaList(item) : [];
  const pairingProfile = item ? getPairingProfile(item) : null;

  const toggleTag = (tag) => {
    const currentTags = editForm.tags || [];
    if (currentTags.includes(tag))
      setEditForm({ ...editForm, tags: currentTags.filter((t) => t !== tag) });
    else setEditForm({ ...editForm, tags: [...currentTags, tag] });
  };

  const handleJsonImport = async () => {
    try {
      const cleanJson = jsonInput
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      const data = JSON.parse(cleanJson);

      if (Array.isArray(data)) {
        if (
          !confirm(
            `${data.length}件のデータを確認します。\n重複していない商品のみ登録しますか？`
          )
        )
          return;
        const snapshot = await getDocs(collection(db, 'sakeList'));
        const existingNames = new Set(
          snapshot.docs.map((doc) => doc.data().name)
        );
        let count = 0;
        for (const newItem of data) {
          if (existingNames.has(newItem.name)) continue;
          await addDoc(collection(db, 'sakeList'), {
            name: newItem.name || '名称未定',
            kana: newItem.kana || '',
            type: newItem.type || 'Sake',
            category_rank: newItem.category_rank || 'Take',
            price_cost: Number(newItem.price_cost) || 0,
            capacity_ml: Number(newItem.capacity_ml) || 720,
            region: newItem.region || '',
            tags: newItem.tags || [],
            stock_bottles: 0,
            stock_level: 100,
            sales_talk: '',
            pairing_hint: '',
            order_history: newItem.order_history || [],
            daily_stats: [], // 新規作成時は空配列
          });
          count++;
        }
        alert(`${count}件を新規登録しました！`);
        setShowJsonInput(false);
        onClose();
      } else {
        setEditForm((prev) => ({ ...prev, ...data }));
        alert('単体データを反映しました。');
        setShowJsonInput(false);
      }
    } catch (e) {
      alert('データの形式が正しくありません。');
      console.error(e);
    }
  };

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー画像エリア */}
        <div className="relative h-48 bg-gray-200 cursor-pointer group flex-shrink-0">
          {!isEditMode ? (
            <div
              onClick={() =>
                !isSommelierMode &&
                !isUploading &&
                fileInputRef.current?.click()
              }
              className="w-full h-full relative"
            >
              {cloudImages[item.id] || item.image ? (
                <img
                  src={cloudImages[item.id] || item.image}
                  className={`w-full h-full object-cover transition-opacity ${
                    isUploading ? 'opacity-50' : ''
                  }`}
                  alt={item.name}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                  <Camera size={48} />
                  <span className="text-xs font-bold bg-white/80 px-2 py-1 rounded">
                    写真登録
                  </span>
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Loader className="animate-spin text-white" size={32} />
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
              ※画像は保存後に変更可能
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => onFileUpload(e, 'main')}
          />
          <button
            onClick={onClose}
            className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full z-10 hover:bg-black/70"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {!isEditMode ? (
            // ================= 閲覧モード =================
            <>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {item.name}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{item.kana}</span>
                    {item.region && (
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-bold text-gray-600">
                        📍 {item.region}
                      </span>
                    )}
                  </div>
                </div>
                {!isSommelierMode && (
                  <button
                    onClick={onStartEdit}
                    className="text-gray-400 hover:text-blue-600 p-2"
                  >
                    <Pencil size={20} />
                  </button>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 mb-4">
                <p className="text-blue-900 font-medium text-sm leading-relaxed">
                  "{item.sales_talk || '特徴を入力してください'}"
                </p>
              </div>

              {/* AIソムリエ提案 */}
              {pairingProfile && (
                <div className="mb-6 animate-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-2 text-purple-700 font-bold text-xs uppercase tracking-wider mb-2">
                    <Sparkles size={14} /> AI Sommelier's Approach
                  </div>
                  <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                    {/* ★ 判定タイプ（タップで詳細表示） */}
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-purple-100">
                      <span className="text-xs font-bold text-gray-500">
                        判定タイプ
                      </span>
                      <button
                        onClick={() => setShowTypeDetail(!showTypeDetail)}
                        className="flex items-center gap-1 text-sm font-bold text-purple-900 hover:text-purple-600 transition-colors bg-white/50 px-2 py-1 rounded shadow-sm"
                      >
                        {pairingProfile.typeInfo.label}
                        <Info size={14} className="text-purple-400" />
                      </button>
                    </div>

                    {showTypeDetail && (
                      <div className="bg-white/80 p-3 rounded-lg border border-purple-100 mb-3 text-xs text-purple-800 leading-relaxed animate-in fade-in slide-in-from-top-1 shadow-inner">
                        <span className="font-bold block mb-1">
                          【{pairingProfile.typeInfo.label}の特徴】
                        </span>
                        {pairingProfile.typeInfo.desc}
                      </div>
                    )}

                    <div className="space-y-3">
                      {pairingProfile.roles.map((role, idx) => (
                        <div
                          key={idx}
                          className="bg-white p-3 rounded-lg shadow-sm border border-purple-50"
                        >
                          <div className="font-bold text-xs text-purple-700 mb-1">
                            {role.approach}
                          </div>
                          <div className="text-xs text-gray-600 mb-1">
                            <span className="font-bold text-gray-400 text-[10px] mr-1">
                              TARGET:
                            </span>
                            {role.target}
                          </div>
                          <div className="text-[10px] text-gray-500 leading-snug">
                            {role.reason}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {item.pairing_hint && (
                <div className="flex items-start gap-3 bg-orange-50 p-3 rounded-lg border border-orange-100 mb-6">
                  <Utensils className="text-orange-500 mt-0.5" size={18} />
                  <div>
                    <span className="block text-xs font-bold text-orange-800 mb-0.5">
                      おすすめペアリング
                    </span>
                    <p className="text-sm text-orange-900">
                      {item.pairing_hint}
                    </p>
                  </div>
                </div>
              )}

              {triviaList.length > 0 && (
                <div className="mb-6 space-y-3">
                  <div className="flex items-center gap-2 text-gray-800 font-bold text-xs uppercase tracking-wider">
                    <BookOpen size={14} className="text-gray-500" /> 豆知識
                  </div>
                  {triviaList.map((trivia, index) => (
                    <div
                      key={trivia.id || index}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-xl border border-gray-200 relative overflow-hidden"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-gray-500">{trivia.icon}</span>
                        <h4 className="font-bold text-xs text-gray-800">
                          {trivia.title}
                        </h4>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed pl-6">
                        {trivia.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {!isSommelierMode && (
                <div className="border-t pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="text-gray-400" size={20} />
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Analysis (在庫推移)
                    </h3>
                  </div>

                  {/* ★★★ ここからAnalysis刷新 ★★★ */}
                  
                  {/* 1. 基本統計 (既存の統計データを活用) */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-gray-50 p-2 rounded-lg text-center">
                      <span className="block text-[10px] text-gray-500">
                        最終納品
                      </span>
                      <span className="block font-bold text-sm">
                        {stats.lastOrder}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg text-center">
                      <span className="block text-[10px] text-gray-500">
                        累計納品
                      </span>
                      <span className="block font-bold text-sm">
                        {stats.total}回
                      </span>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg text-center">
                      <span className="block text-[10px] text-gray-500">
                        サイクル
                      </span>
                      <span className="block font-bold text-sm text-blue-600">
                        {stats.cycle}
                      </span>
                    </div>
                  </div>

                  {/* 2. 日次推移グラフ (新機能：StockView/ShelfManagerと統一) */}
                  <div className="bg-white border border-gray-100 p-4 rounded-lg shadow-inner mb-4">
                    <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
                        <TrendingUp size={14}/> 直近の在庫変動
                    </p>
                    {item.daily_stats && item.daily_stats.length > 0 ? (
                         <div className="flex items-end gap-1 h-24 border-b border-gray-200 pb-1">
                            {item.daily_stats.slice(-10).map((stat, idx) => (
                                <div key={idx} className="flex-1 flex flex-col items-center group relative">
                                    {/* 納品バー (緑) */}
                                    {stat.order_qty > 0 && (
                                        <div 
                                            className="w-full bg-green-400 opacity-50 absolute bottom-0"
                                            style={{ height: `${Math.min(100, stat.order_qty * 10)}%` }}
                                        ></div>
                                    )}
                                    {/* 在庫バー (青) */}
                                    <div 
                                        className="w-2/3 bg-blue-500 rounded-t-sm z-10"
                                        style={{ height: `${Math.min(100, (stat.stock / 20) * 100)}%` }}
                                    ></div>
                                    <span className="text-[8px] text-gray-400 mt-1 transform -rotate-45 origin-left translate-y-2">{stat.date.slice(5)}</span>
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-1 hidden group-hover:block bg-black/80 text-white text-[9px] p-1 rounded whitespace-nowrap z-20">
                                        {stat.date}<br/>在庫: {stat.stock}<br/>発注: {stat.order_qty}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-24 flex items-center justify-center text-xs text-gray-400 bg-gray-50 rounded">
                            <p>日報データ蓄積中...</p>
                        </div>
                    )}
                    <div className="flex justify-end gap-3 mt-4 text-[9px] text-gray-400">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-sm"></span>在庫数</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-sm"></span>発注数</span>
                    </div>
                  </div>

                  {/* 3. 納品履歴ログ (既存機能：長期履歴用として残す) */}
                  <div className="mb-4">
                    <button
                      onClick={() => setShowHistoryLog(!showHistoryLog)}
                      className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-800 w-full py-2"
                    >
                      {showHistoryLog ? (
                        <ChevronDown size={14} />
                      ) : (
                        <ChevronRight size={14} />
                      )}
                      <History size={14} /> 過去の全納品ログ
                    </button>
                    {showHistoryLog && (
                      <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto mt-1 text-xs animate-in slide-in-from-top-1">
                        {item.order_history && item.order_history.length > 0 ? (
                          <ul className="space-y-1">
                            {[...item.order_history]
                              .sort((a, b) => new Date(b) - new Date(a))
                              .map((dateStr, idx) => (
                                <li
                                  key={idx}
                                  className="flex justify-between border-b border-gray-200 last:border-0 pb-1"
                                >
                                  <span className="text-gray-600">
                                    {new Date(dateStr).toLocaleDateString(
                                      'ja-JP'
                                    )}
                                  </span>
                                  <span className="font-bold text-blue-600">
                                    納品
                                  </span>
                                </li>
                              ))}
                          </ul>
                        ) : (
                          <p className="text-center text-gray-400">履歴なし</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
                    <div>
                      <span className="block text-gray-400 text-xs">
                        Capacity
                      </span>
                      <span className="font-bold">{item.capacity_ml}ml</span>
                    </div>
                    <div>
                      <span className="block text-gray-400 text-xs">Cost</span>
                      <span className="font-bold">
                        ¥{item.price_cost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  {(item.source_text || item.spec_image) && (
                    <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
                      <p className="font-bold mb-1">Source Info:</p>
                      {item.spec_image && (
                        <a
                          href={item.spec_image}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline block mb-1"
                        >
                          スペック画像を確認
                        </a>
                      )}
                      {item.source_text && (
                        <p className="truncate opacity-50">
                          {item.source_text}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            // ================= 編集モード (変更なし) =================
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-gray-500">
                  商品編集
                </label>
                <button
                  onClick={() => setShowJsonInput(!showJsonInput)}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md hover:opacity-90 flex items-center gap-1 animate-pulse"
                >
                  <Sparkles size={12} /> NotebookLMから一括入力
                </button>
              </div>

              {showJsonInput && (
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 mb-4 animate-in slide-in-from-top-2">
                  <p className="text-[10px] text-purple-800 mb-1 font-bold">
                    JSONデータを貼り付けて「データを反映する」を押してください
                  </p>
                  <textarea
                    className="w-full border border-purple-200 rounded p-2 text-xs h-24 mb-2 bg-white"
                    placeholder={'例: [{"name": "黒霧島", ...}]'}
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                  />
                  <button
                    onClick={handleJsonImport}
                    className="w-full bg-purple-600 text-white py-2 rounded font-bold text-xs shadow hover:bg-purple-700"
                  >
                    データを反映する
                  </button>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-500">
                  商品名
                </label>
                <input
                  className="w-full border p-2 rounded"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">
                  ふりがな
                </label>
                <input
                  className="w-full border p-2 rounded"
                  value={editForm.kana}
                  onChange={(e) =>
                    setEditForm({ ...editForm, kana: e.target.value })
                  }
                />
              </div>

              <div className="bg-gray-50 p-3 rounded border border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-500">
                    スペック画像
                  </span>
                  <div className="flex items-center gap-2">
                    {editForm.spec_image && (
                      <span className="text-[10px] text-green-600">登録済</span>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      ref={specInputRef}
                      className="hidden"
                      onChange={(e) => onFileUpload(e, 'spec')}
                    />
                    <button
                      onClick={() => specInputRef.current?.click()}
                      className="text-[10px] bg-white border border-gray-300 text-gray-600 px-2 py-1 rounded flex items-center gap-1 hover:bg-gray-100"
                    >
                      <Upload size={10} /> アップロード
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-500">
                    種別
                  </label>
                  <select
                    className="w-full border p-2 rounded"
                    value={editForm.type}
                    onChange={(e) =>
                      setEditForm({ ...editForm, type: e.target.value })
                    }
                  >
                    <option value="Sake">日本酒</option>
                    <option value="Shochu">焼酎</option>
                    <option value="Liqueur">リキュール</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">
                    ランク
                  </label>
                  <select
                    className="w-full border p-2 rounded"
                    value={editForm.category_rank}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        category_rank: e.target.value,
                      })
                    }
                  >
                    <option value="Matsu">松</option>
                    <option value="Take">竹</option>
                    <option value="Ume">梅</option>
                    <option value="Shochu_Imo">芋焼酎</option>
                    <option value="Shochu_Mugi">麦焼酎</option>
                  </select>
                </div>
              </div>

              <div className="mt-2">
                <label className="text-xs font-bold text-gray-500">産地</label>
                <select
                  className="w-full border p-2 rounded"
                  value={editForm.region || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, region: e.target.value })
                  }
                >
                  <option value="">未選択</option>
                  {PREFECTURES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-500">
                    仕入価格
                  </label>
                  <input
                    type="number"
                    className="w-full border p-2 rounded"
                    value={editForm.price_cost}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        price_cost: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">
                    容量(ml)
                  </label>
                  <input
                    type="number"
                    className="w-full border p-2 rounded"
                    value={editForm.capacity_ml}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        capacity_ml: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">
                  セールストーク
                </label>
                <textarea
                  className="w-full border p-2 rounded h-20"
                  value={editForm.sales_talk}
                  onChange={(e) =>
                    setEditForm({ ...editForm, sales_talk: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">
                  ペアリング
                </label>
                <input
                  className="w-full border p-2 rounded"
                  value={editForm.pairing_hint}
                  onChange={(e) =>
                    setEditForm({ ...editForm, pairing_hint: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">
                  タグ (カンマ区切り)
                </label>
                <input
                  className="w-full border p-2 rounded mb-2"
                  value={editForm.tags?.join(',')}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      tags: e.target.value.split(','),
                    })
                  }
                  placeholder="手入力も可"
                />
                <div className="bg-gray-50 p-2 rounded border border-gray-100">
                  {Object.entries(TAG_SUGGESTIONS).map(([category, tags]) => (
                    <div key={category} className="mb-2 last:mb-0">
                      <span className="text-[10px] text-gray-500 block mb-1">
                        {category}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {tags.map((tag) => {
                          const isSelected = editForm.tags?.includes(tag);
                          return (
                            <button
                              key={tag}
                              onClick={() => toggleTag(tag)}
                              className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                                isSelected
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded">
                <p className="text-xs font-bold mb-2">マップ位置調整</p>
                <div className="flex gap-2 text-xs items-center mb-2">
                  <span>甘</span>
                  <input
                    type="range"
                    className="flex-grow"
                    value={editForm.axisX || 50}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        axisX: Number(e.target.value),
                      })
                    }
                  />
                  <span>辛</span>
                </div>
                <div className="flex gap-2 text-xs items-center">
                  <span>穏</span>
                  <input
                    type="range"
                    className="flex-grow"
                    value={editForm.axisY || 50}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        axisY: Number(e.target.value),
                      })
                    }
                  />
                  <span>華</span>
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t">
                {item.id && (
                  <button
                    onClick={onDelete}
                    className="flex-1 bg-red-100 text-red-600 py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                  >
                    <Trash2 size={18} /> 削除
                  </button>
                )}
                <button
                  onClick={onSave}
                  className="flex-[2] bg-blue-600 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2"
                >
                  <Save size={18} /> 保存
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SakeModal;
