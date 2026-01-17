const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const { exec } = require('child_process')
const isDev = process.env.NODE_ENV !== 'production'

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../renderer/dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

/*
  Filesystem and command handlers.
  All methods return { ok: true, ... } or { error: 'message' }.
*/

ipcMain.handle('fs-read-dir', async (event, dir) => {
  try {
    const files = await fs.promises.readdir(dir, { withFileTypes: true })
    return files.map(f => ({ name: f.name, isDirectory: f.isDirectory() }))
  } catch (err) {
    return { error: err.message }
  }
})

ipcMain.handle('fs-read-file', async (event, filepath) => {
  try {
    const content = await fs.promises.readFile(filepath, 'utf8')
    return { content }
  } catch (err) {
    return { error: err.message }
  }
})

ipcMain.handle('fs-write-file', async (event, filepath, contents) => {
  try {
    await fs.promises.mkdir(path.dirname(filepath), { recursive: true })
    await fs.promises.writeFile(filepath, contents, 'utf8')
    return { ok: true }
  } catch (err) {
    return { error: err.message }
  }
})

ipcMain.handle('fs-mkdir', async (event, dirpath) => {
  try {
    await fs.promises.mkdir(dirpath, { recursive: true })
    return { ok: true }
  } catch (err) {
    return { error: err.message }
  }
})

ipcMain.handle('fs-rm', async (event, targetPath) => {
  try {
    // careful: recursive deletion when directory
    await fs.promises.rm(targetPath, { recursive: true, force: true })
    return { ok: true }
  } catch (err) {
    return { error: err.message }
  }
})

ipcMain.handle('fs-rename', async (event, oldPath, newPath) => {
  try {
    await fs.promises.mkdir(path.dirname(newPath), { recursive: true })
    await fs.promises.rename(oldPath, newPath)
    return { ok: true }
  } catch (err) {
    return { error: err.message }
  }
})

ipcMain.handle('run-command', async (event, cwd, cmd) => {
  return new Promise((resolve) => {
    const child = exec(cmd, { cwd }, (error, stdout, stderr) => {
      resolve({ error: error ? error.message : null, stdout, stderr })
    })
    // optionally forward streaming logs back in future (not needed for MVP)
  })
})

ipcMain.handle('show-open-dialog', async (event) => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  return result
})
