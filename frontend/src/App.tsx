import { useState, useEffect, useCallback } from 'react';
import EditorComponent, { ReadOnlyEditorComponent } from './components/editor';
import SectionItem from './components/SectionItem';
import './App.css'; 
import { Container, Typography, List, ListItem, ListItemButton, ListItemText, Button, Divider, Paper, Box, CircularProgress, Tabs, Tab, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';

interface Template { id: string; name: string; description: string | null; }
interface Section { id: string; title: string; prompt: string | null; order_index: number; parent_id: string | null; children?: Section[]; }
interface UserEntry { id: string; content: any; is_favorite: boolean; }
interface Favorite extends UserEntry { section_title: string; }

function App() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [entry, setEntry] = useState<UserEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingEntry, setIsLoadingEntry] = useState(false);
  const [currentView, setCurrentView] = useState<'templates' | 'favorites'>('templates');
  const [favorites, setFavorites] = useState<Favorite[]>([]);

  const buildSectionTree = (sectionsList: Section[]): Section[] => { const sectionsMap = new Map(sectionsList.map(s => [s.id, { ...s, children: [] }])); const tree: Section[] = []; sectionsList.forEach(section => { if (section.parent_id && sectionsMap.has(section.parent_id)) { const parent = sectionsMap.get(section.parent_id); if (parent?.children) { (parent.children as any).push(sectionsMap.get(section.id)!); } } else { (tree as any).push(sectionsMap.get(section.id)!); } }); return tree; };
  const fetchFavorites = () => { fetch('http://localhost:8000/entries/favorites/').then(res => res.json()).then(data => setFavorites(data)).catch(console.error); };
  useEffect(() => { if (currentView === 'templates') { fetch('http://localhost:8000/templates/').then(res => res.json()).then(data => setTemplates(data)).catch(console.error); } else if (currentView === 'favorites') { fetchFavorites(); } }, [currentView]);
  useEffect(() => { if (selectedTemplate) { setSelectedSection(null); fetch(`http://localhost:8000/templates/${selectedTemplate.id}/sections/`).then(res => res.json()).then(data => setSections(data)).catch(console.error); } else { setSections([]); } }, [selectedTemplate]);
  useEffect(() => { if (selectedSection) { setIsLoadingEntry(true); fetch(`http://localhost:8000/sections/${selectedSection.id}/entry`).then(res => (res.status === 404 ? null : res.json())).then(data => { setEntry(data); setIsLoadingEntry(false); }).catch(error => { setIsLoadingEntry(false); console.error(error); }); } else { setEntry(null); } }, [selectedSection]);
  const handleToggleFavorite = useCallback((entryId: string, currentStatus: boolean) => { fetch(`http://localhost:8000/entries/${entryId}/favorite`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_favorite: !currentStatus }), }).then(response => response.json()).then(updatedEntry => { setEntry(updatedEntry); fetchFavorites(); }).catch(console.error); }, []);
  const handleContentChange = useCallback((newData: any) => { if (!selectedSection) return; setIsSaving(true); const updatedEntry = { content: newData }; fetch(`http://localhost:8000/sections/${selectedSection.id}/entry`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedEntry), }).then(response => response.json()).then(savedData => { if (JSON.stringify(entry?.content) !== JSON.stringify(savedData.content)) { setEntry(savedData); } setIsSaving(false); }).catch(error => { setIsSaving(false); }); }, [selectedSection, entry]);

  if (selectedSection) { return (<Container maxWidth="md" sx={{ mt: 4 }}><Button startIcon={<ArrowBackIcon />} onClick={() => setSelectedSection(null)}>Geri</Button><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}><Typography variant="h4" component="h1">{selectedSection.title}</Typography>{entry && (<IconButton onClick={() => handleToggleFavorite(entry.id, entry.is_favorite)}>{entry.is_favorite ? <StarIcon color="warning" /> : <StarBorderIcon />}</IconButton>)}</Box><Typography variant="body2" fontStyle="italic" color="text.secondary" paragraph>{selectedSection.prompt || ''}</Typography><Divider sx={{ my: 2 }} /><Paper elevation={2} sx={{ p: 2, minHeight: 300 }}>{isLoadingEntry ? (<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>) : (<EditorComponent key={selectedSection.id} data={entry?.content || {}} onChange={handleContentChange} />)}</Paper></Container>); }
  if (selectedTemplate) { const sectionTree = buildSectionTree(sections); return (<Container maxWidth="md" sx={{ mt: 4 }}><Button startIcon={<ArrowBackIcon />} onClick={() => setSelectedTemplate(null)}>Geri</Button><Typography variant="h4" component="h1" sx={{ mt: 2 }}>{selectedTemplate.name}</Typography><Typography variant="body1" color="text.secondary" paragraph>{selectedTemplate.description || ''}</Typography><Divider sx={{ my: 2 }} /><Typography variant="h5" component="h2" gutterBottom>Başlıklar</Typography><Paper elevation={2}><List>{sectionTree.map((rootSection) => (<SectionItem key={rootSection.id} section={rootSection} onSectionClick={(section) => setSelectedSection(section)} />))}</List></Paper></Container>); }
  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}><Tabs value={currentView} onChange={(event, newValue) => setCurrentView(newValue)}><Tab label="Tüm Şablonlar" value="templates" /><Tab label="Favorilerim" value="favorites" /></Tabs></Box>
      {currentView === 'templates' && (<Paper elevation={2}><List>{templates.map((template, index) => (<ListItem key={template.id} disablePadding divider={index < templates.length - 1}><ListItemButton onClick={() => setSelectedTemplate(template)}><ListItemText primary={template.name} /></ListItemButton></ListItem>))}</List></Paper>)}
      {currentView === 'favorites' && (<Paper elevation={2}><List>{favorites.map((fav) => (<ListItem key={fav.id} sx={{ display: 'block', mb: 2 }} divider><ListItemText primary={fav.section_title} primaryTypographyProps={{ fontWeight: 'bold', mb: 1 }} /><Paper variant="outlined" sx={{ p: 2 }}><ReadOnlyEditorComponent data={fav.content} /></Paper></ListItem>))}</List></Paper>)}
    </Container>
  );
}

export default App;