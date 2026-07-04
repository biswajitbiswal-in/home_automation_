
            /*************************************************************
 *  PROJECT: Home Automation Through Voice Commands
 *  USING: ESP32, Blynk IoT, and Website (HTML/CSS/JS)
 *
 *  FEATURES:
 *   - Wi-Fi connectivity
 *   - Blynk Cloud sync (V0=Red, V1=Fan, V2=Green, V3=Blue,
 *                        V4=Temperature, V5=Humidity, V6=AutoMode)
 *   - HTTP Web Server with REST-style endpoints
 *   - RGB LED control (digitalWrite based, ESP32 Core 3.x safe)
 *   - 28BYJ-48 Stepper Motor control via AccelStepper (non-blocking)
 *   - DHT11/DHT22 Temperature & Humidity sensing (non-blocking)
 *   - Automatic fan control based on temperature/humidity thresholds
 *     -> ONLY active when autoModeEnabled == true. Manual switch
 *        presses (web or Blynk) always take priority and switch
 *        the system into manual mode so DHT readings can't
 *        silently undo your command.
 *   - Detailed Serial debugging
 *
 *  BOARD: ESP32 Dev Module
 *  CORE:  ESP32 Arduino Core 3.x (latest)
 *************************************************************/

#define BLYNK_TEMPLATE_ID   "your blynk template id"
#define BLYNK_TEMPLATE_NAME "your blynk template name"
#define BLYNK_PRINT Serial

#include 
#include 
#include 
#include 
#include               // Adafruit DHT sensor library

/* ================= CREDENTIALS ================= */
char auth[] = "qS4HP-bPIg1oZQ5bZuU8ZQ3wsF1htDao";
char ssid[] = "Your wifi id";
char pass[] = "your wifi password";

/* ================= RGB LED PINS ================= */
#define RED_PIN    13
#define GREEN_PIN  27
#define BLUE_PIN   14

/* ================= STEPPER PINS ================= */
#define IN1 26
#define IN2 33
#define IN3 25
#define IN4 32

/* ================= STEPPER CONFIG ================= */
// 28BYJ-48 in HALF4WIRE mode via ULN2003.
// Pin order for AccelStepper HALF4WIRE must be IN1, IN3, IN2, IN4
AccelStepper stepper(AccelStepper::HALF4WIRE, IN1, IN3, IN2, IN4);
const float FAN_SPEED = 600.0;   // steps/sec - continuous rotation speed

/* ================= DHT SENSOR CONFIG ================= */
#define DHT_PIN   4          // GPIO4 - free pin, not used elsewhere in this project
#define DHT_TYPE  DHT11      // DHT11 by default; switch to DHT22 if needed
DHT dht(DHT_PIN, DHT_TYPE);

// Global variables holding the latest sensor readings.
// NAN (Not-A-Number) is used as the "no valid reading yet / read failed" sentinel.
float temperature = NAN;
float humidity     = NAN;

// Non-blocking timing control for sensor reads (replaces delay()-based polling)
unsigned long lastSensorReadTime = 0;
const unsigned long SENSOR_READ_INTERVAL = 2000; // read every 2 seconds

/* ================= AUTO FAN CONTROL CONFIG ================= */
// Fan turns ON automatically if temperature OR humidity crosses the "ON" threshold.
// Fan turns OFF automatically once BOTH values drop back below the same threshold.
// This logic ONLY runs while autoModeEnabled == true (see below).
const float AUTO_TEMP_ON_THRESHOLD  = 30.0;  // °C - fan turns ON above this
const float AUTO_TEMP_OFF_THRESHOLD = 30.0;  // °C - fan turns OFF below this
const float AUTO_HUM_ON_THRESHOLD   = 60.0;  // %  - fan turns ON above this
const float AUTO_HUM_OFF_THRESHOLD  = 60.0;  // %  - fan turns OFF below this

/* ================= STATE VARIABLES ================= */
bool redState    = false;
bool greenState  = false;
bool blueState   = false;
bool fanState    = false;

