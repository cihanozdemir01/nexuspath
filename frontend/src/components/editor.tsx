// src/components/Editor.tsx

import React, { useEffect, useRef } from 'react';
import EditorJS from '@editorjs/editorjs'; // Ana kütüphaneyi doğrudan import et
import type { OutputData } from '@editorjs/editorjs';

// Eklentileri import ediyoruz
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';

// Eklentileri bir obje içinde topluyoruz
const EDITOR_JS_TOOLS = {
  list: List,
  header: Header,
  quote: Quote,
};

// Dışarıdan alacağımız props'ların (parametrelerin) tipini tanımlıyoruz
interface EditorProps {
  data: OutputData | undefined; // Veri tipi artık daha spesifik
  onChange: (data: OutputData) => void;
  holder: string; // Editörün hangi HTML elementine bağlanacağını belirtmek için
}

const Editor: React.FC<EditorProps> = ({ data, onChange, holder }) => {
  // Editör instance'ını saklamak için bir React 'ref'i oluşturuyoruz.
  // Bu, component yeniden render olsa bile instance'ın kaybolmamasını sağlar.
  const editorInstanceRef = useRef<EditorJS | null>(null);

  useEffect(() => {
    // Sadece ilk render'da yeni bir EditorJS instance'ı oluştur.
    if (!editorInstanceRef.current) {
      const editor = new EditorJS({
        holder: holder,
        tools: EDITOR_JS_TOOLS,
        data: data,

        // Bu ayar, editör içeriği hazır olduğunda çalışır.
        async onReady() {
          console.log('Editor.js is ready to work!');
        },

        // Bu ayar, kullanıcı bir değişiklik yaptığında çalışır.
        async onChange(api) {
          const savedData = await api.saver.save();
          onChange(savedData);
        },
      });
      editorInstanceRef.current = editor;
    }

    // Component DOM'dan kaldırıldığında, editör instance'ını temizle.
    // Bu, hafıza sızıntılarını önler.
    return () => {
      if (editorInstanceRef.current && editorInstanceRef.current.destroy) {
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
      }
    };
  }, []); // Boş dizi, bu effect'in sadece bir kez çalışmasını sağlar.

  // Bu component artık sadece bir 'div' render ediyor.
  // EditorJS, bu div'in içine kendini çizecek.
  return <div id={holder} />;
};

export default Editor;