export function Name() { return "Tezarre TK61"; }
export function VendorId() { return 0x3434; }
export function ProductId() { return 0x0140; }
export function Publisher() { return "CReies"; }
export function Documentation() { return "SignalRGB plugin para Tezarre TK61 keyboard con soporte completo de RGB"; }
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
	device.log("✅ Plugin inicializado correctamente - listo para el canvas RGB");
}

export function Render() {
	sendColors();
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
	} else {
		color = device.color(0, 0);
	}

	// Usar la configuración que mejor funciona: Modo estático OpenRGB
	// Basado en las pruebas: ROJO funcionó perfectamente
	let buf = new Array(64).fill(0x00);
	buf[0] = 0x01;  // Report ID según OpenRGB
	buf[1] = 0x07;  // SetMode command
	buf[6] = 0x00;  // CLASSIC_CONST_MODE_VALUE (static)
	buf[7] = 0x04;  // brightness max
	buf[8] = 0x02;  // speed medium
	buf[9] = color[0];   // R
	buf[10] = color[1];  // G
	buf[11] = color[2];  // B
	buf[15] = 0x00; // direction
	buf[16] = 0x00; // not random

	try {
		device.write(buf, buf.length);
	} catch (err) {
		device.log(`❌ Error enviando color: ${err.message}`);
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

	return false;
}
