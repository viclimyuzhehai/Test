import React, { useState } from 'react'
import FileTree from './FileTree'
import EditorPanel from './EditorPanel'
import AgentPanel from './AgentPanel'

export default function App() {
  const [workspace, setWorkspace] = useState('')
  const [openFile, setOpenFile] = useState(null)
  const [editorApi, setEditorApi] = useState(null)

  const openWorkspace = async () => {
    const res = await window.electronAPI.showOpenDialog()
    if (!res.canceled && res.filePaths && res.filePaths[0]) {
      setWorkspace(res.filePaths[0])
    }
  }

  return (
    <div className="app-root">
      <div className="toolbar">
        <button onClick={openWorkspace}>Open Workspace</button>
        <div className="workspace-path">{workspace}</div>
      </div>
      <div className="main">
        <div className="left">
          <FileTree dir={workspace} onOpen={setOpenFile} />
          <AgentPanel
            workspace={workspace}
            setOpenFile={setOpenFile}
            editorApi={editorApi}
          />
        </div>
        <div className="editor">
          <EditorPanel
            filePath={openFile}
            onEditorReady={(api) => setEditorApi(api)}
          />
        </div>
      </div>
    </div>
  )
}
