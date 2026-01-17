import React, { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import NGramPredictor from '../../agent/ngram.js'

const predictor = new NGramPredictor(3)

export default function EditorPanel({ filePath, onEditorReady }) {
  const [content, setContent] = useState('')
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    if (!filePath) {
      setContent('')
      return
    }
    window.electronAPI.readFile(filePath).then(res => {
      if (!res.error) {
        setContent(res.content)
        predictor.feed(res.content) // seed predictor with file content
      } else {
        setContent('// Error: ' + res.error)
      }
    })
  }, [filePath])

  const handleEditorMount = (editor, monaco) => {
    // Provide editor API to parent
    onEditorReady && onEditorReady(editor)

    // Register a simple listener that updates suggestions on typing
    editor.onDidChangeModelContent(() => {
      const model = editor.getModel()
      const pos = editor.getPosition()
      const word = model.getWordUntilPosition(pos)
      const range = new monaco.Range(pos.lineNumber, Math.max(1, word.startColumn - 10), pos.lineNumber, word.endColumn)
      const prefix = model.getValueInRange(new monaco.Range(Math.max(1, pos.lineNumber - 10), 1, pos.lineNumber, pos.column))
      // feed last change for predictor
      const val = model.getValue()
      predictor.feed(val.slice(-500))
      const preds = predictor.predict(prefix || '')
      setSuggestions(preds)
    })
  }

  const save = async () => {
    if (!filePath) return alert('No file open')
    const res = await window.electronAPI.writeFile(filePath, content)
    if (res.error) alert('Save failed: ' + res.error)
    else alert('Saved')
    predictor.feed(content)
  }

  return (
    <div style={{ height: '100%' }}>
      {filePath ? (
        <>
          <div className="editor-header">
            <div className="file-path">{filePath}</div>
            <div>
              <button onClick={save}>Save</button>
            </div>
          </div>
          <Editor
            height="70vh"
            defaultLanguage="javascript"
            value={content}
            onMount={handleEditorMount}
            onChange={(v) => setContent(v)}
          />
          <div className="suggestions">
            <strong>Suggestions:</strong>
            <ul>
              {suggestions.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        </>
      ) : (
        <div className="empty">Open a file to edit</div>
      )}
    </div>
  )
}
