import React, { useState, useEffect } from 'react';
import { User, LogOut } from 'lucide-react';
import { db, storage } from './firebase';
import {
  doc,
  onSnapshot,
  collection,
  updateDoc,
  addDoc,
  deleteDoc,
  setDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Components
import TabNav from './components/TabNav';
import MenuView from './components/MenuView';
import StockView from './components/StockView';
import CalculatorView from './components/CalculatorView';
import SakeModal from './components/SakeModal';
import MapView from './components/MapView';

export default function SakeManager() {
  const [activeTab, setActiveTab] = useState('sake');
  const [modalItem, setModalItem] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [cloudImages, setCloudImages] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [sakeList, setSakeList] = useState([]);
  const [isSommelierMode, setIsSommelierMode] = useState(false);

  // AI Import State
  const [jsonInput, setJsonInput] = useState('');
  const [showJsonInput, setShowJsonInput] = useState(false);

  // Firestore Sync
  useEffect(() => {
    if (!db) return;
    // 1. 商品リスト
    const unsubList = onSnapshot(collection(db, 'sakeList'), (snapshot) => {
      // ★修正ポイント1: idの読み込み順序を変更 (doc.data()の内容よりdoc.idを優先)
      setSakeList(snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    });
    // 2. 画像データ
    const unsubImages = onSnapshot(doc(db, 'sakeImages', 'main'), (doc) => {
      if (doc.exists()) setCloudImages(doc.data());
    });
    return () => {
      unsubList();
      unsubImages();
    };
  }, []);

  // Handlers
  const handleAddNew = () => {
    let defaultType = 'Sake';
    if (activeTab === 'shochu') defaultType = 'Shochu';
    if (activeTab === 'liqueur') defaultType = 'Liqueur';

    const newItem = {
      id: '',
      name: '',
      kana: '',
      category_rank: 'Take',
      type: defaultType,
      price_cost: 0,
      capacity_ml: 1800,
      tags: [],
      sales_talk: '',
      pairing_hint: '',
      source_text: '',
      spec_image: '',
      stock_level: 100,
      stock_bottles: 0,
      order_history: [],
      axisX: 50,
      axisY: 50,
    };
    setEditForm(newItem);
    setIsEditMode(true);
    setModalItem(newItem);
    setJsonInput('');
    setShowJsonInput(false);
  };

  const handleOpenDetail = (item) => {
    setEditForm(item);
    setIsEditMode(false);
    setModalItem(item);
    setJsonInput('');
    setShowJsonInput(false);
  };

  const handleJsonImport = () => {
    try {
      const cleanJson = jsonInput
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      const data = JSON.parse(cleanJson);
      setEditForm((prev) => ({
        ...prev,
        ...data,
        price_cost: Number(data.price_cost) || prev.price_cost,
        capacity_ml: Number(data.capacity_ml) || prev.capacity_ml,
        axisX: Number(data.axisX) || prev.axisX,
        axisY: Number(data.axisY) || prev.axisY,
      }));
      alert('AIデータを反映しました。');
      setShowJsonInput(false);
    } catch (e) {
      alert('データ形式エラー');
    }
  };

  const handleSave = async () => {
    if (!editForm.name) return alert('商品名は必須です');
    try {
      // ★修正ポイント2: 保存時に不要な「空のid」を除外する
      const { id, ...dataToSave } = editForm;

      if (modalItem.id) {
        // 更新時
        await updateDoc(doc(db, 'sakeList', modalItem.id), dataToSave);
        alert('更新しました！');
      } else {
        // 新規登録時
        await addDoc(collection(db, 'sakeList'), dataToSave);
        alert('新規登録しました！');
      }
      setModalItem(null);
      setIsEditMode(false);
    } catch (e) {
      alert('保存エラー: ' + e.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('削除しますか？')) return;
    try {
      await deleteDoc(doc(db, 'sakeList', modalItem.id));
      alert('削除しました');
      setModalItem(null);
    } catch (e) {
      alert('削除エラー');
    }
  };

  const handleFileUpload = async (event, type = 'main') => {
    const file = event.target.files[0];
    if (!file || !modalItem.id) {
      if (!modalItem.id) alert('先に商品を保存してください');
      return;
    }
    try {
      setIsUploading(true);
      const fileName =
        type === 'main'
          ? `${modalItem.id}_main.jpg`
          : `${modalItem.id}_spec.jpg`;
      const storageRef = ref(storage, `images/${fileName}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      if (type === 'main') {
        // キャッシュ用と商品データ本体の両方にURLを保存
        await setDoc(
          doc(db, 'sakeImages', 'main'),
          { [modalItem.id]: downloadURL },
          { merge: true }
        );
        await updateDoc(doc(db, 'sakeList', modalItem.id), {
          image: downloadURL,
        });

        // 画面の即時更新
        setCloudImages((prev) => ({ ...prev, [modalItem.id]: downloadURL }));
        setSakeList((prev) =>
          prev.map((item) =>
            item.id === modalItem.id ? { ...item, image: downloadURL } : item
          )
        );
      } else {
        setEditForm((prev) => ({ ...prev, spec_image: downloadURL }));
        alert('スペック画像を読み込みました。保存してください。');
      }
    } catch (error) {
      console.error(error);
      alert('アップロード失敗: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full md:max-w-4xl mx-auto bg-white min-h-screen shadow-2xl overflow-hidden relative font-sans">
      <div
        className={`flex justify-between items-center p-3 border-b ${
          isSommelierMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
        } transition-colors duration-300`}
      >
        <h1 className="font-bold text-lg flex items-center gap-2">
          {isSommelierMode ? (
            <>
              <User size={20} /> Sommelier Mode
            </>
          ) : (
            'Sake Manager'
          )}
        </h1>
        <button
          onClick={() => setIsSommelierMode(!isSommelierMode)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            isSommelierMode
              ? 'bg-white text-gray-900'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {isSommelierMode ? (
            <>
              <LogOut size={14} /> Exit
            </>
          ) : (
            <>
              <User size={14} /> 接客モード
            </>
          )}
        </button>
      </div>

      <TabNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSommelierMode={isSommelierMode}
      />

      <div className="h-full">
        {activeTab === 'sake' && (
          <MenuView
            data={sakeList.filter((d) => d.type === 'Sake')}
            onSelect={handleOpenDetail}
            onAdd={handleAddNew}
            cloudImages={cloudImages}
            placeholder="日本酒を検索..."
            isSommelierMode={isSommelierMode}
            activeTab="sake"
          />
        )}
        {activeTab === 'shochu' && (
          <MenuView
            data={sakeList.filter((d) => d.type === 'Shochu')}
            onSelect={handleOpenDetail}
            onAdd={handleAddNew}
            cloudImages={cloudImages}
            placeholder="焼酎を検索..."
            isSommelierMode={isSommelierMode}
            activeTab="shochu"
          />
        )}
        {activeTab === 'liqueur' && (
          <MenuView
            data={sakeList.filter((d) => d.type === 'Liqueur')}
            onSelect={handleOpenDetail}
            onAdd={handleAddNew}
            cloudImages={cloudImages}
            placeholder="リキュールを検索..."
            isSommelierMode={isSommelierMode}
            activeTab="liqueur"
          />
        )}
        {activeTab === 'stock' && !isSommelierMode && (
          <StockView data={sakeList} />
        )}
        {activeTab === 'calc' && !isSommelierMode && (
          <CalculatorView data={sakeList} />
        )}
        {activeTab === 'map' && (
          <MapView
            data={sakeList}
            cloudImages={cloudImages}
            onSelect={handleOpenDetail}
          />
        )}
      </div>

      <SakeModal
        item={modalItem}
        onClose={() => setModalItem(null)}
        isEditMode={isEditMode}
        isSommelierMode={isSommelierMode}
        isUploading={isUploading}
        cloudImages={cloudImages}
        onStartEdit={() => setIsEditMode(true)}
        onSave={handleSave}
        onDelete={handleDelete}
        onFileUpload={handleFileUpload}
        editForm={editForm}
        setEditForm={setEditForm}
        showJsonInput={showJsonInput}
        setShowJsonInput={setShowJsonInput}
        jsonInput={jsonInput}
        setJsonInput={setJsonInput}
        handleJsonImport={handleJsonImport}
      />
    </div>
  );
}