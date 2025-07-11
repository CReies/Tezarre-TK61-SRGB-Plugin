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
			const buffer = Buffer.from([0x00, 0xFF, 0x00]);
			try {
				device.write(buffer);
				log("🎨 Buffer enviado");
			} catch (err) {
				log("💥 Error escribiendo buffer: " + err.message);
			}
		}
	},

	async init(log) {
		log("init() called");
		const devices = HID.devices();
		log("Devices count: " + devices.length);
		const info = devices.find(d => d.vendorId === vendorId && d.productId === productId);
		if (!info) {
			log("No se encontró dispositivo TK61");
			return false;
		}
		try {
			device = new HID.HID(info.path);
			log("Dispositivo abierto: " + info.path);
			return true;
		} catch (err) {
			log("Error abriendo dispositivo: " + err.message);
			return false;
		}
	},

	cleanup(log) {
		log("cleanup() called");
		if (device) {
			try {
				device.close();
				log("Dispositivo cerrado");
			} catch (err) {
				log("Error cerrando dispositivo: " + err.message);
			}
		}
	}
};
