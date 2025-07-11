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
	device.pause(5000); // 5 segundos para observar efectos físicos
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

	// Probar diferentes Report IDs y formatos basados en Wireshark
	let configuraciones = [
		// Config 1: Sin Report ID (paquete directo)
		{
			nombre: "Paquete directo sin Report ID",
			datos: [0x50, 0x70, 0x6e, 0x1b, 0x8d, 0xd5, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x09, 0x00, color[0], color[1], color[2], 0x06, 0x00, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00]
		},
		
		// Config 2: Report ID 0x00 como primer byte
		{
			nombre: "Report ID 0x00",
			datos: [0x00, 0x50, 0x70, 0x6e, 0x1b, 0x8d, 0xd5, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x09, 0x00, color[0], color[1], color[2], 0x06, 0x00, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00]
		},
		
		// Config 3: Report ID 0x1B (según Analysis)
		{
			nombre: "Report ID 0x1B",
			datos: [0x1b, 0x50, 0x70, 0x6e, 0x1b, 0x8d, 0xd5, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x09, 0x00, color[0], color[1], color[2], 0x06, 0x00, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00]
		},
		
		// Config 4: Comando corto basado en posiciones RGB
		{
			nombre: "Comando RGB corto",
			datos: [0x1b, 0x09, 0x00, color[0], color[1], color[2]]
		},
		
		// Config 5: Formato alternativo con header
		{
			nombre: "Header + RGB",
			datos: [0x00, 0x1b, 0x09, 0x00, color[0], color[1], color[2], 0x06, 0x00, 0x04, 0x01]
		},
		
		// Config 6: Paquete de 64 bytes (tamaño estándar HID)
		{
			nombre: "Buffer 64 bytes",
			datos: (() => {
				let buf = [0x1b, 0x50, 0x70, 0x6e, 0x1b, 0x8d, 0xd5, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x09, 0x00, color[0], color[1], color[2], 0x06, 0x00, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00];
				while (buf.length < 64) buf.push(0x00);
				return buf;
			})()
		}
	];

	// Probar cada configuración
	for (let i = 0; i < configuraciones.length; i++) {
		let config = configuraciones[i];
		device.log(`🔄 Probando: ${config.nombre} (${config.datos.length} bytes)`);
		device.log(`📊 Datos: [${config.datos.slice(0, 10).map(x => '0x' + x.toString(16).padStart(2, '0')).join(', ')}...]`);
		
		try {
			// Intentar escribir especificando la longitud
			device.write(config.datos, config.datos.length);
			device.log(`✅ ${config.nombre} - write() exitoso`);
			
			// Pausa para observar efecto físico
			device.pause(1000);
			device.log(`🔍 ¿Cambió el color del teclado? Si SÍ cambió, reportar esta configuración`);
			
			// No hacer return aquí - probar TODAS las configuraciones para ver cuál funciona
			
		} catch (err) {
			device.log(`❌ ${config.nombre}: ${err.message}`);
		}
		
		// Pausa entre intentos para observar cambios
		device.pause(500);
	}
	
	device.log("🔚 Fin de pruebas - revisar cuál configuración cambió el color del teclado");
	device.log("🔚 Fin de pruebas - revisar cuál configuración cambió el color del teclado");
	device.log("💡 Sugerencias adicionales:");
	device.log("💡 1. Verificar si el teclado está en modo RGB correcto");
	device.log("💡 2. Probar con software original del fabricante primero");
	device.log("💡 3. Capturar más paquetes Wireshark durante cambios de color");
	device.log("💡 4. Si ninguna funciona, puede que necesite un comando de 'activación' primero");
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
