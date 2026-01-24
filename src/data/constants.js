// ==========================================
// 定数・設定値
// ==========================================

// ランクごとの色定義
export const getRankColor = (rank) => {
  const colors = { 
    'Matsu': 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    'Take': 'bg-green-100 text-green-800 border-green-200', 
    'Ume': 'bg-blue-100 text-blue-800 border-blue-200', 
    'Shochu_Imo': 'bg-purple-100 text-purple-800 border-purple-200', 
    'Shochu_Mugi': 'bg-amber-100 text-amber-800 border-amber-200', 
  };
  return colors[rank] || 'bg-gray-100 text-gray-800 border-gray-200';
};