import { useState, useEffect, useCallback } from 'react';
import { createReactEditorJS } from 'react-editor-js';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';
import Embed from '@editorjs/embed';

// Ayrı bir CSS dosyasıyla uğraşmamak için stilleri doğrudan burada tanımlıyoruz.
const styles = `
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #f4f4f9; color: #333; }
.container { max-width: 800px; margin: 20px auto; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.list { list-style: none; padding: 0; }
.list li { padding: 15px; border: 1px solid #ddd; margin-top: -1px; cursor: pointer; transition: background-color 0.2s; }
.list li:hover { background-color: #eef2f7; }
.list li:first-child { border-radius: 4px 4px 0 0; }
.list li:last-child { border-radius: 0 0 4px 4px; }
button { background-color: #6c5ce7; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; margin-bottom: 20px; font-size: 14px; }
button:hover { background-color: #5849c9; }
hr { border: none; border-top: 1px solid #eee; margin: 20px 0; }
.saving-status { text-align: right; color: #999; font-size: 0.9em; height: 1.2em; transition: opacity 0.5s; }
.content-area { border: 1px solid #ccc; border-radius: 4px; padding: 1px; min-height: 200px; }
`;

const ReactEditorJS = createReactEditorJS();
// ÖNEMLİ: Create React App ile uyumluluk için eklentileri bu şekilde tanımlamak daha kararlı olabilir.
const EDITOR_JS_TOOLS = {
  embed: { class: Embed, inlineToolbar: true },
  list: { class: List, inlineToolbar: true },
  header: { class: Header, inlineToolbar: true },
  quote: { class: Quote, inlineToolbar: true }
};

// Bu, bizim 'editor.js' dosyasından gelecek olan component'tir.
// Adının 'EditorComponent' olması, App component'inden farklı olduğunu netleştirir.

function App() {
  // --- STATE DEĞİŞKENLERİ ---
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [entry, setEntry] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- VERİ ÇEKME ---
  useEffect(() => {
    fetch('http://localhost:8000/templates/')
      .then(res => res.json())
      .then(setTemplates)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedTemplate) {
      setSelectedSection(null);
      fetch(`http://localhost:8000/templates/${selectedTemplate.id}/sections/`)
        .then(res => res.json())
        .then(setSections)
        .catch(console.error);
    } else {
      setSections([]);
    }
  }, [selectedTemplate]);

  useEffect(() => {
    if (selectedSection) {
      fetch(`http://localhost:8000/sections/${selectedSection.id}/entry`)
        .then(res => (res.status === 404 ? null : res.json()))
        .then(setEntry)
        .catch(console.error);
    } else {
      setEntry(null);
    }
  }, [selectedSection]);

  // --- KAYDETME ---
  const handleContentChange = useCallback((newData) => {
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

  // --- RENDER ---

  if (!selectedTemplate) {
    return (
      <>
        <style>{styles}</style>
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
      </>
    );
  }

  if (!selectedSection) {
    return (
      <>
        <style>{styles}</style>
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
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
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
    </>
  );
}

export default App;