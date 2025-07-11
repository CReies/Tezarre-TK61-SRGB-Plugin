module.exports = function ({ signal }) {
	const myKeyboard = require('./deviceHandlers/tezarre-tk61.mjs');

	signal.on('start', async () => {
		await myKeyboard.init();
		signal.deviceManager.addDevice(myKeyboard.device);
	});

	signal.on('stop', () => {
		myKeyboard.cleanup();
	});
};
