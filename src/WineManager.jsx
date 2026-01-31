import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Plus, Minus, Camera, Loader, X, Save, Trash2, Grape, Globe, DollarSign, Check, ChevronDown, ChevronRight, Sparkles, Utensils, Send, TrendingUp } from 'lucide-react';
import { db, storage } from './firebase';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, query, orderBy, limit, getDocs, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { WINE_TYPES, generateDailyWineReport, getWinePairing } from './utils/wineLogic';
import { shareData, saveDailyReport } from './utils/reportUtils';

export default function WineManager() {
  const [activeTab, setActiveTab] = useState('list');
  const [wineList, setWineList] = useState([]);
  const [cloudImages, setCloudImages] = useState({});
  const [modalItem, setModalItem] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [historyReports, setHistoryReports] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [showJsonInput, setShowJsonInput] = useState(false);
  const fileInputRef = useRef(null);

  const pairingSuggestions = modalItem ? getWinePairing(modalItem) : [];

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "wines"), orderBy('order', 'asc'));
    const unsubList = onSnapshot(q, (snapshot) => {
      // ID優先読み込み
      setWineList(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    const unsubImages = onSnapshot(doc(db, "wineImages", "main"), (doc) => {
      if (doc.exists()) setCloudImages(doc.data());
    });
    return () => { unsubList(); unsubImages(); };
  }, []);

  useEffect(() => { if (showHistory) fetchHistory(); }, [showHistory]);

  const fetchHistory = async () => {
    if (!db) return;
    try {
      const q = query(collection(db, "wineReports"), orderBy("createdAt", "desc"), limit(10));
      const querySnapshot = await getDocs(q);
      setHistoryReports(querySnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); }
  };

  const filteredData = useMemo(() => {
    return wineList.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.country && item.country.includes(searchTerm)) ||
      (item.grape && item.grape.includes(searchTerm))
    );
  }, [wineList, searchTerm]);

  const handleAddNew = () => {
    setEditForm({
      name: '', type: 'Red', country: '', region: '', vintage: '', grape: '',
      price: '', cost: '', stock_bottles: 0, stock_level: 100, sales_talk: '', pairing_hint: '',
      order: 100, image: '', order_history: []
    });
    setIsEditMode(true); setModalItem({}); setJsonInput(''); setShowJsonInput(false);
  };

  const handleSave = async () => {
    if (!editForm.name) return alert("ワイン名は必須です");
    try {
      const { id, ...dataToSave } = editForm;
      const saveData = {
        ...dataToSave,
        price: Number(editForm.price) || 0,
        cost: Number(editForm.cost) || 0,
        stock_bottles: Number(editForm.stock_bottles) || 0,
        stock_level: Number(editForm.stock_level) || 100,
        order: Number(editForm.order) || 100,
      };
      if (modalItem.id) { await updateDoc(doc(db, "wines", modalItem.id), saveData); alert("更新しました"); }
      else { await addDoc(collection(db, "wines"), saveData); alert("新規登録しました"); }
      setModalItem(null); setIsEditMode(false);
    } catch (e) { alert("保存エラー: " + e.message); }
  };

  const handleDelete = async () => {
    if (!confirm("本当に削除しますか？")) return;
    try { await deleteDoc(doc(db, "wines", modalItem.id)); setModalItem(null); } catch (e) { alert("削除エラー"); }
  };

  // ★★★ 画像ダブル保存ロジック (WineManager版) ★★★
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!modalItem.id && !isEditMode) return alert("先に保存してください");
    try {
      setIsUploading(true);
      const tempId = modalItem.id || Date.now().toString();
      const storageRef = ref(storage, `wine_images/${tempId}.jpg`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      if (modalItem.id) {
         // 1. キャッシュ
         await setDoc(doc(db, "wineImages", "main"), { [modalItem.id]: downloadURL }, { merge: true });
         // 2. 本体
         await updateDoc(doc(db, "wines", modalItem.id), { image: downloadURL });
         
         setCloudImages(prev => ({ ...prev, [modalItem.id]: downloadURL }));
      } else {
         setEditForm(prev => ({ ...prev, image: downloadURL }));
      }
    } catch (e) { alert("アップロード失敗"); } finally { setIsUploading(false); }
  };

  const updateStock = async (id, delta) => {
    const item = wineList.find(i => i.id === id);
    const newStock = Math.max(0, (item.stock_bottles || 0) + delta);
    await updateDoc(doc(db, "wines", id), { stock_bottles: newStock });
  };

  const updateLevel = async (id, level) => {
    await updateDoc(doc(db, "wines", id), { stock_level: level });
  };

  const handleJsonImport = async () => {
    try {
      const cleanJson = jsonInput.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanJson);
      if (Array.isArray(data)) {
        if (!confirm(`${data.length}件のワインデータを登録しますか？`)) return;
        let count = 0;
        for (const item of data) {
            await addDoc(collection(db, "wines"), {
              name: item.name, type: item.category || 'Red', country: item.country || '', region: item.region || '',
              vintage: item.vintage || '', grape: item.grape || '', price: Number(item.price_sell) || 0,
              cost: Number(item.price_cost) || 0, stock_bottles: 0, stock_level: 100, sales_talk: item.sales_talk || '',
              pairing_hint: item.pairing_hint || '', order: 100, image: '', tags: item.tags || []
            });
            count++;
        }
        alert(`${count}件登録しました`); setShowJsonInput(false); setModalItem(null);
      }
    } catch (e) { alert("エラー"); }
  };

  const totalAsset = filteredData.reduce((sum, item) => sum + (item.stock_bottles||0)*(item.cost||0) + Math.round((item.cost||0)*((item.stock_level??100)/100)), 0);

  // 共有機能
  const handleShareStock = async () => {
    const today = new Date().toLocaleDateString('ja-JP');
    let text = `【Wine在庫日報】 ${today}\n----------------------------\n`;
    wineList.forEach(item => {
      if ((item.stock_bottles || 0) > 0 || (item.stock_level ?? 100) < 100) {
        text += `${item.name} (${item.vintage || 'NV'}): ${item.stock_bottles}本`;
        if ((item.stock_level ?? 100) < 100) text += ` (残${item.stock_level}%)`;
        text += `\n`;
      }
    });
    text += `----------------------------\n資産合計: ¥${totalAsset.toLocaleString()}`;
    await shareData(text, "ワイン在庫");
  };

  const handleSaveToCloud = async () => {
    if (!confirm("本日の記録として保存しますか？")) return;
    const itemsToSave = wineList.map(item => ({ ...item, stock: item.stock_bottles || 0 })).filter(i => i.stock > 0 || (i.stock_level ?? 100) < 100);
    await saveDailyReport("wineReports", itemsToSave, totalAsset);
    alert("保存しました");
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20 animate-in fade-in">
      <div className="flex bg-white border-b sticky top-0 z-10 shadow-sm">
        <button onClick={() => setActiveTab('list')} className={`flex-1 py-3 text-sm font-bold ${activeTab === 'list' ? 'text-red-700 border-b-2 border-red-700' : 'text-gray-400'}`}>リスト</button>
        <button onClick={() => setActiveTab('stock')} className={`flex-1 py-3 text-sm font-bold ${activeTab === 'stock' ? 'text-gray-800 border-b-2 border-gray-800' : 'text-gray-400'}`}>資産・在庫</button>
      </div>

      <div className="p-4">
        {activeTab === 'list' && (
          <>
            <div className="relative mb-4"><Search className="absolute left-3 top-2.5 text-gray-400" size={20}/><input type="text" placeholder="検索..." className="w-full pl-10 pr-4 py-2 rounded-lg border" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div>
            <div className="grid grid-cols-1 gap-3">
              {filteredData.map(item => {
                const typeInfo = WINE_TYPES.find(t => t.id === item.type) || WINE_TYPES[0];
                const displayImage = (cloudImages[item.id] || item.image); // 両方チェック
                return (
                  <div key={item.id} onClick={() => { setModalItem(item); setIsEditMode(false); }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex cursor-pointer">
                    <div className="w-28 bg-gray-100 relative flex-shrink-0">
                        {displayImage ? <img src={displayImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Grape size={32}/></div>}
                        {(item.stock_bottles || 0) === 0 && (<div className="absolute inset-0 bg-black/60 flex items-center justify-center"><span className="text-white font-bold text-xs border px-2 py-1">SOLD OUT</span></div>)}
                    </div>
                    <div className="flex-1 p-3 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-1"><span className={`text-[10px] px-2 py-0.5 rounded border ${typeInfo.color}`}>{typeInfo.label}</span><span className="text-xs font-bold text-gray-500">{item.vintage || 'NV'}</span></div>
                            <h3 className="font-bold text-gray-800 text-sm leading-tight mb-1 truncate">{item.name}</h3>
                        </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={handleAddNew} className="fixed bottom-20 right-4 bg-red-700 text-white p-4 rounded-full shadow-lg z-20"><Plus size={24}/></button>
          </>
        )}

        {activeTab === 'stock' && (
          <div className="space-y-4">
            <div className="bg-gray-800 text-white p-4 rounded-xl shadow-lg sticky top-0 z-10">
              <p className="text-xs text-gray-400 font-bold uppercase">在庫資産合計</p>
              <p className="text-2xl font-bold">¥ {totalAsset.toLocaleString()}</p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={handleShareStock} className="bg-white/10 hover:bg-white/20 text-white py-2 rounded flex items-center justify-center gap-2 text-xs font-bold"><Send size={16}/> 在庫リスト送信</button>
                <button onClick={handleSaveToCloud} className="bg-red-600 hover:bg-red-500 border border-red-400 text-white py-2 rounded flex items-center justify-center gap-2 text-xs font-bold"><Save size={16} /> 記録保存</button>
              </div>
            </div>
            {/* 履歴 */}
            <div className="mb-4">
              <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 text-xs font-bold text-gray-500 w-full p-2">{showHistory ? <ChevronDown size={16}/> : <ChevronRight size={16}/>} 過去の履歴</button>
              {showHistory && (
                <div className="bg-white rounded-xl border mt-2 overflow-hidden">
                  {historyReports.map(report => (<div key={report.id} className="p-3 border-b text-xs flex justify-between"><span>{new Date(report.createdAt).toLocaleDateString()}</span><span>¥{report.total_assets?.toLocaleString()}</span></div>))}
                </div>
              )}
            </div>
            {filteredData.map(item => (
              <div key={item.id} className="bg-white p-3 rounded-lg border shadow-sm">
                <div className="flex justify-between items-start mb-3">
                    <div><h3 className="font-bold text-sm text-gray-800">{item.name}</h3></div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => updateStock(item.id, -1)} className="w-8 h-8 rounded shadow-sm flex items-center justify-center border"><Minus size={16}/></button>
                        <span className="font-bold w-6 text-center text-lg">{item.stock_bottles || 0}</span>
                        <button onClick={() => updateStock(item.id, 1)} className="w-8 h-8 rounded shadow-sm flex items-center justify-center border"><Plus size={16}/></button>
                    </div>
                </div>
                {/* 残量スライダー */}
                <div className="border-t border-gray-100 pt-2">
                    <div className="flex justify-between text-[10px] text-gray-400 font-bold mb-1"><span>残量</span><span>{item.stock_level ?? 100}%</span></div>
                    <input type="range" min="0" max="100" step="10" className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" value={item.stock_level ?? 100} onChange={(e) => updateLevel(item.id, Number(e.target.value))}/>
                </div>
                {item.daily_stats && item.daily_stats.length > 0 && (<div className="mt-3 pt-2 border-t border-gray-100"><div className="flex items-center gap-1 mb-1"><TrendingUp size={12} className="text-gray-400"/><span className="text-[10px] text-gray-400">推移</span></div><div className="flex items-end gap-1 h-10">{item.daily_stats.slice(-10).map((stat, idx) => (<div key={idx} className="flex-1 bg-red-100 rounded-t-sm" style={{height: `${Math.min(100, (stat.stock / 10) * 100)}%`}}></div>))}</div></div>)}
              </div>
            ))}
          </div>
        )}
      </div>

      {modalItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModalItem(null)}>
          <div className="bg-white w-full max-w-sm rounded-xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="h-40 bg-gray-100 relative flex-shrink-0">
              {(cloudImages[modalItem.id] || modalItem.image) ? <img src={cloudImages[modalItem.id] || modalItem.image} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-gray-400"><Camera size={32}/></div>}
              <button onClick={() => setModalItem(null)} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"><X size={16}/></button>
              {!isEditMode && <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-2 right-2 bg-white/80 text-xs px-2 py-1 rounded shadow font-bold">写真変更</button>}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload}/>
              {isUploading && <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Loader className="animate-spin text-white"/></div>}
            </div>
            <div className="p-5 overflow-y-auto">
              {!isEditMode ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">{modalItem.name}</h2>
                  {modalItem.sales_talk && <div className="bg-purple-50 p-3 rounded text-sm text-purple-900">{modalItem.sales_talk}</div>}
                  {pairingSuggestions.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                        <div className="flex items-center gap-2 text-purple-700 font-bold text-xs uppercase tracking-wider mb-2"><Sparkles size={14}/> AI Approach</div>
                        <div className="space-y-2">{pairingSuggestions.map((sug, idx) => (<div key={idx} className="bg-purple-50 p-2 rounded text-xs"><span className="font-bold text-purple-900 block">{sug.approach}</span><span className="text-gray-600">{sug.target}</span></div>))}</div>
                    </div>
                  )}
                  <button onClick={() => { setEditForm({...modalItem}); setIsEditMode(true); }} className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold">編集</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button onClick={() => setShowJsonInput(!showJsonInput)} className="bg-purple-500 text-white px-3 py-1.5 rounded-full text-xs font-bold w-full"><Sparkles size={12}/> AI一括</button>
                  {showJsonInput && <div className="bg-purple-50 p-2"><textarea className="w-full h-20 text-xs" value={jsonInput} onChange={e=>setJsonInput(e.target.value)} placeholder="JSON"/><button onClick={handleJsonImport} className="w-full bg-purple-600 text-white text-xs py-1">登録</button></div>}
                  <input className="w-full border p-2 rounded" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}/>
                  <div className="flex gap-2">
                    {modalItem.id && <button onClick={handleDelete} className="flex-1 bg-red-100 text-red-600 py-3 rounded font-bold"><Trash2 className="mx-auto"/></button>}
                    <button onClick={handleSave} className="flex-[3] bg-purple-700 text-white py-3 rounded font-bold">保存</button>
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