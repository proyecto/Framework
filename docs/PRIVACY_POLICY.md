# Política de Privacidad / Privacy Policy – MintMox

_Última actualización / Last updated: Noviembre 2026_  
_Responsable del Tratamiento / Developer: Rafael Ruiz_  
_Contacto / Contact: Repositorio oficial del proyecto MintMox_

---

## 🇪🇸 Versión en Español

### Resumen Ejecutivo
**MintMox** es una aplicación orientada a coleccionistas de *Magic: The Gathering* desarrollada bajo la filosofía **local-first** y el principio de *Privacidad por Diseño*. Actualmente, la aplicación es 100% gratuita, local y sin publicidad. No recopilamos, no almacenamos en servidores externos y no comercializamos ningún tipo de dato personal de los usuarios. Tu colección reside exclusivamente en la memoria local de tu dispositivo.

---

### 1. Información que NO recopilamos en el estado actual
La aplicación no requiere registro ni creación de cuenta, y no recopila:
- Nombres y apellidos, direcciones de correo electrónico, números de teléfono o domicilios.
- Datos de ubicación geográfica (ni por GPS ni triangulación de redes).
- Identificadores publicitarios del dispositivo (IDFA en iOS, GAID en Android).
- Huellas digitales del dispositivo ni datos biométricos.
- Contactos, cámara, biblioteca de fotos ni archivos personales almacenados en tu dispositivo.

---

### 2. Almacenamiento Local (Local-First) y Propiedad del Usuario
Toda la información introducida por el usuario (inventario de cartas, precios reales de compra, cantidades, carpetas y archivadores de colecciones, notas o preferencias):
- Se almacena de forma local mediante una base de datos **SQLite embebida** dentro del espacio protegido de la aplicación en el propio dispositivo.
- No se transmite a ningún servidor central, nube ni terceros.
- El usuario mantiene el control absoluto: dispone de herramientas nativas para exportar su cartera completa en formatos abiertos y universales (JSON y CSV) o borrarla íntegramente en cualquier momento (*Ajustes > Reiniciar / Vaciar Cartera*).

---

### 3. Conexiones de Red y Servicios de Terceros
La aplicación únicamente establece comunicaciones de red salientes hacia la API pública de **Scryfall** (`https://api.scryfall.com`) con fines informativos para:
- Descargar datos públicos y oficiales de cartas (nombres, números de coleccionista, rareza, ilustraciones oficiales).
- Consultar cotizaciones públicas y precios de mercado en Euros provistos por Cardmarket a través de Scryfall.

**Privacidad de las consultas:** Dichas solicitudes HTTP son de solo lectura, anónimas y nunca transmiten el contenido total de la colección del usuario ni identificadores personales.

---

### 4. Transparencia sobre Servicios Futuros (Nube e Inteligencia Artificial)
MintMox se concibe como un proyecto modular en constante evolución. En caso de implementarse a futuro servicios opcionales de valor añadido:

1. **Sincronización Multidispositivo y Copia en Servidores (Cloud Sync):**  
   - Si el usuario decide voluntariamente activar la sincronización multidispositivo, se requerirá la creación de una cuenta de usuario (correo electrónico y autenticación segura).
   - Los datos de la colección se transmitirán mediante canales seguros cifrados (TLS/HTTPS) y se almacenarán en bases de datos con cifrado en reposo.
   - La base jurídica del tratamiento será la ejecución de la relación de servicio y el consentimiento explícito del usuario (Art. 6.1 RGPD).
   - El cobro por este servicio responderá estrictamente a los costes de mantenimiento de la infraestructura técnica de servidores, almacenamiento y ancho de banda, nunca al contenido de las cartas.
2. **Servicios de Inteligencia Artificial para Análisis Predictivo:**  
   - Si el usuario decide utilizar herramientas de inferencia de IA para proyectar tendencias o estadísticas de mercado, las consultas procesadas contendrán únicamente datos cuantitativos o estadísticos necesarios para el cómputo.
   - Dichos datos no se utilizarán para entrenar modelos públicos externos ni se venderán a intermediarios de datos.
   - El coste asociado cubrirá la capacidad de procesamiento informático y consumo de recursos de cómputo de la IA.

Cualquier cambio de esta naturaleza se notificará con antelación en la aplicación y exigirá la aceptación expresa de las condiciones y política actualizada.

---

