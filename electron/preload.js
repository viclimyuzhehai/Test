const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  readDir: (dir) => ipcRenderer.invoke('fs-read-dir', dir),
  readFile: (filepath) => ipcRenderer.invoke('fs-read-file', filepath),
  writeFile: (filepath, contents) => ipcRenderer.invoke('fs-write-file', filepath, contents),
  mkdir: (dirpath) => ipcRenderer.invoke('fs-mkdir', dirpath),
  rm: (targetPath) => ipcRenderer.invoke('fs-rm', targetPath),
  rename: (oldPath, newPath) => ipcRenderer.invoke('fs-rename', oldPath, newPath),
  runCommand: (cwd, cmd) => ipcRenderer.invoke('run-command', cwd, cmd),
  showOpenDialog: () => ipcRenderer.invoke('show-open-dialog')
})
