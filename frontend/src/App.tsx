// Dosya Yolu: frontend/src/App.tsx

import { useState, useEffect, useCallback } from 'react';
import EditorComponent from './components/editor';
import './App.css'; 

// --- Tipleri (Interfaces) Tanımlayalım ---
interface Template {
  id: string;
  name: string;
  description: string | null;
}
interface Section {
  id: string;
  title: string;
  prompt: string | null;
  order_index: number;
}
interface UserEntry {
  id: string;
  content: any;
}

function App() {
  // --- State Değişkenleri ---
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [entry, setEntry] = useState<UserEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingEntry, setIsLoadingEntry] = useState(false); // Yükleniyor durumu için state

  // --- Veri Çekme Effect'leri ---
  useEffect(() => {
    fetch('http://localhost:8000/templates/')
      .then(res => res.json())
      .then(data => setTemplates(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      setSelectedSection(null);
      fetch(`http://localhost:8000/templates/${selectedTemplate.id}/sections/`)
        .then(res => res.json())
        .then(data => setSections(data))
        .catch(console.error);
    } else {
      setSections([]);
    }
  }, [selectedTemplate]);

  useEffect(() => {
    if (selectedSection) {
      setIsLoadingEntry(true); // Veri çekmeye başlarken yükleniyor...
      fetch(`http://localhost:8000/sections/${selectedSection.id}/entry`)
        .then(res => (res.status === 404 ? null : res.json()))
        .then(data => {
          setEntry(data);
          setIsLoadingEntry(false); // Veri çekme bitince yükleniyor durumunu kaldır
        })
        .catch(error => {
          console.error(error);
          setIsLoadingEntry(false);
        });
    } else {
      setEntry(null);
    }
  }, [selectedSection]);

  // --- Otomatik Kaydetme Fonksiyonu ---
  const handleContentChange = useCallback((newData: any) => {
    if (!selectedSection) return;
    setIsSaving(true);
    const updatedEntry = { content: newData };
    fetch(`http://localhost:8000/sections/${selectedSection.id}/entry`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedEntry),
    })
    .then(response => response.json())
    .then(savedData => {
      if (JSON.stringify(entry?.content) !== JSON.stringify(savedData.content)) {
        setEntry(savedData);
      }
      setIsSaving(false);
    })
    .catch(error => {
      setIsSaving(false);
      console.error("Kaydederken hata:", error);
    });
  }, [selectedSection, entry]);

  // --- RENDER MANTIĞI ---

  // 1. Durum: Şablon seçilmemiş
  if (!selectedTemplate) {
    return (
      <div className="container">
        <h1>Yol Haritası Şablonları</h1>
        <ul className="list">
          {templates.map(template => (
            <li key={template.id} onClick={() => setSelectedTemplate(template)}>
              {template.name}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // 2. Durum: Başlık seçilmemiş
  if (!selectedSection) {
    return (
      <div className="container">
        <button onClick={() => setSelectedTemplate(null)}>← Geri</button>
        <h1>{selectedTemplate.name}</h1>
        <p>{selectedTemplate.description || ''}</p>
        <hr />
        <h2>Başlıklar</h2>
        <ul className="list">
          {sections.map(section => (
            <li key={section.id} onClick={() => setSelectedSection(section)}>
              {section.title}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // 3. Durum: Editör ekranı
  return (
    <div className="container">
      <button onClick={() => setSelectedSection(null)}>← Başlıklara Geri Dön</button>
      <h1>{selectedSection.title}</h1>
      <p><i>{selectedSection.prompt || ''}</i></p>
      <div className="saving-status">{isSaving ? 'Kaydediliyor...' : 'Kaydedildi'}</div>
      <hr />
      <div className="content-area">
        {isLoadingEntry ? (
          <p>İçerik yükleniyor...</p>
        ) : (
          <EditorComponent
            key={selectedSection.id}
            data={entry?.content || {}}
            onChange={handleContentChange}
          />
        )}
      </div>
    </div>
  );
}

export default App;