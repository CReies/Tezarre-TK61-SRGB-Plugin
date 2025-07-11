const fs = require('fs');
const path = require('path');
const logPath = path.join(__dirname, 'plugin-log.txt');
const log = (msg) => {
	fs.appendFileSync(logPath, new Date().toISOString() + " " + msg + "\n");
};

module.exports = function (context) {
	log("module.exports function loaded");

	const { signal, deviceManager } = context;
	const teclado = require('./deviceHandlers/teclado.js');

	signal.on('start', async () => {
		log("start event triggered");
		const ok = await teclado.init(log);
		if (ok) {
			log("init OK — adding device");
			deviceManager.addDevice(teclado.device);
		} else {
			log("init FAILED");
		}
	});

	signal.on('stop', () => {
		log("stop event triggered");
		teclado.cleanup(log);
	});
};
