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

	// Intentar un comando de inicialización si es necesario
	device.log("🔧 Plugin inicializado correctamente");
}

export function Render() {
	device.log("🎨 Render ciclo iniciado");
	sendColors();
	device.pause(3000); // Pausa de 3 segundos para observar cambios
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

	device.log(`📦 Preparando envío de color RGB(${color[0]}, ${color[1]}, ${color[2]})`);

	// Lista de configuraciones a probar sistemáticamente
	let configuraciones = [
		// Config 1: 0x1b como Report ID + datos sin el primer 0x1b
		{
			data: [0x1b, 0x00, 0x50, 0x70, 0x6e, 0x1b, 0x8d, 0xd5, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x09, 0x00, color[0], color[1], color[2], 0x06, 0x00, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00],
			desc: "0x1b como Report ID"
		},
		
		// Config 2: Report ID 0x00 + datos completos
		{
			data: [0x00, 0x1b, 0x00, 0x50, 0x70, 0x6e, 0x1b, 0x8d, 0xd5, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x09, 0x00, color[0], color[1], color[2], 0x06, 0x00, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00],
			desc: "Report ID 0x00 + datos completos"
		},
		
		// Config 3: Datos sin ningún Report ID
		{
			data: [0x00, 0x50, 0x70, 0x6e, 0x1b, 0x8d, 0xd5, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x09, 0x00, color[0], color[1], color[2], 0x06, 0x00, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00],
			desc: "Sin 0x1b inicial, empezando con 0x00"
		},
		
		// Config 4: Formato simple RGB
		{
			data: [0x1b, color[0], color[1], color[2], 0x00, 0x00, 0x00, 0x00],
			desc: "Formato simple 0x1b + RGB"
		},
		
		// Config 5: Padding a 32 bytes con 0x1b como Report ID
		{
			data: [0x1b, 0x00, 0x50, 0x70, 0x6e, 0x1b, 0x8d, 0xd5, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x09, 0x00, color[0], color[1], color[2], 0x06, 0x00, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
			desc: "32 bytes con 0x1b como Report ID"
		}
	];

	for (let i = 0; i < configuraciones.length; i++) {
		let config = configuraciones[i];
		device.log(`🔄 [${i + 1}/${configuraciones.length}] ${config.desc}`);
		device.log(`📦 Datos (${config.data.length} bytes): [${config.data.join(", ")}]`);
		
		try {
			device.write(config.data, config.data.length);
			device.log(`✅ Config ${i + 1} completada - verificar teclado físicamente`);
			
			// Pausa para ver si el teclado cambió
			device.pause(100);
			
		} catch (err) {
			device.log(`❌ Config ${i + 1} falló: ${err.message}`);
		}
	}
	
	device.log("🔍 Todas las configuraciones enviadas - verificar cuál funcionó visualmente");
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