// NEW: Mode flag - this is the fix.
// false (default) = MANUAL mode: fan only responds to explicit on/off commands.
//                    DHT readings are still taken and reported, but autoFanControl()
//                    will NOT touch the fan.
// true             = AUTO mode: DHT readings automatically drive the fan, exactly
//                    like before.
// Any manual /fan/on, /fan/off, or Blynk V1 toggle forces autoModeEnabled = false,
// so your manual command always wins and can never be silently reversed by the
// sensor 2 seconds later.
bool autoModeEnabled = false;

/* ================= WEB SERVER ================= */
WebServer server(80);

/* ================= FUNCTION PROTOTYPES ================= */
void connectWiFi();
void setupServerRoutes();
void handleRedOn();
void handleRedOff();
void handleGreenOn();
void handleGreenOff();
void handleBlueOn();
void handleBlueOff();
void handleFanOn();
void handleFanOff();
void handleModeAuto();     // NEW: /mode/auto endpoint
void handleModeManual();   // NEW: /mode/manual endpoint
void handleStatus();
void handleSensor();
void handleNotFound();
void applyRed(bool state);
void applyGreen(bool state);
void applyBlue(bool state);
void applyFan(bool state);
void readSensor();
void autoFanControl();
String buildStatusJSON();
String buildSensorJSON();

/*************************************************************
 *  SETUP
 *************************************************************/
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println();
  Serial.println("=================================================");
  Serial.println(" HOME AUTOMATION SYSTEM - ESP32 BOOTING...");
  Serial.println("=================================================");

  // --- RGB LED pin setup ---
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);
  digitalWrite(RED_PIN, LOW);
  digitalWrite(GREEN_PIN, LOW);
  digitalWrite(BLUE_PIN, LOW);
  Serial.println("[INIT] RGB LED pins configured (13=R, 27=G, 14=B)");

  // --- Stepper setup ---
  stepper.setMaxSpeed(1000.0);
  stepper.setSpeed(0);
  Serial.println("[INIT] Stepper motor (28BYJ-48 + ULN2003) configured");

  // --- DHT sensor setup ---
  dht.begin();
  Serial.println("[INIT] DHT sensor initialized on GPIO4");
  Serial.println("[INIT] Starting in MANUAL fan mode (auto-control OFF by default)");

  // --- Wi-Fi connection ---
  connectWiFi();

  // --- Blynk connection ---
  Serial.println("[BLYNK] Connecting to Blynk Cloud...");
  Blynk.config(auth);
  bool blynkOK = Blynk.connect(5000); // 5 second timeout
  if (blynkOK) {
    Serial.println("[BLYNK] Connected to Blynk Cloud successfully!");
  } else {
    Serial.println("[BLYNK] WARNING: Could not connect to Blynk Cloud.");
    Serial.println("[BLYNK] Will keep retrying in background via Blynk.run()");
  }

  // --- Web server setup ---
  setupServerRoutes();
  server.begin();
  Serial.println("[SERVER] HTTP Web Server started on port 80");
  Serial.print("[SERVER] Access dashboard API at: http://");
  Serial.println(WiFi.localIP());

  Serial.println("=================================================");
  Serial.println(" SYSTEM READY - All modules initialized");
  Serial.println("=================================================");
}

/*************************************************************
 *  MAIN LOOP
 *************************************************************/
void loop() {
  Blynk.run();
  server.handleClient();

  // Non-blocking continuous stepper rotation while fan is ON
  if (fanState) {
    stepper.runSpeed();
  }

  // Non-blocking DHT sensor polling (millis()-based, no delay())
  readSensor();
}

/*************************************************************
 *  WI-FI CONNECTION
 *************************************************************/
void connectWiFi() {
  Serial.print("[WIFI] Connecting to SSID: ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, pass);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[WIFI] Wi-Fi Connected Successfully!");
    Serial.print("[WIFI] IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WIFI] Signal Strength (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("[WIFI] ERROR: Failed to connect to Wi-Fi after multiple attempts.");
    Serial.println("[WIFI] Please check SSID/Password and restart the device.");
  }
}

/*************************************************************
 *  WEB SERVER ROUTES
 *************************************************************/
