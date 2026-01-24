import React from 'react';
import {
  Sprout,
  Award,
  Database,
  Moon,
  Calendar,
  Droplets,
  Sparkles,
  GlassWater,
  Wheat,
  Leaf,
  FlaskConical,
  Wine,
  Utensils,
  Flame,
  Sun,
  Snowflake,
  Thermometer,
  Fish,
  Beef,
  Sandwich,
  Layers,
} from 'lucide-react';

// ==========================================
// 知識ベース (辞書データ)
// ==========================================

export const TAG_SUGGESTIONS = {
  '原料・米': ['山田錦', '雄町', '五百万石', '美山錦', '愛山'],
  スペック: [
    '大吟醸',
    '純米',
    '本醸造',
    '原酒',
    '生酒',
    '新酒',
    '古酒',
    '貴醸酒',
  ],
  製法詳細: [
    '山廃',
    '生酛',
    'おりがらみ',
    '荒走り',
    '中取り',
    '責め',
    'ひやおろし',
  ],
  '焼酎・他': [
    '芋',
    '麦',
    '米',
    '黒糖',
    'そば',
    '黒麹',
    '白麹',
    '減圧',
    '常圧',
  ],
  味わい: ['辛口', '甘口', '酸', 'BY'],
};

// ★ コラム（豆知識）マスターデータベース
// (内容は変更なしですが、全件保持してください)
export const TRIVIA_MASTER_DB = [
  {
    id: 'rice_omachi',
    priority: 3,
    condition: (item) =>
      item.type === 'Sake' && item.tags?.some((t) => t.includes('雄町')),
    icon: <Sprout size={14} />,
    title: 'オマチストを魅了する「雄町」',
    text: '栽培が難しく一度は幻となったお米。優等生な山田錦に対し、野性味あふれる複雑で太い旨味が特徴。「オマチスト」と呼ばれる熱狂的なファンを持ちます。',
  },
  {
    id: 'rice_aiyama',
    priority: 3,
    condition: (item) =>
      item.type === 'Sake' && item.tags?.some((t) => t.includes('愛山')),
    icon: <Award size={14} />,
    title: '幻の酒米「愛山」',
    text: '「酒米のダイヤモンド」とも呼ばれる希少米。非常に溶けやすく、独特の濃厚な甘みと酸味を持つ、ジューシーで色気のあるお酒に仕上がります。',
  },
  {
    id: 'sake_yamahai',
    priority: 3,
    condition: (item) =>
      item.type === 'Sake' && item.tags?.some((t) => t.includes('山廃')),
    icon: <Database size={14} />,
    title: '「山廃」のワイルドさ',
    text: '天然の乳酸菌を取り込んで発酵させる伝統製法。通常の倍の時間と手間がかかりますが、ヨーグルトのような酸と、腰の強い濃厚な旨味が生まれ、お燗で化けます。',
  },
  {
    id: 'sake_kimoto',
    priority: 3,
    condition: (item) =>
      item.type === 'Sake' && item.tags?.some((t) => t.includes('生酛')),
    icon: <Database size={14} />,
    title: '原点回帰「生酛（きもと）」',
    text: '山廃のさらに原型となる、江戸時代の手法。米をすり潰す重労働を経て育てた強力な酵母は、複雑味がありながらも後切れの良い、力強いお酒を生みます。',
  },
  {
    id: 'sake_kijoshu',
    priority: 3,
    condition: (item) =>
      item.type === 'Sake' && item.tags?.some((t) => t.includes('貴醸酒')),
    icon: <Moon size={14} />,
    title: 'お酒でお酒を仕込む？',
    text: '仕込み水の代わりに「日本酒」を使って仕込む贅沢なお酒。非常に濃厚で甘美な味わいになり、デザートワインのように食後酒として楽しむのがおすすめです。',
  },
  {
    id: 'sake_koshu',
    priority: 3,
    condition: (item) =>
      item.type === 'Sake' && item.tags?.some((t) => t.includes('古酒')),
    icon: <Calendar size={14} />,
    title: '時が育てる「熟成古酒」',
    text: '日本酒もワイン同様、熟成します。数年寝かせることで色は琥珀色に、香りはナッツやドライフルーツのように変化し、中華料理やチーズとも渡り合える深みが生まれます。',
  },
  {
    id: 'sake_origarami',
    priority: 3,
    condition: (item) =>
      item.type === 'Sake' &&
      (item.tags?.some((t) => t.includes('おりがらみ')) ||
        item.tags?.some((t) => t.includes('にごり'))),
    icon: <Droplets size={14} />,
    title: '「おりがらみ」の愉しみ',
    text: '底に沈殿している白い「おり」は、米や酵母の細かい破片です。混ぜるとシルキーな口当たりと甘みがプラスされます。最初は上澄み、後半は混ぜて濃厚に。',
  },
  {
    id: 'sake_namazake',
    priority: 3,
    condition: (item) =>
      item.type === 'Sake' &&
      (item.tags?.some((t) => t.includes('生酒')) ||
        item.tags?.some((t) => t.includes('新酒'))),
    icon: <Sparkles size={14} />,
    title: '火入れなしのフレッシュ感',
    text: '通常は2回行う加熱殺菌（火入れ）を一切しない「すっぴん」のお酒。酵母が生み出した微炭酸（ガス感）や、青リンゴのようなフレッシュな香りがそのまま生きています。',
  },
  {
    id: 'sake_arabashiri',
    priority: 3,
    condition: (item) =>
      item.type === 'Sake' && item.tags?.some((t) => t.includes('荒走り')),
    icon: <GlassWater size={14} />,
    title: '搾り始めの「荒走り」',
    text: 'お酒を搾る際、圧力をかけずに自然に出てくる最初の部分。少し薄にごりで、炭酸ガスを含んだ荒々しくフレッシュな香りが特徴です。',
  },
  {
    id: 'sake_nakadori',
    priority: 3,
    condition: (item) =>
      item.type === 'Sake' && item.tags?.some((t) => t.includes('中取り')),
    icon: <Award size={14} />,
    title: '一番いい場所「中取り」',
    text: '搾りの中盤、最も香味のバランスが良く、雑味のない綺麗な部分。「中汲み」とも呼ばれ、鑑評会の出品酒にも使われる最高品質の部位です。',
  },
  {
    id: 'sake_seme',
    priority: 3,
    condition: (item) =>
      item.type === 'Sake' && item.tags?.some((t) => t.includes('責め')),
    icon: <Database size={14} />,
    title: '通好みの「責め」',
    text: '搾りの最後、圧力をかけて搾り切った部分。雑味も出ますが、その分エキス分が濃く、パンチのある味わいに。通はこの複雑味を好みます。',
  },
  {
    id: 'shochu_kokuto',
    priority: 3,
    condition: (item) =>
      item.type === 'Shochu' && item.tags?.some((t) => t.includes('黒糖')),
    icon: <Sun size={14} />,
    title: '黒糖焼酎は「奄美」だけ',
    text: '黒糖を原料に出来るのは、法律で奄美群島の蔵元だけと決まっています。ラム酒と同じ原料ですが、米麹を使うため食事に合うスッキリした甘い香りが特徴です。',
  },
  {
    id: 'shochu_soba',
    priority: 3,
    condition: (item) =>
      item.type === 'Shochu' && item.tags?.some((t) => t.includes('そば')),
    icon: <Leaf size={14} />,
    title: 'そば焼酎と「そば湯」',
    text: 'そば独特の清涼感と香ばしさがある焼酎。これをお湯ではなく「そば湯」で割ると、とろみと風味が増して絶品です。発祥の地、宮崎県の定番スタイルです。',
  },
  {
    id: 'shochu_maewari',
    priority: 3,
    condition: (item) =>
      item.type === 'Shochu' && item.category_rank === 'Shochu_Imo',
    icon: <Droplets size={14} />,
    title: '究極のまろやかさ「前割り」',
    text: '飲む数日前から焼酎と水を好みの割合で割って寝かせておく方法。水とアルコールが分子レベルで馴染み、カドが取れて驚くほど口当たりが優しくなります。',
  },
  {
    id: 'shochu_partial',
    priority: 3,
    condition: (item) =>
      item.type === 'Shochu' &&
      (item.tags?.some((t) => t.includes('原酒')) ||
        item.tags?.some((t) => t.includes('40度'))),
    icon: <Snowflake size={14} />,
    title: 'とろり濃厚「パーシャルショット」',
    text: '度数の高い原酒を瓶ごと冷凍庫へ。アルコールのおかげで凍らず、とろりとしたシロップ状になります。濃厚な味と冷たさが同時に押し寄せる大人の楽しみ方です。',
  },
  {
    id: 'liqueur_base',
    priority: 3,
    condition: (item) => item.type === 'Liqueur',
    icon: <GlassWater size={14} />,
    title: 'ベースのお酒で味が変わる',
    text: '果実酒は「何のお酒に漬けたか」が重要です。ホワイトリカーなら果実の香りがストレートに、日本酒ベースならまろやかに、ブランデーベースなら濃厚な仕上がりになります。',
  },
  {
    id: 'sake_daiginjo',
    priority: 2,
    condition: (item) =>
      item.type === 'Sake' &&
      (item.tags?.some((t) => t.includes('大吟醸')) ||
        item.category_rank.includes('Matsu')),
    icon: <Sparkles size={14} />,
    title: '大吟醸の「50%」の意味',
    text: 'お米を半分以上削り、中心のデンプン質だけを贅沢に使います。雑味の元になる外側を削ぎ落とし、低温で発酵させることで、果実のような華やかな香りが生まれます。',
  },
  {
    id: 'sake_junmai',
    priority: 2,
    condition: (item) =>
      item.type === 'Sake' && item.tags?.some((t) => t.includes('純米')),
    icon: <Wheat size={14} />,
    title: '「純米」はお米のジュース',
    text: '醸造アルコールを一切添加せず、お米と水と麹だけで造ったお酒です。炊き立てのご飯のような穀物の香りや、お米本来のふくよかな旨味をダイレクトに感じられます。',
  },
  {
    id: 'rice_yamada',
    priority: 2,
    condition: (item) =>
      item.type === 'Sake' && item.tags?.some((t) => t.includes('山田錦')),
    icon: <Sprout size={14} />,
    title: '酒米の王様「山田錦」',
    text: '粒が大きく心白（中心のデンプン）が大きいため、綺麗で雑味のない、品格のある味わいに仕上がります。「迷ったら山田錦」と言われるほどの王道です。',
  },
  {
    id: 'rice_gohyakumangoku',
    priority: 2,
    condition: (item) =>
      item.type === 'Sake' && item.tags?.some((t) => t.includes('五百万石')),
    icon: <Sprout size={14} />,
    title: 'スッキリ淡麗「五百万石」',
    text: '新潟県を中心に栽培される、淡麗辛口の代名詞的なお米。スッキリと軽快で、食事の邪魔をしない綺麗なお酒になりやすいのが特徴です。',
  },
  {
    id: 'rice_miyama',
    priority: 2,
    condition: (item) =>
      item.type === 'Sake' && item.tags?.some((t) => t.includes('美山錦')),
    icon: <Sprout size={14} />,
    title: '冷涼な地の「美山錦」',
    text: '長野県で生まれた寒冷地に強いお米。五百万石に近いスッキリ系ですが、より硬質でキリッとした独特の渋みや酸味があり、通好みの食中酒になります。',
  },
  {
    id: 'sake_aki',
    priority: 2,
    condition: (item) =>
      item.type === 'Sake' && item.tags?.some((t) => t.includes('ひやおろし')),
    icon: <Leaf size={14} />,
    title: '秋の風物詩「ひやおろし」',
    text: '春に搾ったお酒を一度火入れし、夏の間蔵で寝かせ、秋にそのまま詰めたお酒。夏を超えて熟成が進み、角が取れてまろやかになった「秋あがり」の味わいです。',
  },
  {
    id: 'shochu_imo_aroma',
    priority: 2,
    condition: (item) => item.category_rank === 'Shochu_Imo',
    icon: <Sparkles size={14} />,
    title: '芋の香りは「花」と同じ',
    text: '芋焼酎の香り成分（モノテルペンアルコール）は、実はマスカットやバラの香り成分と同じ仲間。「芋臭い」ではなく「フルーティ」と感じるのは科学的に正しいのです。',
  },
  {
    id: 'shochu_mugi_choco',
    priority: 2,
    condition: (item) => item.category_rank === 'Shochu_Mugi',
    icon: <Utensils size={14} />,
    title: '麦焼酎とチョコの関係',
    text: '大麦を原料とする麦焼酎の香ばしさは、焙煎したカカオやナッツと驚くほど合います。食後にビターチョコレートをかじりながら、麦焼酎のロックを流し込む。知る人ぞ知る大人のデザートタイムです。',
  },
  {
    id: 'shochu_rice_ginjo',
    priority: 2,
    condition: (item) =>
      item.type === 'Shochu' &&
      (item.tags?.some((t) => t.includes('米')) || item.name.includes('米')),
    icon: <Wheat size={14} />,
    title: '米焼酎は「和製ウォッカ」',
    text: '日本酒と同じ米が原料ですが、蒸留することで糖分が抜け、お米の甘い香りだけが純粋に抽出されます。そのクリアでスムースな飲み口は、まさに和製ウォッカやジンです。',
  },
  {
    id: 'shochu_koji_black',
    priority: 2,
    condition: (item) =>
      item.type === 'Shochu' && item.tags?.some((t) => t.includes('黒麹')),
    icon: <Database size={14} />,
    title: 'どっしり「黒麹」',
    text: '沖縄の泡盛から伝わった菌。クエン酸を多く作り腐敗に強いだけでなく、味わいに「どっしりとしたコク」と「キレ」を与えます。飲みごたえ重視派に。',
  },
  {
    id: 'shochu_koji_white',
    priority: 2,
    condition: (item) =>
      item.type === 'Shochu' &&
      item.category_rank === 'Shochu_Imo' &&
      !item.tags?.some((t) => t.includes('黒麹')),
    icon: <Database size={14} />,
    title: 'マイルド「白麹」',
    text: '黒麹から突然変異で生まれた菌。黒麹よりも優しく、マイルドで軽快な味わいに仕上がります。どんな料理にも合わせやすい優等生です。',
  },
  {
    id: 'sake_honjozo',
    priority: 1,
    condition: (item) =>
      item.type === 'Sake' && item.tags?.some((t) => t.includes('本醸造')),
    icon: <FlaskConical size={14} />,
    title: '「アル添」は技術の証',
    text: '醸造アルコールの添加は、香り成分を引き出し、後味を軽快にする伝統技術です。本醸造はキレが良く飲み飽きしないため、実は晩酌の最強のパートナーと言われます。',
  },
  {
    id: 'sake_genshu',
    priority: 1,
    condition: (item) =>
      item.type === 'Sake' && item.tags?.some((t) => t.includes('原酒')),
    icon: <Droplets size={14} />,
    title: '「原酒」＝ロック推奨？',
    text: '加水調整をしていない搾ったままのお酒。アルコールのおかげで凍らず、とろりとしたシロップ状になります。濃厚な味と冷たさが同時に押し寄せる大人の楽しみ方です。',
  },
  {
    id: 'water_hard',
    priority: 1,
    condition: (item) =>
      item.type === 'Sake' &&
      (item.tags?.some((t) => t.includes('灘')) || item.axisX > 65),
    icon: <Droplets size={14} />,
    title: '硬水が生む「男酒」',
    text: 'ミネラル豊富な「硬水」で仕込むと、酵母が活発になり発酵が力強く進みます。その結果、酸が効いたキリッと辛口の、いわゆる「男酒（灘の酒など）」になります。',
  },
  {
    id: 'water_soft',
    priority: 1,
    condition: (item) =>
      item.type === 'Sake' &&
      (item.tags?.some((t) => t.includes('伏見')) ||
        (item.axisX < 40 && item.axisY > 40)),
    icon: <Droplets size={14} />,
    title: '軟水が生む「女酒」',
    text: 'ミネラルの少ない「軟水」で仕込むと、発酵が穏やかに進みます。結果、きめ細やかで口当たりの柔らかい、優しい「女酒（京都伏見の酒など）」に仕上がります。',
  },
  {
    id: 'sake_karakuchi',
    priority: 1,
    condition: (item) => item.type === 'Sake' && item.axisX > 65,
    icon: <Wine size={14} />,
    title: '日本酒度「＋」は辛口',
    text: '「日本酒度」は糖分の少なさを示す数値。プラスが高いほど糖分が少なく、キレのある辛口になります。食事の脂を流す「ウォッシュ効果」が高いのが特徴です。',
  },
  {
    id: 'sake_acid',
    priority: 1,
    condition: (item) =>
      item.type === 'Sake' &&
      (item.tags?.some((t) => t.includes('酸')) ||
        (item.axisX < 40 && item.axisY < 40)),
    icon: <FlaskConical size={14} />,
    title: '日本酒の「酸」は旨味の輪郭',
    text: '日本酒の酸度は、単に酸っぱいだけでなく、味の輪郭を引き締め「キレ」を生みます。酸が高いお酒は白ワインのように、油を使った料理や肉料理とよく合います。',
  },
  {
    id: 'sake_pair_cheese',
    priority: 1,
    condition: (item) =>
      item.type === 'Sake' &&
      (item.tags?.some((t) => t.includes('山廃')) || item.axisX < 30),
    icon: <Utensils size={14} />,
    title: '発酵×発酵＝最強',
    text: '旨味の強い日本酒（山廃や熟成酒）は、同じ発酵食品である「チーズ」と相性抜群。ブルーチーズや味噌漬けチーズと一緒に飲むと、口の中で旨味が爆発します。',
  },
  {
    id: 'sake_pair_soba',
    priority: 1,
    condition: (item) =>
      item.type === 'Sake' && item.axisX > 55 && item.axisY < 55,
    icon: <Utensils size={14} />,
    title: '「蕎麦前」の粋',
    text: '蕎麦の繊細な香りを邪魔しない、スッキリとした辛口酒は「蕎麦屋酒」の王道。わさび、焼き海苔、出汁巻き卵をつまみに、ちびちびやるのが粋です。',
  },
  {
    id: 'sake_vessel',
    priority: 1,
    condition: (item) => item.type === 'Sake' && item.axisY > 60,
    icon: <GlassWater size={14} />,
    title: 'ワイングラスの魔法',
    text: '香り高い吟醸系は、口の広いワイングラスで飲むと香りが内側にこもってより華やかに感じられます。逆にお猪口だとスッキリした味に。器で味は変わります。',
  },
  {
    id: 'sake_kan_nuru',
    priority: 1,
    condition: (item) =>
      item.type === 'Sake' && item.axisX < 50 && item.axisY < 45,
    icon: <Thermometer size={14} />,
    title: '魔法の温度「ぬる燗」',
    text: '「人肌（35℃）」〜「ぬる燗（40℃）」に温めると、お米の甘みと旨味がふわっと開き、冷酒とは別人のような優しさを見せます。寒い日だけでなく、胃を休めたい時にも最適。',
  },
  {
    id: 'sake_kan_atsu',
    priority: 1,
    condition: (item) =>
      item.type === 'Sake' &&
      (item.tags?.some((t) => t.includes('本醸造')) ||
        (item.axisX > 60 && item.axisY < 40)),
    icon: <Flame size={14} />,
    title: 'キレ味鋭い「熱燗」',
    text: '50℃前後の「熱燗」にすると、香りはシャープになり、アルコールの刺激で辛さが引き立ちます。脂っこい料理の脂をスパッと切るには熱燗が一番です。',
  },
  {
    id: 'sake_amino',
    priority: 1,
    condition: (item) => item.type === 'Sake' && item.axisX < 30,
    icon: <Database size={14} />,
    title: 'アミノ酸は「コク」の正体',
    text: '日本酒のアミノ酸度は「旨味・コク」の指標です。多いと濃厚で複雑な味に、少ないとスッキリ淡麗に。このお酒はアミノ酸が豊富で、飲みごたえ抜群です。',
  },
  {
    id: 'sake_label',
    priority: 1,
    condition: (item) =>
      item.type === 'Sake' && item.tags?.some((t) => t.includes('BY')),
    icon: <Calendar size={14} />,
    title: '「BY」って何？',
    text: 'Brewery Year（酒造年度）の略。7月1日から翌年6月30日までを1年とします。「R5BY」なら令和5年の秋〜冬に造られたお酒という意味です。',
  },
  {
    id: 'shochu_hot_order',
    priority: 1,
    condition: (item) =>
      item.type === 'Shochu' &&
      (item.category_rank === 'Shochu_Imo' || item.axisX < 50),
    icon: <Flame size={14} />,
    title: 'お湯割りの黄金律「お湯が先」',
    text: 'お湯割りのコツは「グラスにお湯を先に入れる」こと。後から焼酎を注ぐと、対流で自然に混ざり、温度差で香りがふわっと立ち上がります。マドラー不要です。',
  },
  {
    id: 'shochu_soda',
    priority: 1,
    condition: (item) =>
      item.type === 'Shochu' &&
      (item.axisY < 50 || item.category_rank === 'Shochu_Mugi'),
    icon: <GlassWater size={14} />,
    title: 'ソーダ割りが合う理由',
    text: '焼酎の香りは炭酸ガスと一緒に弾けることでより華やかに感じられます。特に麦焼酎や香り高い芋焼酎は、ハイボールにすることで食中酒としてのポテンシャルが最大化します。',
  },
  {
    id: 'shochu_rock',
    priority: 1,
    condition: (item) => item.type === 'Shochu' && item.axisX < 50,
    icon: <Database size={14} />,
    title: 'ロックで味わう「時間」',
    text: 'ロックの醍醐味は、氷が溶けることによる「加水」の変化。最初はガツンと濃厚に、徐々に水と馴染んでまろやかに。一杯で二度も三度も美味しい飲み方です。',
  },
  {
    id: 'shochu_distill_atm',
    priority: 1,
    condition: (item) =>
      item.type === 'Shochu' && !item.tags?.some((t) => t.includes('減圧')),
    icon: <FlaskConical size={14} />,
    title: '濃厚な「常圧蒸留」',
    text: '昔ながらの蒸留法。高い温度で沸騰させるため、原料の複雑な香りや雑味（個性）まで一緒に抽出されます。芋や麦の個性をガツンと感じたいなら常圧です。',
  },
  {
    id: 'shochu_distill_vac',
    priority: 1,
    condition: (item) =>
      item.type === 'Shochu' && item.tags?.some((t) => t.includes('減圧')),
    icon: <FlaskConical size={14} />,
    title: 'クリアな「減圧蒸留」',
    text: '気圧を下げて低い温度（40-50℃）で沸騰させる方法。雑味が出にくく、華やかでクセのないクリアな味わいになります。焼酎初心者にもおすすめです。',
  },
  {
    id: 'shochu_health',
    priority: 1,
    condition: (item) => item.type === 'Shochu',
    icon: <Leaf size={14} />,
    title: '実はヘルシー？「糖質ゼロ」',
    text: '焼酎は蒸留酒であるため、製造過程で糖分が残りません。「糖質ゼロ・プリン体ゼロ」。ダイエット中の方も心置きなく楽しめるお酒です。',
  },
  {
    id: 'shochu_dareyame',
    priority: 1,
    condition: (item) => item.type === 'Shochu',
    icon: <Wine size={14} />,
    title: '南九州の文化「だれやめ」',
    text: '「だれ（疲れ）」を「やめる（止める）」という意味で、晩酌のこと。1日の疲れを焼酎で洗い流し、明日への活力を養う。焼酎は生活のリセットボタンなのです。',
  },
  {
    id: 'general_light',
    priority: 0,
    condition: (item) => true,
    icon: <Sun size={14} />,
    title: 'お酒は「日光」が苦手',
    text: '日本酒や焼酎は紫外線に非常に弱く、日光に当たると数時間で「日光臭」という不快な臭いがつきます。茶色や緑の瓶が多いのは、光を遮断するためです。',
  },
  {
    id: 'general_air',
    priority: 0,
    condition: (item) => true,
    icon: <GlassWater size={14} />,
    title: '開栓後の味の変化',
    text: 'お酒は空気に触れると酸化が進みます。日本酒なら味がまろやかに（または老ねる）、焼酎なら香りが開くことも。開けたてと数日後の味の違いを楽しむのも一興です。',
  },
  {
    id: 'general_store',
    priority: 0,
    condition: (item) => item.type === 'Sake',
    icon: <Thermometer size={14} />,
    title: '冷蔵庫には「縦置き」で',
    text: 'お酒を保管する際、横にするとお酒が空気に触れる面積が増え、キャップの金属臭が移るリスクもあります。基本は冷蔵庫のドアポケットなどに「縦置き」が正解です。',
  },
  {
    id: 'general_date',
    priority: 0,
    condition: (item) => true,
    icon: <Calendar size={14} />,
    title: '製造年月≠賞味期限',
    text: 'お酒のラベルの日付は「瓶詰めした日」です。アルコール度数が高いため腐ることはありませんが、美味しく飲める目安はあります（生酒なら冷蔵で半年、火入れなら冷暗所で1年程度）。',
  },
];

