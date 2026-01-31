import { doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

// ==========================================
// 1. LINE共有 / テキストコピー機能 (強化版)
// ==========================================
export const shareData = async (text, title = "在庫リスト") => {
  console.log("Share function called"); // デバッグ用ログ

  // A. モバイル等のシェア機能 (HTTPS必須)
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: text,
      });
      console.log("Shared successfully");
      return true;
    } catch (error) {
      console.warn('Share API failed or canceled, falling back to clipboard:', error);
      // シェアがキャンセル・失敗した場合はクリップボード処理へ進む
    }
  }

  // B. クリップボードへのコピー (フォールバック)
  try {
    await navigator.clipboard.writeText(text);
    alert("【コピー完了】\n共有メニューが開けなかったため、テキストをコピーしました。\nLINEなどに貼り付けてください。");
    return true;
  } catch (clipboardError) {
    console.error('Clipboard failed:', clipboardError);
    alert("コピーに失敗しました。ブラウザの権限を確認してください。");
    return false;
  }
};

// ==========================================
// 2. 日報データ生成 & 保存ロジック
// ==========================================
export const saveDailyReport = async (collectionName, items, totalAsset) => {
  const todayStr = new Date().toLocaleDateString('ja-JP');
  const docId = new Date().toISOString().split('T')[0];

  try {
    const reportRef = doc(db, collectionName, docId);
    
    await setDoc(reportRef, {
      date: todayStr,
      updatedAt: new Date().toISOString(),
      total_assets: totalAsset,
      items: items.map(i => ({
        id: i.id,
        name: i.name,
        stock: i.stock || i.stock_num || i.stock_bottles || 0,
        order_qty: i.order_qty || 0
      }))
    }, { merge: true });

    // グラフ用履歴データの更新
    const updatePromises = items.map(async (item) => {
      // コレクション名の特定
      let targetCol = item._collection;
      if (!targetCol) {
          if (collectionName === 'sakeReports') targetCol = 'sakeList';
          if (collectionName === 'wineReports') targetCol = 'wines';
          if (collectionName === 'otherReports') targetCol = 'otherList';
      }
      if (!targetCol) return; 

      const currentStats = item.daily_stats || [];
      const todayStatIndex = currentStats.findIndex(s => s.date === todayStr);

      const newStat = {
        date: todayStr,
        stock: item.stock || item.stock_num || item.stock_bottles || 0,
        order_qty: item.order_qty || 0,
      };

      let newStats = [...currentStats];
      if (todayStatIndex >= 0) {
        newStats[todayStatIndex] = newStat;
      } else {
        newStats.push(newStat);
      }
      if (newStats.length > 365) newStats.shift();

      await updateDoc(doc(db, targetCol, item.id), {
        daily_stats: newStats,
        last_updated: new Date().toISOString()
      });
    });

    await Promise.all(updatePromises);
    return true;

  } catch (error) {
    console.error("Save Error:", error);
    throw error;
  }
};
