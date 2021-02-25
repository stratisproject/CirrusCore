import { app, BrowserWindow, ipcMain, Menu, nativeImage, Tray } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as os from 'os';

if (os.arch() === 'arm') {
  app.disableHardwareAcceleration();
}

const daemonName = 'Stratis.CirrusD';
const applicationName = 'Cirrus Core';

let serve;
let testnet;
let nodaemon;
let devtools;

const args = process.argv.slice(1);

args.push('--enableSignalR');

if (os.platform() === 'darwin') {
  args.push('--dbtype=rocksdb');
}

serve = args.some(val => val === '--serve' || val === '-serve');
testnet = args.some(val => val === '--testnet' || val === '-testnet');
nodaemon = args.some(val => val === '--nodaemon' || val === '-nodaemon');
devtools = args.some(val => val === '--devtools' || val === '-devtools');

// Set default API port according to network
let apiPortDefault;
if (testnet) {
  apiPortDefault = 38223;
} else {
  apiPortDefault = 37223;
}

// Sets default arguments
const coreargs = require('minimist')(args, {
  default: {
    daemonip: 'localhost',
    apiport: apiPortDefault
  },
});

// Apply arguments to override default daemon IP and port
let daemonIP;
let apiPort;
daemonIP = coreargs.daemonip;
apiPort = coreargs.apiport;

// Prevents daemon from starting if connecting to remote daemon.
if (daemonIP !== 'localhost') {
  nodaemon = true;
}

ipcMain.on('get-port', (event, arg) => {
  event.returnValue = apiPort;
});

ipcMain.on('get-testnet', (event, arg) => {
  event.returnValue = testnet;
});

ipcMain.on('get-daemonip', (event, arg) => {
  event.returnValue = daemonIP;
});

require('electron-context-menu')({
  showInspectElement: serve
});

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1150,
    height: 650,
    frame: true,
    minWidth: 1150,
    minHeight: 650,
    title: applicationName,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  if (serve) {
    require('electron-reload')(__dirname, {});
    mainWindow.loadURL('http://localhost:4200');
  } else {
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }

  if (serve || devtools) {
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is going to close.
  mainWindow.on('close', () => {
    if (!serve && !nodaemon) {
      shutdownDaemon(daemonIP, apiPort);
    }
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  // Remove menu, new from Electron 5
  mainWindow.removeMenu();

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  if (serve) {
    console.log('Cirrus UI was started in development mode. This requires the user to be running the StratisFullNode daemon himself.');
  } else {
    if (!nodaemon) {
      startDaemon();
    }
  }
  createTray();
  createWindow();
  if (os.platform() === 'darwin') {
    createMenu();
  }
});

/* 'before-quit' is emitted when Electron receives
 * the signal to exit and wants to start closing windows */
app.on('before-quit', () => {
  if (!serve && !nodaemon) {
    shutdownDaemon(daemonIP, apiPort);
  }
});

app.on('quit', () => {
  if (!serve && !nodaemon) {
    shutdownDaemon(daemonIP, apiPort);
  }
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

function shutdownDaemon(daemonAddr, portNumber) {
  writeLog('Sending POST request to shut down daemon.');
  const http = require('http');
  const options = {
    hostname: daemonAddr,
    port: portNumber,
    path: '/api/node/shutdown',
    method: 'POST'
  };

  const req = http.request(options);

  req.on('response', (res) => {
    if (res.statusCode === 200) {
      writeLog('Request to shutdown daemon returned HTTP success code.');
    } else {
      writeError('Request to shutdown daemon returned HTTP failure code: ' + res.statusCode);
    }
  });

  req.on('error', (err) => {
    writeError('Request to shutdown daemon failed.');
  });

  req.setHeader('content-type', 'application/json-patch+json');
  req.write('true');
  req.end();
}

function startDaemon() {
  let daemonProcess;
  const spawnDaemon = require('child_process').spawn;

  let daemonPath;
  if (os.platform() === 'win32') {
    daemonPath = path.resolve(__dirname, '..\\..\\resources\\daemon\\' + daemonName + '.exe');
  } else if (os.platform() === 'linux') {
    daemonPath = path.resolve(__dirname, '..//..//resources//daemon//' + daemonName);
  } else {
    daemonPath = path.resolve(__dirname, '..//..//resources//daemon//' + daemonName);
  }

  const spawnArgs = args.filter(arg => arg.startsWith('-'))
    .join('&').replace(/--/g, '-').split('&');

  console.log('Starting daemon ' + daemonPath);
  console.log(spawnArgs);

  daemonProcess = spawnDaemon(daemonPath, spawnArgs, {
    detached: false
  });

  daemonProcess.stdout.on('data', (data) => {
    writeLog(`Stratis: ${data}`);
  });
}

function createTray() {
  // Put the app in system tray
  let iconPath = 'cirrus/icon-16.png';
  let trayIcon;
  if (serve) {
    trayIcon = nativeImage.createFromPath('./src/assets/images/' + iconPath);
  } else {
    trayIcon = nativeImage.createFromPath(path.resolve(__dirname, '../../resources/src/assets/images/' + iconPath));
  }

  const systemTray = new Tray(trayIcon);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Hide/Show',
      click: function () {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
      }
    },
    {
      label: 'Exit',
      click: function () {
        app.quit();
      }
    }
  ]);
  systemTray.setToolTip(applicationName);
  systemTray.setContextMenu(contextMenu);
  systemTray.on('click', function () {
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    }

    if (!mainWindow.isFocused()) {
      mainWindow.focus();
    }
  });

  app.on('window-all-closed', function () {
    if (systemTray) {
      systemTray.destroy();
    }
  });
}

function writeLog(msg) {
  console.log(msg);
}

function writeError(msg) {
  console.log("Error: " + msg);
}

function createMenu() {
  const menuTemplate = [{
    label: app.getName(),
    submenu: [
      {label: 'About ' + app.getName(), selector: 'orderFrontStandardAboutPanel:'},
      {
        label: 'Quit', accelerator: 'Command+Q', click: function () {
          app.quit();
        }
      }
    ]
  }, {
    label: 'Edit',
    submenu: [
      {label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:'},
      {label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:'},
      {label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:'},
      {label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:'},
      {label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:'},
      {label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:'}
    ]
  }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
}
