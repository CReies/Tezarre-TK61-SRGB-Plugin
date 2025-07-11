# Tezarre TK61 SignalRGB Plugin

Plugin para controlar la iluminación RGB del teclado Tezarre TK61 desde SignalRGB.

## 🔧 Desarrollo y Debugging

### Debugging Local
```bash
# Instalar dependencias
npm install

# Ejecutar mock environment para testing
npm run debug

# Watch mode (reinicia automáticamente en cambios)
npm run watch

# Verificar sintaxis del plugin
npm run lint
```

### Debugging en SignalRGB

1. **Activar Verbose Logging**:
   - Ir a SignalRGB > Settings > Logging
   - Activar "Enable Verbose Logging"

2. **Ver logs en tiempo real**:
   - Los logs se guardan en: `%USERPROFILE%\AppData\Local\VortxData\VortxEngine\logs`
   - Usar `tail -f` o un visor de logs para seguimiento en tiempo real

3. **Ubicación del plugin**:
   - Instalar en: `%USERPROFILE%\Documents\WhirlwindFX\SignalRGB\Plugins`

### Debugging con Wireshark

Para capturar tráfico USB:
1. Instalar USBPcap o usar Wireshark con soporte USB
2. Filtrar por VID/PID: `usb.device_address == X && usb.vendor_id == 0x0416 && usb.product_id == 0xc345`
3. Analizar paquetes HID para entender el protocolo

## 📝 Estructura del Proyecto

```
.
├── tezarre-tk61.js     # Plugin principal
├── debug-mock.js       # Environment de testing local
├── package.json        # Configuración y scripts
├── manifest.json       # Metadatos del plugin
└── README.md          # Esta documentación
```

## 🐛 Debugging Tips

### Common Issues:
- **"WriteFile: El parámetro no es correcto"**: Report ID incorrecto o tamaño de buffer inválido
- **"Zero buffer/length"**: Buffer vacío o null
- **Plugin no detecta dispositivo**: Verificar VID/PID y función Validate()

### Useful Logs:
```javascript
device.log("🔍 Debug info: " + JSON.stringify(data));
device.log(\`📦 Buffer size: \${buffer.length} bytes\`);
device.log(\`🎯 Endpoint: interface=\${endpoint.interface}, usage=0x\${endpoint.usage?.toString(16)}\`);
```

## 📋 Estado del Desarrollo

- [x] Detección del dispositivo
- [x] Validación de endpoints
- [x] Captura de colores de SignalRGB
- [ ] Comunicación HID exitosa
- [ ] Control RGB funcional
- [ ] Optimización de rendimiento

## 🔗 Referencias

- [SignalRGB Plugin Documentation](https://docs.signalrgb.com/)
- [HID Usage Tables](https://usb.org/sites/default/files/hut1_12v2.pdf)
- [Node-HID Documentation](https://github.com/node-hid/node-hid)
