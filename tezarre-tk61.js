export function Name() { return "Tezarre TK61"; }
export function VendorId() { return 0x0416; }
export function ProductId() { return 0xC345; }
export function Publisher() { return "CReies"; }
export function Documentation() { return "SignalRGB plugin para Tezarre TK61 keyboard con soporte completo de RGB"; }
export function Size() { return [15, 5]; }
export function DefaultPosition() { return [10, 100]; }
export function DefaultScale() { return 8.0; }
export function DeviceType() { return "keyboard"; }

// Layout del TK61 (60%) - 61 teclas exactas
const keyMap = [
	// Row 0: Números y función
	[7, 13, 16, 19, 22, 28, 31, 34, 37, 40, 43, 46, 49, 52],
	// Row 1: QWERTY
	[83, 86, 89, 92, 95, 98, 101, 104, 107, 110, 113, 116, 119, 135],
	// Row 2: ASDF 
	[159, 162, 165, 168, 171, 174, 177, 180, 183, 186, 199, 202, 211],
	// Row 3: ZXCV
	[235, 241, 244, 247, 250, 263, 266, 269, 272, 275, 278, 287],
	// Row 4: Modificadores
	[311, 314, 327, 415, 427, 430, 433, 436]
];

// Nombres exactos de las 61 teclas del TK61
const keyNames = [
	// Row 0: Primera fila
	["Esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Backspace"],
	// Row 1: Segunda fila
	["Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"],
	// Row 2: Tercera fila
	["Caps Lock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter"],
	// Row 3: Cuarta fila
	["Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift"],
	// Row 4: Quinta fila
	["Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Menu", "Right Ctrl", "Fn"]
];

// Generar arrays de nombres y posiciones para SignalRGB
let vLedNames = [];
let vLedPositions = [];

// Llenar arrays con las 61 teclas exactas
for (let row = 0; row < keyMap.length; row++) {
	for (let col = 0; col < keyMap[row].length; col++) {
		const offset = keyMap[row][col];
		const keyName = keyNames[row][col];
		vLedNames.push(keyName);
		vLedPositions.push([col, row]);
	}
}
let shutdownColor = "#000000";

export function LedNames() {
	return vLedNames;
}

export function LedPositions() {
	return vLedPositions;
}

export function Initialize() {
	device.log("🔌 Inicializando Tezarre TK61 con control individual de LEDs...");
	device.log("🔧 Información del dispositivo:");
	device.log(`🔧 Vendor ID: 0x${VendorId().toString(16).padStart(4, '0')}`);
	device.log(`🔧 Product ID: 0x${ProductId().toString(16).padStart(4, '0')}`);
	device.log(`🔧 LEDs detectados: ${vLedNames.length} teclas individuales`);

	// Activar modo Direct (per-LED control) - Config 6
	device.log("🎨 Activando modo Direct para control individual...");
	const modePacket = [0x01, 0x07, 0x06, 0x03, 0x00, 0x00, 0x00, 0x00];
	padToLength(modePacket, 64);

	try {
		device.write(modePacket, modePacket.length);
		device.log("✅ Plugin inicializado correctamente - listo para RGB individual");
	} catch (err) {
		device.log(`❌ Error en inicialización: ${err.message}`);
	}
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
	if (overrideColor) {
		// Modo shutdown/forced - usar color global
		sendGlobalColor(overrideColor);
	} else {
		// Modo Canvas - enviar colores individuales por LED
		sendIndividualColors();
	}
}

function sendGlobalColor(colorHex) {
	const color = hexToRgb(colorHex);

	// Usar modo estático para color global
	let buf = new Array(64).fill(0x00);
	buf[0] = 0x01;  // Report ID
	buf[1] = 0x07;  // SetMode command
	buf[6] = 0x00;  // Static mode
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
		device.log(`❌ Error enviando color global: ${err.message}`);
	}
}

function sendIndividualColors() {
	// Crear array para almacenar todos los colores por offset
	const ledColors = new Map();

	// Obtener colores del canvas para cada una de las 61 teclas
	for (let row = 0; row < keyMap.length; row++) {
		for (let col = 0; col < keyMap[row].length; col++) {
			const offset = keyMap[row][col];
			const color = device.color(col, row);
			ledColors.set(offset, {
				r: color[0],
				g: color[1],
				b: color[2]
			});
		}
	}

	device.log(`🎨 Enviando ${ledColors.size} colores individuales del canvas TK61...`);

	// Enviar en 8 paquetes como OpenRGB
	for (let i = 0; i < 8; i++) {
		const packet = new Array(64).fill(0);
		packet[0] = 0x01;  // Report ID
		packet[1] = 0x0F;  // SetLEDsData command
		packet[2] = i;     // Packet number (0-7)

		// Llenar datos RGB según offsets
		ledColors.forEach((color, offset) => {
			const packetStart = i * 64;
			const packetEnd = (i + 1) * 64;

			if (offset >= packetStart && offset < packetEnd) {
				const localOffset = offset - packetStart;
				if (localOffset + 2 < 61) { // Espacio para RGB
					packet[3 + localOffset] = color.r;
					packet[4 + localOffset] = color.g;
					packet[5 + localOffset] = color.b;
				}
			}
		});

		try {
			device.write(packet, packet.length);
			sleep(1); // Pequeña pausa entre paquetes
		} catch (err) {
			device.log(`❌ Error enviando paquete ${i}: ${err.message}`);
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

function padToLength(array, length) {
	while (array.length < length) {
		array.push(0x00);
	}
}

function sleep(ms) {
	const start = Date.now();
	while (Date.now() - start < ms) { }
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
