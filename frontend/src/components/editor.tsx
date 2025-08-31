import React, { useRef, useEffect } from 'react';
import { createReactEditorJS } from 'react-editor-js';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';
import Embed from '@editorjs/embed';
import RawTool from '@editorjs/raw';

const ReactEditorJS = createReactEditorJS();

const EDITOR_JS_TOOLS = {
  raw: RawTool as any,
  embed: { class: Embed as any, config: { services: { youtube: true, spotify: true } } },
  list: List as any,
  header: Header as any,
  quote: Quote as any,
};

interface EditorProps {
  data: any;
  onChange: (data: any) => void;
}

const EditorComponent: React.FC<EditorProps> = ({ data, onChange }) => {
  return (
    <ReactEditorJS
      tools={EDITOR_JS_TOOLS}
      defaultValue={data}
      onChange={async (api) => {
        const newData = await api.saver.save();
        onChange(newData);
      }}
    />
  );
};

// --- YENİ: SALT OKUNUR EDİTÖR ---
export const ReadOnlyEditorComponent: React.FC<{ data: any }> = ({ data }) => {
  // Bu ref, editörün her render'da yeniden oluşturulmasını önler
  const editorInstanceRef = useRef<EditorJS | null>(null);
  // Holder ID'sinin her bileşen için eşsiz olmasını sağlar
  const holderId = `editor-readonly-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    if (!editorInstanceRef.current && data) {
      const editor = new EditorJS({
        holder: holderId,
        tools: EDITOR_JS_TOOLS,
        data: data,
        readOnly: true, // <-- SİHİRLİ AYAR BU!
        
        // Salt okunur modda onChange'e ihtiyacımız yok
      });
      editorInstanceRef.current = editor;
    }

    return () => {
      if (editorInstanceRef.current && editorInstanceRef.current.destroy) {
        editorInstanceRef.current.destroy();
        editorInstanceRef.current = null;
      }
    };
  }, [data, holderId]);

  return <div id={holderId} />;
};
export default EditorComponent;