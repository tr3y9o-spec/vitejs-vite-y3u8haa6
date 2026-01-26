// date-fns 依存なし

// ==========================================
// 1. 酒タイプ分類定義 (Sake & Shochu Types)
// ==========================================
export const SAKE_TYPES = {
  // 日本酒 (Sake)
  SOSHU: { id: 'SOSHU', label: '爽酒 (Soshu)', keywords: ['淡麗', '辛口', 'キレ', '本醸造', '生酒'], desc: '軽快でなめらか。脂っこい料理を洗い流す「ウォッシュ」効果が高い。' },
  JUNSHU: { id: 'JUNSHU', label: '醇酒 (Jun-shu)', keywords: ['純米', '山廃', '生酛', '旨口', '無濾過', 'コク'], desc: 'お米の旨味が豊か。濃い味付けや肉料理に「同調」する力強いタイプ。' },
  KUNSHU: { id: 'KUNSHU', label: '薫酒 (Kun-shu)', keywords: ['大吟醸', '吟醸', '華やか', 'フルーティー'], desc: '果実のような香り。素材の味を活かした料理や前菜に向く。' },
  JUKUSHU: { id: 'JUKUSHU', label: '熟酒 (Juku-shu)', keywords: ['古酒', '熟成', '長期熟成', '貴醸酒'], desc: 'スパイスやドライフルーツの香り。中華やジビエ、ハードチーズに合う。' },
  
  // ★ 焼酎 (Shochu) - 細分化
  IMOJOCHU: { id: 'IMOJOCHU', label: '芋焼酎 (Imo)', desc: 'さつまいもの甘みと豊かな香り。お湯割りで香りが開き、ロックでキレが増します。' },
  MUGIJOCHU: { id: 'MUGIJOCHU', label: '麦焼酎 (Mugi)', desc: '大麦由来の香ばしさとスッキリした飲み口。炭酸割りやロックなど万能に楽しめます。' },
  KOMEJOCHU: { id: 'KOMEJOCHU', label: '米焼酎 (Kome)', desc: '日本酒のような吟醸香と、蒸留酒ならではのクリアな味わい。食事の邪魔をしません。' },
  KOKUTO: { id: 'KOKUTO', label: '黒糖焼酎 (Kokuto)', desc: '奄美群島特産。黒糖の甘い香りと米麹の旨味。ラム酒のような風味がありデザートにも。' },
  SOBA: { id: 'SOBA', label: 'そば焼酎 (Soba)', desc: 'そば独特の清涼感と香ばしさ。そば湯割りは絶品です。' },
  CORN: { id: 'CORN', label: 'とうもろこし焼酎 (Corn)', desc: 'バーボンのような穀物の甘みと香ばしさ。ロックや水割りがおすすめ。' },
  AWAMORI: { id: 'AWAMORI', label: '泡盛 (Awamori)', desc: '黒麹由来の力強いコクと芳醇な香り。熟成（古酒）させることでバニラのような甘みが出ます。' },
  
  // その他
  SHOCHU_GEN: { id: 'SHOCHU_GEN', label: '焼酎 (Shochu)', desc: '本格焼酎。原材料の風味が活きた蒸留酒。' }, // 分類不能な場合のフォールバック
  LIQUEUR: { id: 'LIQUEUR', label: '果実酒 (Liqueur)', desc: '果実の甘みと酸味。デザート感覚や食前酒、ソーダ割りに最適。' }
};

/**
 * 商品データからタイプを自動判定する
 */
