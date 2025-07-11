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

	// Asegurar que el paquete tiene la longitud correcta
	if (packet.length === 0) {
		device.log("❌ Error: paquete vacío");
		return;
	}

	device.log(`📦 Preparando envío - Longitud: ${packet.length}`);
	device.log(`📦 Datos: [${packet.join(", ")}]`);
	
	// Método 1: device.write con array directo (más común en SignalRGB)
	try {
		device.write(packet, packet.length);
		device.log(`📤 Paquete enviado exitosamente (array + length)`);
		return; // Si funciona, salir aquí
	} catch (err) {
		device.log("❌ Error array + length: " + err.message);
	}
	
	// Método 2: device.write solo con array
	try {
		device.write(packet);
		device.log(`📤 Paquete enviado exitosamente (solo array)`);
		return;
	} catch (err) {
		device.log("❌ Error solo array: " + err.message);
	}
	
	// Método 3: Probar setFeatureReport (método HID común)
	try {
		device.setFeatureReport(packet, packet.length);
		device.log(`📤 setFeatureReport exitoso`);
		return;
	} catch (err) {
		device.log("❌ Error setFeatureReport: " + err.message);
	}
	
	// Método 4: Probar con diferentes formatos de buffer
	try {
		let buffer = new Uint8Array(packet);
		device.write(buffer);
		device.log(`📤 Uint8Array exitoso`);
		return;
	} catch (err) {
		device.log("❌ Error Uint8Array: " + err.message);
	}
	
	// Método 5: Intentar con report ID
	try {
		let packetWithReportId = [0x00, ...packet];
		device.write(packetWithReportId);
		device.log(`📤 Con Report ID exitoso`);
		return;
	} catch (err) {
		device.log("❌ Error con Report ID: " + err.message);
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

	// Buscar la interfaz 2 con usage_page vendor-specific (0xff1b)
	if (endpoint.interface === 2 && endpoint.usage_page === 0xff1b) {
		device.log(`✅ Endpoint válido (vendor-specific): interface ${endpoint.interface}`);
		return true;
	}

	// También intentar con interfaz 0 como fallback
	if (endpoint.interface === 0) {
		device.log(`⚠️ Endpoint fallback (interface 0): intentando...`);
		return true;
	}

	device.log(`❌ Endpoint no válido: interface ${endpoint.interface}`);
	return false;
}
