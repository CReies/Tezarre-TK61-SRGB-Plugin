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
	
	// Habilitar debugging avanzado
	device.log("🐛 Modo debug activado");
	device.log("🐛 Para ver logs detallados, ir a: SignalRGB > Settings > Logging > Enable Verbose Logging");
	device.log("🐛 Los logs se guardan en: %USERPROFILE%\\AppData\\Local\\VortxData\\VortxEngine\\logs");
	
	device.log("🔧 Plugin inicializado correctamente");
}

export function Render() {
	device.log("🎨 Render ciclo iniciado");
	sendColors();
	device.pause(2000); // 2 segundos para observar si alguna config funciona
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

	device.log(`📦 Enviando color RGB(${color[0]}, ${color[1]}, ${color[2]})`);

	// Datos base del paquete capturado de Wireshark
	let baseData = [0x00, 0x50, 0x70, 0x6e, 0x1b, 0x8d, 0xd5, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x09, 0x00, color[0], color[1], color[2], 0x06, 0x00, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00];

	// Métodos alternativos para dispositivos HID en SignalRGB
	let metodos = [
		// Método 1: setFeatureReport con Report ID 0x1B
		() => {
			device.log("🔄 Método 1: setFeatureReport con Report ID 0x1B");
			try {
				device.setFeatureReport([0x1b, ...baseData], 27);
				device.log("✅ setFeatureReport 0x1B exitoso");
				return true;
			} catch (err) {
				device.log(`❌ setFeatureReport 0x1B: ${err.message}`);
				return false;
			}
		},
		
		// Método 2: sendOutputReport con Report ID 0x1B
		() => {
			device.log("🔄 Método 2: sendOutputReport con Report ID 0x1B");
			try {
				device.sendOutputReport([0x1b, ...baseData], 27);
				device.log("✅ sendOutputReport 0x1B exitoso");
				return true;
			} catch (err) {
				device.log(`❌ sendOutputReport 0x1B: ${err.message}`);
				return false;
			}
		},
		
		// Método 3: write con sintaxis específica de SignalRGB para HID
		() => {
			device.log("🔄 Método 3: write específico HID");
			try {
				device.write([0x1b, ...baseData]);
				device.log("✅ write HID exitoso");
				return true;
			} catch (err) {
				device.log(`❌ write HID: ${err.message}`);
				return false;
			}
		},
		
		// Método 4: Probar con buffer de tamaño fijo (común en HID)
		() => {
			device.log("🔄 Método 4: Buffer 32 bytes");
			let buffer32 = [0x1b, ...baseData];
			while (buffer32.length < 32) buffer32.push(0x00);
			try {
				device.write(buffer32, 32);
				device.log("✅ Buffer 32 bytes exitoso");
				return true;
			} catch (err) {
				device.log(`❌ Buffer 32 bytes: ${err.message}`);
				return false;
			}
		},
		
		// Método 5: Usar el paquete exacto de Wireshark
		() => {
			device.log("🔄 Método 5: Paquete Wireshark exacto");
			let exactPacket = [0x1b, 0x00, 0x50, 0x70, 0x6e, 0x1b, 0x8d, 0xd5, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x09, 0x00, color[0], color[1], color[2], 0x06, 0x00, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00];
			try {
				device.write(exactPacket);
				device.log("✅ Paquete exacto exitoso");
				return true;
			} catch (err) {
				device.log(`❌ Paquete exacto: ${err.message}`);
				return false;
			}
		},
		
		// Método 6: Comando simple RGB directo
		() => {
			device.log("🔄 Método 6: RGB simple");
			try {
				device.write([0x1b, color[0], color[1], color[2]]);
				device.log("✅ RGB simple exitoso");
				return true;
			} catch (err) {
				device.log(`❌ RGB simple: ${err.message}`);
				return false;
			}
		}
	];

	// Probar todos los métodos
	for (let i = 0; i < metodos.length; i++) {
		if (metodos[i]()) {
			device.log(`🎉 MÉTODO ${i + 1} FUNCIONÓ - usar este en el futuro`);
			return; // Salir si algún método funciona
		}
		device.pause(50); // Pequeña pausa entre métodos
	}
	
	device.log("❌ Ningún método funcionó - verificar protocolo del dispositivo");
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
