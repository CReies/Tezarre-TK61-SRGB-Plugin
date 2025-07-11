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
	device.pause(1); // evitar saturar el bus
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
		color = device.color(0, 0); // Solo LED 1 en (0,0)
		device.log(`🌈 Color capturado: RGB(${color[0]}, ${color[1]}, ${color[2]})`);
	}

	// ⚠️ ESTE BUFFER ES UN EJEMPLO: debes adaptarlo al protocolo real
	let packet = [
		0x00,          // header o padding
		color[0],      // R
		color[1],      // G
		color[2],      // B
		0x00, 0x00, 0x00, 0x00 // extra
	];

	try {
		device.send_report(packet, packet.length);
		device.log(`📦 Packet enviado: [${packet.join(", ")}]`);
	} catch (err) {
		device.log("❌ Error al enviar packet: " + err.message);
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
	// Puedes refinar esto si tienes más info
	return endpoint.interface === 0;
}