void setupServerRoutes() {
  server.on("/red/on",    HTTP_GET, handleRedOn);
  server.on("/red/off",   HTTP_GET, handleRedOff);
  server.on("/green/on",  HTTP_GET, handleGreenOn);
  server.on("/green/off", HTTP_GET, handleGreenOff);
  server.on("/blue/on",   HTTP_GET, handleBlueOn);
  server.on("/blue/off",  HTTP_GET, handleBlueOff);
  server.on("/fan/on",    HTTP_GET, handleFanOn);
  server.on("/fan/off",   HTTP_GET, handleFanOff);
  server.on("/mode/auto",   HTTP_GET, handleModeAuto);    // NEW
  server.on("/mode/manual", HTTP_GET, handleModeManual);  // NEW
  server.on("/status",    HTTP_GET, handleStatus);
  server.on("/sensor",    HTTP_GET, handleSensor);

  // Enable CORS for all responses so the website (served from
  // Live Server / GitHub Pages / local file) can call the ESP32 API
  server.enableCORS(true);

  server.onNotFound(handleNotFound);

  Serial.println("[SERVER] Routes registered:");
  Serial.println("         GET /red/on    GET /red/off");
  Serial.println("         GET /green/on  GET /green/off");
  Serial.println("         GET /blue/on   GET /blue/off");
  Serial.println("         GET /fan/on    GET /fan/off   (forces MANUAL mode)");
  Serial.println("         GET /mode/auto   GET /mode/manual");
  Serial.println("         GET /status");
  Serial.println("         GET /sensor");
}

/*************************************************************
 *  ROUTE HANDLERS
 *************************************************************/
void handleRedOn() {
  Serial.println("[WEB] Website Request Received: /red/on");
  applyRed(true);
  server.send(200, "application/json", buildStatusJSON());
}

void handleRedOff() {
  Serial.println("[WEB] Website Request Received: /red/off");
  applyRed(false);
  server.send(200, "application/json", buildStatusJSON());
}

void handleGreenOn() {
  Serial.println("[WEB] Website Request Received: /green/on");
  applyGreen(true);
  server.send(200, "application/json", buildStatusJSON());
}

void handleGreenOff() {
  Serial.println("[WEB] Website Request Received: /green/off");
  applyGreen(false);
  server.send(200, "application/json", buildStatusJSON());
}

void handleBlueOn() {
  Serial.println("[WEB] Website Request Received: /blue/on");
  applyBlue(true);
  server.send(200, "application/json", buildStatusJSON());
}

void handleBlueOff() {
  Serial.println("[WEB] Website Request Received: /blue/off");
  applyBlue(false);
  server.send(200, "application/json", buildStatusJSON());
}

void handleFanOn() {
  Serial.println("[WEB] Website Request Received: /fan/on (manual)");
  autoModeEnabled = false;   // FIX: manual command always wins, DHT can't override it
  applyFan(true);
  server.send(200, "application/json", buildStatusJSON());
}

void handleFanOff() {
  Serial.println("[WEB] Website Request Received: /fan/off (manual)");
  autoModeEnabled = false;   // FIX: manual command always wins, DHT can't override it
  applyFan(false);
  server.send(200, "application/json", buildStatusJSON());
}

// NEW: re-enable DHT-based automatic fan control
void handleModeAuto() {
  Serial.println("[WEB] Website Request Received: /mode/auto");
  autoModeEnabled = true;
  Serial.println("[MODE] Switched to AUTO - DHT readings will now control the fan");
  server.send(200, "application/json", buildStatusJSON());
}

// NEW: force manual mode (fan stays exactly as you last set it)
void handleModeManual() {
  Serial.println("[WEB] Website Request Received: /mode/manual");
  autoModeEnabled = false;
  Serial.println("[MODE] Switched to MANUAL - fan will only respond to on/off commands");
  server.send(200, "application/json", buildStatusJSON());
}

void handleStatus() {
  server.send(200, "application/json", buildStatusJSON());
}

void handleSensor() {
  Serial.println("[WEB] Website Request Received: /sensor");
  server.send(200, "application/json", buildSensorJSON());
}

