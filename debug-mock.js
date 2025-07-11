// Mock environment para testing local de plugins SignalRGB
// Ejecutar con: node debug-mock.js

// Mock del objeto device
const device = {
	log: (message) => {
		console.log(`[${new Date().toISOString()}] ${message}`);
	},

	color: (ledIndex, componentIndex) => {
		// Simular colores que van cambiando
		const colors = [
			[255, 0, 0],    // Rojo
			[0, 255, 0],    // Verde  
			[0, 0, 255],    // Azul
			[255, 255, 0],  // Amarillo
			[255, 0, 255],  // Magenta
			[0, 255, 255]   // Cian
		];
		const colorIndex = Math.floor(Date.now() / 2000) % colors.length;
		return colors[colorIndex];
	},

	write: (data, length) => {
		console.log(`📤 MOCK WRITE: [${data.join(", ")}] (${length || data.length} bytes)`);

		// Simular diferentes tipos de errores para testing
		const rand = Math.random();
		if (rand < 0.1) {
			throw new Error("Mock error: Invalid parameter");
		}
		return true;
	},

	pause: (ms) => {
		console.log(`⏸️ MOCK PAUSE: ${ms}ms`);
		// En el mock no pausamos realmente para acelerar las pruebas
	}
};

// Hacer global el objeto device
global.device = device;

// Importar y probar el plugin
console.log("🚀 Iniciando mock environment para Tezarre TK61");
console.log("=".repeat(50));

// Aquí copiarías las funciones de tu plugin para probar
function mockVendorId() { return 0x0416; }
function mockProductId() { return 0xC345; }

function mockHexToRgb(hex) {
	if (!hex.startsWith("#")) hex = "#" + hex;
	let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (!result) {
		device.log("❌ Error en hexToRgb: input inválido");
		return [0, 0, 0];
	}
	return [
		parseInt(result[1], 16),
		parseInt(result[2], 16),
		parseInt(result[3], 16),
	];
}

function mockSendColors(overrideColor) {
	let color;

	if (overrideColor) {
		color = mockHexToRgb(overrideColor);
		device.log(`⚫ Override color: ${overrideColor}`);
	} else {
		color = device.color(0, 0);
		device.log(`🌈 Color capturado: RGB(${color[0]}, ${color[1]}, ${color[2]})`);
	}

	device.log(`📦 Preparando envío de color RGB(${color[0]}, ${color[1]}, ${color[2]})`);

	// Lista de configuraciones a probar sistemáticamente
	let configuraciones = [
		// Config 1: 0x1b como Report ID + datos sin el primer 0x1b
		{
			data: [0x1b, 0x00, 0x50, 0x70, 0x6e, 0x1b, 0x8d, 0xd5, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x09, 0x00, color[0], color[1], color[2], 0x06, 0x00, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00],
			desc: "0x1b como Report ID"
		},

		// Config 2: Report ID 0x00 + datos completos
		{
			data: [0x00, 0x1b, 0x00, 0x50, 0x70, 0x6e, 0x1b, 0x8d, 0xd5, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x09, 0x00, color[0], color[1], color[2], 0x06, 0x00, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00],
			desc: "Report ID 0x00 + datos completos"
		}
	];

	for (let i = 0; i < configuraciones.length; i++) {
		let config = configuraciones[i];
		device.log(`🔄 [${i + 1}/${configuraciones.length}] ${config.desc}`);
		device.log(`📦 Datos (${config.data.length} bytes): [${config.data.join(", ")}]`);

		try {
			device.write(config.data, config.data.length);
			device.log(`✅ Config ${i + 1} completada`);
		} catch (err) {
			device.log(`❌ Config ${i + 1} falló: ${err.message}`);
		}
	}

	device.log("🔍 Todas las configuraciones enviadas");
}

// Simular inicialización
device.log("🔌 Mock Initialize");
device.log(`🔧 Vendor ID: 0x${mockVendorId().toString(16).padStart(4, '0')}`);
device.log(`🔧 Product ID: 0x${mockProductId().toString(16).padStart(4, '0')}`);

// Simular algunos ciclos de render
console.log("\n🎮 Simulando ciclos de render...");
for (let i = 0; i < 3; i++) {
	console.log(`\n--- Ciclo ${i + 1} ---`);
	device.log("🎨 Mock Render ciclo iniciado");
	mockSendColors();
	console.log(""); // Línea en blanco para separar
}

console.log("🏁 Mock testing completado");
