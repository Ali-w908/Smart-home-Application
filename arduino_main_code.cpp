// ----------------------------------------------------
// Smart Home Prototype - FINAL CODE (Wi-Fi & NTC Thermistor)
// ----------------------------------------------------

#include <SoftwareSerial.h>

// --- Wi-Fi Configuration ---
// !! CHANGE THESE TO YOUR NETWORK DETAILS !!
const char* WIFI_SSID = "WE8B19F7";
const char* WIFI_PASSWORD = "F707F21F";
const int SERVER_PORT = 80;

// ESP8266 Connection (Using SoftwareSerial on D10/D11)
const int WIFI_RX_PIN = 10; // Connects to the ESP8266 TX pin
const int WIFI_TX_PIN = 11; // Connects to the ESP8266 RX pin
SoftwareSerial esp8266(WIFI_RX_PIN, WIFI_TX_PIN);
const long ESP_BAUD_RATE = 74880;

// --- Actuator/Sensor Pin Definitions ---
const int LAMP_RELAY_PIN = 7;
const int PLUG_RELAY_PIN = 6;
const int DOOR_SENSOR_PIN = 2;
const int BUZZER_PIN = 8;

// --- NTC Thermistor Configuration ---
const int NTC_PIN = A0; // Analog pin connected to the NTC voltage divider output
const float NOMINAL_RESISTANCE = 100000; // 100k Ohms
const float NOMINAL_TEMPERATURE = 25;    // 25C 
const int BETA_COEFFICIENT = 3950;       // B-value for 100k NTC
const float REFERENCE_RESISTANCE = 100000; // Fixed 100k Ohm resistor in the voltage divider
const int ADC_RESOLUTION = 1024;

// Alarm Settings (now settable from App)
float alarmTempThreshold = 27.0;

// --- State Variables ---
// Lamp: App toggles relay, physical switch in series creates XOR effect
bool lampRelayState = false;   // Current relay state (controlled by app)
bool plugState = false;
bool buzzerAppOverride = false; // App can override buzzer
bool previousDoorState = true; // HIGH=CLOSED, LOW=OPEN
String currentCommand = "";

// Variables for managing status updates
unsigned long lastStatusUpdateTime = 0;
const unsigned long STATUS_REPORT_INTERVAL_MS = 5000; // Report status every 5 seconds


void setup() {
    Serial.begin(9600);    // Hardware Serial for debugging
    esp8266.begin(ESP_BAUD_RATE); // Software Serial for ESP8266

    // Initialize Actuator Pins and set them OFF (HIGH for Active LOW relays)
    pinMode(LAMP_RELAY_PIN, OUTPUT);
    pinMode(PLUG_RELAY_PIN, OUTPUT);
    pinMode(BUZZER_PIN, OUTPUT);
    digitalWrite(LAMP_RELAY_PIN, LOW);
    digitalWrite(PLUG_RELAY_PIN, HIGH);
    digitalWrite(BUZZER_PIN, LOW);

    // Initialize Sensor Pins
    pinMode(DOOR_SENSOR_PIN, INPUT_PULLUP);
    previousDoorState = digitalRead(DOOR_SENSOR_PIN);

    Serial.println("Smart Home Prototype Initializing Wi-Fi and NTC...");

    // Connect to Wi-Fi and start server
    connectToWiFi();
}

void loop() {
    // 1. Handle incoming Wi-Fi commands (Actuator Control)
    if (esp8266.available()) {
        if (esp8266.find("+IPD,")) {
            delay(50);
            int connectionId = esp8266.read() - '0';
            Serial.print("\n> COMMAND RECEIVED on CID: ");
            Serial.println(connectionId);
            readWiFiCommand(connectionId);
        }
    }

    // 2. Read Sensors
    float currentTemp = readNTC();
    bool currentDoorState = digitalRead(DOOR_SENSOR_PIN);
    
    // 3. Lamp control is handled by commands - relay state + physical switch in series = XOR
    // No need to read switch, XOR happens in hardware

    // 4. Temperature Alarm Logic (using settable threshold)
    bool shouldAlarm = currentTemp > alarmTempThreshold;
    if (shouldAlarm || buzzerAppOverride) {
        digitalWrite(BUZZER_PIN, HIGH); // Physical Alarm ON
        if (digitalRead(BUZZER_PIN) == HIGH) {
            Serial.println(">>> HIGH TEMP ALARM ACTIVE! Buzzer ON.");
        }
    }
    else {
        digitalWrite(BUZZER_PIN, LOW); // Physical Alarm OFF
    }

    // 5. Door Status Change Alert (Immediate Report to monitor)
    if (currentDoorState != previousDoorState) {
        Serial.print(">>> DOOR STATUS CHANGE: ");
        Serial.println((currentDoorState == LOW) ? "CLOSED" : "OPENED");
        previousDoorState = currentDoorState;
        delay(200);
    }

    // 6. Periodic Status Reporting (for monitor and app polling reference)
    if (millis() - lastStatusUpdateTime >= STATUS_REPORT_INTERVAL_MS) {
        Serial.print("STATUS UPDATE: ");
        Serial.print(currentTemp, 2);
        Serial.print(" C. Door: ");
        Serial.print((currentDoorState == LOW) ? "CLOSED" : "OPENED");
        Serial.print(" | Threshold: ");
        Serial.print(alarmTempThreshold, 1);
        Serial.println(" C");

        lastStatusUpdateTime = millis();
    }

    delay(500); // Reduced delay for more responsive XOR control
}