void handleNotFound() {
  server.send(404, "application/json", "{\"error\":\"Endpoint not found\"}");
  Serial.print("[WEB] 404 - Unknown request: ");
  Serial.println(server.uri());
}

/*************************************************************
 *  APPLY FUNCTIONS (single source of truth for hardware state)
 *  These update the GPIO, the internal state, AND sync Blynk.
 *************************************************************/
void applyRed(bool state) {
  redState = state;
  digitalWrite(RED_PIN, state ? HIGH : LOW);
  Blynk.virtualWrite(V0, state ? 1 : 0);
  Serial.print("[LED] Red LED ");
  Serial.println(state ? "ON" : "OFF");
}

void applyGreen(bool state) {
  greenState = state;
  digitalWrite(GREEN_PIN, state ? HIGH : LOW);
  Blynk.virtualWrite(V2, state ? 1 : 0);
  Serial.print("[LED] Green LED ");
  Serial.println(state ? "ON" : "OFF");
}

void applyBlue(bool state) {
  blueState = state;
  digitalWrite(BLUE_PIN, state ? HIGH : LOW);
  Blynk.virtualWrite(V3, state ? 1 : 0);
  Serial.print("[LED] Blue LED ");
  Serial.println(state ? "ON" : "OFF");
}

void applyFan(bool state) {
  fanState = state;
  if (state) {
    stepper.setSpeed(FAN_SPEED);
    Serial.println("[FAN] Fan Running (continuous rotation)");
  } else {
    stepper.setSpeed(0);
    stepper.disableOutputs(); // cuts current to coils, prevents overheating/holding current
    Serial.println("[FAN] Fan Stopped");
  }
  Blynk.virtualWrite(V1, state ? 1 : 0);
}

/*************************************************************
 *  DHT SENSOR FUNCTIONS
 *************************************************************/

// readSensor()
// -------------
// Non-blocking DHT read using millis() timing (no delay() calls).
// Runs every SENSOR_READ_INTERVAL (2000 ms) inside loop().
// Always updates readings/Serial/Blynk V4-V5 regardless of mode,
// so you can still monitor temperature/humidity even in manual mode.
// Only calls autoFanControl() - i.e. only touches the fan - when
// autoModeEnabled is true.
void readSensor() {
  unsigned long now = millis();

  if (now - lastSensorReadTime < SENSOR_READ_INTERVAL) {
    return;
  }
  lastSensorReadTime = now;

  float h = dht.readHumidity();
  float t = dht.readTemperature(); // Celsius by default

  if (isnan(h) || isnan(t)) {
    Serial.println("[DHT] WARNING: Failed to read from DHT sensor! Keeping last known values.");
    return;
  }

  temperature = t;
  humidity    = h;

  Serial.print("[DHT] Temperature: ");
  Serial.print(temperature, 1);
  Serial.print(" C   Humidity: ");
  Serial.print(humidity, 1);
  Serial.println(" %");

  Blynk.virtualWrite(V4, temperature);
  Blynk.virtualWrite(V5, humidity);

  // FIX: only let DHT drive the fan when auto mode is explicitly enabled
  if (autoModeEnabled) {
    autoFanControl();
  }
}

// autoFanControl()
// ------------------
// Automatically turns the fan ON when temperature > 30°C OR humidity > 60%,
// and OFF once BOTH temperature < 30°C AND humidity < 60%.
// This function is now ONLY ever called while autoModeEnabled == true
// (see readSensor()), so it can never fight a manual on/off command -
// a manual command always sets autoModeEnabled = false first.
void autoFanControl() {
  bool shouldTurnOn  = (temperature > AUTO_TEMP_ON_THRESHOLD) ||
                       (humidity    > AUTO_HUM_ON_THRESHOLD);
  bool shouldTurnOff = (temperature < AUTO_TEMP_OFF_THRESHOLD) &&
                       (humidity    < AUTO_HUM_OFF_THRESHOLD);

  if (shouldTurnOn && !fanState) {
    Serial.println("[AUTO] Threshold exceeded (temp/humidity) - turning fan ON automatically");
    applyFan(true);
  } else if (shouldTurnOff && fanState) {
    Serial.println("[AUTO] Readings normalized - turning fan OFF automatically");
    applyFan(false);
  }
}

