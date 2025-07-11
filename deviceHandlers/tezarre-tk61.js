const HID = require('node-hid');

const vendorId = 0x0416;
const productId = 0xC345;
let device;

module.exports = {
	device: {
		name: 'Tezarre TK61 RGB',
		type: 'keyboard',
		ledCount: 1,
		write(colors) {
			if (!device) return;
			const buffer = Buffer.from([0x00, 0xFF, 0x00]); // ejemplo de rojo
			try {
				device.write(buffer);
				console.log('🎨 Buffer enviado');
			} catch (err) {
				console.error('❌ Error al enviar buffer:', err.message);
			}
		}
	},

	async init() {
		const devices = HID.devices();
		console.log('📋 Dispositivos detectados:', devices.length);
		const info = devices.find(d => d.vendorId === vendorId && d.productId === productId);
		if (!info) {
			console.error('❌ No se encontró el dispositivo');
			return false;
		}
		try {
			device = new HID.HID(info.path);
			console.log('✅ Dispositivo abierto:', info.path);
			return true;
		} catch (err) {
			console.error('❌ Error al abrir HID:', err.message);
			return false;
		}
	},

	cleanup() {
		if (device) {
			try {
				device.close();
				console.log('🛑 Dispositivo cerrado');
			} catch (err) {
				console.error('⚠️ Error cerrando dispositivo:', err.message);
			}
		}
	}
};
