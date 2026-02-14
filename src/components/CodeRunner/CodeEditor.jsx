import React, { useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";

const CodeEditor = ({ language, value, onChange, theme = "vs-dark" }) => {
    const editorRef = useRef(null);

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;
    };

    return (
        <div className="h-full w-full border border-gray-700 rounded-md overflow-hidden shadow-lg">
            <Editor
                height="100%"
                defaultLanguage={language}
                language={language}
                value={value}
                onChange={onChange}
                theme={theme}
                onMount={handleEditorDidMount}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                }}
            />
        </div>
    );
};

export default CodeEditor;
