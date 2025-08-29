// Dosya Yolu: frontend/src/components/editor.tsx

import React from 'react';
import { createReactEditorJS } from 'react-editor-js';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';
import Embed from '@editorjs/embed';

const ReactEditorJS = createReactEditorJS();

const EDITOR_JS_TOOLS = {
  embed: Embed as any,
  list: List as any,
  header: Header as any,
  quote: Quote as any,
};

// Prop tiplerini basitleştiriyoruz
interface EditorProps {
  data: any;
  onChange: (data: any) => void;
}

const EditorComponent: React.FC<EditorProps> = ({ data, onChange }) => {
  return (
    <ReactEditorJS
      // instanceRef buradan kaldırıldı
      tools={EDITOR_JS_TOOLS}
      defaultValue={data}
      onChange={async (api) => {
        const newData = await api.saver.save();
        onChange(newData);
      }}
    />
  );
};

export default EditorComponent;