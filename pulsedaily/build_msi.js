const { MSICreator } = require('electron-wix-msi');

const APP_DIR = '/Users/ariel/Documents/pulsedailydemo/Electron2/pulsedaily/dist/win-unpacked/pulsedaily.exe';
const OUT_DIR = '/Users/ariel/Documents/pulsedailydemo/Electron2/pulsedaily/out/msi/pulsedaily';

// Step 1: Instantiate the MSICreator
const msiCreator = new MSICreator({
    appDirectory: APP_DIR,
    description: 'PulseDaily survery application',
    exe: 'pulse',
    name: 'PulseDaily',
    manufacturer: 'Ariel Liu',
    version: '1.0.0',
    outputDirectory: OUT_DIR,
    ui: {
        chooseDirectory: false
    }
});

msiCreator.create().then(function () {
    msiCreator.compile();
});