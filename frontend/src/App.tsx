// Dosya Yolu: frontend/src/App.tsx

import { useState, useEffect, useCallback } from 'react';
import EditorComponent from './components/editor';

// --- YENİ: MUI BİLEŞENLERİNİ İMPORT ET ---
import {
  Container, Typography, List, ListItem, ListItemButton, ListItemText,
  Button, Divider, Paper, Box, CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // Geri ikonu
import SectionItem from './components/SectionItem'; 

// --- Tipler (Interfaces) ---
interface Template { id: string; name: string; description: string | null; }
interface Section {
  id: string;
  title: string;
  prompt: string | null;
  order_index: number;
  parent_id: string | null; // parent_id'yi de eklemek iyi bir pratik
  children?: Section[]; // children alanı Section dizisidir ve isteğe bağlıdır
}
interface UserEntry { id: string; content: any; }

function App() {
  // --- State Değişkenleri ---
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [entry, setEntry] = useState<UserEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingEntry, setIsLoadingEntry] = useState(false);
  const buildSectionTree = (sectionsList: any[]): any[] => {
    const sectionsMap = new Map(sectionsList.map(s => [s.id, { ...s, children: [] }]));
    const tree: any[] = [];

    sectionsList.forEach(section => {
      if (section.parent_id && sectionsMap.has(section.parent_id)) {
        const parent = sectionsMap.get(section.parent_id);
        if (parent) {
          parent.children.push(sectionsMap.get(section.id)!);
        }
      } else {
        tree.push(sectionsMap.get(section.id)!);
      }
    });
    return tree;
  };
    // --- Veri Çekme Effect'leri (DOLDURULMUŞ) ---
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
  
    // --- Otomatik Kaydetme Fonksiyonu (DOLDURULMUŞ) ---
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

  // --- RENDER MANTIĞI (MUI İLE GÜNCELLENDİ) ---

  // 1. Durum: Şablon seçilmemiş
  if (!selectedTemplate) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Yol Haritası Şablonları
        </Typography>
        <Paper elevation={2}>
          <List>
            {templates.map((template, index) => (
              <ListItem key={template.id} disablePadding divider={index < templates.length - 1}>
                <ListItemButton onClick={() => setSelectedTemplate(template)}>
                  <ListItemText primary={template.name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Container>
    );
  }

  // 2. Durum: Başlık seçilmemiş
  if (!selectedSection) {
     // Hiyerarşik veriyi oluştur
    const sectionTree = buildSectionTree(sections);
    
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => setSelectedTemplate(null)}>
          Geri
        </Button>
        <Typography variant="h4" component="h1" sx={{ mt: 2 }}>
          {selectedTemplate.name}
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {selectedTemplate.description || ''}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h5" component="h2" gutterBottom>
          Başlıklar
        </Typography>
        <Paper elevation={2}>
          <List>
            {sectionTree.map((rootSection) => (
              <SectionItem
                key={rootSection.id}
                section={rootSection}
                onSectionClick={(section) => setSelectedSection(section)}
              />
            ))}
          </List>
        </Paper>
      </Container>
    );
  }

  // 3. Durum: Editör ekranı
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => setSelectedSection(null)}>
        Başlıklara Geri Dön
      </Button>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
        <Typography variant="h4" component="h1">
          {selectedSection.title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {isSaving ? 'Kaydediliyor...' : 'Kaydedildi'}
        </Typography>
      </Box>
      <Typography variant="body2" fontStyle="italic" color="text.secondary" paragraph>
        {selectedSection.prompt || ''}
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Paper elevation={2} sx={{ p: 2, minHeight: 300 }}>
        {isLoadingEntry ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <EditorComponent
            key={selectedSection.id}
            data={entry?.content || {}}
            onChange={handleContentChange}
          />
        )}
      </Paper>
    </Container>
  );
}
// Okunabilirlik için, 'useEffect' ve 'handleContentChange' fonksiyonlarının içini
// daha önce çalışan versiyonlarından kopyalayıp buraya yapıştırmalısın.
// Güvenlik için tam kodu bir sonraki mesajda vereceğim.
export default App;