// ==========================================
// ★ ここを修正：整合性を高めた提案ロジック
// ==========================================

export const getCurrentSeasonTheme = () => {
  const month = new Date().getMonth() + 1;
  // 春 (3-5月)
  if (month >= 3 && month <= 5) {
    return {
      id: 'spring',
      label: '春・花見酒',
      icon: <Calendar size={14} />,
      color: 'bg-pink-100 text-pink-700 border-pink-200',
      filter: (item) =>
        item.tags?.some(
          (t) => t.includes('花見') || t.includes('春') || t.includes('ピンク')
        ) ||
        (item.axisX < 60 && item.axisY > 40),
      guide: (
        <>
          <span className="font-bold block mb-1">
            🌸 アプローチ：春の陽気に合わせる
          </span>
          「山菜の苦味などには、とげのない『優しい甘み』と『華やかな香り』を持つお酒（マップ右上・薫酒）が相性抜群です」と提案しましょう。
        </>
      ),
    };
  }
  // 夏 (6-8月)
  else if (month >= 6 && month <= 8) {
    return {
      id: 'summer',
      label: '夏・涼み酒',
      icon: <Calendar size={14} />,
      color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      filter: (item) =>
        item.tags?.some((t) => t.includes('夏') || t.includes('辛口')) ||
        item.axisX > 60,
      guide: (
        <>
          <span className="font-bold block mb-1">
            🎐 アプローチ：清涼感でリフレッシュ
          </span>
          「暑い日には、後味がスパッと切れる『超辛口』や『夏酒』（マップ右側・爽酒）が体に染み渡ります。よく冷やしてどうぞ」と提案しましょう。
        </>
      ),
    };
  }
  // 秋 (9-11月)
  else if (month >= 9 && month <= 11) {
    return {
      id: 'autumn',
      label: '秋・ひやおろし',
      icon: <Calendar size={14} />,
      color: 'bg-orange-100 text-orange-700 border-orange-200',
      filter: (item) =>
        item.tags?.some(
          (t) =>
            t.includes('秋') ||
            t.includes('ひやおろし') ||
            t.includes('山廃') ||
            t.includes('生酛')
        ) ||
        (item.axisX < 45 && item.axisY < 55),
      guide: (
        <>
          <span className="font-bold block mb-1">
            🍁 アプローチ：食材の濃さに負けない
          </span>
          「秋の味覚には、熟成感やお米のコクがある『芳醇・旨口』タイプ（マップ左下・醇酒）を選ぶと、料理の味が引き立ちます」と提案しましょう。
        </>
      ),
    };
  }
  // 冬 (12-2月)
  else {
    return {
      id: 'winter',
      label: '冬・しぼりたて',
      icon: <Calendar size={14} />,
      color: 'bg-gray-100 text-gray-700 border-gray-200',
      filter: (item) =>
        item.tags?.some(
          (t) =>
            t.includes('新酒') ||
            t.includes('しぼりたて') ||
            t.includes('にごり')
        ) || item.axisY > 60,
      guide: (
        <>
          <span className="font-bold block mb-1">
            ⛄️ アプローチ：フレッシュ感の対比
          </span>
          「冬の濃厚な料理（鍋など）には、口の中をリセットしてくれる『華やかでフレッシュ』な新酒（マップ上部）が合います。冷酒と温かい料理の温度差も粋です」と提案しましょう。
        </>
      ),
    };
  }
};

