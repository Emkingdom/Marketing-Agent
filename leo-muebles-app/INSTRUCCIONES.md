# Finanzas Leo Muebles en Google Sheets

Instalación única. Toma unos 10 minutos. Solo necesitas tu cuenta de Google.

Archivos:
- `Code.gs`: el servidor, que guarda y lee en la hoja.
- `Index.html`: la app (pantallas).
- `Datos.gs`: tus datos actuales (148 movimientos de noviembre, nombres de sucursales y moneda).

## 1. Crea la hoja
1. Entra a **sheets.google.com** y crea una **hoja en blanco**.
2. Ponle de nombre **Finanzas Leo Muebles**.

## 2. Pega el código
1. En la hoja, ve al menú **Extensiones → Apps Script**. Se abre el editor.
2. Verás un archivo `Código.gs` con unas líneas. **Bórralas todas** y pega el contenido completo de `Code.gs`.
3. Al lado de "Archivos", pulsa **+** → **Secuencia de comandos**. Nómbralo `Datos` y pega todo el contenido de `Datos.gs`, reemplazando lo que traiga.
4. Pulsa **+** → **HTML**. Nómbralo exactamente `Index` y pega todo el contenido de `Index.html`, reemplazando lo que traiga.
5. Pulsa el ícono de **guardar** (el disquete).

## 3. Publica la app
1. Arriba a la derecha: **Implementar → Nueva implementación**.
2. En "Seleccionar tipo" (el engranaje), elige **Aplicación web**.
3. Llena así:
   - **Ejecutar como:** Yo (tu correo)
   - **Quién tiene acceso:** Solo yo
4. Pulsa **Implementar**.
5. Google pedirá permiso. Pulsa **Autorizar acceso** y elige tu cuenta.
   - Si aparece "Google no ha verificado esta aplicación", pulsa **Configuración avanzada → Ir a Finanzas Leo Muebles (no seguro)** y luego **Permitir**. Es normal: la app es tuya y solo accede a esta hoja.
6. Copia la **URL de la aplicación web**. Termina en `/exec`. **Ese es tu enlace.**

## 4. Úsala
- Abre el enlace en cualquier navegador, en computadora o celular, con tu cuenta de Google iniciada. En el celular puedes usar "Agregar a pantalla de inicio".
- La primera vez tarda unos segundos porque carga tus datos en la hoja.
- Todo lo que registres queda en la hoja, en las pestañas **Movimientos**, **Facturas** y **Config**. No cambies los encabezados ni el orden de las columnas.
- Si quieres, después de la primera vez puedes borrar el archivo `Datos` del editor.

## Si después quieres que la usen tus empleados
1. Comparte la hoja con ellos (botón **Compartir**, como **Editor**).
2. En Apps Script: **Implementar → Administrar implementaciones → editar (lápiz)**.
3. Cambia **Ejecutar como:** "Usuario que accede a la aplicación web" y **Quién tiene acceso:** "Cualquier usuario con cuenta de Google". Pulsa **Implementar**.
4. Mándales el mismo enlace. Solo entra quien tenga acceso a la hoja. La primera vez, cada persona debe autorizar como en el paso 3.5.

## Cuando haya una versión nueva de la app
1. Reemplaza el contenido de `Index` (y de `Code.gs` si cambió) y guarda.
2. **Implementar → Administrar implementaciones → editar (lápiz) → Versión: Nueva versión → Implementar.**
3. El enlace no cambia y tus datos no se tocan.

## Copias y cargar datos
En **Ajustes → Copia de seguridad**:
- **Descargar copia (.json):** guarda todos tus datos en un archivo.
- **Cargar un archivo de datos:** elige un archivo .json y luego:
  - **Agregar a lo que ya hay:** suma movimientos nuevos, por ejemplo un archivo que te preparen a partir de un PDF.
  - **Reemplazar todo:** restaura una copia completa y borra lo actual.
