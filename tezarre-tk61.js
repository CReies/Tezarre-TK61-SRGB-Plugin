export function Name() { return "Tezarre TK61"; }
export function VendorId() { return 0x0416; }
export function ProductId() { return 0xC345; }
export function Publisher() { return "CReies"; }
export function Documentation() { return ""; }
export function Size() { return [1, 1]; }
export function DefaultPosition() { return [240, 120]; }
export function DefaultScale() { return 8.0; }

let vLedNames = ["LED 1"];
let vLedPositions = [[0, 0]];
let shutdownColor = "#000000";

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {
	device.log("🔌 Inicializando Tezarre TK61...");
	device.log("🔧 Información del dispositivo:");
	device.log(`🔧 Vendor ID: 0x${VendorId().toString(16).padStart(4, '0')}`);
	device.log(`🔧 Product ID: 0x${ProductId().toString(16).padStart(4, '0')}`);

	// Intentar un comando de inicialización si es necesario
	device.log("🔧 Plugin inicializado correctamente");
}

export function Render() {
	device.log("🎨 Render ciclo iniciado");
	sendColors();
	device.pause(1000); // Pausa de 1 segundo para facilitar debugging
}

export function Shutdown(SystemSuspending) {
	device.log("⏹️ Apagando plugin");
	if (SystemSuspending) {
		sendColors("#000000");
	} else {
		sendColors(shutdownColor);
	}
}

function sendColors(overrideColor) {
	let color;

	if (overrideColor) {
		color = hexToRgb(overrideColor);
		device.log(`⚫ Override color: ${overrideColor}`);
	} else {
		color = device.color(0, 0);
		device.log(`🌈 Color capturado: RGB(${color[0]}, ${color[1]}, ${color[2]})`);
	}

	// Paquete base capturado de Wireshark, sin los colores
	let basePacket = [
		0x1b, 0x00, 0x50, 0x70, 0x6e, 0x1b, 0x8d, 0xd5,
		0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x09, 0x00,
		color[0], color[1], color[2],
		0x06, 0x00, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00
	];

	device.log(`📦 Preparando envío - Longitud: ${basePacket.length}`);
	device.log(`📦 Datos base: [${basePacket.join(", ")}]`);

	// Lista de configuraciones a probar
	let configuraciones = [
		// Configuración 1: Paquete original
		{ data: basePacket, desc: "Paquete original (27 bytes)" },

		// Configuración 2: Con Report ID 0x00
		{ data: [0x00, ...basePacket], desc: "Con Report ID 0x00 (28 bytes)" },

		// Configuración 3: Con Report ID 0x01  
		{ data: [0x01, ...basePacket], desc: "Con Report ID 0x01 (28 bytes)" },

		// Configuración 4: Con Report ID 0x02
		{ data: [0x02, ...basePacket], desc: "Con Report ID 0x02 (28 bytes)" },

		// Configuración 5: Padding a 32 bytes
		{ data: [...basePacket, 0x00, 0x00, 0x00, 0x00, 0x00], desc: "Padding a 32 bytes" },

		// Configuración 6: El primer byte podría ser el Report ID
		{ data: [0x00, 0x00, 0x50, 0x70, 0x6e, 0x1b, 0x8d, 0xd5, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x09, 0x00, color[0], color[1], color[2], 0x06, 0x00, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00], desc: "Reinterpretando 0x1b como Report ID" }
	];

	for (let i = 0; i < configuraciones.length; i++) {
		let config = configuraciones[i];
		device.log(`🔄 Probando configuración ${i + 1}: ${config.desc}`);

		try {
			device.write(config.data, config.data.length);
			device.log(`✅ ÉXITO configuración ${i + 1}: ${config.desc}`);
			return; // Si funciona, salir
		} catch (err) {
			device.log(`❌ Falló configuración ${i + 1}: ${err.message}`);
		}
	}

	device.log("❌ Todas las configuraciones fallaron");
}



function hexToRgb(hex) {
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

export function Validate(endpoint) {
	device.log("🔍 Validando endpoint...");
	device.log(`🔍 Endpoint interface: ${endpoint.interface}, usage: 0x${endpoint.usage?.toString(16).padStart(4, '0')}, usage_page: 0x${endpoint.usage_page?.toString(16).padStart(4, '0')}, collection: ${endpoint.collection}`);

	// Prioridad 1: Interfaz 2 con usage_page vendor-specific (0xff1b)
	if (endpoint.interface === 2 && endpoint.usage_page === 0xff1b) {
		device.log(`✅ Endpoint PERFECTO (vendor-specific): interface ${endpoint.interface}`);
		return true;
	}

	// Prioridad 2: Solo interfaz 2 (la más prometedora según los logs)
	if (endpoint.interface === 2) {
		device.log(`✅ Endpoint BUENO (interface 2): intentando...`);
		return true;
	}

	device.log(`❌ Endpoint rechazado: interface ${endpoint.interface}`);
	return false;
}