export const determineSakeType = (item) => {
  if (!item) return SAKE_TYPES.JUNSHU;

  // ★ 焼酎の原材料判定ロジック
  if (item.type === 'Shochu') {
    const text = (item.name + (item.tags?.join('') || '')).toLowerCase();
    
    if (text.includes('芋') || text.includes('霧島') || text.includes('ダイヤ')) return SAKE_TYPES.IMOJOCHU;
    if (text.includes('麦') || text.includes('二階堂') || text.includes('中々')) return SAKE_TYPES.MUGIJOCHU;
    if (text.includes('米') || text.includes('鳥飼') || text.includes('白岳')) return SAKE_TYPES.KOMEJOCHU;
    if (text.includes('黒糖') || text.includes('れんと')) return SAKE_TYPES.KOKUTO;
    if (text.includes('そば') || text.includes('雲海')) return SAKE_TYPES.SOBA;
    if (text.includes('とうもろこし') || text.includes('コーン')) return SAKE_TYPES.CORN;
    if (text.includes('泡盛') || text.includes('残波')) return SAKE_TYPES.AWAMORI;
    
    return SAKE_TYPES.SHOCHU_GEN;
  }

  if (item.type === 'Liqueur') return SAKE_TYPES.LIQUEUR;

  // 日本酒の詳細分類
  const text = (item.name + (item.tags?.join('') || '') + (item.sales_talk || '')).toLowerCase();

  if (text.includes('古酒') || text.includes('熟成')) return SAKE_TYPES.JUKUSHU;
  if (text.includes('大吟醸') || text.includes('吟醸') || text.includes('華やか')) return SAKE_TYPES.KUNSHU;
  if (text.includes('山廃') || text.includes('生酛') || text.includes('純米') || text.includes('旨味')) return SAKE_TYPES.JUNSHU;
  if (text.includes('辛口') || text.includes('キレ') || text.includes('淡麗')) return SAKE_TYPES.SOSHU;

  // マップ座標による判定
  const x = item.axisX ?? 50;
  const y = item.axisY ?? 50;

  if (y > 60) return SAKE_TYPES.KUNSHU;
  if (y < 40 && x > 60) return SAKE_TYPES.SOSHU;
  if (y < 60 && x < 40) return SAKE_TYPES.JUNSHU;

  return SAKE_TYPES.JUNSHU;
};

// ==========================================
// 2. ペアリング提案ロジック
// ==========================================
export const getPairingProfile = (item) => {
  const type = determineSakeType(item);
  let roles = [];

  switch (type.id) {
    // --- 日本酒 ---
    case 'SOSHU':
      roles.push({ approach: '🌊 ウォッシュ', target: '天ぷら、脂の乗った魚、焼肉', reason: '軽快なキレが脂を洗い流し、口内をリセットします。' });
      roles.push({ approach: '⚖️ バランス', target: '刺身、冷奴、蕎麦', reason: '料理の繊細な風味を邪魔せず、静かに寄り添います。' });
      break;
    case 'JUNSHU':
      roles.push({ approach: '🔄 ハーモニー', target: 'すき焼き、煮魚、味噌料理', reason: 'お米のふくよかな旨味が、濃い味付けと同調します。' });
      roles.push({ approach: '🔥 お燗の妙', target: '鍋料理、おでん', reason: '温めることで酸がまろやかになり、出汁の旨味と溶け合います。' });
      break;
    case 'KUNSHU':
      roles.push({ approach: '💐 アロマ', target: 'カルパッチョ、生春巻き', reason: '華やかな香りが、ハーブや柑橘を使った前菜を引き立てます。' });
      roles.push({ approach: '🥂 アペリティフ', target: '乾杯酒として', reason: 'フルーティーな香味が食欲を刺激。最初の1杯に最適です。' });
      break;
    case 'JUKUSHU':
      roles.push({ approach: '🍷 ディープ', target: '麻婆豆腐、羊肉、ブルーチーズ', reason: '熟成香と複雑味が、スパイスやクセのある食材を受け止めます。' });
      break;

    // --- 焼酎 (タイプ別提案) ---
    case 'IMOJOCHU':
      roles.push({ approach: '🍠 芋の甘み', target: '豚の角煮、さつま揚げ', reason: '脂の甘みと芋の香ばしさがマッチ。お湯割りがおすすめ。' });
      roles.push({ approach: '🧊 ロックでキレ', target: '地鶏の炭火焼き', reason: '冷やすと香りが締まり、香ばしい料理の脂を切ります。' });
      break;
    case 'MUGIJOCHU':
      roles.push({ approach: '🌾 香ばしさ', target: '白身魚のフライ、燻製', reason: '麦の香ばしさが、揚げ物やスモーキーな香りと同調します。' });
      roles.push({ approach: '💧 ソーダ割り', target: '唐揚げ、ポテトサラダ', reason: 'ハイボール感覚で、油料理を爽快にウォッシュします。' });
      break;
    case 'KOMEJOCHU':
      roles.push({ approach: '🍚 米の旨味', target: '刺身、和食全般', reason: '日本酒に近い感覚で、繊細な出汁の料理に寄り添います。' });
      break;
    case 'KOKUTO':
      roles.push({ approach: '🍬 島の甘み', target: 'ラフテー、デザート', reason: '黒糖由来の甘い香りが、豚肉料理や食後のスイーツと合います。' });
      break;
    case 'SOBA':
      roles.push({ approach: '🍜 そば湯割り', target: '出汁巻き卵、焼き鳥（塩）', reason: 'そば湯で割ることでとろみと風味が増し、出汁料理と調和します。' });
      break;
    case 'AWAMORI':
      roles.push({ approach: '🦁 コクとキレ', target: 'ラフテー、ゴーヤチャンプルー', reason: '脂っこい料理を流す強さと、豚肉に負けないコクがあります。' });
      break;
    case 'SHOCHU_GEN':
      roles.push({ approach: '🥃 スタイル提案', target: '幅広い居酒屋料理', reason: 'ロックなら素材の味を、水割りなら食事全体に寄り添います。' });
      break;

    case 'LIQUEUR':
      roles.push({ approach: '🍹 デザート・〆', target: 'バニラアイス、食後の余韻', reason: '濃厚な甘みと酸味が、食事の締めくくりを彩ります。' });
      roles.push({ approach: '🫧 ソーダ割り', target: 'スパイシーな料理、揚げ物', reason: '甘酸っぱさと炭酸の刺激が、辛い料理や油を中和します。' });
      break;
    default: break;
  }
  return { typeInfo: type, roles: roles };
};

