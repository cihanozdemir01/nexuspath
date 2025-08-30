// Dosya Yolu: frontend/src/components/editor.tsx

import React, { useEffect, useRef } from 'react';
import EditorJS from '@editorjs/editorjs';
import type { OutputData } from '@editorjs/editorjs';

import Header from '@editorjs/header';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';
import Embed from '@editorjs/embed';
import RawTool from '@editorjs/raw';

const EDITOR_JS_TOOLS = {
  raw: RawTool as any,
  embed: { class: Embed as any, config: { services: { youtube: true, spotify: true } } },
  list: List as any,
  header: Header as any,
  quote: Quote as any,
};

interface EditorProps {
  data?: OutputData;
  onChange: (data: OutputData) => void;
  holder: string;
}

const EditorComponent: React.FC<EditorProps> = ({ data, onChange, holder }) => {
  const editorInstanceRef = useRef<EditorJS | null>(null);

  useEffect(() => {
    if (!editorInstanceRef.current) {
      const editor = new EditorJS({
        holder: holder,
        tools: EDITOR_JS_TOOLS,
        data: data || { blocks: [] }, // Tip hatasını önlemek için doğru başlangıç verisi

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

  return <div id={holder} className="codex-editor" />;
};

export default EditorComponent;