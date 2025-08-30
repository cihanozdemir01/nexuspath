// Dosya Yolu: frontend/src/App.tsx - SAF EDITORJS İLE UYUMLU SON HALİ

import { useState, useEffect, useCallback, useRef } from 'react'; // useRef'i import et
import EditorComponent from './components/editor';
import SectionItem from './components/SectionItem';
import './App.css'; 

import { Container, Typography, List, Button, Divider, Paper, Box, CircularProgress, ListItem, ListItemButton, ListItemText } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// --- Tipler (Interfaces) ---
interface Template { id: string; name: string; description: string | null; }
interface Section { id: string; title: string; prompt: string | null; order_index: number; parent_id: string | null; children?: Section[]; }
interface UserEntry { id: string; content: any; }

function App() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [entry, setEntry] = useState<UserEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingEntry, setIsLoadingEntry] = useState(false);

  // Hiyerarşi fonksiyonu
  const buildSectionTree = (sectionsList: Section[]): Section[] => {
    // Gelen listeyi ve haritayı da 'Section' tipine uygun hale getirelim
    const sectionsMap: Map<string, Section> = new Map(
      sectionsList.map(s => [s.id, { ...s, children: [] }])
    );
    
    const tree: Section[] = []; // <-- Tipi açıkça 'Section[]' olarak belirtiyoruz
    
    sectionsList.forEach(section => {
      if (section.parent_id && sectionsMap.has(section.parent_id)) {
        const parent = sectionsMap.get(section.parent_id);
        if (parent && parent.children) { // 'children'ın varlığını kontrol et
          parent.children.push(sectionsMap.get(section.id)!);
        }
      } else {
        tree.push(sectionsMap.get(section.id)!);
      }
    });
    return tree;
  };

  // --- Veri Çekme Effect'leri ---
  useEffect(() => { fetch('http://localhost:8000/templates/').then(res => res.json()).then(data => setTemplates(data)).catch(console.error); }, []);
  useEffect(() => { if (selectedTemplate) { setSelectedSection(null); fetch(`http://localhost:8000/templates/${selectedTemplate.id}/sections/`).then(res => res.json()).then(data => setSections(data)).catch(console.error); } else { setSections([]); } }, [selectedTemplate]);
  
  // İçerik çekme effect'i güncellendi: Artık editöre render komutu göndermeyecek,
  // çünkü 'key' prop'u bu işi halledecek.
  useEffect(() => {
    if (selectedSection) {
      setIsLoadingEntry(true);
      fetch(`http://localhost:8000/sections/${selectedSection.id}/entry`)
        .then(res => (res.status === 404 ? null : res.json()))
        .then(data => {
          setEntry(data);
          setIsLoadingEntry(false);
        })
        .catch(error => {
          console.error(error);
          setIsLoadingEntry(false);
        });
    } else {
      setEntry(null);
    }
  }, [selectedSection]);

  // --- Otomatik Kaydetme ---
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
    .catch(error => { setIsSaving(false); console.error("Kaydederken hata:", error); });
  }, [selectedSection, entry]);

  // --- RENDER MANTIĞI ---

  if (!selectedTemplate) {
    return (<Container maxWidth="md" sx={{ mt: 4 }}><Typography variant="h4" component="h1" gutterBottom>Yol Haritası Şablonları</Typography><Paper elevation={2}><List>{templates.map((template, index) => (<ListItem key={template.id} disablePadding divider={index < templates.length - 1}><ListItemButton onClick={() => setSelectedTemplate(template)}><ListItemText primary={template.name} /></ListItemButton></ListItem>))}</List></Paper></Container>);
  }

  if (!selectedSection) {
    const sectionTree = buildSectionTree(sections);
    return (<Container maxWidth="md" sx={{ mt: 4 }}><Button startIcon={<ArrowBackIcon />} onClick={() => setSelectedTemplate(null)}>Geri</Button><Typography variant="h4" component="h1" sx={{ mt: 2 }}>{selectedTemplate.name}</Typography><Typography variant="body1" color="text.secondary" paragraph>{selectedTemplate.description || ''}</Typography><Divider sx={{ my: 2 }} /><Typography variant="h5" component="h2" gutterBottom>Başlıklar</Typography><Paper elevation={2}><List>{sectionTree.map((rootSection) => (<SectionItem key={rootSection.id} section={rootSection} onSectionClick={(section) => setSelectedSection(section)} />))}</List></Paper></Container>);
  }

  // Editör ekranı
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => setSelectedSection(null)}>Başlıklara Geri Dön</Button>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
        <Typography variant="h4" component="h1">{selectedSection.title}</Typography>
        <Typography variant="caption" color="text.secondary">{isSaving ? 'Kaydediliyor...' : 'Kaydedildi'}</Typography>
      </Box>
      <Typography variant="body2" fontStyle="italic" color="text.secondary" paragraph>{selectedSection.prompt || ''}</Typography>
      <Divider sx={{ my: 2 }} />
      <Paper elevation={2} sx={{ p: 2, minHeight: 300 }}>
        {isLoadingEntry ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>
        ) : (
          // DİKKAT: 'holder' prop'u yerine tekrar 'key' prop'unu kullanıyoruz.
          // Bu, 'react-editor-js' sarmalayıcısı için doğru olan yöntemdir.
          <EditorComponent
            holder="editorjs-container"
            data={entry?.content}
            onChange={handleContentChange}
          />
        )}
      </Paper>
    </Container>
  );
}

export default App;