module.exports = function ({ signal }) {
	const myKeyboard = require('./deviceHandlers/tezarre-tk61.mjs');

	signal.on('start', async () => {
		console.log("🟢 Plugin arrancó");
		const ok = await teclado.init();
		if (ok) {
			console.log("✅ Teclado inicializado, agregando dispositivo");
			signal.deviceManager.addDevice(teclado.device);
		} else {
			console.log("❌ No se pudo inicializar el teclado");
		}
	});

	signal.on('stop', () => {
		myKeyboard.cleanup();
	});
};
