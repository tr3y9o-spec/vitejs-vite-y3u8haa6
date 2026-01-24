import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Plus,
  Minus,
  Camera,
  Loader,
  X,
  Save,
  Trash2,
  Coffee,
  Check,
  ClipboardCopy,
  ChevronDown,
  ChevronRight,
  Beer,
  GlassWater,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { db, storage } from './firebase';
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// ロジックをインポート
import { analyzeHistory } from './utils/sakeLogic';

const OTHER_CATEGORIES = [
  {
    id: 'Beer',
    label: 'ビール',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <Beer size={14} />,
  },
  {
    id: 'Whiskey',
    label: 'ウイスキー',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: <GlassWater size={14} />,
  },
  {
    id: 'Sour',
    label: 'サワー・酎ハイ',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <GlassWater size={14} />,
  },
  {
    id: 'SoftDrink',
    label: 'ソフトドリンク',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Coffee size={14} />,
  },
  {
    id: 'Other',
    label: 'その他',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <Coffee size={14} />,
  },
];

export default function OtherManager() {
  const [activeTab, setActiveTab] = useState('list');
  const [itemList, setItemList] = useState([]);
  const [cloudImages, setCloudImages] = useState({});
  const [modalItem, setModalItem] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [copied, setCopied] = useState(false);
  const [historyReports, setHistoryReports] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState(null);
  const [jsonInput, setJsonInput] = useState('');
  const [showJsonInput, setShowJsonInput] = useState(false);
  const fileInputRef = useRef(null);

  // ★統計データ計算（グラフ用）
  const stats = modalItem ? analyzeHistory(modalItem.order_history) : null;

  useEffect(() => {
    if (!db) return;
    const unsubList = onSnapshot(collection(db, 'otherList'), (snapshot) => {
      setItemList(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    const unsubImages = onSnapshot(doc(db, 'otherImages', 'main'), (doc) => {
      if (doc.exists()) setCloudImages(doc.data());
    });
    return () => {
      unsubList();
      unsubImages();
    };
  }, []);

  useEffect(() => {
    if (showHistory) fetchHistory();
  }, [showHistory]);

  const fetchHistory = async () => {
    if (!db) return;
    try {
      const q = query(
        collection(db, 'otherReports'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      setHistoryReports(
        querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const filteredData = useMemo(() => {
    return itemList.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [itemList, searchTerm]);

  const handleAddNew = () => {
    setEditForm({
      name: '',
      category: 'Beer',
      price_cost: 0,
      stock_num: 0,
      note: '',
    });
    setIsEditMode(true);
    setModalItem({});
    setJsonInput('');
    setShowJsonInput(false);
  };

  const handleSave = async () => {
    if (!editForm.name) return alert('名称は必須です');
    try {
      if (modalItem.id) {
        await updateDoc(doc(db, 'otherList', modalItem.id), editForm);
        alert('更新しました');
      } else {
        await addDoc(collection(db, 'otherList'), editForm);
        alert('新規登録しました');
      }
      setModalItem(null);
      setIsEditMode(false);
    } catch (e) {
      alert('保存エラー');
    }
  };

  const handleDelete = async () => {
    if (!confirm('削除しますか？')) return;
    try {
      await deleteDoc(doc(db, 'otherList', modalItem.id));
      setModalItem(null);
    } catch (e) {
      alert('削除エラー');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !modalItem.id) return alert('先に保存してください');
    try {
      setIsUploading(true);
      const storageRef = ref(storage, `other_images/${modalItem.id}.jpg`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      await setDoc(
        doc(db, 'otherImages', 'main'),
        { [modalItem.id]: downloadURL },
        { merge: true }
      );
      setCloudImages((prev) => ({ ...prev, [modalItem.id]: downloadURL }));
    } catch (e) {
      alert('アップロード失敗');
    } finally {
      setIsUploading(false);
    }
  };

  const updateStock = async (id, delta) => {
    const item = itemList.find((i) => i.id === id);
    if (!item) return;
    const newStock = Math.max(0, (item.stock_num || 0) + delta);
    await updateDoc(doc(db, 'otherList', id), { stock_num: newStock });
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
            `${data.length}件のデータを一括登録しますか？\n（既存の商品名がある場合はスキップされます）`
          )
        )
          return;
        let count = 0;
        for (const item of data) {
          const exists = itemList.some((i) => i.name === item.name);
          if (!exists) {
            await addDoc(collection(db, 'otherList'), {
              name: item.name,
              category: item.category || 'Other',
              price_cost: Number(item.price_cost) || 0,
              stock_num: 0,
              note: item.note || '',
              order_history: item.order_history || [],
            });
            count++;
          }
        }
        alert(`${count}件のデータを新規登録しました！`);
        setShowJsonInput(false);
        setModalItem(null);
      } else {
        setEditForm((prev) => ({ ...prev, ...data }));
        alert('データを反映しました。保存を押してください。');
        setShowJsonInput(false);
      }
    } catch (e) {
      alert('データの形式が正しくありません。');
    }
  };

  const handleSaveToCloud = async () => {
    if (!confirm('現在の在庫状況を「本日の記録」として保存しますか？')) return;
    try {
      const today = new Date();
      const reportData = {
        date: today.toLocaleDateString('ja-JP'),
        createdAt: today.toISOString(),
        total_assets: filteredData.reduce(
          (sum, i) => sum + (i.stock_num || 0) * i.price_cost,
          0
        ),
        items: filteredData
          .map((item) => ({
            name: item.name,
            category: item.category,
            stock: item.stock_num || 0,
          }))
          .filter((i) => i.stock > 0),
      };
      await addDoc(collection(db, 'otherReports'), reportData);
      alert('クラウドに保存しました！');
      if (showHistory) fetchHistory();
    } catch (e) {
      alert('保存失敗');
    }
  };

  const generateReport = () => {
    const today = new Date().toLocaleDateString('ja-JP');
    let text = `【その他ドリンク在庫】 ${today}\n------------------\n`;
    itemList.forEach((item) => {
      if ((item.stock_num || 0) > 0)
        text += `${item.name}: ${item.stock_num}\n`;
    });
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      alert('コピーしました');
    });
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20 animate-in fade-in">
      <div className="flex bg-white border-b sticky top-0 z-10 shadow-sm">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-3 text-sm font-bold ${
            activeTab === 'list'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-gray-400'
          }`}
        >
          リスト
        </button>
        <button
          onClick={() => setActiveTab('stock')}
          className={`flex-1 py-3 text-sm font-bold ${
            activeTab === 'stock'
              ? 'text-gray-800 border-b-2 border-gray-800'
              : 'text-gray-400'
          }`}
        >
          在庫管理
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'list' && (
          <>
            <div className="relative mb-4">
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="ドリンク名..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-amber-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 gap-3">
              {filteredData.map((item) => {
                const cat =
                  OTHER_CATEGORIES.find((c) => c.id === item.category) ||
                  OTHER_CATEGORIES[4];
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setModalItem(item);
                      setIsEditMode(false);
                    }}
                    className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex gap-3 cursor-pointer active:scale-[0.99] transition-transform"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                      {cloudImages[item.id] ? (
                        <img
                          src={cloudImages[item.id]}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          {cat.icon}
                        </div>
                      )}
                    </div>
                    <div>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border ${cat.color}`}
                      >
                        {cat.label}
                      </span>
                      <h3 className="font-bold text-gray-800 mt-1">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        ¥{item.price_cost} / 在庫: {item.stock_num || 0}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={handleAddNew}
              className="fixed bottom-20 right-4 bg-amber-600 text-white p-4 rounded-full shadow-lg hover:bg-amber-700 z-20"
            >
              <Plus size={24} />
            </button>
          </>
        )}

        {/* Stock View */}
        {activeTab === 'stock' && (
          <div className="space-y-4">
            <div className="bg-gray-800 text-white p-4 rounded-xl shadow-lg mb-4">
              <p className="text-xs text-gray-400 font-bold uppercase">
                在庫資産合計
              </p>
              <p className="text-2xl font-bold">
                ¥{' '}
                {filteredData
                  .reduce(
                    (sum, i) => sum + (i.stock_num || 0) * i.price_cost,
                    0
                  )
                  .toLocaleString()}
              </p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={generateReport}
                  className="bg-white/10 py-2 rounded flex items-center justify-center gap-2 text-xs font-bold hover:bg-white/20"
                >
                  {copied ? <Check size={16} /> : <ClipboardCopy size={16} />}{' '}
                  コピー
                </button>
                <button
                  onClick={handleSaveToCloud}
                  className="bg-amber-600 hover:bg-amber-500 border border-amber-400 text-white py-2 rounded flex items-center justify-center gap-2 text-xs font-bold shadow-md"
                >
                  <Save size={16} /> 記録保存
                </button>
              </div>
            </div>
            <div className="mb-4">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-800 w-full p-2"
              >
                {showHistory ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}{' '}
                過去の履歴
              </button>
              {showHistory && (
                <div className="bg-white rounded-xl border mt-2 overflow-hidden">
                  {historyReports.map((report) => (
                    <div
                      key={report.id}
                      className="border-b last:border-0 text-sm"
                    >
                      <div
                        onClick={() =>
                          setExpandedReportId(
                            expandedReportId === report.id ? null : report.id
                          )
                        }
                        className="p-3 flex justify-between cursor-pointer hover:bg-gray-50"
                      >
                        <span className="font-bold text-gray-800">
                          {report.date}
                        </span>
                        <span className="text-xs font-bold text-gray-600">
                          ¥{report.total_assets?.toLocaleString()}
                        </span>
                      </div>
                      {expandedReportId === report.id && (
                        <div className="bg-gray-50 p-3 text-xs border-t shadow-inner">
                          {report.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between py-1 border-b border-gray-200 last:border-0"
                            >
                              <span>{item.name}</span>
                              <span>{item.stock}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {filteredData.map((item) => (
              <div
                key={item.id}
                className="bg-white p-3 rounded-lg border flex justify-between items-center shadow-sm"
              >
                <div>
                  <h3 className="font-bold text-sm text-gray-800">
                    {item.name}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateStock(item.id, -1)}
                    className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-bold w-6 text-center">
                    {item.stock_num || 0}
                  </span>
                  <button
                    onClick={() => updateStock(item.id, 1)}
                    className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* モーダル */}
      {modalItem && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setModalItem(null)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-32 bg-gray-100 relative flex-shrink-0">
              {cloudImages[modalItem.id] ? (
                <img
                  src={cloudImages[modalItem.id]}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Coffee size={32} />
                </div>
              )}
              <button
                onClick={() => setModalItem(null)}
                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"
              >
                <X size={16} />
              </button>
              {!isEditMode && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 bg-white/80 text-xs px-2 py-1 rounded shadow font-bold"
                >
                  写真変更
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
              {isUploading && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Loader className="animate-spin text-white" />
                </div>
              )}
            </div>

            <div className="p-4 overflow-y-auto">
              {!isEditMode ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">{modalItem.name}</h2>
                  <div className="flex gap-2 text-sm text-gray-600">
                    <span>
                      {
                        OTHER_CATEGORIES.find(
                          (c) => c.id === modalItem.category
                        )?.label
                      }
                    </span>
                    <span>¥{modalItem.price_cost}</span>
                    <span>在庫: {modalItem.stock_num}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">
                    {modalItem.note || 'メモなし'}
                  </div>

                  {/* ★グラフ表示エリア追加 */}
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="text-gray-400" size={20} />
                      <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                        Analysis
                      </h3>
                    </div>
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
                          累計
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
                    <div className="bg-white border border-gray-100 p-4 rounded-lg shadow-inner mb-4">
                      <div className="flex items-end justify-between h-24 gap-1">
                        {stats.monthly.map((m, i) => {
                          const max =
                            Math.max(...stats.monthly.map((d) => d.count)) || 1;
                          return (
                            <div
                              key={i}
                              className="flex-1 flex flex-col items-center group"
                            >
                              <div
                                className={`w-full max-w-[20px] rounded-t-sm transition-all duration-500 ${
                                  m.count > 0
                                    ? 'bg-amber-400 group-hover:bg-amber-500'
                                    : 'bg-gray-100'
                                }`}
                                style={{
                                  height: `${(m.count / max) * 100}%`,
                                  minHeight: m.count > 0 ? '4px' : '2px',
                                }}
                              ></div>
                              <span className="text-[9px] text-gray-400 mt-1">
                                {m.label.replace('月', '')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setEditForm({ ...modalItem });
                      setIsEditMode(true);
                    }}
                    className="w-full bg-gray-900 text-white py-3 rounded font-bold"
                  >
                    編集
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-500">
                      一括登録
                    </label>
                    <button
                      onClick={() => setShowJsonInput(!showJsonInput)}
                      className="bg-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md hover:opacity-90 flex items-center gap-1 animate-pulse"
                    >
                      <Sparkles size={12} /> AI一括入力
                    </button>
                  </div>
                  {showJsonInput && (
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mb-4">
                      <p className="text-[10px] text-amber-800 mb-1 font-bold">
                        JSONデータを貼り付けてください
                      </p>
                      <textarea
                        className="w-full border border-amber-200 rounded p-2 text-xs h-24 mb-2 bg-white"
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder='[{"name":"ビール", ...}]'
                      />
                      <button
                        onClick={handleJsonImport}
                        className="w-full bg-amber-600 text-white py-2 rounded font-bold text-xs shadow hover:bg-amber-700"
                      >
                        登録実行
                      </button>
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-bold text-gray-400">
                      名前
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
                    <label className="text-xs font-bold text-gray-400">
                      カテゴリ
                    </label>
                    <select
                      className="w-full border p-2 rounded"
                      value={editForm.category}
                      onChange={(e) =>
                        setEditForm({ ...editForm, category: e.target.value })
                      }
                    >
                      {OTHER_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-gray-400">
                        原価
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
                      <label className="text-xs font-bold text-gray-400">
                        在庫
                      </label>
                      <input
                        type="number"
                        className="w-full border p-2 rounded"
                        value={editForm.stock_num}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            stock_num: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400">
                      メモ
                    </label>
                    <textarea
                      className="w-full border p-2 rounded h-20"
                      value={editForm.note}
                      onChange={(e) =>
                        setEditForm({ ...editForm, note: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex gap-2 pt-4 border-t">
                    {modalItem.id && (
                      <button
                        onClick={handleDelete}
                        className="flex-1 bg-red-100 text-red-600 py-3 rounded font-bold"
                      >
                        <Trash2 size={16} className="mx-auto" />
                      </button>
                    )}
                    <button
                      onClick={handleSave}
                      className="flex-[3] bg-amber-600 text-white py-3 rounded font-bold flex items-center justify-center gap-2"
                    >
                      <Save size={18} /> 保存
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
