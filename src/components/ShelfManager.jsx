import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Minus, ClipboardCopy, Check, Save, RefreshCw, Upload, Search, X, Sparkles, Send, BarChart3, TrendingUp, Truck, Split } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, writeBatch, addDoc } from "firebase/firestore";
// 共通ロジック
import { shareData, saveDailyReport } from '../utils/reportUtils';

export default function ShelfManager({ mode = 'drinks' }) {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderQuantities, setOrderQuantities] = useState({});
  const [showJsonInput, setShowJsonInput] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [expandedItemId, setExpandedItemId] = useState(null);

  // モード設定
  const config = {
    drinks: { 
      title: 'ドリンク全般', 
      color: 'bg-blue-600', 
      lightColor: 'bg-blue-50 text-blue-800',
      collections: ['sakeList', 'wines', 'otherList'],
      reportCollection: 'dailyReports_Drinks' 
    },
    food: { 
      title: '食品・調味料', 
      color: 'bg-orange-600', 
      lightColor: 'bg-orange-50 text-orange-800',
      collections: ['generalItems'],
      filter: 'Food',
      reportCollection: 'dailyReports_Food'
    },
    supplies: { 
      title: '消耗品・その他', 
      color: 'bg-gray-600', 
      lightColor: 'bg-gray-50 text-gray-800',
      collections: ['generalItems'],
      filter: 'Supply',
      reportCollection: 'dailyReports_Supplies'
    }
  }[mode];

  // データ取得
  const [rawData, setRawData] = useState({});

  useEffect(() => {
    if (!db) return;
    setLoading(true);
    const unsubscribers = [];

    const handleSnapshot = (snap, colName) => {
        const data = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            _collection: colName
        }));
        setRawData(prev => ({ ...prev, [colName]: data }));
        setLoading(false);
    };

    if (mode === 'drinks') {
      config.collections.forEach(col => {
          unsubscribers.push(onSnapshot(collection(db, col), (snap) => handleSnapshot(snap, col)));
      });
    } else {
      unsubscribers.push(onSnapshot(collection(db, "generalItems"), (snap) => handleSnapshot(snap, "generalItems")));
    }

    return () => unsubscribers.forEach(u => u());
  }, [mode]);

  // 表示データ生成
  const displayItems = useMemo(() => {
    let allItems = [];
    Object.values(rawData).forEach(arr => allItems = [...allItems, ...arr]);

    if (mode === 'food') allItems = allItems.filter(i => i.categoryType === 'Food');
    if (mode === 'supplies') allItems = allItems.filter(i => i.categoryType === 'Supply');

    if (searchTerm) {
      allItems = allItems.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return allItems.map(item => ({
      ...item,
      price: item.price_cost || item.cost || 0,
      stock: (item.stock !== undefined) ? item.stock : (item.stock_bottles !== undefined) ? item.stock_bottles : (item.stock_num !== undefined) ? item.stock_num : 0,
      unit: item.unit || '個',
      order_qty: orderQuantities[item.id] || 0
    }));
  }, [rawData, mode, searchTerm, orderQuantities]);

  const updateStock = async (item, delta) => {
    const newStock = Math.max(0, (item.stock || 0) + delta);
    let fieldName = 'stock';
    if (item._collection === 'wines' || item._collection === 'sakeList') fieldName = 'stock_bottles';
    if (item._collection === 'otherList') fieldName = 'stock_num';
    
    await updateDoc(doc(db, item._collection, item.id), { [fieldName]: newStock });
  };

  const updateOrderQty = (itemId, delta) => {
    setOrderQuantities(prev => ({
        ...prev,
        [itemId]: Math.max(0, (prev[itemId] || 0) + delta)
    }));
  };

  const handleShare = async (type = 'stock') => {
    const today = new Date().toLocaleDateString('ja-JP');
    let text = "";
    
    if (type === 'order') {
        const orderItems = displayItems.filter(i => i.order_qty > 0);
        if (orderItems.length === 0) return alert("発注数が入力されていません");
        text = `【${config.title} 発注リスト】 ${today}\n------------------\n`;
        orderItems.forEach(item => { text += `${item.name}: ${item.order_qty}${item.unit}\n`; });
    } else {
        text = `【${config.title} 在庫報告】 ${today}\n------------------\n`;
        displayItems.forEach(item => { if (item.stock > 0) text += `${item.name}: ${item.stock}${item.unit}\n`; });
        text += `------------------\n資産合計: ¥${totalAsset.toLocaleString()}`;
    }
    await shareData(text, `${config.title} ${type === 'order' ? '発注' : '在庫'}`);
  };

  const handleSaveReport = async () => {
    if (!confirm(`${config.title}の現在庫と発注内容を記録しますか？`)) return;
    try {
        await saveDailyReport(config.reportCollection, displayItems, totalAsset);
        alert("保存しました。");
    } catch (e) { alert("保存エラー: " + e.message); }
  };

  // ★★★ 自動振り分けインポート機能 ★★★
  const handleSmartImport = async () => {
    try {
      const cleanJson = jsonInput.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanJson);
      
      if (!Array.isArray(data)) throw new Error("配列形式で入力してください");
      
      // 確認ダイアログ
      const sakeCount = data.filter(i => i.target === 'sake').length;
      const wineCount = data.filter(i => i.target === 'wine').length;
      const otherCount = data.filter(i => i.target === 'other').length;
      const generalCount = data.filter(i => i.target === 'general').length;
      
      if (!confirm(`以下の内容で振り分け登録しますか？\n\n🍶 日本酒・焼酎: ${sakeCount}件\n🍷 ワイン: ${wineCount}件\n🍺 その他ドリンク: ${otherCount}件\n📦 食品・消耗品: ${generalCount}件`)) return;

      const batch = writeBatch(db);
      let count = 0;

      for (const item of data) {
        let collectionName = '';
        let docData = {};

        // ターゲットごとのデータ整形
        switch (item.target) {
            case 'sake':
                collectionName = 'sakeList';
                docData = {
                    name: item.name,
                    kana: item.kana || '',
                    type: item.type || 'Sake', // Sake, Shochu, Liqueur
                    category_rank: item.rank || 'Take',
                    price_cost: Number(item.price) || 0,
                    capacity_ml: Number(item.capacity) || 1800,
                    stock_bottles: Number(item.qty) || 0,
                    stock_level: 100,
                    order_history: []
                };
                break;
            case 'wine':
                collectionName = 'wines';
                docData = {
                    name: item.name,
                    type: item.color || 'Red', // Red, White, Sparkling...
                    vintage: item.vintage || '',
                    country: item.country || '',
                    price: Number(item.price_sell) || 0,
                    cost: Number(item.price) || 0,
                    stock_bottles: Number(item.qty) || 0,
                    stock_level: 100,
                    order_history: []
                };
                break;
            case 'other':
                collectionName = 'otherList';
                docData = {
                    name: item.name,
                    category: item.category || 'Other',
                    price_cost: Number(item.price) || 0,
                    stock_num: Number(item.qty) || 0,
                    order_history: []
                };
                break;
            default: // general (food/supply)
                collectionName = 'generalItems';
                docData = {
                    name: item.name,
                    categoryType: mode === 'supplies' ? 'Supply' : 'Food', // 現在のモードに依存させるか、JSONの指定に従うか
                    category: item.category || 'その他',
                    price_cost: Number(item.price) || 0,
                    stock: Number(item.qty) || 0,
                    unit: item.unit || '個'
                };
                // JSONでgeneral指定かつcategoryType指定がない場合は現在のタブのモードを適用
                if(item.target === 'general' && !item.categoryType) {
                    // modeがdrinksの場合はデフォルトFoodにする等の処理
                    docData.categoryType = (mode === 'supplies') ? 'Supply' : 'Food';
                }
                break;
        }

        if (collectionName) {
            const newRef = doc(collection(db, collectionName));
            batch.set(newRef, docData);
            count++;
        }
      }

      await batch.commit();
      alert(`${count}件のデータを各マネージャーに振り分けて登録しました！`);
      setShowJsonInput(false); 
      setJsonInput('');

    } catch (e) {
      alert("エラー: " + e.message + "\nJSONの形式またはtarget指定を確認してください。");
    }
  };

  const totalAsset = displayItems.reduce((sum, i) => sum + (i.price * i.stock), 0);
  const totalOrderCount = Object.values(orderQuantities).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* Header */}
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
          <button onClick={() => handleShare('stock')} className="bg-white/20 text-white px-3 rounded-lg font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95">
            <Send size={14}/> 在庫
          </button>
          <button onClick={handleSaveReport} className="bg-white text-gray-800 px-3 rounded-lg font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95">
             <Save size={14}/> 記録
          </button>
        </div>

        {totalOrderCount > 0 && (
            <div className="mt-3 bg-white/90 text-gray-900 p-2 rounded-lg flex justify-between items-center animate-in slide-in-from-top-2">
                <span className="text-xs font-bold">発注候補: {totalOrderCount}点</span>
                <button onClick={() => handleShare('order')} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold shadow flex items-center gap-1 active:scale-95">
                    <Send size={12}/> 発注リスト送信
                </button>
            </div>
        )}
      </div>

      {/* List */}
      <div className="p-3 space-y-3 mt-2">
        {loading && <div className="text-center text-gray-400 py-10">読み込み中...</div>}
        {displayItems.map(item => (
          <div key={item.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
            <button 
                onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                className="absolute top-3 right-3 text-gray-300 hover:text-blue-500"
            >
                <BarChart3 size={18}/>
            </button>

            <div className="flex justify-between items-start mb-2 pr-8">
              <div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${config.lightColor} mb-1 inline-block`}>{item.category || 'Item'}</span>
                <h3 className="font-bold text-gray-800 text-sm">{item.name}</h3>
                <p className="text-xs text-gray-400">¥{item.price.toLocaleString()} / {item.unit}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 flex flex-col items-center">
                    <span className="text-[9px] text-gray-400 font-bold mb-1">現在庫</span>
                    <div className="flex items-center gap-3">
                        <button onClick={() => updateStock(item, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 active:scale-95 border border-gray-200"><Minus size={16}/></button>
                        <span className="font-bold w-6 text-center text-lg">{item.stock}</span>
                        <button onClick={() => updateStock(item, 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 active:scale-95 border border-gray-200"><Plus size={16}/></button>
                    </div>
                </div>
                <div className="bg-green-50 p-2 rounded-lg border border-green-100 flex flex-col items-center relative">
                    <span className="text-[9px] text-green-700 font-bold mb-1">発注数</span>
                    {item.order_qty > 0 && <span className="absolute top-[-5px] right-[-5px] w-4 h-4 bg-red-500 rounded-full animate-ping opacity-75"></span>}
                    <div className="flex items-center gap-3">
                        <button onClick={() => updateOrderQty(item.id, -1)} className={`w-8 h-8 flex items-center justify-center rounded shadow-sm active:scale-95 border ${item.order_qty > 0 ? 'bg-white text-green-700 border-green-200' : 'bg-gray-100 text-gray-300 border-transparent'}`}><Minus size={16}/></button>
                        <span className={`font-bold w-6 text-center text-lg ${item.order_qty > 0 ? 'text-green-700' : 'text-gray-300'}`}>{item.order_qty}</span>
                        <button onClick={() => updateOrderQty(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded shadow-sm text-green-700 active:scale-95 border border-green-200"><Plus size={16}/></button>
                    </div>
                </div>
            </div>

            {expandedItemId === item.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 animate-in fade-in">
                    <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1"><TrendingUp size={14}/> 在庫履歴 (直近7回分)</p>
                    {item.daily_stats && item.daily_stats.length > 0 ? (
                        <div className="flex items-end gap-1 h-24 border-b border-gray-200 pb-1">
                            {item.daily_stats.slice(-7).map((stat, idx) => (
                                <div key={idx} className="flex-1 flex flex-col items-center group relative">
                                    {stat.order_qty > 0 && (<div className="w-full bg-green-400 opacity-50 absolute bottom-0" style={{ height: `${Math.min(100, stat.order_qty * 10)}%` }}></div>)}
                                    <div className="w-3/4 bg-blue-500 rounded-t-sm z-10" style={{ height: `${Math.min(100, (stat.stock / 20) * 100)}%` }}></div>
                                    <span className="text-[8px] text-gray-400 mt-1 transform -rotate-45 origin-left translate-y-2">{stat.date.slice(5)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-xs text-gray-400 py-4">履歴データがまだありません</div>
                    )}
                </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Smart Import Button (Always visible) */}
      <button onClick={() => setShowJsonInput(!showJsonInput)} className={`fixed bottom-20 right-4 ${config.color} text-white p-4 rounded-full shadow-xl hover:opacity-90 active:scale-95 transition-transform z-30`}>
           <Plus size={24}/>
      </button>

      {showJsonInput && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4" onClick={() => setShowJsonInput(false)}>
            <div className="bg-white w-full max-w-sm rounded-xl p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Split size={18} className="text-purple-600"/> 自動振り分け登録</h3>
                <p className="text-xs text-gray-500 mb-3">AIに <code>target: "sake" / "wine" / "other" / "general"</code> を指定させたJSONを貼り付けてください。</p>
                <textarea 
                  className="w-full h-32 border border-gray-200 rounded-lg p-2 text-xs mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={jsonInput}
                  onChange={e => setJsonInput(e.target.value)}
                  placeholder='[{"target":"sake", "name":"黒霧島", ...}]'
                />
                <button onClick={handleSmartImport} className={`w-full ${config.color} text-white py-3 rounded-lg font-bold shadow-md`}>振り分け登録を実行</button>
            </div>
        </div>
      )}
    </div>
  );
}