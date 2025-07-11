export function Name() { return "Tezarre TK61"; }
export function VendorId() { return 0x0416; }
export function ProductId() { return 0xC345; }
export function Publisher() { return "CReies"; }
export function Documentation() { return "SignalRGB plugin para Tezarre TK61 keyboard con soporte completo de RGB"; }
export function Size() { return [14, 5]; }
export function DefaultPosition() { return [240, 120]; }
export function DefaultScale() { return 8.0; }
export function DeviceType() { return "keyboard"; }
export function ImageUrl() { return "https://github.com/CReies/Tezarre-TK61-SRGB-Plugin/blob/main/assets/tezarre-tk61.png?raw=true"; }

/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
*/

// TK61 60% layout - based on official Nuvoton plugin
let vLedNames = [
	"Esc", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace",
	"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\",
	"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter",
	"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift",
	"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Menu", "Right Ctrl", "Fn"
];

let vLedPositions = [
	[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0],
	[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1],
	[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [13, 2],
	[0, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [13, 3],
	[0, 4], [1, 4], [2, 4], [6, 4], [10, 4], [11, 4], [12, 4], [13, 4]
];

// LED offsets for each key - based on Nuvoton plugin 60% layout (sin teclas ISO)
let vLedOffsets = [
	22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 36,
	44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 58,
	66, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 80,
	88, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 102,
	110, 111, 112, 116, 120, 121, 122, 123
];

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
	device.log(`🔧 LEDs individuales: ${vLedNames.length}`);

	// Set device properties like Nuvoton plugin
	device.setName("Tezarre TK61");
	device.setSize([14, 5]);
	device.setControllableLeds(vLedNames, vLedPositions);
	device.setImageFromUrl(ImageUrl());

	// Set Direct lighting mode (based on Nuvoton plugin)
	setDirectLightingMode();

	device.log("✅ Plugin inicializado correctamente - listo para LEDs individuales");
}

export function Render() {
	sendIndividualColors();
}

export function Shutdown(SystemSuspending) {
	device.log("⏹️ Apagando plugin");
	if (SystemSuspending) {
		sendIndividualColors("#000000");
	} else {
		sendIndividualColors(shutdownColor);
	}
}

function setDirectLightingMode() {
	// Set direct lighting mode - based on Nuvoton plugin
	try {
		device.write([0x01, 0x07, 0x00, 0x00, 0x00, 0x0E, 0x00, 0x04, 0x03, 0xFF], 64);
		device.write([0x01, 0x17, 0x00, 0x00, 0x00, 0x01, 0x01], 64);
		device.write([0x01, 0x08, 0x00, 0x00, 0x00, 0x0D, 0x02, 0x03, 0x03, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01], 64);
		device.log("✅ Modo directo activado");
	} catch (err) {
		device.log(`❌ Error activando modo directo: ${err.message}`);
	}
}

function sendIndividualColors(overrideColor) {
	try {
		// Create RGB data array - initialize with zeros
		const maxOffset = Math.max(...vLedOffsets);
		const RGBData = new Array((maxOffset + 1) * 3).fill(0);

		// Fill RGB data for each LED using the correct offset mapping
		for (let iIdx = 0; iIdx < vLedNames.length; iIdx++) {
			const iPxX = vLedPositions[iIdx][0];
			const iPxY = vLedPositions[iIdx][1];
			let color;

			if (overrideColor) {
				color = hexToRgb(overrideColor);
			} else if (typeof LightingMode !== "undefined" && LightingMode === "Forced") {
				color = hexToRgb(forcedColor);
			} else {
				color = device.color(iPxX, iPxY);
			}

			const ledOffset = vLedOffsets[iIdx];
			RGBData[ledOffset * 3] = color[0];     // R
			RGBData[ledOffset * 3 + 1] = color[1]; // G
			RGBData[ledOffset * 3 + 2] = color[2]; // B
		}

		// Send data in packets (18 LEDs per packet max) - following Nuvoton protocol
		let zoneTotalLEDs = RGBData.length / 3;
		let packetCount = 0;
		let dataIndex = 0;

		while (zoneTotalLEDs > 0) {
			const ledsToSend = zoneTotalLEDs >= 18 ? 18 : zoneTotalLEDs;
			const bytesToSend = ledsToSend * 3;

			// Create packet header - zone 0 for keyboard
			const header = [0x01, 0x0F, 0x00, 0x00, packetCount, bytesToSend];

			// Get data for this packet
			const data = RGBData.slice(dataIndex, dataIndex + bytesToSend);

			// Combine header and data
			const packet = header.concat(data);

			// Pad to 65 bytes
			while (packet.length < 65) {
				packet.push(0x00);
			}

			device.write(packet, 65);

			zoneTotalLEDs -= ledsToSend;
			dataIndex += bytesToSend;
			packetCount++;
			device.pause(1);
		}

		// Send blank packet to zone 1 (required by protocol)
		device.write([0x01, 0x0F, 0x01, 0x00, 0x00, 0x36], 65);
		device.write([0x01, 0x0F, 0x01, 0x00, 0x01, 0x2D], 65);

	} catch (err) {
		device.log(`❌ Error enviando colores individuales: ${err.message}`);
	}
}

function hexToRgb(hex) {
	// Handle different input types from SignalRGB
	if (!hex) {
		return [0, 0, 0];
	}

	// Convert to string if not already
	hex = hex.toString();

	// Ensure it starts with #
	if (!hex.startsWith("#")) {
		hex = "#" + hex;
	}

	let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (!result) {
		device.log(`❌ Error en hexToRgb: input inválido '${hex}'`);
		return [0, 0, 0];
	}
	return [
		parseInt(result[1], 16),
		parseInt(result[2], 16),
		parseInt(result[3], 16),
	];
}

export function ControllableParameters() {
	return [
		{ property: "shutdownColor", group: "lighting", label: "Shutdown Color", description: "This color is applied to the device when the System, or SignalRGB is shutting down", min: "0", max: "360", type: "color", default: "#000000" },
		{ property: "LightingMode", group: "lighting", label: "Lighting Mode", description: "Determines where the device's RGB comes from. Canvas will pull from the active Effect, while Forced will override it to a specific color", type: "combobox", values: ["Canvas", "Forced"], default: "Canvas" },
		{ property: "forcedColor", group: "lighting", label: "Forced Color", description: "The color used when 'Forced' Lighting Mode is enabled", min: "0", max: "360", type: "color", default: "#009bde" },
	];
}

export function Validate(endpoint) {
	// Use the exact same validation as the Nuvoton plugin
	return endpoint.interface === 2 && endpoint.usage === 0x0091 && endpoint.usage_page === 0xFF1B && endpoint.collection === 0x0000;
}
