# 🏠 Home Automation Through Voice Commands

> A modern IoT-based Home Automation System built using **ESP32**, **HTML**, **CSS**, and **JavaScript**. The system enables real-time monitoring and control of home appliances through a responsive web dashboard using REST API communication over a local Wi-Fi network.

---

# 📖 Overview

This project is a smart home automation system that enables users to monitor and control household appliances using an **ESP32 microcontroller** and a **custom web dashboard**. The ESP32 hosts an HTTP web server that exposes REST API endpoints, allowing seamless communication between the dashboard and the hardware.

The system provides real-time control of RGB LEDs and a stepper motor fan while continuously monitoring temperature and humidity using a DHT11 sensor. It supports both **Manual Mode** and **Auto Mode**, making the system reliable, efficient, and user-friendly.

---

# ✨ Features

- 🌐 ESP32 HTTP Web Server
- 📡 REST API Communication
- 💡 RGB LED Control
- 🌀 Stepper Motor Fan Control
- 🌡️ Real-Time Temperature Monitoring
- 💧 Real-Time Humidity Monitoring
- ⚙️ Manual & Auto Fan Mode
- 📶 Wi-Fi Signal Monitoring
- 📱 Responsive Web Dashboard
- 🎨 Modern User Interface
- ⚡ Live Device Status Updates
- 🔄 Real-Time Dashboard Synchronization
- 🏠 Local Wi-Fi Network Communication




# 🤖 Aero AI Assistant

**Aero AI** is the intelligent virtual assistant integrated into the Home Automation dashboard. It provides users with instant information about the project, system features, and connected devices through an interactive chat interface.

Unlike traditional voice assistants, Aero AI is designed as a **project knowledge assistant**. It helps users understand how the system works without directly controlling the hardware.

## ✨ Features

- 💬 Interactive chat interface
- 📖 Explains project features and functionality
- 🌡️ Provides information about temperature and humidity monitoring
- 💡 Describes RGB LED and fan control operations
- 📡 Explains REST API communication
- ⚙️ Answers questions about Auto and Manual modes
- 📚 Helps users understand the system architecture
- 🎨 Integrated seamlessly into the dashboard

## 🧠 What Aero AI Can Answer

- What is this project?
- How does the ESP32 work?
- How does the REST API communicate with the dashboard?
- What is the purpose of the DHT11 sensor?
- How does Auto Mode work?
- How does Manual Mode work?
- What hardware components are used?
- How is the web dashboard connected to the ESP32?
- How does the system monitor temperature and humidity?

> **Note:** Aero AI is an informational assistant designed to explain the project and its features. It does **not** directly control devices or execute hardware commands.

---

# 🛠 Hardware Components

| Component | Quantity |
|-----------|----------|
| ESP32 Dev Board | 1 |
| DHT11 Temperature & Humidity Sensor | 1 |
| 28BYJ-48 Stepper Motor | 1 |
| ULN2003 Driver Module | 1 |
| Red LED | 1 |
| Green LED | 1 |
| Blue LED | 1 |
| 220Ω Resistors | 3 |
| Breadboard | 1 |
| Jumper Wires | As Required |

---

# 💻 Software & Technologies

- Arduino IDE
- HTML5
- CSS3
- JavaScript (ES6)
- ESP32 Arduino Core
- REST API
- VS Code
- Git
- GitHub

---

# 📂 Project Structure


## 📂 Project Structure

```text
Home-Automation/
│
├── index.html
├── README.md
├── esp32code.txt
│
├── css/
│   ├── style.css
│   └── ai-assistant.css
│
├── js/
│   ├── script.js
│   └── ai-assistant.js
│
└── diagram/
    └── diagram_pic.png
```
---

# 🏗️ System Architecture


                    User
                      │
                      ▼
          Web Dashboard (HTML/CSS/JS)
                      │
          HTTP REST API Requests
                      │
                      ▼
            ESP32 HTTP Web Server
        ┌───────────┼────────────┐
        ▼           ▼            ▼
    RGB LEDs   Stepper Motor   DHT11
        │           │            │
        └───────────┼────────────┘
                    │
          Reads Device & Sensor Data
                    │
            JSON Response (/status)
                    │
                    ▼
        Dashboard Updates in Real Time