export const PROPOSAL_THEMES_SAKE = [
  getCurrentSeasonTheme(),
  {
    id: 'steak_wash',
    label: 'ステーキ・脂',
    icon: <Beef size={14} />,
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    // ★ 脂を切る：爽酒（右側）または辛口
    filter: (item) =>
      item.tags?.some(
        (t) => t.includes('辛口') || t.includes('淡麗') || t.includes('本醸造')
      ) || item.axisX > 60,
    guide: (
      <>
        <span className="font-bold block mb-1">
          🥩 アプローチ：脂を流す (Wash)
        </span>
        「鉄板焼きステーキなどの脂が乗ったお肉には、キレのある『辛口』や『爽酒』（マップ右側）が合います。口内の脂をさっぱり流し、次の一口を美味しくさせます」と提案しましょう。
      </>
    ),
  },
  {
    id: 'meat_sauce',
    label: 'タレ・煮込み',
    icon: <Utensils size={14} />,
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    // ★ 旨味に合わせる：醇酒（左側）または山廃・生酛
    filter: (item) =>
      item.tags?.some(
        (t) =>
          t.includes('山廃') ||
          t.includes('生酛') ||
          t.includes('純米') ||
          t.includes('旨口')
      ) || item.axisX < 45,
    guide: (
      <>
        <span className="font-bold block mb-1">
          🥘 アプローチ：旨味の相乗効果 (Harmony)
        </span>
        「タレや煮込みなど味がしっかりした肉料理には、負けない『お米の旨味』があるタイプを選びます。『山廃』や『純米酒』（マップ左側）がおすすめです」と提案しましょう。
      </>
    ),
  },
  {
    id: 'sashimi',
    label: '魚・塩味',
    icon: <Fish size={14} />,
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    // ★ 魚の繊細さ：バランス型（中心付近）またはスッキリ系
    filter: (item) =>
      (item.axisX > 40 &&
        item.axisX < 70 &&
        item.axisY > 30 &&
        item.axisY < 70) ||
      item.tags?.includes('魚'),
    guide: (
      <>
        <span className="font-bold block mb-1">
          🐟 アプローチ：素材に寄り添う (Balance)
        </span>
        「白身魚の刺身や塩焼きには、主張しすぎず素材の甘みを引き立てる『バランスの良い』お酒（マップ中心付近）や『綺麗な酸』があるタイプが合います」と提案しましょう。
      </>
    ),
  },
  {
    id: 'starter',
    label: '乾杯・華やか',
    icon: <Sparkles size={14} />,
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    // ★ 香り：薫酒（上側）
    filter: (item) =>
      item.tags?.some(
        (t) =>
          t.includes('大吟醸') || t.includes('吟醸') || t.includes('華やか')
      ) || item.axisY > 60,
    guide: (
      <>
        <span className="font-bold block mb-1">
          🥂 アプローチ：香りで高揚感を (Aroma)
        </span>
        「最初の一杯や、前菜・サラダには、フルーツのような香りがする『華やか』タイプ（マップ上部・薫酒）が喜ばれます。ワイングラスでの提供もおすすめです」と提案しましょう。
      </>
    ),
  },
  {
    id: 'cheese_deep',
    label: '珍味・チーズ',
    icon: <Sandwich size={14} />,
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    // ★ 熟成・濃厚：熟酒（下側・左下）
    filter: (item) =>
      item.tags?.some(
        (t) => t.includes('古酒') || t.includes('熟成') || t.includes('貴醸酒')
      ) ||
      (item.axisY < 40 && item.axisX < 40),
    guide: (
      <>
        <span className="font-bold block mb-1">
          🧀 アプローチ：発酵の深み (Deep)
        </span>
        「チーズ、珍味、ドライフルーツなど癖のある肴には、熟成感のある『古酒』や『濃醇』なタイプ（マップ下部・熟酒）が渡り合えます。食後酒としても優秀です」と提案しましょう。
      </>
    ),
  },
];

