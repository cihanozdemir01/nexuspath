// Dosya Yolu: frontend/src/App.tsx - Düzeltilmiş Render Mantığı

import { useState, useEffect, useCallback } from 'react';
import './App.css';
import EditorComponent from './components/editor'; // Dosya adın 'editor.tsx' ise bu doğru

// --- VERİ MODELLERİ ---
interface Template { id: string; name: string; description: string | null; }
interface Section { id: string; title: string; prompt: string | null; order_index: number; }
interface UserEntry { id: string; content: any; }

function App() {
  // --- DURUM DEĞİŞKENLERİ ---
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [entry, setEntry] = useState<UserEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- VERİ ÇEKME İŞLEMLERİ ---
  useEffect(() => {
    fetch('http://localhost:8000/templates/').then(res => res.json()).then(setTemplates);
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      setSelectedSection(null);
      fetch(`http://localhost:8000/templates/${selectedTemplate.id}/sections/`).then(res => res.json()).then(setSections);
    } else { setSections([]); }
  }, [selectedTemplate]);

  useEffect(() => {
    if (selectedSection) {
      fetch(`http://localhost:8000/sections/${selectedSection.id}/entry`)
        .then(res => res.status === 404 ? null : res.json())
        .then(setEntry);
    } else { setEntry(null); }
  }, [selectedSection]);

  // --- OTOMATİK KAYDETME ---
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
      console.error("Kaydederken hata:", error);
      setIsSaving(false);
    });
  }, [selectedSection, entry]);

  // --- RENDER MANTIĞI (DOĞRU VERSİYON) ---

  // 1. Durum: Şablon seçilmemişse, şablon listesini göster.
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

  // 2. Durum: Şablon seçilmiş ama başlık seçilmemişse, başlık listesini göster.
  if (!selectedSection) {
    return (
      <div className="container">
        <button onClick={() => setSelectedTemplate(null)}>← Geri</button>
        <h1>{selectedTemplate.name}</h1>
        <p>{selectedTemplate.description}</p>
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
  
  // 3. Durum: Hem şablon hem başlık seçilmişse, içerik editörünü göster.
  return (
    <div className="container">
      <button onClick={() => setSelectedSection(null)}>← Başlıklara Geri Dön</button>
      <h1>{selectedSection.title}</h1>
      <p><i>{selectedSection.prompt}</i></p>
      <div className="saving-status">{isSaving ? 'Kaydediliyor...' : 'Kaydedildi'}</div>
      <hr />
      <div className="content-area">
        <EditorComponent
          key={selectedSection.id}
          data={entry?.content || {}}
          onChange={handleContentChange}
        />
      </div>
    </div>
  );
}

export default App;