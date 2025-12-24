<<<<<<< HEAD
#include <WiFi.h>
#include <WebServer.h>

// ================= CONFIGURATION =================
// TODO: Change these to your actual Wi-Fi details
const char* ssid = "WE8B19F7";      // e.g. "Home_WiFi"
const char* password = "F707F21F";  // e.g. "12345678"
// =================================================

// Create a Web Server running on port 80 (standard HTTP)
WebServer server(80);

// --- Handler: When the App sends a ping ---
void handleStatus() {
    // CRITICAL: This line tells the browser "I allow this App to talk to me"
    // Without this, your browser will block the connection
    server.sendHeader("Access-Control-Allow-Origin", "*");

    // Send the response back to the app (JSON format)
    String jsonResponse = "{\"status\":\"connected\", \"message\":\"Hello from ESP32!\"}";
    server.send(200, "application/json", jsonResponse);

    Serial.println("App pinged me! Sent response.");
}

// --- Handler: If the app asks for a page that doesn't exist ---
void handleNotFound() {
    // We also add the header here just in case
    server.sendHeader("Access-Control-Allow-Origin", "*");
    server.send(404, "text/plain", "Not Found");
}

void setup() {
    // 1. Start Serial Monitor (make sure your IDE is set to 115200)
    Serial.begin(115200);
    delay(100); // Give it a moment to wake up

    // 2. Connect to Wi-Fi
    Serial.println();
    Serial.print("Connecting to ");
    Serial.println(ssid);

    WiFi.begin(ssid, password);

    // Wait until connected
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    // 3. Print the IP Address (Type this into your App!)
    Serial.println("");
    Serial.println("WiFi connected.");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());

    // 4. Define the URL routes
    // When App visits http://[IP]/status, run the 'handleStatus' function
    server.on("/status", handleStatus);

    // Handle 404 errors
    server.onNotFound(handleNotFound);

    // 5. Start the server
    server.begin();
    Serial.println("HTTP server started");
}

void loop() {
    // Keep the server listening for new requests
    server.handleClient();
}
=======
#include <WiFi.h>
#include <WebServer.h>

// ================= CONFIGURATION =================
// TODO: Change these to your actual Wi-Fi details
const char* ssid     = "WE8B19F7";      // e.g. "Home_WiFi"
const char* password = "F707F21F";  // e.g. "12345678"
// =================================================

// Create a Web Server running on port 80 (standard HTTP)
WebServer server(80);

// --- Handler: When the App sends a ping ---
void handleStatus() {
  // CRITICAL: This line tells the browser "I allow this App to talk to me"
  // Without this, your browser will block the connection
  server.sendHeader("Access-Control-Allow-Origin", "*");
  
  // Send the response back to the app (JSON format)
  String jsonResponse = "{\"status\":\"connected\", \"message\":\"Hello from ESP32!\"}";
  server.send(200, "application/json", jsonResponse);
  
  Serial.println("App pinged me! Sent response.");
}

// --- Handler: If the app asks for a page that doesn't exist ---
void handleNotFound() {
  // We also add the header here just in case
  server.sendHeader("Access-Control-Allow-Origin", "*"); 
  server.send(404, "text/plain", "Not Found");
}

void setup() {
  // 1. Start Serial Monitor (make sure your IDE is set to 115200)
  Serial.begin(115200);
  delay(100); // Give it a moment to wake up

  // 2. Connect to Wi-Fi
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  // Wait until connected
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  // 3. Print the IP Address (Type this into your App!)
  Serial.println("");
  Serial.println("WiFi connected.");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP()); 

  // 4. Define the URL routes
  // When App visits http://[IP]/status, run the 'handleStatus' function
  server.on("/status", handleStatus); 
  
  // Handle 404 errors
  server.onNotFound(handleNotFound);

  // 5. Start the server
  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  // Keep the server listening for new requests
  server.handleClient();
}
>>>>>>> d675c0d880a2cfb0c205dc4bb06fbb4d735c71fe
