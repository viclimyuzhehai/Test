import React, { useEffect, useState } from 'react'

export default function FileTree({ dir, onOpen }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    let mounted = true
    if (!dir) {
      setItems([])
      return
    }
    window.electronAPI.readDir(dir).then(res => {
      if (!mounted) return
      if (res.error) {
        setItems([])
      } else {
        setItems(res)
      }
    })
    return () => { mounted = false }
  }, [dir])

  return (
    <div className="file-tree">
      <h4>{dir || 'Workspace'}</h4>
      <ul>
        {items.map((it) => (
          <li key={it.name}>
            <button
              onClick={() => onOpen((dir ? (dir + '/') : '') + it.name)}
              className="file-button"
            >
              {it.name}{it.isDirectory ? '/' : ''}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
