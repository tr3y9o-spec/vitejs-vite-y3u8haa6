import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Plus,
  Minus,
  ClipboardCopy,
  Check,
  Save,
  Calendar,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  doc,
  updateDoc,
  arrayUnion,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';
import { generateDailyStockReport } from '../utils/sakeLogic';

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
  const [copied, setCopied] = useState(false);

  // ★ 履歴機能用 State
  const [historyReports, setHistoryReports] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState(null);

  // 初回ロード時に履歴を取得
  useEffect(() => {
    if (showHistory) fetchHistory();
  }, [showHistory]);

  // 履歴データの取得 (最新10件)
  const fetchHistory = async () => {
    if (!db) return;
    try {
      const q = query(
        collection(db, 'sakeReports'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const querySnapshot = await getDocs(q);
      setHistoryReports(
        querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
    } catch (e) {
      console.error('履歴取得エラー', e);
    }
  };

  // 在庫更新ハンドラ (変更なし)
  const updateStock = async (id, field, val) => {
    if (!id) return;
    try {
      await updateDoc(doc(db, 'sakeList', id), {
        [field]: val,
        stock_updated_at: new Date().toISOString(),
      });
    } catch (e) {
      alert('更新失敗');
    }
  };

  // 納品ハンドラ (変更なし)
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
    } catch (e) {
      alert('納品処理に失敗しました');
    }
  };

  // クリップボードコピー (変更なし)
  const handleCopyReport = async () => {
    const report = generateDailyStockReport(data);
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ★ データベースへの保存機能
  const handleSaveToCloud = async () => {
    if (
      !confirm(
        '現在の在庫状況を「本日の記録」として保存しますか？\n（同日に複数回保存すると、最新の記録として追加されます）'
      )
    )
      return;

    try {
      // 保存するデータ構造
      const today = new Date();
      const reportData = {
        date: today.toLocaleDateString('ja-JP'),
        createdAt: today.toISOString(),
        total_assets: totalAssetValue,
        items: data
          .map((item) => ({
            name: item.name,
            id: item.id,
            stock: item.stock_bottles || 0,
            level: item.stock_level ?? 100,
            // 今日納品された数を計算して保存
            delivered_today: (item.order_history || []).filter(
              (d) => new Date(d).toDateString() === today.toDateString()
            ).length,
          }))
          .filter((i) => i.stock > 0 || i.delivered_today > 0), // 在庫なし＆納品なしは除外して軽量化
      };

      await addDoc(collection(db, 'sakeReports'), reportData);
      alert('クラウドに保存しました！');
      if (showHistory) fetchHistory(); // 履歴が開いていれば更新
    } catch (e) {
      console.error(e);
      alert('保存に失敗しました: ' + e.message);
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen pb-24 animate-in fade-in duration-500">
      {/* 資産サマリー & アクション */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl p-6 text-white shadow-lg mb-6">
        <p className="text-gray-300 text-xs font-bold uppercase tracking-wider mb-1">
          現在の棚卸し資産総額
        </p>
        <p className="text-3xl font-bold">
          ¥ {totalAssetValue.toLocaleString()}
        </p>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={handleCopyReport}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-95"
          >
            {copied ? (
              <Check size={16} className="text-green-400" />
            ) : (
              <ClipboardCopy size={16} />
            )}
            <span className="text-xs font-bold">
              {copied ? 'コピー完了' : 'テキストコピー'}
            </span>
          </button>

          {/* ★ DB保存ボタン */}
          <button
            onClick={handleSaveToCloud}
            className="bg-blue-600 hover:bg-blue-500 border border-blue-400 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-md"
          >
            <Save size={16} />
            <span className="text-xs font-bold">日報を記録保存</span>
          </button>
        </div>
      </div>

      {/* ★ 履歴閲覧トグル */}
      <div className="mb-4">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors w-full p-2"
        >
          {showHistory ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Calendar size={14} /> 過去の在庫履歴を見る
        </button>

        {showHistory && (
          <div className="bg-white rounded-xl border border-gray-200 mt-2 overflow-hidden animate-in slide-in-from-top-2">
            <div className="bg-gray-50 px-4 py-2 text-xs font-bold text-gray-500 border-b">
              最近のレポート (最新10件)
            </div>
            {historyReports.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">
                履歴がありません
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {historyReports.map((report) => (
                  <div key={report.id} className="text-sm">
                    <div
                      onClick={() =>
                        setExpandedReportId(
                          expandedReportId === report.id ? null : report.id
                        )
                      }
                      className="p-3 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">
                          {report.date}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(report.createdAt).toLocaleTimeString(
                            'ja-JP',
                            { hour: '2-digit', minute: '2-digit' }
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-600">
                          ¥{report.total_assets?.toLocaleString()}
                        </span>
                        {expandedReportId === report.id ? (
                          <ChevronDown size={14} className="text-gray-300" />
                        ) : (
                          <ChevronRight size={14} className="text-gray-300" />
                        )}
                      </div>
                    </div>

                    {/* 詳細展開 */}
                    {expandedReportId === report.id && (
                      <div className="bg-gray-50 p-3 text-xs border-t border-inner shadow-inner">
                        <div className="grid grid-cols-1 gap-1">
                          {report.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between border-b border-gray-100 last:border-0 py-1"
                            >
                              <span className="text-gray-700">{item.name}</span>
                              <span className="text-gray-500">
                                {item.stock}本
                                {item.delivered_today > 0 && (
                                  <span className="text-green-600 font-bold ml-1">
                                    (+{item.delivered_today}納品)
                                  </span>
                                )}
                              </span>
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

      {/* 在庫リスト (既存機能) */}
      <div className="space-y-4">
        {data.map((item) => (
          <div
            key={item.id}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-gray-800">{item.name}</h3>
                <span className="text-xs text-gray-500">
                  原価: ¥{item.price_cost.toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => {
                  setRestockModalItem(item);
                  setRestockDate(new Date().toISOString().split('T')[0]);
                }}
                className="flex flex-col items-center justify-center bg-green-50 text-green-700 px-3 py-2 rounded-lg border border-green-200 hover:bg-green-100 active:scale-95 transition-transform"
              >
                <RefreshCw size={16} />
                <span className="text-[10px] font-bold mt-1">納品 (+1)</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* 未開封在庫 */}
              <div className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                <span className="text-xs font-bold text-gray-600">
                  未開封在庫
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      updateStock(
                        item.id,
                        'stock_bottles',
                        Math.max(0, (item.stock_bottles || 0) - 1)
                      )
                    }
                    className="w-8 h-8 flex items-center justify-center bg-white border rounded-full shadow-sm active:bg-gray-200"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-bold text-lg w-6 text-center">
                    {item.stock_bottles || 0}
                  </span>
                  <button
                    onClick={() =>
                      updateStock(
                        item.id,
                        'stock_bottles',
                        (item.stock_bottles || 0) + 1
                      )
                    }
                    className="w-8 h-8 flex items-center justify-center bg-white border rounded-full shadow-sm active:bg-gray-200"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* 開封済み残量 */}
              <div>
                <div className="flex justify-between text-xs mb-1 px-1">
                  <span className="text-gray-500">開封済み残量</span>
                  <span
                    className={`font-bold ${
                      item.stock_level < 20 ? 'text-red-600' : 'text-blue-600'
                    }`}
                  >
                    {item.stock_level ?? 100}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={item.stock_level ?? 100}
                  onChange={(e) =>
                    updateStock(item.id, 'stock_level', Number(e.target.value))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 納品モーダル (既存) */}
      {restockModalItem && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setRestockModalItem(null)}
        >
          <div
            className="bg-white w-full max-w-xs rounded-xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg mb-2 text-gray-800">納品登録</h3>
            <p className="text-sm text-gray-500 mb-4">
              {restockModalItem.name} を1本追加します。
              <br />
              いつ届きましたか？
            </p>
            <label className="block text-xs font-bold text-gray-500 mb-1">
              納品日
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg p-3 mb-6 font-bold text-gray-700 bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none"
              value={restockDate}
              onChange={(e) => setRestockDate(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setRestockModalItem(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-lg font-bold text-sm"
              >
                キャンセル
              </button>
              <button
                onClick={handleRestockSubmit}
                className="flex-[2] py-3 bg-green-600 text-white rounded-lg font-bold text-sm shadow-md hover:bg-green-700"
              >
                確定 (+1本)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockView;
