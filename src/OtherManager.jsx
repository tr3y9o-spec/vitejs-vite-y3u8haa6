import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Plus, Minus, Camera, Loader, X, Save, Trash2, Coffee, Beer, GlassWater, BarChart3, Send, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';
import { db, storage } from './firebase';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, setDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { analyzeHistory } from './utils/sakeLogic';
// ★共通ロジック
import { shareData, saveDailyReport } from './utils/reportUtils';

const OTHER_CATEGORIES = [
  { id: 'Beer', label: 'ビール', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Beer size={14} /> },
  { id: 'Whiskey', label: 'ウイスキー', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: <GlassWater size={14} /> },
  { id: 'Sour', label: 'サワー・酎ハイ', color: 'bg-green-100 text-green-800 border-green-200', icon: <GlassWater size={14} /> },
  { id: 'SoftDrink', label: 'ソフトドリンク', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <Coffee size={14} /> },
  { id: 'Other', label: 'その他', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: <Coffee size={14} /> },
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
  const [historyReports, setHistoryReports] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState(null);
  const [jsonInput, setJsonInput] = useState('');
  const [showJsonInput, setShowJsonInput] = useState(false);
  const fileInputRef = useRef(null);

  const stats = modalItem ? analyzeHistory(modalItem.order_history) : null;

  useEffect(() => {
    if (!db) return;
    const unsubList = onSnapshot(collection(db, 'otherList'), (snapshot) => {
      // id優先で読み込み
      setItemList(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    });
    const unsubImages = onSnapshot(doc(db, 'otherImages', 'main'), (doc) => {
      if (doc.exists()) setCloudImages(doc.data());
    });
    return () => { unsubList(); unsubImages(); };
  }, []);

  const fetchHistory = async () => {
    if (!db) return;
    try {
      const q = query(collection(db, 'otherReports'), orderBy('createdAt', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      setHistoryReports(querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (showHistory) fetchHistory(); }, [showHistory]);

  const filteredData = useMemo(() => itemList.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase())), [itemList, searchTerm]);

  const handleAddNew = () => {
    setEditForm({ name: '', category: 'Beer', price_cost: 0, stock_num: 0, stock_level: 100, note: '' });
    setIsEditMode(true); setModalItem({}); setJsonInput(''); setShowJsonInput(false);
  };

  const handleSave = async () => {
    if (!editForm.name) return alert('名称は必須です');
    const { id, ...dataToSave } = editForm; // ID除外
    const saveData = { ...dataToSave, price_cost: Number(editForm.price_cost)||0, stock_num: Number(editForm.stock_num)||0, stock_level: Number(editForm.stock_level)||100 };
    
    if (modalItem.id) { await updateDoc(doc(db, 'otherList', modalItem.id), saveData); }
    else { await addDoc(collection(db, 'otherList'), saveData); }
    setModalItem(null); setIsEditMode(false);
  };

  const handleDelete = async () => {
    if (!confirm('削除しますか？')) return;
    try { await deleteDoc(doc(db, 'otherList', modalItem.id)); setModalItem(null); } catch (e) { alert('削除エラー'); }
  };

  // ★★★ 画像ダブル保存ロジック (OtherManager版) ★★★
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !modalItem.id) return alert('先に保存してください');
    try {
      setIsUploading(true);
      const storageRef = ref(storage, `other_images/${modalItem.id}.jpg`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      // 1. 一覧用キャッシュ
      await setDoc(doc(db, 'otherImages', 'main'), { [modalItem.id]: downloadURL }, { merge: true });
      // 2. 本体データ (これで確実)
      await updateDoc(doc(db, 'otherList', modalItem.id), { image: downloadURL });
      
      setCloudImages((prev) => ({ ...prev, [modalItem.id]: downloadURL }));
      // リストも即時更新
      setItemList(prev => prev.map(i => i.id === modalItem.id ? { ...i, image: downloadURL } : i));
    } catch (e) { alert('アップロード失敗'); } finally { setIsUploading(false); }
  };

  const updateStock = async (id, delta) => {
    const item = itemList.find(i => i.id === id);
    const newStock = Math.max(0, (item.stock_num || 0) + delta);
    await updateDoc(doc(db, 'otherList', id), { stock_num: newStock });
  };

  const updateLevel = async (id, level) => {
    await updateDoc(doc(db, 'otherList', id), { stock_level: level });
  };

  const handleJsonImport = async () => {
    try {
      const cleanJson = jsonInput.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanJson);
      if (Array.isArray(data)) {
        if (!confirm(`${data.length}件を一括登録しますか？`)) return;
        const batch = db.batch(); // Firestoreバッチ処理など本当は良いが、ここではループで
        let count = 0;
        for (const item of data) {
            await addDoc(collection(db, 'otherList'), {
              name: item.name, category: item.category || 'Other',
              price_cost: Number(item.price_cost) || 0, stock_num: 0, stock_level: 100,
              note: item.note || '', order_history: []
            });
            count++;
        }
        alert(`${count}件登録しました`); setShowJsonInput(false); setModalItem(null);
      }
    } catch (e) { alert('エラー'); }
  };

  const totalAsset = filteredData.reduce((sum, item) => sum + (item.stock_num||0)*(item.price_cost||0) + Math.round((item.price_cost||0)*((item.stock_level??100)/100)), 0);

  // 共有機能
  const handleShareStock = async () => {
    const today = new Date().toLocaleDateString('ja-JP');
    let text = `【その他ドリンク在庫】 ${today}\n------------------\n`;
    itemList.forEach((item) => {
      if ((item.stock_num || 0) > 0 || (item.stock_level ?? 100) < 100) {
        text += `${item.name}: ${item.stock_num}`;
        if((item.stock_level ?? 100) < 100) text += ` (残${item.stock_level}%)`;
        text += `\n`;
      }
    });
    text += `------------------\n資産合計: ¥${totalAsset.toLocaleString()}`;
    await shareData(text, "その他ドリンク在庫");
  };

  const handleSaveToCloud = async () => {
    if (!confirm('本日の記録として保存しますか？')) return;
    const itemsToSave = itemList.map(item => ({ ...item, stock: item.stock_num||0 })).filter(i => i.stock>0 || (i.stock_level??100)<100);
    await saveDailyReport('otherReports', itemsToSave, totalAsset);
    alert('保存しました');
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20 animate-in fade-in">
      <div className="flex bg-white border-b sticky top-0 z-10 shadow-sm">
        <button onClick={() => setActiveTab('list')} className={`flex-1 py-3 text-sm font-bold ${activeTab === 'list' ? 'text-amber-600 border-b-2 border-amber-600' : 'text-gray-400'}`}>リスト</button>
        <button onClick={() => setActiveTab('stock')} className={`flex-1 py-3 text-sm font-bold ${activeTab === 'stock' ? 'text-gray-800 border-b-2 border-gray-800' : 'text-gray-400'}`}>資産・在庫</button>
      </div>

      <div className="p-4">
        {activeTab === 'list' && (
          <>
            <div className="relative mb-4"><Search className="absolute left-3 top-2.5 text-gray-400" size={20}/><input type="text" placeholder="検索..." className="w-full pl-10 pr-4 py-2 rounded-lg border" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div>
            <div className="grid grid-cols-1 gap-3">
              {filteredData.map(item => {
                const cat = OTHER_CATEGORIES.find(c => c.id === item.category) || OTHER_CATEGORIES[4];
                const displayImage = (cloudImages[item.id] || item.image); // 両方チェック
                return (
                  <div key={item.id} onClick={() => { setModalItem(item); setIsEditMode(false); }} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex gap-3 cursor-pointer">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {displayImage ? <img src={displayImage} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-gray-300">{cat.icon}</div>}
                    </div>
                    <div><span className={`text-[10px] px-1.5 py-0.5 rounded border ${cat.color}`}>{cat.label}</span><h3 className="font-bold text-gray-800 mt-1">{item.name}</h3></div>
                  </div>
                );
              })}
            </div>
            <button onClick={handleAddNew} className="fixed bottom-20 right-4 bg-amber-600 text-white p-4 rounded-full shadow-lg z-20"><Plus size={24}/></button>
          </>
        )}

        {/* Stock View */}
        {activeTab === 'stock' && (
          <div className="space-y-4">
            <div className="bg-gray-800 text-white p-4 rounded-xl shadow-lg sticky top-0 z-10">
              <p className="text-xs text-gray-400 font-bold uppercase">在庫資産合計</p>
              <p className="text-2xl font-bold">¥ {totalAsset.toLocaleString()}</p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={handleShareStock} className="bg-white/10 hover:bg-white/20 text-white py-2 rounded flex items-center justify-center gap-2 text-xs font-bold"><Send size={16}/> 在庫リスト送信</button>
                <button onClick={handleSaveToCloud} className="bg-amber-600 hover:bg-amber-500 border border-amber-400 text-white py-2 rounded flex items-center justify-center gap-2 text-xs font-bold"><Save size={16}/> 記録保存</button>
              </div>
            </div>
            {filteredData.map(item => (
              <div key={item.id} className="bg-white p-3 rounded-lg border shadow-sm">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-sm">{item.name}</h3>
                    <div className="flex items-center gap-3">
                        <button onClick={() => updateStock(item.id, -1)} className="w-8 h-8 rounded-full border flex items-center justify-center"><Minus size={16}/></button>
                        <span className="font-bold w-6 text-center">{item.stock_num||0}</span>
                        <button onClick={() => updateStock(item.id, 1)} className="w-8 h-8 rounded-full border flex items-center justify-center"><Plus size={16}/></button>
                    </div>
                </div>
                {/* 残量スライダー */}
                <div className="border-t border-gray-100 pt-2">
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold mb-1"><span>残量</span><span>{item.stock_level??100}%</span></div>
                    <input type="range" min="0" max="100" step="10" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" value={item.stock_level??100} onChange={e => updateLevel(item.id, Number(e.target.value))}/>
                </div>
                {item.daily_stats && item.daily_stats.length > 0 && (<div className="mt-3 pt-2 border-t border-gray-100"><div className="flex items-center gap-1 mb-1"><TrendingUp size={12} className="text-gray-400"/><span className="text-[10px] text-gray-400">推移</span></div><div className="flex items-end gap-1 h-10">{item.daily_stats.slice(-10).map((stat, idx) => (<div key={idx} className="flex-1 bg-amber-100 rounded-t-sm" style={{height: `${Math.min(100, (stat.stock / 10) * 100)}%`}}></div>))}</div></div>)}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* モーダル */}
      {modalItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModalItem(null)}>
            <div className="bg-white w-full max-w-sm rounded-xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="h-32 bg-gray-100 relative flex-shrink-0">
                    {(cloudImages[modalItem.id] || modalItem.image) ? <img src={cloudImages[modalItem.id] || modalItem.image} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Coffee size={32}/></div>}
                    <button onClick={() => setModalItem(null)} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"><X size={16}/></button>
                    {!isEditMode && <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-2 right-2 bg-white/80 text-xs px-2 py-1 rounded shadow font-bold">写真変更</button>}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload}/>
                    {isUploading && <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Loader className="animate-spin text-white"/></div>}
                </div>
                <div className="p-4 overflow-y-auto">
                    {!isEditMode ? (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold">{modalItem.name}</h2>
                            <div className="bg-gray-50 p-3 rounded text-sm">{modalItem.note || 'メモなし'}</div>
                            <div className="border-t pt-4">
                                <h3 className="text-sm font-bold mb-2 flex items-center gap-2"><BarChart3 size={16}/> Analysis</h3>
                                <div className="grid grid-cols-3 gap-2 mb-2 text-center text-xs">
                                    <div className="bg-gray-50 p-2 rounded">最終: {stats.lastOrder}</div>
                                    <div className="bg-gray-50 p-2 rounded">累計: {stats.total}回</div>
                                    <div className="bg-gray-50 p-2 rounded">周期: {stats.cycle}</div>
                                </div>
                            </div>
                            <button onClick={() => { setEditForm({...modalItem}); setIsEditMode(true); }} className="w-full bg-gray-900 text-white py-3 rounded font-bold">編集</button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <button onClick={() => setShowJsonInput(!showJsonInput)} className="bg-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-bold w-full"><Sparkles size={12}/> AI一括入力</button>
                            {showJsonInput && <div className="bg-amber-50 p-2"><textarea className="w-full h-20 text-xs" value={jsonInput} onChange={e=>setJsonInput(e.target.value)} placeholder="JSON"/><button onClick={handleJsonImport} className="w-full bg-amber-600 text-white text-xs py-1">登録</button></div>}
                            <input className="w-full border p-2 rounded" placeholder="名前" value={editForm.name} onChange={e => setEditForm({...editForm, name:e.target.value})}/>
                            <select className="w-full border p-2 rounded" value={editForm.category} onChange={e => setEditForm({...editForm, category:e.target.value})}>{OTHER_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</select>
                            <div className="grid grid-cols-2 gap-2">
                                <input type="number" className="w-full border p-2 rounded" placeholder="原価" value={editForm.price_cost} onChange={e => setEditForm({...editForm, price_cost:Number(e.target.value)})}/>
                                <input type="number" className="w-full border p-2 rounded" placeholder="在庫" value={editForm.stock_num} onChange={e => setEditForm({...editForm, stock_num:Number(e.target.value)})}/>
                            </div>
                            <textarea className="w-full border p-2 rounded" value={editForm.note} onChange={e=>setEditForm({...editForm, note:e.target.value})}/>
                            <div className="flex gap-2">
                                {modalItem.id && <button onClick={handleDelete} className="flex-1 bg-red-100 text-red-600 rounded"><Trash2 className="mx-auto"/></button>}
                                <button onClick={handleSave} className="flex-[3] bg-amber-600 text-white py-3 rounded font-bold">保存</button>
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