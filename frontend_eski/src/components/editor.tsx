// Dosya Yolu: frontend/src/components/Editor.tsx

import React from 'react';
import { createReactEditorJS } from 'react-editor-js';

// Eklentileri import ediyoruz
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';
import Embed from '@editorjs/embed';

const ReactEditorJS = createReactEditorJS();

const EDITOR_JS_TOOLS = {
  embed: Embed,
  list: List,
  header: Header,
  quote: Quote,
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

export default EditorComponent;