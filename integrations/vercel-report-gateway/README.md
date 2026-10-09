# Reporte privado de prueba en Vercel

Código preparado y sin desplegar. La página publicada actualmente en Vercel sigue siendo `portal/`.

Este módulo consulta exclusivamente `GET /api/service-report` del centro privado y devuelve su reporte operativo. No permite escribir registros, llamar a proveedores, enviar mensajes, aceptar contratos, mover dinero ni usar URLs arbitrarias. No contiene claves. La función exige `VERCEL_ENV=preview` y `BD_GATEWAY_ENABLED=true`; rechaza producción. No sigue redirecciones del servidor y no transmite cookies, cabeceras del visitante ni secretos en URLs.

Antes de activarlo se necesita autorización específica para guardar **BD_SITES_SERVICE_TOKEN** (acceso de despacho del centro privado) y **BD_SERVICE_TOKEN** (acceso adicional al reporte) en las variables sensibles de **preview** del proyecto Vercel **build-dreams-ops**. El mismo `BD_SERVICE_TOKEN` debe configurarse como secreto del centro privado y publicarse allí. `BD_SITES_URL` y `BD_GATEWAY_ENABLED` son configuración sin secretos.

La autorización debe reconocer que el despliegue recibirá datos operativos privados del reporte: nombres de clientes en seguimientos, tareas, responsables y totales por obra. Solo los usuarios permitidos por la protección del despliegue deben poder verlos. Verificar Vercel Authentication para **todos** los despliegues de prueba y revisar quién tiene acceso al proyecto antes de publicar. No desactivar la protección ni usar una URL de bypass pública. Resolver el plan comercial de Vercel por separado antes de usarlo para el negocio.

Después de la autorización: configurar las variables, desplegar **solo esta carpeta** como preview, comprobar que una visita no autorizada no llega a la función, y comprobar lectura con una sesión autorizada. Una compilación o una prueba local no establece que la cuenta externa esté conectada.

La revisión automática rechazó previamente la transferencia de los dos secretos a Vercel por falta de autorización concreta del payload y destino. Este código no evita esa revisión y no activa el acceso.
