const { Service } = require('node-windows');
const path = require('path');

// NestJS loyihangning kompilyatsiya qilingan fayliga yo‘l
const scriptPath = path.join(__dirname, 'dist', 'main.js');

const svc = new Service({
  name: 'PrinterService',
  description: 'Real-time printer connector (NestJS)',
  script: scriptPath,
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ],
});

// Hodisalarni kuzatish (ixtiyoriy, foydali)
svc.on('install', () => {
  console.log('✅ Service o‘rnatildi va ishga tushdi!');
  svc.start();
});

svc.on('alreadyinstalled', () => {
  console.log('⚠️ Service allaqachon o‘rnatilgan.');
});

svc.on('start', () => {
  console.log('🚀 Service ishga tushdi!');
});

svc.on('stop', () => {
  console.log('🛑 Service to‘xtadi.');
});

svc.on('uninstall', () => {
  console.log('🗑️ Service o‘chirildi.');
});

// O‘rnatish
svc.install();
