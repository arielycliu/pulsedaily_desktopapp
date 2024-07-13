const { MSICreator } = require('electron-wix-msi');
const path = require('path');

const APP_DIR = path.resolve(__dirname, 'dist/win-unpacked/pulsedaily.exe');
const OUT_DIR = path.resolve(__dirname, 'out/msi/pulsedaily');

// Step 1: Instantiate the MSICreator
const msiCreator = new MSICreator({
    appDirectory: APP_DIR,
    description: 'PulseDaily survery application',
    exe: 'pulse',
    name: 'PulseDaily',
    manufacturer: 'Ariel Liu',
    version: '1.0.0',
    appIconPath: path.resolve(__dirname, 'src/images/icon.ico'),
    outputDirectory: OUT_DIR,
    ui: {
        chooseDirectory: false
    }
});

msiCreator.create().then(function () {
    msiCreator.compile();
});