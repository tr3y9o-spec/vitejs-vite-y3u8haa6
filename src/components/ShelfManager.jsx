import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Minus, ClipboardCopy, Check, Save, RefreshCw, Upload, Search, X, Sparkles } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, addDoc, writeBatch, query, where, getDocs } from "firebase/firestore";

// 日報生成ロジック（簡易版）
const generateReport = (items, title) => {
  const today = new Date().toLocaleDateString('ja-JP');
  let text = `【${title} 棚卸日報】 ${today}\n------------------\n`;
  items.forEach(item => {
    if ((item.stock || 0) > 0) {
      // ドリンクの場合は単位が「本」それ以外はitem.unitを使用
      const unit = item.unit || '本';
      const detail = item.stock_level ? `(残${item.stock_level}%)` : '';
      text += `${item.name}: ${item.stock}${unit} ${detail}\n`;
    }
  });
  text += `------------------\nTotal Items: ${items.length}`;
  return text;
};

export default function ShelfManager({ mode = 'drinks' }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // AI入力用
  const [showJsonInput, setShowJsonInput] = useState(false);
  const [jsonInput, setJsonInput] = useState('');

  // モードごとの設定
  const config = {
    drinks: { 
      title: 'ドリンク全般', 
      color: 'bg-blue-600', 
      lightColor: 'bg-blue-50 text-blue-800',
      collections: ['sakeList', 'wineList', 'otherList'] // 読み込むDB
    },
    food: { 
      title: '食品・調味料', 
      color: 'bg-orange-600', 
      lightColor: 'bg-orange-50 text-orange-800',
      collections: ['generalItems'],
      filter: 'Food' // generalItems内のカテゴリフィルタ
    },
    supplies: { 
      title: '消耗品・その他', 
      color: 'bg-gray-600', 
      lightColor: 'bg-gray-50 text-gray-800',
      collections: ['generalItems'],
      filter: 'Supply'
    }
  }[mode];

  // データ取得ロジック
  useEffect(() => {
    if (!db) return;
    setLoading(true);
    const unsubscribers = [];

    // ドリンクモード：3つのDBを結合して表示
    if (mode === 'drinks') {
      const unsubSake = onSnapshot(collection(db, "sakeList"), (snap) => updateItems(snap, 'sakeList'));
      const unsubWine = onSnapshot(collection(db, "wineList"), (snap) => updateItems(snap, 'wineList'));
      const unsubOther = onSnapshot(collection(db, "otherList"), (snap) => updateItems(snap, 'otherList'));
      unsubscribers.push(unsubSake, unsubWine, unsubOther);
    } 
    // 食品・消耗品モード：generalItemsからフィルタリング
    else {
      // 本来は複合クエリ推奨だが、簡易的に全件取得してJSでフィルタ
      const unsubGeneral = onSnapshot(collection(db, "generalItems"), (snap) => updateItems(snap, 'generalItems'));
      unsubscribers.push(unsubGeneral);
    }

    return () => unsubscribers.forEach(u => u());
  }, [mode]);

  // データを統合するためのState管理
  // collectionNameをキーにしてデータを保持
  const [rawData, setRawData] = useState({});

  const updateItems = (snapshot, collectionName) => {
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      _collection: collectionName // 更新時に必要
    }));
    setRawData(prev => ({ ...prev, [collectionName]: data }));
    setLoading(false);
  };

  // 表示用データの生成
  const displayItems = useMemo(() => {
    let allItems = [];
    Object.values(rawData).forEach(arr => allItems = [...allItems, ...arr]);

    // モードによるフィルタリング
    if (mode === 'food') allItems = allItems.filter(i => i.categoryType === 'Food');
    if (mode === 'supplies') allItems = allItems.filter(i => i.categoryType === 'Supply');

    // 検索フィルタ
    if (searchTerm) {
      allItems = allItems.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // 統一フォーマットへの変換
    return allItems.map(item => ({
      ...item,
      // フィールド名の揺らぎ吸収
      price: item.price_cost || item.cost || 0,
      stock: (item.stock !== undefined) ? item.stock : (item.stock_bottles !== undefined) ? item.stock_bottles : (item.stock_num !== undefined) ? item.stock_num : 0,
      unit: item.unit || '本'
    }));
  }, [rawData, mode, searchTerm]);

  // 在庫更新
  const updateStock = async (item, delta) => {
    const newStock = Math.max(0, (item.stock || 0) + delta);
    
    // コレクションごとにフィールド名が違う問題を吸収
    let fieldName = 'stock';
    if (item._collection === 'wineList' || item._collection === 'sakeList') fieldName = 'stock_bottles';
    if (item._collection === 'otherList') fieldName = 'stock_num';
    
    await updateDoc(doc(db, item._collection, item.id), { [fieldName]: newStock });
  };

  const updateLevel = async (item, level) => {
    // 酒類のみ残量スライダー対応
    if (['sakeList', 'wineList'].includes(item._collection)) {
      await updateDoc(doc(db, item._collection, item.id), { stock_level: level });
    }
  };

  // AI一括登録 (General Items用)
  const handleJsonImport = async () => {
    try {
      const cleanJson = jsonInput.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanJson);
      
      if (!Array.isArray(data)) throw new Error("配列形式で入力してください");
      if (!confirm(`${data.length}件のデータを登録しますか？`)) return;

      const batch = writeBatch(db);
      // 食品・消耗品は generalItems に入れる
      // ドリンクモードの場合は、適切なDBに振り分ける必要があるが、今回は食品・消耗品メインの実装とする
      
      let targetCollection = "generalItems";
      let categoryType = mode === 'supplies' ? 'Supply' : 'Food';

      // ドリンクモードでここから登録しようとした場合のガード
      if (mode === 'drinks') {
         alert("ドリンクの一括登録は、各マネージャー画面から行ってください。");
         return;
      }

      let count = 0;
      for (const item of data) {
        const newRef = doc(collection(db, targetCollection));
        batch.set(newRef, {
          name: item.name,
          categoryType: categoryType, // Food or Supply
          category: item.category || 'その他',
          price_cost: Number(item.price) || 0,
          stock: Number(item.qty) || 0,
          unit: item.unit || '個',
          vendor: item.vendor || ''
        });
        count++;
      }
      await batch.commit();
      alert(`${count}件登録しました`);
      setShowJsonInput(false); setJsonInput('');

    } catch (e) { alert("エラー: " + e.message); }
  };

  // 日報コピー
  const handleCopy = () => {
    const text = generateReport(displayItems, config.title);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  // 資産合計
  const totalAsset = displayItems.reduce((sum, i) => sum + (i.price * i.stock), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* Header Area */}
      <div className={`sticky top-0 z-20 ${config.color} text-white p-4 shadow-md rounded-b-xl`}>
        <div className="flex justify-between items-end mb-2">
          <div>
            <span className="text-[10px] font-bold opacity-70 uppercase tracking-wider">SHELF MANAGER</span>
            <h2 className="text-2xl font-bold flex items-center gap-2">{config.title}</h2>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-70">資産合計</p>
            <p className="text-xl font-bold">¥ {totalAsset.toLocaleString()}</p>
          </div>
        </div>
        
        {/* Search & Actions */}
        <div className="flex gap-2 mt-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-2.5 text-white/50" size={16}/>
            <input 
              type="text" 
              placeholder="検索..." 
              className="w-full bg-white/10 border border-white/20 rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:bg-white/20"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={handleCopy} className="bg-white text-gray-800 px-3 rounded-lg font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-transform">
            {copied ? <Check size={14}/> : <ClipboardCopy size={14}/>} 日報
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="p-3 space-y-3 mt-2">
        {loading && <div className="text-center text-gray-400 py-10">読み込み中...</div>}
        
        {displayItems.map(item => (
          <div key={item.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${config.lightColor} mb-1 inline-block`}>{item.category || item.category_rank || item.type || 'Item'}</span>
                <h3 className="font-bold text-gray-800 text-sm">{item.name}</h3>
                <p className="text-xs text-gray-400">¥{item.price.toLocaleString()} / {item.unit}</p>
              </div>
              
              <div className="flex items-center gap-3 bg-gray-50 p-1 rounded-lg">
                <button onClick={() => updateStock(item, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 active:scale-95 border border-gray-200"><Minus size={16}/></button>
                <span className="font-bold w-6 text-center text-lg">{item.stock}</span>
                <button onClick={() => updateStock(item, 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 active:scale-95 border border-gray-200"><Plus size={16}/></button>
              </div>
            </div>

            {/* スライダー (酒類のみ) */}
            {['sakeList', 'wineList'].includes(item._collection) && (
              <div className="mt-2 pt-2 border-t border-gray-100">
                <div className="flex justify-between text-[10px] text-gray-400 font-bold mb-1">
                  <span>開封残量</span>
                  <span>{item.stock_level ?? 100}%</span>
                </div>
                <input
                  type="range"
                  min="0" max="100" step="10"
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  value={item.stock_level ?? 100}
                  onChange={(e) => updateLevel(item, Number(e.target.value))}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* AI Add Button (Food/Supplies only) */}
      {mode !== 'drinks' && (
        <>
          <button onClick={() => setShowJsonInput(!showJsonInput)} className={`fixed bottom-20 right-4 ${config.color} text-white p-4 rounded-full shadow-xl hover:opacity-90 active:scale-95 transition-transform z-30`}>
            {showJsonInput ? <X size={24}/> : <Plus size={24}/>}
          </button>

          {showJsonInput && (
            <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4" onClick={() => setShowJsonInput(false)}>
              <div className="bg-white w-full max-w-sm rounded-xl p-4 shadow-2xl animate-in slide-in-from-bottom-5" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Sparkles size={16} className="text-yellow-500"/> AI一括登録</h3>
                <p className="text-xs text-gray-500 mb-2">NotebookLM等のJSONを貼り付けてください</p>
                <textarea 
                  className="w-full h-32 border border-gray-200 rounded-lg p-2 text-xs mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder='[{"name":"醤油", "category":"調味料", "price":300, "qty":5, "unit":"本"}]'
                  value={jsonInput}
                  onChange={e => setJsonInput(e.target.value)}
                />
                <button onClick={handleJsonImport} className={`w-full ${config.color} text-white py-3 rounded-lg font-bold text-sm shadow-md`}>登録実行</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}