import { useState, useEffect, useCallback } from 'react';
import './App.css';
import Editor from './components/editor'; 

// --- VERİ MODELLERİ (TYPESCRIPT INTERFaces) ---

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

// YENİ: UserEntry verisinin yapısını tanımlıyoruz.
// 'content' alanı herhangi bir JSON nesnesi olabileceği için 'any' kullanıyoruz.
interface UserEntry {
  id: string;
  content: any; 
}

function App() {
  // --- DURUM DEĞİŞKENLERİ (STATE HOOKS) ---

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  
  // YENİ: Hangi başlığın seçili olduğunu tutar.
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);

  // YENİ: Seçilen başlığa ait kullanıcı içeriğini tutar.
  const [entry, setEntry] = useState<UserEntry | null>(null);

  // YENİ: Kaydetme durumunu kullanıcıya göstermek için bir state
  const [isSaving, setIsSaving] = useState(false);


  // --- VERİ ÇEKME İŞLEMLERİ (EFFECT HOOKS) ---

  // Şablon listesini çeken effect (değişiklik yok)
  useEffect(() => {
    // ... (kod aynı) ...
    fetch('http://localhost:8000/templates/')
      .then(response => response.json())
      .then(data => setTemplates(data))
      .catch(error => console.error("Şablonlar çekilirken hata:", error));
  }, []);

  // Şablon seçildiğinde başlıkları çeken effect (değişiklik yok)
  useEffect(() => {
    // ... (kod aynı) ...
    if (selectedTemplate) {
      // Bir şablon seçildiğinde, olası bir önceki bölüm seçimini temizle
      setSelectedSection(null); 
      fetch(`http://localhost:8000/templates/${selectedTemplate.id}/sections/`)
        .then(response => response.json())
        .then(data => setSections(data))
        .catch(error => console.error("Başlıklar çekilirken hata:", error));
    } else {
      setSections([]);
    }
  }, [selectedTemplate]);

  // YENİ EFFECT: Bu effect, `selectedSection` durumu değiştiğinde çalışır.
  useEffect(() => {
    // Eğer bir başlık seçilmişse...
    if (selectedSection) {
      // ...o başlığın ID'si ile kullanıcı içeriği için API isteği gönder.
      fetch(`http://localhost:8000/sections/${selectedSection.id}/entry`)
        .then(response => {
          // Backend'imiz içerik bulunamadığında 404 hatası veriyordu.
          // Bu durumu kontrol edip ona göre davranalım.
          if (!response.ok) {
            if (response.status === 404) {
              return null; // İçerik yoksa null döndür.
            }
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(data => setEntry(data)) // Gelen veriyle (veya null ile) state'i güncelle.
        .catch(error => console.error("İçerik çekilirken hata:", error));
    } else {
      // Eğer başlık seçimi kaldırılmışsa, içeriği temizle.
      setEntry(null);
    }
  }, [selectedSection]);

// --- YENİ: OTOMATİK KAYDETME MANTIĞI ---

  // useCallback, fonksiyonun gereksiz yere yeniden oluşturulmasını engeller.
  const handleContentChange = useCallback((newData: any) => {
    if (!selectedSection) return;

    setIsSaving(true); // "Kaydediliyor..." göstergesini aktif et

    const updatedEntry = { content: newData };

    // Backend'e PUT isteği göndererek içeriği kaydet
    fetch(`http://localhost:8000/sections/${selectedSection.id}/entry`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updatedEntry),
    })
    .then(response => response.json())
    .then(savedData => {
      // Gelen güncel veriyle lokal state'i güncelle
      setEntry(savedData);
      setIsSaving(false); // "Kaydediliyor..." göstergesini kaldır
    })
    .catch(error => {
      console.error("Kaydederken hata:", error);
      setIsSaving(false);
    });

  }, [selectedSection]); // Bu fonksiyon sadece selectedSection değiştiğinde yeniden oluşturulur.

  // --- RENDER (EKRANA ÇİZME) MANTIĞI ---

  // 1. Durum: Hiçbir şablon seçilmemiş. Şablon listesini göster.
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

  // 2. Durum: Şablon seçilmiş, ama hiçbir başlık seçilmemiş. Başlık listesini göster.
  if (selectedTemplate && !selectedSection) {
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
  
  // 3. Durum: Hem şablon hem de başlık seçilmiş. İçerik detayını göster.
  // `selectedSection` null olamayacağı için `!` ile TypeScript'e güvence veriyoruz.
   return (
    <div className="container">
      <button onClick={() => setSelectedSection(null)}>← Başlıklara Geri Dön</button>
      <h1>{selectedSection!.title}</h1>
      <p><i>{selectedSection!.prompt}</i></p>
      
      {/* YENİ: Kaydetme durumu göstergesi */}
      <div className="saving-status">{isSaving ? 'Kaydediliyor...' : 'Kaydedildi'}</div>

      <hr />
      
      <div className="content-area">
        {/* 
          Artık <pre> yerine yeni <Editor> bileşenimizi kullanıyoruz.
          - `entry?.content || {}`: Eğer içerik varsa onu, yoksa boş bir obje gönder. Bu, editörün boşken hata vermemesini sağlar.
          - `onChange`: Editörde her değişiklik olduğunda `handleContentChange` fonksiyonumuzu tetikle.
        */}
        <Editor 
          key={selectedSection!.id} 
          holder="editorjs-container" // <-- YENİ PROP
          data={entry?.content} // Artık || {} yapmamıza gerek yok, undefined gönderebiliriz. 
          onChange={handleContentChange} 
        />
      </div>
    </div>
  );
}

export default App;