```
     ┌───────────────────────────────────────────────┐
     │ • LED Status (ON/OFF)                         │
     │ • Fan Status                                  │
     │ • Temperature                                │
     │ • Humidity                                   │
     │ • Auto / Manual Mode                         │
     │ • Wi-Fi Signal (RSSI)                        │
     │ • ESP32 IP Address                           │
     └───────────────────────────────────────────────┘
```

---

# ⚙️ Working Principle

1. The ESP32 connects to the local Wi-Fi network.
2. The ESP32 starts an HTTP Web Server.
3. The web dashboard sends HTTP GET requests to the ESP32 using REST API endpoints.
4. The ESP32 processes each request and controls the connected hardware.
5. The DHT11 sensor continuously measures temperature and humidity.
6. The ESP32 sends the latest sensor readings and device status as JSON responses.
7. The dashboard automatically updates to display LED status, fan status, temperature, humidity, Wi-Fi information, and operating mode.
8. In **Auto Mode**, the fan operates automatically based on predefined temperature and humidity thresholds.
9. In **Manual Mode**, users can directly control the fan from the dashboard.

---

# 🌐 REST API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/status` | GET | Returns complete system status |
| `/sensor` | GET | Returns temperature and humidity |
| `/red/on` | GET | Turn ON Red LED |
| `/red/off` | GET | Turn OFF Red LED |
| `/green/on` | GET | Turn ON Green LED |
| `/green/off` | GET | Turn OFF Green LED |
| `/blue/on` | GET | Turn ON Blue LED |
| `/blue/off` | GET | Turn OFF Blue LED |
| `/fan/on` | GET | Turn ON Fan |
| `/fan/off` | GET | Turn OFF Fan |
| `/mode/auto` | GET | Enable Auto Mode |
| `/mode/manual` | GET | Enable Manual Mode |

---

# 🚀 Getting Started

## Clone the Repository

```bash
git clone https://github.com/biswajitbiswal-in/Home-Automation.git
```

## Upload ESP32 Code

1. Open Arduino IDE.
2. Install the ESP32 Board Package.
3. Install the required Arduino libraries.
4. Update your Wi-Fi credentials.
5. Upload the code to the ESP32.

## Run the Website

Open **index.html** in your browser or use the **Live Server** extension in Visual Studio Code.

---

# 📚 Required Arduino Libraries

- WiFi.h
- WebServer.h
- DHT.h
- Adafruit_Sensor.h
- AccelStepper.h

---

# 📷 Project Images

## Dashboard

## 📷 Dashboard

<p align="center">
  <img src="diagram/dashboard.png" width="900">
</p>

## Circuit Diagram


<p align="center">
  <img src="diagram/diagram_pic.png" width="700">
</p>

## Hardware Setup
<p align="center">
  <img src="diagram/hardware.png" width="600">
</p>

> Add a photo of your hardware setup here.

---

# 🔮 Future Enhancements

- 🤖 AI Assistant Integration
- 🎙️ Voice Command Support
- ☁️ Cloud Database Integration
- 📊 Data Logging
- 📱 Android Application
- 🌍 Remote Internet Access
- 🔔 Smart Notifications
- 📈 Energy Consumption Monitoring
- 🔐 User Authentication

---

---

# 👨‍💻 Author

**Biswajit Biswal**  
🎓 Bachelor of Technology (B.Tech)  
💻 Department of Computer Science & Engineering (CSE)  
🏛️ Gandhi Institute for Technology (GIFT), Bhubaneswar, Odisha, India  
📍 Internship Project at National Institute of Technology (NIT), Rourkela

---

# 📄 License

This project is developed for educational and learning purposes.

---

# ⭐ Support

If you found this project useful, please consider giving it a ⭐ on GitHub.
