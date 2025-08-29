// frontend/src/components/SectionItem.tsx

import React from 'react';
import { Box, List, ListItem, ListItemButton, ListItemText } from '@mui/material';

// Bu bileşenin alacağı tipleri tanımlıyoruz
interface Section {
    id: string;
    title: string;
    prompt: string | null;
    order_index: number;
    parent_id: string | null; // parent_id'yi de eklemek iyi bir pratik
    children?: Section[]; // children alanı Section dizisidir ve isteğe bağlıdır
}

interface SectionItemProps {
  section: Section;
  onSectionClick: (section: Section) => void;
}

const SectionItem: React.FC<SectionItemProps> = ({ section, onSectionClick }) => {
  return (
    <ListItem disablePadding sx={{ display: 'block' }}>
      <ListItemButton onClick={() => onSectionClick(section)}>
        <ListItemText primary={section.title} />
      </ListItemButton>
      
      {/* Eğer bu başlığın alt başlıkları (children) varsa... */}
      {section.children && section.children.length > 0 && (
        // ...onları göstermek için yeni bir Liste oluştur ve her bir alt başlık için
        // bu bileşenin (SectionItem) kendisini tekrar çağır.
        <List disablePadding sx={{ pl: 4 }}> {/* pl: 4 ile girinti veriyoruz */}
          {section.children.map((childSection) => (
            <SectionItem
              key={childSection.id}
              section={childSection}
              onSectionClick={onSectionClick}
            />
          ))}
        </List>
      )}
    </ListItem>
  );
};

export default SectionItem;