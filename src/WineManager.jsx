import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Plus, Minus, Camera, Loader, X, Save, Trash2, Grape, Globe, DollarSign, Check, ClipboardCopy, ChevronDown, ChevronRight, Sparkles, Utensils, BookOpen, History } from 'lucide-react';
import { db, storage } from './firebase';
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, query, orderBy, limit, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
// ★ コラム機能のインポート
import { WINE_TYPES, generateDailyWineReport, getWinePairing } from './utils/wineLogic';

export default function WineManager() {
  const [activeTab, setActiveTab] = useState('list');
  const [wineList, setWineList] = useState([]);
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

  // ペアリング提案の取得
  const pairingSuggestions = modalItem ? getWinePairing(modalItem) : [];

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "wines"), orderBy('order', 'asc'));
    const unsubList = onSnapshot(q, (snapshot) => {
      setWineList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
      price: '', cost: '', stock_bottles: 0, sales_talk: '', pairing_hint: '',
      order: 100, image: '', order_history: []
    });
    setIsEditMode(true); setModalItem({}); setJsonInput(''); setShowJsonInput(false);
  };

  const handleSave = async () => {
    if (!editForm.name) return alert("ワイン名は必須です");
    try {
      const saveData = {
        ...editForm,
        price: Number(editForm.price) || 0,
        cost: Number(editForm.cost) || 0,
        stock_bottles: Number(editForm.stock_bottles) || 0,
        order: Number(editForm.order) || 100,
      };
      if (modalItem.id) {
        await updateDoc(doc(db, "wines", modalItem.id), saveData);
        alert("更新しました");
      } else {
        await addDoc(collection(db, "wines"), saveData);
        alert("新規登録しました");
      }
      setModalItem(null); setIsEditMode(false);
    } catch (e) { alert("保存エラー: " + e.message); }
  };

  const handleDelete = async () => {
    if (!confirm("本当に削除しますか？")) return;
    try { await deleteDoc(doc(db, "wines", modalItem.id)); setModalItem(null); } catch (e) { alert("削除エラー"); }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files;
    if (!file) return;
    if (!modalItem.id && !isEditMode) return alert("先に保存してください");
    try {
      setIsUploading(true);
      const tempId = modalItem.id || Date.now().toString();
      const storageRef = ref(storage, `wine_images/${tempId}.jpg`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setEditForm(prev => ({ ...prev, image: downloadURL }));
      if (modalItem.id) {
        await updateDoc(doc(db, "wines", modalItem.id), { image: downloadURL });
        setModalItem(prev => ({ ...prev, image: downloadURL }));
      }
    } catch (e) { alert("アップロード失敗"); } finally { setIsUploading(false); }
  };

  const updateStock = async (id, delta) => {
    const item = wineList.find(i => i.id === id);
    if (!item) return;
    const newStock = Math.max(0, (item.stock_bottles || 0) + delta);
    await updateDoc(doc(db, "wines", id), { stock_bottles: newStock });
  };

  const handleJsonImport = async () => {
    try {
      const cleanJson = jsonInput.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanJson);
      if (Array.isArray(data)) {
        if (!confirm(`${data.length}件のワインデータを登録しますか？`)) return;
        let count = 0;
        for (const item of data) {
          const exists = wineList.some(i => i.name === item.name);
          if (!exists) {
            await addDoc(collection(db, "wines"), {
              name: item.name,
              type: item.category || 'Red',
              country: item.country || '',
              region: item.region || '',
              vintage: item.vintage || '',
              grape: item.grape || '',
              price: Number(item.price_sell) || 0,
              cost: Number(item.price_cost) || 0,
              stock_bottles: 0,
              sales_talk: item.sales_talk || '',
              pairing_hint: item.pairing_hint || '',
              order: 100,
              image: '',
              tags: item.tags || []
            });
            count++;
          }
        }
        alert(`${count}件を新規登録しました！`); setShowJsonInput(false); setModalItem(null);
      } else {
        setEditForm(prev => ({ ...prev, ...data })); alert("データを反映しました。"); setShowJsonInput(false);
      }
    } catch (e) { alert("データ形式エラー"); }
  };

  const handleSaveToCloud = async () => {
    if (!confirm("本日の記録として保存しますか？")) return;
    try {
      const today = new Date();
      await addDoc(collection(db, "wineReports"), {
        date: today.toLocaleDateString('ja-JP'), createdAt: today.toISOString(),
        total_assets: filteredData.reduce((sum, i) => sum + ((i.stock_bottles||0) * (i.cost||0)), 0),
        items: filteredData.map(item => ({ name: item.name, vintage: item.vintage || 'NV', id: item.id, stock: item.stock_bottles || 0 })).filter(i => i.stock > 0)
      });
      alert("保存しました！"); if (showHistory) fetchHistory();
    } catch (e) { alert("保存失敗: " + e.message); }
  };

  const generateReport = () => {
    const report = generateDailyWineReport(wineList);
    navigator.clipboard.writeText(report).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); alert("コピーしました"); });
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
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20}/>
              <input type="text" placeholder="ワイン名、国、品種..." className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-red-500 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {filteredData.map(item => {
                const typeInfo = WINE_TYPES.find(t => t.id === item.type) || WINE_TYPES;
                return (
                  <div key={item.id} onClick={() => { setModalItem(item); setIsEditMode(false); }} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex gap-3 active:scale-[0.99] transition-transform cursor-pointer">
                    <div className="w-16 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
                      {cloudImages[item.id] ? <img src={cloudImages[item.id]} className="w-full h-full object-cover"/> : <Grape className="text-gray-300 m-auto mt-6"/>}
                      {(item.stock_bottles || 0) === 0 && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-[10px] font-bold">SOLD OUT</div>}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${typeInfo.color}`}>{typeInfo.label}</span>
                        <span className="text-xs font-bold text-gray-500">{item.vintage || 'NV'}</span>
                      </div>
                      <h3 className="font-bold text-gray-800 truncate mt-1">{item.name}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        {item.country && <span className="flex items-center gap-0.5"><Globe size={10}/>{item.country}</span>}
                        {item.grape && <span className="flex items-center gap-0.5"><Grape size={10}/>{item.grape}</span>}
                        <span className="flex items-center gap-0.5 font-bold text-gray-700 ml-auto">¥{item.price ? Number(item.price).toLocaleString() : '-'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={handleAddNew} className="fixed bottom-20 right-4 bg-red-700 text-white p-4 rounded-full shadow-lg hover:bg-red-800 z-20"><Plus size={24}/></button>
          </>
        )}

        {activeTab === 'stock' && (
          <div className="space-y-4">
            <div className="bg-gray-800 text-white p-4 rounded-xl shadow-lg mb-4">
              <p className="text-xs text-gray-400 font-bold uppercase">在庫資産合計</p>
              <p className="text-2xl font-bold">¥ {filteredData.reduce((sum, i) => sum + ((i.stock_bottles||0) * (i.cost||0)), 0).toLocaleString()}</p>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={generateReport} className="bg-white/10 py-2 rounded flex items-center justify-center gap-2 text-xs font-bold hover:bg-white/20">{copied ? <Check size={16}/> : <ClipboardCopy size={16}/>} コピー</button>
                <button onClick={handleSaveToCloud} className="bg-red-600 hover:bg-red-500 border border-red-400 text-white py-2 rounded flex items-center justify-center gap-2 text-xs font-bold shadow-md"><Save size={16} /> 記録保存</button>
              </div>
            </div>
            
            {/* 履歴閲覧機能 */}
            <div className="mb-4">
              <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-800 w-full p-2">{showHistory ? <ChevronDown size={16}/> : <ChevronRight size={16}/>} 過去のワイン履歴</button>
              {showHistory && (
                <div className="bg-white rounded-xl border mt-2 overflow-hidden">
                  {historyReports.map(report => (
                    <div key={report.id} className="p-3 border-b flex justify-between items-center text-xs">
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                      <span>¥{report.total_assets.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {filteredData.map(item => (
              <div key={item.id} className="bg-white p-3 rounded-lg border flex justify-between items-center shadow-sm">
                <div><h3 className="font-bold text-sm text-gray-800">{item.name}</h3><p className="text-xs text-gray-500">{item.vintage || 'NV'} / 原価:¥{(item.cost || 0).toLocaleString()}</p></div>
                <div className="flex items-center gap-3">
                  <button onClick={() => updateStock(item.id, -1)} className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"><Minus size={16}/></button>
                  <span className="font-bold w-6 text-center">{item.stock_bottles || 0}</span>
                  <button onClick={() => updateStock(item.id, 1)} className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-100"><Plus size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModalItem(null)}>
          <div className="bg-white w-full max-w-sm rounded-xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="h-40 bg-gray-100 relative group flex-shrink-0">
              {cloudImages[modalItem.id] ? <img src={cloudImages[modalItem.id]} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-gray-400"><Camera size={32}/></div>}
              {!isEditMode && <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-2 right-2 bg-white/80 text-gray-700 px-2 py-1 rounded text-xs font-bold shadow flex items-center gap-1"><Camera size={12}/> 写真変更</button>}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload}/>
              {isUploading && <div className="absolute inset-0 bg-black/30 flex items-center justify-center"><Loader className="animate-spin text-white"/></div>}
              <button onClick={() => setModalItem(null)} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"><X size={16}/></button>
            </div>

            <div className="p-5 overflow-y-auto">
              {!isEditMode ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${WINE_TYPES.find(t => t.id === modalItem.type)?.color}`}>{WINE_TYPES.find(t => t.id === modalItem.type)?.label}</span>
                      <span className="text-xl font-bold text-gray-800">{modalItem.vintage || 'NV'}</span>
                    </div>
                    <h2 className="text-xl font-bold mt-1">{modalItem.name}</h2>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-1"><Globe size={14}/> {modalItem.country || '未設定'} / {modalItem.region}</div>
                    <div className="flex items-center gap-1"><Grape size={14}/> {modalItem.grape || '未設定'}</div>
                    <div className="flex items-center gap-1"><DollarSign size={14}/> 売価: ¥{Number(modalItem.price).toLocaleString()}</div>
                    <div className="flex items-center gap-1"><Check size={14}/> 在庫: {modalItem.stock_bottles}本</div>
                  </div>

                  {modalItem.sales_talk && <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500"><p className="text-purple-900 font-medium text-sm leading-relaxed">"{modalItem.sales_talk}"</p></div>}
                  {modalItem.pairing_hint && <div className="flex items-start gap-3 bg-orange-50 p-3 rounded-lg border border-orange-100"><Utensils className="text-orange-500 mt-0.5" size={18} /><div><span className="block text-xs font-bold text-orange-800 mb-0.5">おすすめペアリング</span><p className="text-sm text-orange-900">{modalItem.pairing_hint}</p></div></div>}

                  {/* ★ WineLogicによるペアリング提案を表示 */}
                  {pairingSuggestions.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                        <div className="flex items-center gap-2 text-purple-700 font-bold text-xs uppercase tracking-wider mb-2">
                            <Sparkles size={14}/> AI Approach
                        </div>
                        <div className="space-y-2">
                            {pairingSuggestions.map((sug, idx) => (
                                <div key={idx} className="bg-purple-50 p-2 rounded text-xs">
                                    <span className="font-bold text-purple-900 block">{sug.approach}</span>
                                    <span className="text-gray-600">{sug.target}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                  )}

                  <button onClick={() => { setEditForm({...modalItem}); setIsEditMode(true); }} className="w-full bg-gray-900 text-white py-3 rounded-lg font-bold">編集する</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center mb-2"><label className="text-xs font-bold text-gray-500">一括登録</label><button onClick={() => setShowJsonInput(!showJsonInput)} className="bg-purple-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md hover:opacity-90 flex items-center gap-1 animate-pulse"><Sparkles size={12}/> AI一括入力</button></div>
                  {showJsonInput && (<div className="bg-purple-50 p-3 rounded-lg border border-purple-200 mb-4 animate-in slide-in-from-top-2"><textarea className="w-full border border-purple-200 rounded p-2 text-xs h-24 mb-2 bg-white" value={jsonInput} onChange={e => setJsonInput(e.target.value)} placeholder='[{"name":"ワイン名", ...}]'/><button onClick={handleJsonImport} className="w-full bg-purple-600 text-white py-2 rounded font-bold text-xs shadow hover:bg-purple-700">登録実行</button></div>)}
                  
                  <div><label className="text-xs font-bold text-gray-400">名前</label><input className="w-full border p-2 rounded" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}/></div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs font-bold text-gray-400">タイプ</label><select className="w-full border p-2 rounded bg-white" value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})}>{WINE_TYPES.map(t => (<option key={t.id} value={t.id}>{t.label}</option>))}</select></div>
                    <div><label className="text-xs font-bold text-gray-400">ヴィンテージ</label><input className="w-full border p-2 rounded" placeholder="2020" value={editForm.vintage} onChange={e => setEditForm({...editForm, vintage: e.target.value})}/></div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs font-bold text-gray-400">国</label><input className="w-full border p-2 rounded" placeholder="フランス" value={editForm.country} onChange={e => setEditForm({...editForm, country: e.target.value})}/></div>
                    <div><label className="text-xs font-bold text-gray-400">産地</label><input className="w-full border p-2 rounded" placeholder="ボルドー" value={editForm.region} onChange={e => setEditForm({...editForm, region: e.target.value})}/></div>
                  </div>
                  <div><label className="text-xs font-bold text-gray-400">ブドウ品種</label><input className="w-full border p-2 rounded" placeholder="カベルネ・ソーヴィニヨン等" value={editForm.grape} onChange={e => setEditForm({...editForm, grape: e.target.value})}/></div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><label className="text-xs font-bold text-gray-400">売価</label><input type="number" className="w-full border p-2 rounded" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})}/></div>
                    <div><label className="text-xs font-bold text-gray-400">原価</label><input type="number" className="w-full border p-2 rounded" value={editForm.cost} onChange={e => setEditForm({...editForm, cost: e.target.value})}/></div>
                    <div><label className="text-xs font-bold text-gray-400">在庫数</label><input type="number" className="w-full border p-2 rounded" value={editForm.stock_bottles} onChange={e => setEditForm({...editForm, stock_bottles: e.target.value})}/></div>
                  </div>
                  <div><label className="text-xs font-bold text-gray-400">表示順</label><input type="number" className="w-full border p-2 rounded" placeholder="100" value={editForm.order} onChange={e => setEditForm({...editForm, order: e.target.value})}/></div>
                  <div><label className="text-xs font-bold text-gray-400">セールストーク</label><textarea className="w-full border p-2 rounded h-20" value={editForm.sales_talk} onChange={e => setEditForm({...editForm, sales_talk: e.target.value})}/></div>
                  <div><label className="text-xs font-bold text-gray-400">ペアリング</label><input className="w-full border p-2 rounded" value={editForm.pairing_hint} onChange={e => setEditForm({...editForm, pairing_hint: e.target.value})}/></div>
                  
                  <div className="flex gap-2 pt-4 border-t">
                    {modalItem.id && <button onClick={handleDelete} className="flex-1 bg-red-100 text-red-600 py-3 rounded font-bold"><Trash2 size={16} className="mx-auto"/></button>}
                    <button onClick={handleSave} className="flex- bg-purple-700 text-white py-3 rounded font-bold flex items-center justify-center gap-2"><Save size={18}/> 保存</button>
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