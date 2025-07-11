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
}

export function Render() {
	device.log("🎨 Render ciclo iniciado");
	sendColors();
	device.pause(200); // Pausa más larga para facilitar debugging
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
	let packet = [
		0x1b, 0x00, 0x50, 0x70, 0x6e, 0x1b, 0x8d, 0xd5,
		0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x09, 0x00,
		color[0], color[1], color[2],
		0x06, 0x00, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00
	];

	device.log(`📦 Preparando envío - Longitud: ${packet.length}`);
	device.log(`📦 Datos: [${packet.join(", ")}]`);
	
	// Método 1: Sintaxis típica de SignalRGB con endpoint específico
	try {
		device.write(packet, 27);
		device.log(`📤 Método 1 exitoso (packet, 27)`);
		return;
	} catch (err) {
		device.log("❌ Método 1 error: " + err.message);
	}
	
	// Método 2: Intentar con endpoint 0x00
	try {
		device.write([0x00, ...packet], 28);
		device.log(`📤 Método 2 exitoso (0x00 + packet, 28)`);
		return;
	} catch (err) {
		device.log("❌ Método 2 error: " + err.message);
	}
	
	// Método 3: Formato de 32 bytes (común en HID)
	try {
		let paddedPacket = [...packet];
		while (paddedPacket.length < 32) {
			paddedPacket.push(0x00);
		}
		device.write(paddedPacket, 32);
		device.log(`📤 Método 3 exitoso (32 bytes padded)`);
		return;
	} catch (err) {
		device.log("❌ Método 3 error: " + err.message);
	}
	
	// Método 4: Formato de 64 bytes (otro tamaño común)
	try {
		let paddedPacket = [...packet];
		while (paddedPacket.length < 64) {
			paddedPacket.push(0x00);
		}
		device.write(paddedPacket, 64);
		device.log(`📤 Método 4 exitoso (64 bytes padded)`);
		return;
	} catch (err) {
		device.log("❌ Método 4 error: " + err.message);
	}
	
	// Método 5: Probar diferentes Report IDs
	for (let reportId = 0; reportId <= 3; reportId++) {
		try {
			let packetWithId = [reportId, ...packet];
			device.write(packetWithId, packetWithId.length);
			device.log(`📤 Método 5 exitoso (Report ID: ${reportId})`);
			return;
		} catch (err) {
			device.log(`❌ Método 5 error (Report ID ${reportId}): ${err.message}`);
		}
	}
	
	device.log("❌ Todos los métodos fallaron");
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
