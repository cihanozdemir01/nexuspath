// Dosya Yolu: frontend/src/components/Editor.tsx

import React, { useEffect, useRef } from 'react';
import EditorJS from '@editorjs/editorjs';

import Header from '@editorjs/header';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';

const EDITOR_JS_TOOLS = {
  list: List,
  header: Header,
  quote: Quote,
};

interface EditorProps {
  data?: any; // OutputData yerine 'any' kullanarak tip hatasını esnetiyoruz
  onChange: (data: any) => void; // OutputData yerine 'any'
  holder: string;
}

const EditorComponent: React.FC<EditorProps> = ({ data, onChange, holder }) => {
  const editorInstanceRef = useRef<EditorJS | null>(null);

  useEffect(() => {
    if (!editorInstanceRef.current) {
      const editor = new EditorJS({
        holder: holder,
        tools: EDITOR_JS_TOOLS,
        data: data || {},

        async onReady() {
          console.log('Editor.js hazır.');
        },

        async onChange(api) {
          const savedData = await api.saver.save();
          onChange(savedData);
        },
      });
      editorInstanceRef.current = editor;
    }

    return () => {
      if (editorInstanceRef.current && editorInstanceRef.current.destroy) {
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (editorInstanceRef.current && data) {
      editorInstanceRef.current.render(data);
    }
  }, [data]);

  return <div id={holder} style={{border: '1px solid #ccc', borderRadius: '4px', padding: '10px'}} />;
};

export default EditorComponent;