// buildSensorJSON()
String buildSensorJSON() {
  String json = "{";
  json += "\"temperature\":" + String(isnan(temperature) ? 0.0 : temperature, 1) + ",";
  json += "\"humidity\":" + String(isnan(humidity) ? 0.0 : humidity, 1);
  json += "}";
  return json;
}

/*************************************************************
 *  JSON STATUS BUILDER
 *************************************************************/
String buildStatusJSON() {
  String json = "{";
  json += "\"red\":" + String(redState ? "true" : "false") + ",";
  json += "\"green\":" + String(greenState ? "true" : "false") + ",";
  json += "\"blue\":" + String(blueState ? "true" : "false") + ",";
  json += "\"fan\":" + String(fanState ? "true" : "false") + ",";
  json += "\"autoMode\":" + String(autoModeEnabled ? "true" : "false") + ","; // NEW
  json += "\"temperature\":" + String(isnan(temperature) ? 0.0 : temperature, 1) + ",";
  json += "\"humidity\":" + String(isnan(humidity) ? 0.0 : humidity, 1) + ",";
  json += "\"ip\":\"" + WiFi.localIP().toString() + "\",";
  json += "\"rssi\":" + String(WiFi.RSSI());
  json += "}";
  return json;
}

/*************************************************************
 *  BLYNK VIRTUAL PIN HANDLERS (App -> ESP32)
 *************************************************************/
BLYNK_WRITE(V0) {  // Red LED switch from Blynk app
  int value = param.asInt();
  Serial.println("[BLYNK] Command Received: Red LED");
  digitalWrite(RED_PIN, value ? HIGH : LOW);
  redState = value;
  Serial.print("[LED] Red LED ");
  Serial.println(value ? "ON" : "OFF");
}

BLYNK_WRITE(V1) {  // Fan switch from Blynk app
  int value = param.asInt();
  Serial.println("[BLYNK] Command Received: Fan (manual)");
  autoModeEnabled = false;  // FIX: manual app toggle always wins over DHT
  applyFan(value == 1);
}

BLYNK_WRITE(V2) {  // Green LED switch from Blynk app
  int value = param.asInt();
  Serial.println("[BLYNK] Command Received: Green LED");
  digitalWrite(GREEN_PIN, value ? HIGH : LOW);
  greenState = value;
  Serial.print("[LED] Green LED ");
  Serial.println(value ? "ON" : "OFF");
}

BLYNK_WRITE(V3) {  // Blue LED switch from Blynk app
  int value = param.asInt();
  Serial.println("[BLYNK] Command Received: Blue LED");
  digitalWrite(BLUE_PIN, value ? HIGH : LOW);
  blueState = value;
  Serial.print("[LED] Blue LED ");
  Serial.println(value ? "ON" : "OFF");
}

// NEW: dedicated Blynk switch (V6) to toggle auto/manual fan mode from the app.
// Add a Switch widget on V6 in your Blynk template if you want this control there.
BLYNK_WRITE(V6) {
  int value = param.asInt();
  autoModeEnabled = (value == 1);
  Serial.print("[BLYNK] Fan mode set to: ");
  Serial.println(autoModeEnabled ? "AUTO" : "MANUAL");
}

/*************************************************************
 *  BLYNK CONNECTION EVENT
 *************************************************************/
BLYNK_CONNECTED() {
  Serial.println("[BLYNK] Device connected — syncing current state to app...");
  Blynk.virtualWrite(V0, redState ? 1 : 0);
  Blynk.virtualWrite(V1, fanState ? 1 : 0);
  Blynk.virtualWrite(V2, greenState ? 1 : 0);
  Blynk.virtualWrite(V3, blueState ? 1 : 0);
  Blynk.virtualWrite(V6, autoModeEnabled ? 1 : 0); // NEW
  if (!isnan(temperature)) Blynk.virtualWrite(V4, temperature);
  if (!isnan(humidity))    Blynk.virtualWrite(V5, humidity);
}
          