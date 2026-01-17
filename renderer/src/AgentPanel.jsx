import React, { useState } from 'react'

/*
 AgentPanel provides:
 - Workspace analysis
 - Builds a todo list (multiple-file edits supported)
 - Preview and Run selected tasks
 - Run All will iterate tasks and require confirmation per task
*/

function prettyTask(t) {
  if (t.type === 'write') return `Write file: ${t.path}`
  if (t.type === 'mkdir') return `Create folder: ${t.path}`
  if (t.type === 'rm') return `Remove: ${t.path}`
  if (t.type === 'run') return `Run command: "${t.cmd}" in ${t.cwd}`
  return JSON.stringify(t)
}

export default function AgentPanel({ workspace, setOpenFile, editorApi }) {
  const [todos, setTodos] = useState([])
  const [log, setLog] = useState('')

  const analyze = async () => {
    if (!workspace) return alert('Open a workspace first')
    setLog(prev => prev + `\nAnalyzing ${workspace}...`)
    // Simple heuristics:
    // - If package.json present: suggest npm install
    // - If no README.md: add README
    // - Create multiple edit tasks as sample
    const pkg = await window.electronAPI.readFile(workspace + '/package.json')
    const readme = await window.electronAPI.readFile(workspace + '/README.md')

    const newTodos = []
    if (!pkg.error) {
      newTodos.push({ id: 'npm-install', type: 'run', title: 'Run npm install', cmd: 'npm install', cwd: workspace })
    }
    if (readme.error) {
      newTodos.push({ id: 'add-readme', type: 'write', title: 'Add README.md', path: workspace + '/README.md', contents: '# New Project\n' })
    }

    // Example of a multi-file change: update index.js and add helper.js
    newTodos.push({
      id: 'multi-edit-sample',
      type: 'batch',
      title: 'Sample multi-file edit',
      tasks: [
        { type: 'write', path: workspace + '/src/helper.js', contents: "export function help(){ return 'help' }" },
        { type: 'write', path: workspace + '/src/index.js', contents: "import { help } from './helper.js'; console.log(help())" }
      ]
    })

    setTodos(newTodos)
    setLog(prev => prev + `\nAnalysis complete. ${newTodos.length} tasks created.`)
  }

  const runTask = async (t) => {
    if (t.type === 'run') {
      const confirm = window.confirm(`Run command?\n${t.cmd}\nCWD: ${t.cwd}`)
      if (!confirm) return
      setLog(prev => prev + `\n> Running: ${t.cmd}`)
      const res = await window.electronAPI.runCommand(t.cwd, t.cmd)
      setLog(prev => prev + `\n${res.stdout || ''}${res.stderr || ''}${res.error ? '\\nERROR: ' + res.error : ''}`)
    } else if (t.type === 'write') {
      const confirm = window.confirm(`Write file?\n${t.path}`)
      if (!confirm) return
      const res = await window.electronAPI.writeFile(t.path, t.contents)
      setLog(prev => prev + `\nWrite ${t.path}: ${res.ok ? 'ok' : res.error}`)
    } else if (t.type === 'mkdir') {
      const confirm = window.confirm(`Create folder?\n${t.path}`)
      if (!confirm) return
      const res = await window.electronAPI.mkdir(t.path)
      setLog(prev => prev + `\nMkdir ${t.path}: ${res.ok ? 'ok' : res.error}`)
    } else if (t.type === 'rm') {
      const confirm = window.confirm(`Remove recursively?\n${t.path}`)
      if (!confirm) return
      const res = await window.electronAPI.rm(t.path)
      setLog(prev => prev + `\nRemove ${t.path}: ${res.ok ? 'ok' : res.error}`)
    } else if (t.type === 'batch') {
      // batch is an array of write/mkdir/rm/run tasks
      for (const sub of t.tasks) {
        // re-use runTask for each subtask but don't prompt again — show a final confirmation first
        const finalConfirm = window.confirm(`Execute batch "${t.title}" including ${t.tasks.length} subtasks? (This will prompt per subtask)`)
        if (!finalConfirm) break
        // each sub will prompt; that's intentional for safety
        await runTask(sub)
      }
    }
  }

  const runAll = async () => {
    if (!todos.length) return
    for (const t of todos) {
      await runTask(t)
    }
  }

  const openSample = (t) => {
    if (t.type === 'write' && t.path) {
      setOpenFile && setOpenFile(t.path)
    } else if (t.type === 'batch' && t.tasks && t.tasks[0] && t.tasks[0].path) {
      setOpenFile && setOpenFile(t.tasks[0].path)
    }
  }

  return (
    <div className="agent-panel">
      <h4>Agent</h4>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={analyze}>Analyze workspace</button>
        <button onClick={runAll}>Run All</button>
      </div>

      <ul>
        {todos.map(t => (
          <li key={t.id} className="todo-item">
            <div className="todo-title">{t.title}</div>
            <div className="todo-type">{prettyTask(t)}</div>
            <div className="todo-actions">
              <button onClick={() => runTask(t)}>Run</button>
              <button onClick={() => openSample(t)}>Open</button>
            </div>
          </li>
        ))}
      </ul>

      <pre className="agent-log">{log}</pre>
    </div>
  )
}
