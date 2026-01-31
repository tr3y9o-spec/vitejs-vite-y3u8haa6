import React, { useState, useEffect } from 'react';
import { RefreshCw, Plus, Minus, Save, Calendar, ChevronDown, ChevronRight, Send, TrendingUp } from 'lucide-react';
import { doc, updateDoc, arrayUnion, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
// 共通ロジック (LINE共有/日報保存)
import { shareData, saveDailyReport } from '../utils/reportUtils';

const StockView = ({ data }) => {
  // 資産総額計算
  const totalAssetValue = data.reduce(
    (sum, item) =>
      sum +
      (item.stock_bottles || 0) * item.price_cost +
      Math.round(item.price_cost * ((item.stock_level ?? 100) / 100)),
    0
  );

  // State
  const [restockModalItem, setRestockModalItem] = useState(null);
  const [restockDate, setRestockDate] = useState('');
  
  // 履歴機能用
  const [historyReports, setHistoryReports] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState(null);

  useEffect(() => {
    if (showHistory) fetchHistory();
  }, [showHistory]);

  const fetchHistory = async () => {
    if (!db) return;
    try {
      const q = query(collection(db, 'sakeReports'), orderBy('createdAt', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      setHistoryReports(querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error('履歴取得エラー', e); }
  };

  // 在庫更新
  const updateStock = async (id, field, val) => {
    if (!id) return;
    try {
      await updateDoc(doc(db, 'sakeList', id), {
        [field]: val,
        stock_updated_at: new Date().toISOString(),
      });
    } catch (e) { alert('更新失敗'); }
  };

  // 納品ハンドラ (納品日を指定して追加)
  const handleRestockSubmit = async () => {
    if (!restockModalItem || !restockDate) return;
    try {
      const recordDate = new Date(restockDate);
      recordDate.setHours(12, 0, 0);
      await updateDoc(doc(db, 'sakeList', restockModalItem.id), {
        stock_bottles: (restockModalItem.stock_bottles || 0) + 1,
        stock_updated_at: new Date().toISOString(),
        order_history: arrayUnion(recordDate.toISOString()),
      });
      setRestockModalItem(null);
    } catch (e) { alert('納品処理に失敗しました'); }
  };

  // ★ LINE共有 (在庫リストのみ)
  const handleShareStock = async () => {
    const today = new Date().toLocaleDateString('ja-JP');
    let text = `【日本酒 在庫報告】 ${today}\n------------------\n`;
    
    // 在庫がある、または開封中のものをリストアップ
    const activeItems = data.filter(item => (item.stock_bottles || 0) > 0 || (item.stock_level || 100) < 100);
    
    if (activeItems.length === 0) {
        text += "在庫データなし";
    } else {
        activeItems.forEach(item => {
            text += `${item.name}: ${item.stock_bottles}本`;
            if ((item.stock_level || 100) < 100) {
                text += ` (開:${item.stock_level}%)`;
            }
            text += `\n`;
        });
    }
    
    text += `------------------\n資産合計: ¥${totalAssetValue.toLocaleString()}`;
    await shareData(text, '日本酒在庫');
  };

  // ★ クラウド保存
  const handleSaveToCloud = async () => {
    if (!confirm('現在の在庫状況を「本日の記録」として保存しますか？\n（同日は上書きされます）')) return;
    try {
      const itemsToSave = data.map(item => ({
          ...item,
          stock: item.stock_bottles || 0,
      })).filter(i => i.stock > 0);

      await saveDailyReport('sakeReports', itemsToSave, totalAssetValue);
      alert('クラウドに保存しました！');
      if (showHistory) fetchHistory();
    } catch (e) {
      console.error(e);
      alert('保存に失敗しました: ' + e.message);
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen pb-24 animate-in fade-in duration-500">
      {/* 資産サマリー & アクション */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl p-6 text-white shadow-lg mb-6 sticky top-0 z-10">
        <p className="text-gray-300 text-xs font-bold uppercase tracking-wider mb-1">現在の棚卸し資産総額</p>
        <p className="text-3xl font-bold">¥ {totalAssetValue.toLocaleString()}</p>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button onClick={handleShareStock} className="bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-95">
            <Send size={16} /> <span className="text-xs font-bold">在庫リスト送信</span>
          </button>
          <button onClick={handleSaveToCloud} className="bg-blue-600 hover:bg-blue-500 border border-blue-400 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-md">
            <Save size={16} /> <span className="text-xs font-bold">日報を記録保存</span>
          </button>
        </div>
      </div>

      {/* 履歴閲覧トグル */}
      <div className="mb-4">
        <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors w-full p-2">
          {showHistory ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Calendar size={14} /> 過去の在庫履歴を見る
        </button>

        {showHistory && (
          <div className="bg-white rounded-xl border border-gray-200 mt-2 overflow-hidden animate-in slide-in-from-top-2">
            <div className="bg-gray-50 px-4 py-2 text-xs font-bold text-gray-500 border-b">最近のレポート (最新10件)</div>
            {historyReports.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">履歴がありません</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {historyReports.map((report) => (
                  <div key={report.id} className="text-sm">
                    <div onClick={() => setExpandedReportId(expandedReportId === report.id ? null : report.id)} className="p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">{report.date}</span>
                        <span className="text-[10px] text-gray-400">{new Date(report.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-600">¥{report.total_assets?.toLocaleString()}</span>
                        {expandedReportId === report.id ? <ChevronDown size={14} className="text-gray-300" /> : <ChevronRight size={14} className="text-gray-300" />}
                      </div>
                    </div>
                    {expandedReportId === report.id && (
                      <div className="bg-gray-50 p-3 text-xs border-t border-inner shadow-inner">
                        <div className="grid grid-cols-1 gap-1">
                          {report.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between border-b border-gray-100 last:border-0 py-1">
                              <span className="text-gray-700">{item.name}</span>
                              <span className="text-gray-500">{item.stock}本</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 在庫リスト */}
      <div className="space-y-4">
        {data.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-gray-800">{item.name}</h3>
                <span className="text-xs text-gray-500">原価: ¥{item.price_cost.toLocaleString()}</span>
              </div>
              <button onClick={() => { setRestockModalItem(item); setRestockDate(new Date().toISOString().split('T')[0]); }} className="flex flex-col items-center justify-center bg-gray-50 text-gray-600 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 active:scale-95 transition-transform">
                <RefreshCw size={16} />
                <span className="text-[10px] font-bold mt-1">納品日指定</span>
              </button>
            </div>

            {/* 在庫操作エリア（発注機能削除済み） */}
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-3">
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500">現在庫</span>
                    <div className="flex items-center gap-4">
                        <button onClick={() => updateStock(item.id, 'stock_bottles', Math.max(0, (item.stock_bottles || 0) - 1))} className="w-10 h-10 flex items-center justify-center bg-white border rounded-full shadow-sm active:bg-gray-200"><Minus size={18} /></button>
                        <span className="font-bold text-xl w-8 text-center">{item.stock_bottles || 0}</span>
                        <button onClick={() => updateStock(item.id, 'stock_bottles', (item.stock_bottles || 0) + 1)} className="w-10 h-10 flex items-center justify-center bg-white border rounded-full shadow-sm active:bg-gray-200"><Plus size={18} /></button>
                    </div>
                </div>
            </div>

            {/* 開封済み残量 */}
            <div>
              <div className="flex justify-between text-xs mb-1 px-1">
                <span className="text-gray-500">開封ボトル残量</span>
                <span className={`font-bold ${item.stock_level < 20 ? 'text-red-600' : 'text-blue-600'}`}>{item.stock_level ?? 100}%</span>
              </div>
              <input type="range" min="0" max="100" step="10" value={item.stock_level ?? 100} onChange={(e) => updateStock(item.id, 'stock_level', Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
            </div>

            {/* グラフ表示 */}
            {item.daily_stats && item.daily_stats.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1 mb-1"><TrendingUp size={12} className="text-gray-400"/><span className="text-[10px] text-gray-400">推移</span></div>
                    <div className="flex items-end gap-1 h-10">
                        {item.daily_stats.slice(-10).map((stat, idx) => (
                            <div key={idx} className="flex-1 bg-blue-100 rounded-t-sm" style={{height: `${Math.min(100, (stat.stock / 10) * 100)}%`}}></div>
                        ))}
                    </div>
                </div>
            )}
          </div>
        ))}
      </div>

      {/* 納品日指定モーダル */}
      {restockModalItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRestockModalItem(null)}>
          <div className="bg-white w-full max-w-xs rounded-xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-2 text-gray-800">納品登録</h3>
            <p className="text-sm text-gray-500 mb-4">{restockModalItem.name} を1本追加します。<br />いつ届きましたか？</p>
            <label className="block text-xs font-bold text-gray-500 mb-1">納品日</label>
            <input type="date" className="w-full border border-gray-300 rounded-lg p-3 mb-6 font-bold text-gray-700 bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none" value={restockDate} onChange={(e) => setRestockDate(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={() => setRestockModalItem(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-lg font-bold text-sm">キャンセル</button>
              <button onClick={handleRestockSubmit} className="flex-[2] py-3 bg-green-600 text-white rounded-lg font-bold text-sm shadow-md hover:bg-green-700">確定 (+1本)</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockView;