// --- NTC Thermistor Function ---

float readNTC() {
    // 1. Read the raw ADC value
    int adc_reading = analogRead(NTC_PIN);

    // 2. Convert ADC reading to Resistance (R_thermistor)
    // R_thermistor = R_ref * (V_supply / V_out - 1)
    float resistance;
    if (adc_reading == 0) {
        resistance = NOMINAL_RESISTANCE; // Avoid division by zero
    }
    else {
        resistance = REFERENCE_RESISTANCE * ((float)ADC_RESOLUTION / adc_reading - 1.0);
    }

    // 3. Apply Steinhart-Hart Equation (Simplified Beta Model)
    float temp_kelvin = NOMINAL_TEMPERATURE + 273.15;

    float log_resistance_ratio = -log(resistance / NOMINAL_RESISTANCE);

    float one_over_T = (1.0 / temp_kelvin) + (1.0 / BETA_COEFFICIENT) * log_resistance_ratio;

    float temp_K = 1.0 / one_over_T;

    // 4. Convert to Celsius
    float temp_C = temp_K - 273.15;

    return temp_C;
}


// --- Wi-Fi Communication Functions (Mostly Unchanged) ---

void sendCommand(String command, const int timeout) {
    esp8266.print(command);
    long startTime = millis();

    while (millis() - startTime < timeout) {
        while (esp8266.available()) {
            Serial.write(esp8266.read());
        }
    }
}

void connectToWiFi() {
    // First, test basic AT communication
    Serial.println("Testing ESP8266 communication...");
    Serial.println("Sending AT command (should respond with OK):");
    sendCommand("AT\r\n", 2000);
    Serial.println("\n---");
    
    sendCommand("AT+CWMODE=3\r\n", 2000);
    delay(1000);

    String cmd = "AT+CWJAP=\"";
    cmd += WIFI_SSID;
    cmd += "\",\"";
    cmd += WIFI_PASSWORD;
    cmd += "\"\r\n";
    Serial.print("Connecting to Wi-Fi...");
    sendCommand(cmd, 10000);
    Serial.println("...Done!");

    // Get and display IP Address
    Serial.println("\n=== IMPORTANT: ARDUINO IP ADDRESS ===");
    
    // Clear any pending data first
    while (esp8266.available()) {
        esp8266.read();
    }
    
    // Send AT+CIFSR command
    esp8266.print("AT+CIFSR\r\n");
    
    // Wait and collect response with timeout
    String ipResponse = "";
    unsigned long startTime = millis();
    while (millis() - startTime < 3000) { // 3 second timeout
        while (esp8266.available()) {
            char c = esp8266.read();
            ipResponse += c;
            Serial.write(c); // Echo each character to debug
        }
        delay(10);
    }
    
    Serial.println(""); // New line after raw output
    
    // Try to parse the IP address from response
    int staipStart = ipResponse.indexOf("STAIP,\"");
    if (staipStart != -1) {
        int ipStart = staipStart + 7;
        int ipEnd = ipResponse.indexOf("\"", ipStart);
        if (ipEnd != -1) {
            String ipAddress = ipResponse.substring(ipStart, ipEnd);
            Serial.print("\n>>> YOUR IP ADDRESS: ");
            Serial.println(ipAddress);
        }
    }
    
    // Also try alternative format (some ESP firmware uses different format)
    int altStart = ipResponse.indexOf("+CIFSR:STAIP,\"");
    if (altStart != -1) {
        int ipStart = altStart + 14;
        int ipEnd = ipResponse.indexOf("\"", ipStart);
        if (ipEnd != -1) {
            String ipAddress = ipResponse.substring(ipStart, ipEnd);
            Serial.print("\n>>> YOUR IP ADDRESS: ");
            Serial.println(ipAddress);
        }
    }
    
    Serial.println("\n======================================");
    Serial.println("If no IP shown above, check ESP8266 connection");
    
    sendCommand("AT+CIPMUX=1\r\n", 1000);

    String serverCmd = "AT+CIPSERVER=1,";
    serverCmd += SERVER_PORT;
    serverCmd += "\r\n";
    sendCommand(serverCmd, 1000);

    Serial.println("Wi-Fi Server Started!");
}

