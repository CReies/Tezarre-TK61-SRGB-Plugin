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
	device.pause(50); // Aumentar pausa para evitar saturar el bus
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

	// Convertir a Buffer si es necesario
	let buffer = new Uint8Array(packet);
	
	try {
		device.log(`📦 Preparando envío - Longitud: ${buffer.length}`);
		device.log(`📦 Datos: [${Array.from(buffer).join(", ")}]`);
		
		// Intentar con endpoint 0x01 en lugar de 0x00
		device.write(0x01, buffer);
		device.log(`📤 Paquete enviado exitosamente a endpoint 0x01`);
	} catch (err) {
		device.log("❌ Error al enviar paquete a 0x01: " + err.message);
		
		// Fallback: intentar con endpoint 0x00
		try {
			device.write(0x00, buffer);
			device.log(`📤 Paquete enviado exitosamente a endpoint 0x00 (fallback)`);
		} catch (err2) {
			device.log("❌ Error al enviar paquete a 0x00: " + err2.message);
		}
	}
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
	device.log(`🔍 Endpoint interface: ${endpoint.interface}, direction: ${endpoint.direction}, type: ${endpoint.type}`);
	
	// Validar que sea un endpoint de salida (OUT) y de tipo interrupt o bulk
	if (endpoint.direction === "out" && (endpoint.type === "interrupt" || endpoint.type === "bulk")) {
		device.log(`✅ Endpoint válido: ${endpoint.address}`);
		return true;
	}
	
	device.log(`❌ Endpoint no válido: ${endpoint.address}`);
	return false;
}