export const PROPOSAL_THEMES_SHOCHU = [
  {
    id: 'soda',
    label: 'ソーダ・揚げ物',
    icon: <GlassWater size={14} />,
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    filter: (item) =>
      item.category_rank === 'Shochu_Mugi' ||
      item.tags?.includes('麦') ||
      item.axisY < 50,
    guide: (
      <>
        <span className="font-bold block mb-1">
          🫧 アプローチ：油を流す爽快感
        </span>
        「唐揚げや脂の乗った料理には、炭酸で割った『焼酎ハイボール』が最高に合います」と提案しましょう。香ばしい麦焼酎などは特に相性が良いです。
      </>
    ),
  },
  {
    id: 'rock',
    label: 'ロック・素材感',
    icon: <Database size={14} />,
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    filter: (item) =>
      item.category_rank === 'Shochu_Imo' ||
      item.tags?.includes('芋') ||
      item.tags?.includes('原酒') ||
      item.axisX < 55,
    guide: (
      <>
        <span className="font-bold block mb-1">
          🧊 アプローチ：香りの変化を楽しむ
        </span>
        「素材の香りをダイレクトに楽しむならロックがおすすめです」と伝えます。氷が溶けるごとの味の変化も楽しめます。
      </>
    ),
  },
  {
    id: 'warm',
    label: 'お湯割り・食中',
    icon: <Utensils size={14} />,
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    filter: (item) =>
      item.category_rank === 'Shochu_Imo' || item.tags?.includes('芋'),
    guide: (
      <>
        <span className="font-bold block mb-1">
          ♨️ アプローチ：甘みと食中酒
        </span>
        「お湯割りにすると、芋の甘みと香りが一気に広がります。和食や煮込み料理には、ぬるめのお湯割りが一番の相棒です」と提案します。
      </>
    ),
  },
];

export const PREFECTURES = [
  '北海道',
  '青森県',
  '岩手県',
  '宮城県',
  '秋田県',
  '山形県',
  '福島県',
  '茨城県',
  '栃木県',
  '群馬県',
  '埼玉県',
  '千葉県',
  '東京都',
  '神奈川県',
  '新潟県',
  '富山県',
  '石川県',
  '福井県',
  '山梨県',
  '長野県',
  '岐阜県',
  '静岡県',
  '愛知県',
  '三重県',
  '滋賀県',
  '京都府',
  '大阪府',
  '兵庫県',
  '奈良県',
  '和歌山県',
  '鳥取県',
  '島根県',
  '岡山県',
  '広島県',
  '山口県',
  '徳島県',
  '香川県',
  '愛媛県',
  '高知県',
  '福岡県',
  '佐賀県',
  '長崎県',
  '熊本県',
  '大分県',
  '宮崎県',
  '鹿児島県',
  '沖縄県',
  '海外',
];
