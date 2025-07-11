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

	// Configuraciones basadas en el controlador de OpenRGB
	let configuraciones = [
		// Config 1: Comando de modo estático (SetMode) - según OpenRGB
		{
			nombre: "Modo estático OpenRGB",
			datos: (() => {
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
				return buf;
			})()
		},

		// Config 2: Comando de LEDs individuales (SetLEDsData) - según OpenRGB
		{
			nombre: "LEDs individuales OpenRGB",
			datos: (() => {
				let buf = new Array(64).fill(0x00);
				buf[0] = 0x01;  // Report ID
				buf[1] = 0x0F;  // SetLEDsData command
				buf[4] = 0x00;  // package number
				buf[5] = 0x36;  // package size
				// Llenar múltiples posiciones LED con el mismo color
				for (let i = 6; i < 64; i += 3) {
					buf[i] = color[0];     // R
					buf[i + 1] = color[1]; // G
					buf[i + 2] = color[2]; // B
				}
				return buf;
			})()
		},

		// Config 3: Comando simple de test
		{
			nombre: "Comando simple RGB",
			datos: [0x01, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x04, 0x02, color[0], color[1], color[2]]
		},

		// Config 4: Nuestro paquete original de Wireshark con Report ID correcto
		{
			nombre: "Wireshark con Report ID 0x01",
			datos: [0x01, 0x50, 0x70, 0x6e, 0x1b, 0x8d, 0xd5, 0xff, 0xff, 0x00, 0x00, 0x00, 0x00, 0x09, 0x00, color[0], color[1], color[2], 0x06, 0x00, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00]
		},

		// Config 5: Modo breath con color
		{
			nombre: "Modo breath OpenRGB",
			datos: (() => {
				let buf = new Array(64).fill(0x00);
				buf[0] = 0x01;  // Report ID
				buf[1] = 0x07;  // SetMode command
				buf[6] = 0x01;  // CLASSIC_BREATHE_MODE_VALUE
				buf[7] = 0x04;  // brightness max
				buf[8] = 0x02;  // speed medium
				buf[9] = color[0];   // R
				buf[10] = color[1];  // G
				buf[11] = color[2];  // B
				return buf;
			})()
		},

		// Config 6: Comando personalizado custom mode
		{
			nombre: "Modo custom OpenRGB",
			datos: (() => {
				let buf = new Array(64).fill(0x00);
				buf[0] = 0x01;  // Report ID
				buf[1] = 0x07;  // SetMode command
				buf[6] = 0x0A;  // CLASSIC_CUSTOM_MODE_VALUE
				buf[7] = 0x04;  // brightness max
				buf[8] = 0x00;  // speed
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
	device.log(" Sugerencias adicionales:");
	device.log("💡 1. Si 'Modo estático OpenRGB' funciona, usar esa configuración");
	device.log("💡 2. Si 'LEDs individuales OpenRGB' funciona, implementar control por LED");
	device.log("💡 3. Verificar que el teclado esté conectado y encendido");
	device.log("💡 4. Probar primero con el software original para activar RGB");
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