// ==========================================
// 3. 分析・豆知識・日報ロジック
// ==========================================
export const analyzeHistory = (history) => {
  if (!history || history.length === 0) {
    return { lastOrder: 'なし', total: 0, cycle: 'データなし', monthly: Array(6).fill({ label: '', count: 0 }) };
  }
  const sorted = [...history].map(d => new Date(d)).sort((a, b) => a - b);
  const lastDate = sorted[sorted.length - 1];
  const firstDate = sorted;
  const today = new Date();
  
  const getDiffDays = (d1, d2) => Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
  const diffDays = getDiffDays(today, lastDate);
  
  let cycleText = '';
  if (sorted.length > 1) {
    const totalDays = getDiffDays(lastDate, firstDate);
    const avgDays = Math.round(totalDays / (sorted.length - 1));
    cycleText = `平均${avgDays}日`;
  } else {
    cycleText = '算出中';
  }

  const monthlyStats = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const label = `${d.getMonth() + 1}月`;
    const count = history.filter(h => {
      const hd = new Date(h);
      return hd.getMonth() === d.getMonth() && hd.getFullYear() === d.getFullYear();
    }).length;
    monthlyStats.push({ label, count });
  }

  return { lastOrder: diffDays === 0 ? '今日' : `${diffDays}日前`, total: history.length, cycle: cycleText, monthly: monthlyStats };
};

export const getTriviaList = (item) => {
  const list = [];
  if (item.category_rank === 'Matsu') list.push({ icon: '👑', title: '最高ランク', text: '店舗の顔となる最高級ライン。特別な日に。' });
  if (item.tags?.includes('辛口')) list.push({ icon: '🔪', title: 'キレの辛口', text: '脂っこい料理の後に口をリセットする効果があります。' });
  
  if (item.type === 'Shochu') list.push({ icon: '🍶', title: '飲み方自在', text: '「前割り」しておくと、水とアルコールが馴染んでまろやかになります。' });
  if (item.type === 'Liqueur') list.push({ icon: '🍋', title: 'ビタミン', text: '果実由来の成分が含まれています。ロックでじっくり味わうのも乙です。' });

  return list;
};

export const generateDailyStockReport = (items) => {
  const today = new Date().toLocaleDateString('ja-JP');
  let report = `【在庫日報】 ${today}\n----------------------------\n`;
  items.forEach(item => {
    if ((item.stock_bottles || 0) > 0) {
      report += `${item.name}: ${item.stock_bottles}本 (残${item.stock_level ?? 100}%)\n`;
    }
  });
  report += `----------------------------\n作成: Setsu-Phone System`;
  return report;
};
