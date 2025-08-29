import React from 'react';
import { createReactEditorJS } from 'react-editor-js';

// Gerekli eklentileri import ediyoruz
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';
import Embed from '@editorjs/embed';

const ReactEditorJS = createReactEditorJS();

// Editor.js'e hangi araçları kullanacağını söylüyoruz
const EDITOR_JS_TOOLS = {
  embed: {
    class: Embed,
    inlineToolbar: true,
  },
  list: {
    class: List,
    inlineToolbar: true,
  },
  header: {
    class: Header,
    inlineToolbar: true,
  },
  quote: {
    class: Quote,
    inlineToolbar: true,
  }
};

// Bu, bizim React bileşenimizdir
const EditorComponent = ({ data, onChange }) => {
  return (
    <ReactEditorJS
      tools={EDITOR_JS_TOOLS}
      defaultValue={data} // Başlangıç verisini buraya veriyoruz
      onChange={async (api) => {
        // Editörde bir değişiklik olduğunda, içeriğin en son halini
        // 'save' metoduyla alıp 'onChange' prop'u ile yukarıya (App.js'e) gönderiyoruz.
        const newData = await api.saver.save();
        onChange(newData);
      }}
    />
  );
};

export default EditorComponent;