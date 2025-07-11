const HID = require('node-hid');

const vendorId = 0x0416;
const productId = 0xC345;

let device;

module.exports = {
	device: {
		name: "Mi Teclado RGB",
		type: "keyboard",
		ledCount: 1, // Cambia si tienes control por tecla
		write: function (colors) {
			if (!device) return;

			// Esto solo manda rojo fijo como prueba.
			const r = colors[0]?.r || 0;
			const g = colors[0]?.g || 0;
			const b = colors[0]?.b || 0;

			// ⚠️ Este buffer es de prueba. Debe adaptarse a tu teclado.
			const buffer = Buffer.from([
				0x00, r, g, b, 0x00, 0x00, 0x00, 0x00 // ejemplo genérico
			]);

			try {
				device.write(buffer);
			} catch (err) {
				console.error("❌ Error al escribir en el dispositivo:", err.message);
			}
		},
	},

	init: async function () {
		const devices = HID.devices();
		const info = devices.find(
			(d) =>
				d.vendorId === vendorId &&
				d.productId === productId &&
				d.path.includes("mi_02") // puede ser sensible a mayúsculas/minúsculas
		);

		if (!info) {
			console.error("❌ Dispositivo no encontrado");
			return false;
		}

		try {
			device = new HID.HID(info.path);
			console.log("✅ Teclado RGB conectado:", info.path);
			return true;
		} catch (err) {
			console.error("❌ Error al abrir el dispositivo:", err.message);
			return false;
		}
	},

	cleanup: function () {
		if (device) {
			try {
				device.close();
				console.log("🛑 Teclado desconectado");
			} catch (err) {
				console.error("⚠️ Error al cerrar el dispositivo:", err.message);
			}
		}
	},
};
