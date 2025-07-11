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

	try {
		device.log(`📦 Preparando envío HID - Longitud: ${packet.length}`);
		device.log(`📦 Datos: [${packet.join(", ")}]`);

		// Método 1: Feature Report
		device.sendFeatureReport(packet, packet.length);
		device.log(`📤 Feature Report enviado exitosamente`);

	} catch (err) {
		device.log("❌ Error al enviar Feature Report: " + err.message);

		// Método 2: Output Report
		try {
			device.sendOutputReport(packet, packet.length);
			device.log(`📤 Output Report enviado exitosamente (fallback)`);
		} catch (err2) {
			device.log("❌ Error al enviar Output Report: " + err2.message);

			// Método 3: Probar con Report ID al principio
			try {
				let packetWithReportId = [0x00, ...packet]; // Report ID 0x00
				device.sendFeatureReport(packetWithReportId, packetWithReportId.length);
				device.log(`📤 Feature Report con Report ID enviado exitosamente`);
			} catch (err3) {
				device.log("❌ Error con Report ID: " + err3.message);

				// Método 4: Último fallback con write tradicional
				try {
					let buffer = new Uint8Array(packet);
					device.write(0x00, buffer);
					device.log(`📤 Write tradicional exitoso (último fallback)`);
				} catch (err4) {
					device.log("❌ Error en write tradicional: " + err4.message);
				}
			}
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