### 5. Descargo Financiero y Modelos Predictivos
MintMox es una herramienta informativa y de ocio. Ninguna función actual o futura (incluidas proyecciones o análisis de mercado generados por IA) constituye asesoramiento financiero ni recomendación de inversión. Consulta los términos completos en el [Aviso Legal](file:///Users/rafaelruiz/Framework/docs/LEGAL_NOTICE.md).

---

### 6. Publicidad, Analíticas y Rastreadores
- **Cero Anuncios:** La aplicación no incluye redes publicitarias (AdMob, Unity Ads, etc.).
- **Cero Rastreo:** No se incorporan SDKs de telemetría de comportamiento ni rastreadores (Google Analytics, Firebase Analytics, Facebook SDK, etc.).
- **Cero Cookies:** No se emplean cookies de sesión ni de terceros.

---

### 7. Derechos del Usuario (RGPD y CCPA)
De conformidad con el Reglamento General de Protección de Datos (RGPD) de la UE y la normativa aplicable, el usuario puede ejercer sus derechos de acceso, rectificación, portabilidad y supresión (derecho al olvido). En el modelo local actual, el usuario ejerce estos derechos de forma directa e inmediata:
- Exportando sus datos en JSON/CSV.
- Eliminando la base de datos desde los ajustes de la app o desinstalando la aplicación.

---

### 8. Aviso Legal y Contenido de Fans de Wizards of the Coast
MintMox es contenido de fans no oficial permitido bajo la Política de Contenido de Fans de Wizards of the Coast. No está aprobado ni respaldado por Wizards. Parte de los materiales utilizados son propiedad de Wizards of the Coast. ©Wizards of the Coast LLC. Magic: The Gathering, Scryfall y Cardmarket son marcas registradas de sus respectivos propietarios.

---

## 🇬🇧 English Version

### Executive Summary
**MintMox** is a collection management application for *Magic: The Gathering* players and collectors built upon a **local-first** architecture and the principle of *Privacy by Design*. Currently, MintMox is 100% free, local, and ad-free. We do not collect, store on external servers, or sell any personal user data. Your collection is saved exclusively in your device's local memory.

---

### 1. Information We Do NOT Collect (Current State)
MintMox requires no user account or login and collects no personal data:
- No names, email addresses, phone numbers, or physical addresses.
- No geographical location data (GPS or network triangulation).
- No device advertising identifiers (IDFA, GAID).
- No device fingerprints or biometric data.
- No access to your contact list, camera roll, or personal files.

---

### 2. Local-First Storage & User Ownership
All data entered into the application (card inventory, purchase prices, quantities, binders, notes, and custom categories):
- Is saved locally in an **embedded SQLite database** within the app's sandboxed storage.
- Is never uploaded to central servers, external cloud storage, or third parties.
- Full user sovereignty: export your complete dataset at any time in open formats (JSON/CSV) or wipe everything via *Settings > Reset Inventory*.

---

### 3. Outgoing Network Requests & Third-Party Services
The application only connects to the public **Scryfall API** (`https://api.scryfall.com`) for informational purposes:
- Fetching official card metadata (names, set codes, rarity, collector numbers, card artwork).
- Fetching public EUR market price quotes provided by Cardmarket via Scryfall.

**Privacy Guarantee:** These HTTP requests are read-only, anonymous, and never transmit your personal information or your portfolio contents.

---

### 4. Transparency on Future Services (Cloud Sync & AI Predictions)
MintMox is designed as a forward-looking, modular application. In the event that optional value-added features are launched in the future:

1. **Multi-Device Cloud Synchronization & Server Storage:**  
   - If the user voluntarily opts into multi-device synchronization, an account (email & secure authentication) will be required.
   - Portfolio datasets will be transferred over secure encrypted channels (TLS/HTTPS) and stored in encrypted databases at rest.
   - Legal basis: contractual performance and user explicit consent (Art. 6(1) GDPR).
   - Subscription or service fees will strictly cover server hosting, database infrastructure, and bandwidth costs, never MTG intellectual property.
2. **AI Computational Models for Market Prediction:**  
   - If the user opts into AI-powered trend analysis or forecasting features, queries will only contain the quantitative data necessary for inference.
   - User data will not be used to train public third-party models or sold to data brokers.
   - Fees will solely cover raw computing power and AI model inference costs.

Users will be notified in advance and required to provide explicit consent before activating any cloud-enabled feature.

---

### 5. Financial Disclaimer & AI Predictions
MintMox is an informational and hobby tool. Neither current statistics nor future AI market predictions constitute financial advice or investment recommendations. Please refer to our complete [Legal Notice](file:///Users/rafaelruiz/Framework/docs/LEGAL_NOTICE.md).

---

### 6. Zero Ads, Zero Trackers & Zero Cookies
- **No Ads:** The app contains no third-party advertising SDKs.
- **No Telemetry/Trackers:** No analytics tools (Google Analytics, Firebase, Facebook SDK) are bundled.
- **No Cookies:** No web cookies or cross-site tracking mechanisms are used.

---

### 7. User Rights (GDPR & CCPA)
Under GDPR and global privacy frameworks, users maintain full rights to access, rectify, export, and delete their data. In the current local-first model, you exercise these rights directly within the app by exporting JSON/CSV files or wiping the database via Settings.

---

### 8. Wizards of the Coast Fan Content Notice
MintMox is unofficial Fan Content permitted under the Wizards of the Coast Fan Content Policy. Not approved or endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC. Magic: The Gathering, Scryfall, and Cardmarket are trademarks of their respective owners.
