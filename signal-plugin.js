module.exports = function ({ signal }) {
	const teclado = require('./deviceHandlers/tezarre-tk61.js');

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
		teclado.cleanup();
	});
};
