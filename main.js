/* eslint-disable no-undef */
/* eslint-disable semi */
/* eslint-disable no-unused-vars */
/* eslint-disable no-var */
import 'v8-compile-cache'
// Modules to control application life and create native browser window
import { app, BrowserWindow, screen, clipboard, dialog } from 'electron'
import { register } from 'electron-localshortcut'
import { join } from 'path'
import prompt from 'electron-prompt'
import { Client } from 'discord-rpc'

import { AppUpdater, autoUpdater } from 'electron-updater'
var mainWindow
let fromlogin = false

if (process.platform === 'win32') {
  app.commandLine.appendSwitch('ignore-gpu-blacklist')
  app.commandLine.appendSwitch('disable-gpu-vsync')
  app.commandLine.appendSwitch('enable-pointer-lock-options')
  app.commandLine.appendSwitch('enable-quic')
  app.commandLine.appendSwitch('disable-accelerated-video-decode', false)
  app.commandLine.appendSwitch('disable-frame-rate-limit')
}

function Init () {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  mainWindow = new BrowserWindow({
    height: height,
    weight: width,
    webPreferences: {
      preload: join(__dirname, 'preload.js')
    },
    removeMenu: true
  })

  const rpc = new Client({
    transport: 'ipc'
  })
  rpc.login({
    clientId: '809694543490056192'
  })
  var date = Date.now()
  rpc.once('connected', () => {
    setInterval(() => {
      rpc.setActivity({
        largeImageKey: 'logo',
        largeImageText: `PClient v${app.getVersion()}`,
        startTimestamp: new Date(),
        details: `PClient v${app.getVersion()}`
      })
    }, 1e4)
  })

  app.on('before-quit', () => rpc.destroy())

  mainWindow.on('close', () => {
    mainWindow = null
    if (!fromlogin) {
      app.quit()
    }
  })
  mainWindow.setFullScreen(true)
  mainWindow.loadURL('https://ev.io/')
  mainWindow.setResizable(false)

  mainWindow.webContents.on('did-finish-load', (event) => {
    if (process.platform === 'win32') {
      if (mainWindow.webContents.getURL() === 'https://ev.io/user/login') {
        mainWindow.loadURL('https://ev.io/')
        createNewWindow('https://ev.io/user/login', mainWindow)
      }
    }
    const url = mainWindow.webContents.getURL()
    if (url.indexOf('ev.io/') === -1) {
      mainWindow.loadURL('https://ev.io/')
    }
  })

  function LinkBox () {
    function input () {
      var myPrompt = prompt({
        title: 'Join a Private game',
        label: 'Please enter your Invite link here',
        // eslint-disable-next-line no-undef
        value: paste,
        inputAttrs: {
          type: 'url'
        },
        type: 'input'
      })
      return myPrompt
    }
  }

  function ispasted (url) {
    mainWindow.loadURL(url)
  }
  let shortcut1 = 'F1'
  let shortcut2 = 'F2'
  if (process.platform === 'darwin') {
    shortcut1 = 'CommandOrControl+' + shortcut1
    shortcut2 = 'CommandOrControl+' + shortcut2
  }
  register(mainWindow, shortcut2, () => {
    LinkBox()
    // check paste for joining private game
    let clipboardText = clipboard.readText()
    if (clipboardText.indexOf('ev.io/?game=') === -1) {
      clipboardText = 'https://ev.io/'
    }
    ispasted(clipboardText)
  })

  register(mainWindow, shortcut1, () => {
    mainWindow.loadURL('https://ev.io/')
  })

  register('ESC', () => {
    mainWindow.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'M' })
    mainWindow.webContents.executeJavaScript(`
                document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;
                document.exitPointerLock();
  `)
  })
  mainWindow.webContents.on('will-prevent-unload', (event) =>
    event.preventDefault()
  )
  mainWindow.webContents.on('dom-ready', (event) => {
    mainWindow.setTitle(`EvClient V${app.getVersion()}`)
    event.preventDefault()
  })
  register(mainWindow, 'Alt+F4', () => {
    app.quit()
  })
  register(mainWindow, 'F11', () => {
    mainWindow.setSimpleFullScreen(!mainWindow.isSimpleFullScreen())
  })
}

function createNewWindow (url, mainWindow) {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  var win = new BrowserWindow({
    width: width * 0.8,
    height: height * 0.8,
    show: false,
    parent: mainWindow,
    removeMenu: true,
    webPreferences: {
      nodeIntegration: true
    }
  })
  win.setSimpleFullScreen(false)
  win.loadURL(url)
  win.webContents.on('dom-ready', (event) => {
    event.preventDefault()
  })
  win.webContents.on('will-prevent-unload', (event) => event.preventDefault())
  register(win, 'Alt+F4', () => {
    app.quit()
  })
  win.on('ready-to-show', () => {
    setTimeout(() => {
      if (!win.isDestroyed()) {
        win.show()
      }
    }, 500)
  })
  win.webContents.on('did-finish-load', (event) => {
    if (win.webContents.getURL() === 'https://ev.io/') {
      win.close()
      setTimeout(() => {
        fromlogin = true
        mainWindow.close()
        Init()
        fromlogin = false
      }, 500)
    }
  })
}

startUpdater ( {
  const { autoUpdater } = require('electron-updater')
  autoUpdater.checkForUpdatesAndNotify()

  autoUpdater.once('update-available', () => {
    this.gameWindow.webContents.executeJavaScript(
      'alert("Update is available and with be installed in the background.")'
    )
})

autoUpdater.once('update-downloaded', () => {
  this.gameWindow.webContents
    .executeJavaScript('alert("The update will be installed now.")')
    .then(() =>autoUpdater.quitAndInstall())
    .catch((error) => console.log(error))
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
