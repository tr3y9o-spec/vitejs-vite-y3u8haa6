import React, { useState, useEffect } from 'react';

const CalculatorView = ({ data }) => {
  const [selectedId, setSelectedId] = useState(data[0]?.id);
  const [targetCostRate, setTargetCostRate] = useState(30);
  const [servingSize, setServingSize] = useState(90);

  if (!data || data.length === 0) return <div className="p-10 text-center text-gray-500">データ読込中...</div>;

  const selectedItem = data.find(i => i.id === selectedId) || data[0];

  // ★ アイテム変更時に提供量のデフォルト値を切り替える
  useEffect(() => {
    if (!selectedItem) return;
    
    // ワインのタイプ定義に含まれるかチェック
    const isWine = ['Red', 'White', 'Sparkling', 'Rose', 'Orange'].includes(selectedItem.type);
    
    if (isWine) {
      setServingSize(120); // ワインは120ml
    } else {
      setServingSize(90);  // 日本酒等は90ml
    }
  }, [selectedId, selectedItem]);

  const mlCost = selectedItem.price_cost / selectedItem.capacity_ml;
  const idealPrice = Math.round(Math.round(mlCost * servingSize) / (targetCostRate / 100));

  return (
    <div className="p-4 bg-gray-50 min-h-screen animate-in fade-in duration-500">
       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
         <h2 className="text-gray-500 text-sm font-bold mb-4 uppercase tracking-wider">Parameters</h2>
         <div className="mb-4">
           <label className="block text-sm font-medium text-gray-700 mb-1">対象商品</label>
           <select className="w-full p-2 border border-gray-300 rounded-md bg-white" value={selectedItem.id} onChange={(e) => setSelectedId(e.target.value)}>
             {data.map(item => (<option key={item.id} value={item.id}>{item.name}</option>))}
           </select>
         </div>
         <div className="mb-6">
           <div className="flex justify-between mb-1">
             <label className="text-sm font-medium text-gray-700">提供量</label>
             <span className="text-sm font-bold text-blue-600">{servingSize} ml</span>
           </div>
           <input type="range" min="30" max="360" step="10" value={servingSize} onChange={(e) => setServingSize(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
         </div>
         <div className="mb-2">
           <div className="flex justify-between mb-1">
             <label className="text-sm font-medium text-gray-700">目標原価率</label>
             <span className="text-sm font-bold text-green-600">{targetCostRate}%</span>
           </div>
           <input type="range" min="10" max="100" step="5" value={targetCostRate} onChange={(e) => setTargetCostRate(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
         </div>
       </div>
       <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-green-500 text-center">
         <p className="text-sm text-gray-500">推奨売価 (税抜)</p>
         <p className="text-4xl font-bold text-gray-800">¥{idealPrice.toLocaleString()}</p>
       </div>
       <div className="mt-6 p-3 bg-yellow-50 rounded text-xs text-yellow-800 border border-yellow-200">
         <p className="mb-1">💡 <strong>Manager's Note:</strong></p>
         {selectedItem.category_rank?.includes('Matsu') ? (<p>この商品は高単価（松）です。原価率を40%程度まで上げて、お得感を出しつつ粗利額（円）を稼ぐ戦略も有効です。</p>) : selectedItem.category_rank?.includes('Ume') ? (<p>この商品は回転重視（梅）です。原価率を20-25%に抑え、利益の柱に設定することを推奨します。</p>) : (<p>標準的な原価率設定です。季節のおすすめとしてメニューの目立つ位置に配置しましょう。</p>)}
       </div>
    </div>
  );
};

export default CalculatorView;