void readWiFiCommand(int connectionId) {
    currentCommand = "";
    while (esp8266.available()) {
        currentCommand += (char)esp8266.read();
    }

    int start = currentCommand.indexOf("GET /");
    int end = currentCommand.indexOf(" HTTP/1.1");
    String action = "";

    if (start != -1 && end != -1) {
        action = currentCommand.substring(start + 5, end);
        Serial.print("   Action: ");
        Serial.println(action);
    }

    // Actuator Control Logic
    // Lamp: Toggle relay state - physical switch in series creates XOR
    if (action.equals("LAMP_ON")) {
        lampRelayState = true;
        digitalWrite(LAMP_RELAY_PIN, LOW); // Active LOW relay ON
        Serial.println("   Lamp relay ON");
    }
    else if (action.equals("LAMP_OFF")) {
        lampRelayState = false;
        digitalWrite(LAMP_RELAY_PIN, HIGH); // Active LOW relay OFF
        Serial.println("   Lamp relay OFF");
    }
    else if (action.equals("LAMP_TOGGLE")) {
        lampRelayState = !lampRelayState;
        digitalWrite(LAMP_RELAY_PIN, lampRelayState ? LOW : HIGH);
        Serial.print("   Lamp relay toggled to: ");
        Serial.println(lampRelayState ? "ON" : "OFF");
    }
    else if (action.equals("PLUG_ON")) {
        digitalWrite(PLUG_RELAY_PIN, LOW);
        plugState = true;
    }
    else if (action.equals("PLUG_OFF")) {
        digitalWrite(PLUG_RELAY_PIN, HIGH);
        plugState = false;
    }
    else if (action.startsWith("SET_THRESHOLD:")) {
        String thresholdStr = action.substring(14);
        float newThreshold = thresholdStr.toFloat();
        if (newThreshold > 0 && newThreshold < 100) {
            alarmTempThreshold = newThreshold;
            Serial.print("   Threshold set to: ");
            Serial.println(alarmTempThreshold);
        }
    }
    else if (action.equals("ALARM_ON")) {
        buzzerAppOverride = true;
        digitalWrite(BUZZER_PIN, HIGH);
        Serial.println("   App activated alarm");
    }
    else if (action.equals("ALARM_OFF")) {
        buzzerAppOverride = false;
        digitalWrite(BUZZER_PIN, LOW);
        Serial.println("   App deactivated alarm");
    }
    else if (action.equals("STATUS")) {
        Serial.println("   Status poll received.");
    }

    // Prepare Status Response
    String statusResponse = sendCurrentStatus(readNTC(), digitalRead(DOOR_SENSOR_PIN));

    // Send HTTP Response with CORS header for browser/app compatibility
    String header = "HTTP/1.1 200 OK\r\n";
    header += "Access-Control-Allow-Origin: *\r\n";
    header += "Content-Type: text/plain\r\n";
    header += "Content-Length: ";
    header += statusResponse.length();
    header += "\r\n\r\n";

    String finalResponse = header + statusResponse;

    // 1. Send command length
    String cipSend = "AT+CIPSEND=";
    cipSend += connectionId;
    cipSend += ",";
    cipSend += finalResponse.length();
    cipSend += "\r\n";
    sendCommand(cipSend, 500);

    // 2. Send the actual data
    esp8266.print(finalResponse);
    delay(100);

    // 3. Close the connection
    String cipClose = "AT+CIPCLOSE=";
    cipClose += connectionId;
    cipClose += "\r\n";
    sendCommand(cipClose, 1000);
}

// Function to format the status data for the Android App
String sendCurrentStatus(float temp, bool doorSensorReading) {
    String doorStatusStr = (doorSensorReading == LOW) ? "OPEN" : "CLOSED";
    String lampStatusStr = lampRelayState ? "ON" : "OFF";
    String plugStatusStr = plugState ? "ON" : "OFF";
    String alarmStatusStr = (temp > alarmTempThreshold || buzzerAppOverride) ? "ALARM" : "SAFE";

    // Format: "TEMP:XX.XX,DOOR:STATUS,LAMP:STATUS,PLUG:STATUS,ALARM:STATUS,THRESHOLD:XX.X"
    String statusMessage = "";
    statusMessage += "TEMP:";
    statusMessage += String(temp, 2);
    statusMessage += ",DOOR:";
    statusMessage += doorStatusStr;
    statusMessage += ",LAMP:";
    statusMessage += lampStatusStr;
    statusMessage += ",PLUG:";
    statusMessage += plugStatusStr;
    statusMessage += ",ALARM:";
    statusMessage += alarmStatusStr;
    statusMessage += ",THRESHOLD:";
    statusMessage += String(alarmTempThreshold, 1);

    return statusMessage;
}