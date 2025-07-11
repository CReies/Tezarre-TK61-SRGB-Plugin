export function Name() { return "Tezarre TK61 RGB"; }
export function VendorId() { return 0x3434; }
export function ProductId() { return 0x0140; }
export function Publisher() { return "Crist"; }
export function Documentation() { return "support/Documentation.md"; }
export function Size() { return [22, 6]; }
export function DefaultPosition() { return [10, 100]; }
export function DefaultScale() { return 8.0; }
export function ConflictingProcesses() { return ["Tezarre.exe"]; }
export function ControllableParameters() {
	return [
		{ "property": "shutdownColor", "group": "lighting", "label": "Shutdown Color", "min": "0", "max": "360", "type": "color", "default": "#009bde" },
		{ "property": "LightingMode", "group": "lighting", "label": "Lighting Mode", "type": "combobox", "values": ["Canvas", "Forced"], "default": "Canvas" },
		{ "property": "forcedColor", "group": "lighting", "label": "Forced Color", "min": "0", "max": "360", "type": "color", "default": "#009bde" },
	];
}

// Layout completo del TKL con offsets de OpenRGB
const keyMap = [
	// Row 0: Function keys
	[7, 0xFF, 13, 16, 19, 22, 0xFF, 28, 31, 34, 37, 0xFF, 40, 43, 46, 49, 0xFF, 52, 55, 58],
	// Row 1: Number row  
	[83, 86, 89, 92, 95, 98, 101, 104, 107, 110, 113, 116, 119, 135, 0xFF, 138, 141, 144],
	// Row 2: QWERTY row
	[159, 162, 165, 168, 171, 174, 177, 180, 183, 186, 199, 202, 205, 211, 0xFF, 214, 217, 220],
	// Row 3: ASDF row
	[235, 241, 244, 247, 250, 263, 266, 269, 272, 275, 278, 281, 284, 287, 0xFF, 0xFF, 0xFF, 0xFF],
	// Row 4: ZXCV row
	[311, 314, 327, 330, 333, 336, 339, 342, 345, 348, 351, 354, 363, 0xFF, 0xFF, 369, 0xFF, 0xFF],
	// Row 5: Bottom row
	[397, 400, 403, 0xFF, 0xFF, 415, 0xFF, 0xFF, 0xFF, 427, 430, 433, 436, 0xFF, 442, 455, 458, 0xFF]
];

// WASD específico para test
const WASD_OFFSETS = {
	W: 165,
	A: 241,
	S: 244,
	D: 247
};

let device;

export function Initialize() {
	device = hid.Open(VendorId(), ProductId());
	if (device == 0) {
		return false;
	}

	// Activar modo Direct (per-LED control) - Config 6
	console.log("Activando modo Direct para control individual...");
	const modePacket = [0x01, 0x07, 0x06, 0x03, 0x00, 0x00, 0x00, 0x00];
	padToLength(modePacket, 64);
	hid.WriteFile(device, modePacket, modePacket.length);

	console.log("Tezarre TK61 inicializado con control individual de LEDs");
	return true;
}

export function Render() {
	sendColors();
}

export function Shutdown() {
	const shutdownCol = hexToRgb(shutdownColor);
	if (device != 0) {
		// Modo estático para shutdown
		const modePacket = [0x01, 0x07, 0x01, 0x03, 0x00, 0x00, 0x00, 0x00];
		padToLength(modePacket, 64);
		hid.WriteFile(device, modePacket, modePacket.length);

		// Color de shutdown
		const colorPacket = [0x01, 0x0F, shutdownCol[0], shutdownCol[1], shutdownCol[2], 0x00, 0x00, 0x00];
		padToLength(colorPacket, 64);
		hid.WriteFile(device, colorPacket, colorPacket.length);
	}
}

function sendColors() {
	if (device == 0) return;

	if (LightingMode === "Forced") {
		sendForcedColor();
		return;
	}

	// Modo Canvas - enviar colores individuales por LED
	sendIndividualColors();
}

function sendForcedColor() {
	const color = hexToRgb(forcedColor);
	const colorPacket = [0x01, 0x0F, color[0], color[1], color[2], 0x00, 0x00, 0x00];
	padToLength(colorPacket, 64);
	hid.WriteFile(device, colorPacket, colorPacket.length);
}

function sendIndividualColors() {
	// Sistema de 8 paquetes para LEDs individuales (según OpenRGB)

	// Primero test con WASD para confirmar funcionalidad
	testWASDColors();

	// Luego enviar colores completos del canvas
	// sendFullCanvasColors();
}

function testWASDColors() {
	// Test: W=Rojo, A=Verde, S=Azul, D=Amarillo
	const testColors = [
		{ offset: WASD_OFFSETS.W, r: 255, g: 0, b: 0 },     // W - Rojo
		{ offset: WASD_OFFSETS.A, r: 0, g: 255, b: 0 },     // A - Verde  
		{ offset: WASD_OFFSETS.S, r: 0, g: 0, b: 255 },     // S - Azul
		{ offset: WASD_OFFSETS.D, r: 255, g: 255, b: 0 }    // D - Amarillo
	];

	console.log("Enviando colores WASD individuales...");

	for (let i = 0; i < 8; i++) {
		const packet = new Array(64).fill(0);
		packet[0] = 0x01;  // Report ID
		packet[1] = 0x0F;  // SetLEDsData command
		packet[2] = i;     // Packet number (0-7)

		// Llenar datos RGB según offsets
		testColors.forEach(led => {
			const packetStart = i * 64;
			const packetEnd = (i + 1) * 64;

			if (led.offset >= packetStart && led.offset < packetEnd) {
				const localOffset = led.offset - packetStart;
				if (localOffset + 2 < 61) { // Espacio para RGB
					packet[3 + localOffset] = led.r;
					packet[4 + localOffset] = led.g;
					packet[5 + localOffset] = led.b;
				}
			}
		});

		hid.WriteFile(device, packet, packet.length);
		sleep(1); // Pequeña pausa entre paquetes
	}
}

function sendFullCanvasColors() {
	// Implementar envío completo del canvas cuando el test funcione
	for (let row = 0; row < keyMap.length; row++) {
		for (let col = 0; col < keyMap[row].length; col++) {
			const offset = keyMap[row][col];
			if (offset === 0xFF) continue; // Posición vacía

			const color = device.getColor(col, row);
			// Enviar color a offset específico...
		}
	}
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result ? [
		parseInt(result[1], 16),
		parseInt(result[2], 16),
		parseInt(result[3], 16)
	] : [0, 0, 0];
}

function padToLength(array, length) {
	while (array.length < length) {
		array.push(0x00);
	}
}

function sleep(ms) {
	const start = Date.now();
	while (Date.now() - start < ms) { }
}
