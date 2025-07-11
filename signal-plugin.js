module.exports = function (context) {
	const { signal } = context;
	const teclado = require('./deviceHandlers/teclado.js');

	signal.on('start', async () => {
		console.log('🟢 Plugin arrancó');
		const ok = await teclado.init();
		if (ok) {
			console.log('✅ Teclado inicializado, agregando dispositivo');
			context.deviceManager.addDevice(teclado.device);
		} else {
			console.error('❌ No se pudo inicializar el teclado');
		}
	});

	signal.on('stop', () => {
		teclado.cleanup();
		console.log('🛑 Plugin detenido');
	});
};
