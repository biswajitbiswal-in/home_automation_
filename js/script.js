/* =====================================================================
   HOME AUTOMATION SYSTEM — CONTROL PANEL SCRIPT (Phase 2: UI only)
   ---------------------------------------------------------------------
   Everything here is FRONT-END SIMULATION. No network requests are made
   to the ESP32 yet. Every place a real device call will eventually go
   is marked "PHASE 3 HOOK" and isolated in its own function so it can
   be swapped for a real fetch() call later without touching UI logic.
   ===================================================================== */

document.addEventListener("DOMContentLoaded", () => {

  /* ===================================================================
     0. ELEMENT REFERENCES
     =================================================================== */
  const el = {
    currentDate: document.getElementById("currentDate"),
    currentTime: document.getElementById("currentTime"),
    menuToggle: document.getElementById("menuToggle"),
    topNav: document.getElementById("topNav"),
    navLinks: Array.from(document.querySelectorAll(".top-nav__link")),
    themeToggle: document.getElementById("themeToggle"),
    copyCodeBtn: document.getElementById("copyCodeBtn"),
    espCodeBlock: document.getElementById("espCodeBlock"),

    chipConnValue: document.getElementById("chipConnValue"),
    chipTemp: document.getElementById("chipTemp"),
    chipHumidity: document.getElementById("chipHumidity"),
    chipDevices: document.getElementById("chipDevices"),

    tempGaugeFill: document.getElementById("tempGaugeFill"),
    humidityGaugeFill: document.getElementById("humidityGaugeFill"),
    tempValue: document.getElementById("tempValue"),
    humidityValue: document.getElementById("humidityValue"),
    trendSvg: document.getElementById("trendSvg"),

    ledOrb: document.getElementById("ledOrb"),
    colorValue: document.getElementById("colorValue"),
    ledStateLabel: document.getElementById("ledStateLabel"),
    ledOnBtn: document.getElementById("ledOnBtn"),
    ledOffBtn: document.getElementById("ledOffBtn"),
    redToggleBtn: document.getElementById("redToggleBtn"),
    greenToggleBtn: document.getElementById("greenToggleBtn"),
    blueToggleBtn: document.getElementById("blueToggleBtn"),
    brightnessSlider: document.getElementById("brightnessSlider"),
    brightnessValue: document.getElementById("brightnessValue"),

    fanSvg: document.getElementById("fanSvg"),
    fanBlades: document.getElementById("fanBlades"),
    fanStatus: document.getElementById("fanStatus"),
    fanSpeedSlider: document.getElementById("fanSpeedSlider"),
    fanSpeedValue: document.getElementById("fanSpeedValue"),
    fanOnBtn: document.getElementById("fanOnBtn"),
    fanOffBtn: document.getElementById("fanOffBtn"),

    micBtn: document.getElementById("micBtn"),
    startListeningBtn: document.getElementById("startListeningBtn"),
    voiceStatusText: document.getElementById("voiceStatusText"),
    recognizedText: document.getElementById("recognizedText"),

    logList: document.getElementById("logList"),
    logEmptyState: document.getElementById("logEmptyState"),
    clearLogBtn: document.getElementById("clearLogBtn"),
  };

  /* ===================================================================
     1. HEADER — LIVE DATE & TIME + NAVIGATION
     =================================================================== */
  function updateDateTime() {
    const now = new Date();
    const dateFormatter = new Intl.DateTimeFormat("en-US", {
      weekday: "short", day: "2-digit", month: "short", year: "numeric",
    });
    el.currentDate.textContent = dateFormatter.format(now);
    el.currentTime.textContent = now.toLocaleTimeString("en-US", { hour12: true });
  }
  updateDateTime();
  setInterval(updateDateTime, 1000);

  function toggleMenu(forceClose = false) {
    const shouldOpen = forceClose ? false : !document.body.classList.contains("nav-open");
    document.body.classList.toggle("nav-open", shouldOpen);
    el.menuToggle?.setAttribute("aria-expanded", String(shouldOpen));
  }

  el.menuToggle?.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleMenu();
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".header__actions") && document.body.classList.contains("nav-open")) {
      toggleMenu(true);
    }
  });

  function setActiveNavLink(activeLink) {
    el.navLinks.forEach((item) => item.classList.remove("active"));
    activeLink.classList.add("active");
  }

  el.navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      const targetSection = document.querySelector(targetId);
      if (targetSection) {
        event.preventDefault();
        targetSection.scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveNavLink(link);
      }
      if (window.innerWidth <= 768) toggleMenu(true);
    });
  });

  const sections = Array.from(document.querySelectorAll(".page-section"));
  if (sections.length > 0 && "IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visibleEntry) {
        const matchingLink = el.navLinks.find((link) => link.getAttribute("href") === `#${visibleEntry.target.id}`);
        if (matchingLink) setActiveNavLink(matchingLink);
      }
    }, { threshold: [0.2, 0.5, 0.8] });

    sections.forEach((section) => sectionObserver.observe(section));
  }

  const storedTheme = localStorage.getItem("homeAutomationTheme") || "dark";
  if (storedTheme === "bright") document.body.classList.add("bright-theme");

  el.themeToggle?.addEventListener("click", () => {
    document.body.classList.toggle("bright-theme");
    const isBright = document.body.classList.contains("bright-theme");
    localStorage.setItem("homeAutomationTheme", isBright ? "bright" : "dark");
    el.themeToggle.innerHTML = isBright
      ? '<i class="fa-solid fa-moon"></i><span>Dark</span>'
      : '<i class="fa-solid fa-sun"></i><span>Bright</span>';
  });

  if (el.themeToggle) {
    const isBright = document.body.classList.contains("bright-theme");
    el.themeToggle.innerHTML = isBright
      ? '<i class="fa-solid fa-moon"></i><span>Dark</span>'
      : '<i class="fa-solid fa-sun"></i><span>Bright</span>';
  }

  document.querySelectorAll(".detail-item").forEach((button) => {
    button.addEventListener("click", () => {
      const isOpen = button.classList.contains("is-open");
      document.querySelectorAll(".detail-item").forEach((item) => item.classList.remove("is-open"));
      if (!isOpen) button.classList.add("is-open");
    });
  });

  if (el.copyCodeBtn && el.espCodeBlock) {
    el.copyCodeBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(el.espCodeBlock.textContent);
        const originalLabel = el.copyCodeBtn.innerHTML;
        el.copyCodeBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied';
        window.setTimeout(() => { el.copyCodeBtn.innerHTML = originalLabel; }, 1200);
      } catch (error) {
        el.copyCodeBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Failed';
      }
    });
  }

  /* ===================================================================
     2. ACTIVITY LOG
     =================================================================== */
  const MAX_LOG_ENTRIES = 25;
  const logEntries = [];

  function addLogEntry(text, iconClass = "fa-solid fa-circle-info") {
    logEntries.unshift({ text, iconClass, time: new Date().toLocaleTimeString("en-US", { hour12: true }) });
    if (logEntries.length > MAX_LOG_ENTRIES) logEntries.length = MAX_LOG_ENTRIES;
    renderLog();
  }

  function renderLog() {
    el.logList.innerHTML = "";
    if (logEntries.length === 0) {
      el.logList.appendChild(el.logEmptyState);
      return;
    }
    logEntries.forEach((entry) => {
      const li = document.createElement("li");
      li.className = "log-item";
      li.innerHTML = `
        <span class="log-item__icon"><i class="${entry.iconClass}"></i></span>
        <span class="log-item__text">${entry.text}</span>
        <span class="log-item__time">${entry.time}</span>
      `;
      el.logList.appendChild(li);
    });
  }

  el.clearLogBtn.addEventListener("click", () => {
    logEntries.length = 0;
    renderLog();
  });

  addLogEntry("Dashboard initialised", "fa-solid fa-power-off");

  /* ===================================================================
     3. DEVICE CONNECTION HANDSHAKE (dummy)
     PHASE 3 HOOK: replace with a real GET to /status.
     =================================================================== */
  let devicesActive = 0;
  function updateDeviceCount(delta) {
    devicesActive = Math.max(0, Math.min(3, devicesActive + delta));
    el.chipDevices.textContent = `${devicesActive} / 3`;
  }

  function setConnectionStatus(status, isConnected) {
    el.chipConnValue.textContent = status;
    el.chipConnValue.style.color = isConnected ? "var(--success)" : "var(--danger)";
  }

  async function checkConnection() {
    setConnectionStatus("Connecting…", false);

    const statusUrls = [`${ESP32_IP}/status`, "/status"];

    for (const url of statusUrls) {
      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 1500);
        const response = await fetch(url, { cache: "no-store", signal: controller.signal });
        window.clearTimeout(timeout);

        if (response.ok) {
          setConnectionStatus("Online", true);
          addLogEntry("ESP32 connected to dashboard", "fa-solid fa-satellite-dish");
          return;
        }
      } catch (error) {
        // Try the next candidate if the board is not reachable.
      }
    }

    setConnectionStatus("Offline", false);
    addLogEntry("ESP32 status check failed", "fa-solid fa-triangle-exclamation");
  }

  checkConnection();
  window.setInterval(checkConnection, 15000);

  /* ===================================================================
     4. CLIMATE / DHT11 GAUGE CLUSTER
     Simulated live readings for the UI preview. Swap generateReading()
     for real polled values from the ESP32 /status endpoint in Phase 3.
     =================================================================== */
  const GAUGE_CIRCUMFERENCE = 540.35; // 2 * PI * r(86), matches CSS
  const TEMP_RANGE = { min: 0, max: 50 };
  const HUMIDITY_RANGE = { min: 0, max: 100 };
  const HISTORY_LENGTH = 30;

  const climate = {
    temp: 27.5,
    humidity: 58,
    tempHistory: [],
    humidityHistory: [],
  };

  async function refreshClimateFromEsp32() {
    const statusUrls = [`${ESP32_IP}/status`, "/status"];

    for (const url of statusUrls) {
      try {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 1500);
        const response = await fetch(url, { cache: "no-store", signal: controller.signal });
        window.clearTimeout(timeout);

        if (!response.ok) continue;

        const data = await response.json();
        if (typeof data.temperature === "number") {
          climate.temp = data.temperature;
        }
        if (typeof data.humidity === "number") {
          climate.humidity = data.humidity;
        }

        pushHistory(climate.tempHistory, climate.temp);
        pushHistory(climate.humidityHistory, climate.humidity);
        refreshClimateUI();
        return;
      } catch (error) {
        // Fall back to the local simulator if the ESP32 is unreachable.
      }
    }

    simulateReading();
  }

  function setGauge(fillEl, value, range) {
    const clamped = Math.max(range.min, Math.min(range.max, value));
    const ratio = (clamped - range.min) / (range.max - range.min);
    const offset = GAUGE_CIRCUMFERENCE * (1 - ratio);
    fillEl.style.strokeDashoffset = offset;
  }

  function drawTrend() {
    const w = 300, h = 100, pad = 6;
    const points = (arr, range) => arr.map((v, i) => {
      const x = pad + (i / (HISTORY_LENGTH - 1)) * (w - pad * 2);
      const ratio = (v - range.min) / (range.max - range.min);
      const y = h - pad - ratio * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");

    const tempPoly = points(climate.tempHistory, { min: 15, max: 40 });
    const humidityPoly = points(climate.humidityHistory, { min: 20, max: 90 });

    el.trendSvg.innerHTML = `
      <polyline points="${tempPoly}" fill="none" stroke="#ffb020" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" opacity="0.9" />
      <polyline points="${humidityPoly}" fill="none" stroke="#2dd4bf" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" opacity="0.9" />
    `;
  }

  function pushHistory(arr, value) {
    arr.push(value);
    if (arr.length > HISTORY_LENGTH) arr.shift();
  }

  function refreshClimateUI() {
    el.tempValue.textContent = climate.temp.toFixed(1);
    el.humidityValue.textContent = Math.round(climate.humidity);
    el.chipTemp.innerHTML = `${climate.temp.toFixed(1)} &deg;C`;
    el.chipHumidity.textContent = `${Math.round(climate.humidity)} %`;
    setGauge(el.tempGaugeFill, climate.temp, TEMP_RANGE);
    setGauge(el.humidityGaugeFill, climate.humidity, HUMIDITY_RANGE);
    drawTrend();
  }

  function simulateReading() {
    climate.temp += (Math.random() - 0.5) * 0.8;
    climate.temp = Math.max(18, Math.min(38, climate.temp));
    climate.humidity += (Math.random() - 0.5) * 2.5;
    climate.humidity = Math.max(25, Math.min(85, climate.humidity));

    pushHistory(climate.tempHistory, climate.temp);
    pushHistory(climate.humidityHistory, climate.humidity);
    refreshClimateUI();
  }

  // Seed history so the sparkline isn't empty on first paint.
  for (let i = 0; i < HISTORY_LENGTH; i++) {
    pushHistory(climate.tempHistory, climate.temp + (Math.random() - 0.5) * 2);
    pushHistory(climate.humidityHistory, climate.humidity + (Math.random() - 0.5) * 4);
  }
  refreshClimateUI();
  refreshClimateFromEsp32();
  setInterval(refreshClimateFromEsp32, 4000);

  /* ===================================================================
     5. RGB LED CONTROL CARD
     =================================================================== */
  const led = {
    red: false,
    green: false,
    blue: false,
    brightness: 80,
  };

  function currentLedColor() {
    const r = led.red ? 255 : 20;
    const g = led.green ? 255 : 20;
    const b = led.blue ? 255 : 20;
    return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
  }

  function refreshLedUI() {
    const isOn = led.red || led.green || led.blue;
    const color = currentLedColor();
    el.ledOrb.style.setProperty("--led-color", color);
    el.ledOrb.style.filter = `brightness(${0.5 + led.brightness / 100})`;
    el.ledOrb.classList.toggle("is-on", isOn);
    el.colorValue.textContent = color.toUpperCase();
    el.ledStateLabel.textContent = isOn ? "LED is ON" : "LED is OFF";

    el.redToggleBtn.dataset.on = String(led.red);
    el.greenToggleBtn.dataset.on = String(led.green);
    el.blueToggleBtn.dataset.on = String(led.blue);

    updateDeviceCount(0); // keep in sync, recompute below
    el.chipDevices.textContent = `${(isOn ? 1 : 0) + (fan.isOn ? 1 : 0) + 1} / 3`;
  }

  function sendLedCommandStub(channel) {
    const targets = channel === "all" ? ["red", "green", "blue"] : [channel];
    targets.forEach((c) => {
      fetch(`${ESP32_IP}/${c}/${led[c] ? "on" : "off"}`).catch(() => {
        /* board offline — UI state remains authoritative */
      });
    });

    if (channel === "brightness") {
      fetch(`${ESP32_IP}/brightness/${led.brightness}`).catch(() => {
        /* board offline — UI state remains authoritative */
      });
    }
  }

  function toggleChannel(channel, iconClass) {
    led[channel] = !led[channel];
    refreshLedUI();
    sendLedCommandStub(channel);
    addLogEntry(`${channel[0].toUpperCase() + channel.slice(1)} LED turned ${led[channel] ? "ON" : "OFF"}`, iconClass);
  }

  window.toggleRed = () => toggleChannel("red", "fa-solid fa-circle");
  window.toggleGreen = () => toggleChannel("green", "fa-solid fa-circle");
  window.toggleBlue = () => toggleChannel("blue", "fa-solid fa-circle");

  el.redToggleBtn.addEventListener("click", () => window.toggleRed());
  el.greenToggleBtn.addEventListener("click", () => window.toggleGreen());
  el.blueToggleBtn.addEventListener("click", () => window.toggleBlue());

  window.ledOn = () => {
    led.red = led.green = led.blue = true;
    refreshLedUI();
    sendLedCommandStub("all");
    addLogEntry("All LED channels turned ON", "fa-solid fa-lightbulb");
  };

  window.ledOff = () => {
    led.red = led.green = led.blue = false;
    refreshLedUI();
    sendLedCommandStub("all");
    addLogEntry("All LED channels turned OFF", "fa-solid fa-lightbulb");
  };

  el.ledOnBtn.addEventListener("click", () => window.ledOn());
  el.ledOffBtn.addEventListener("click", () => window.ledOff());

  el.brightnessSlider.addEventListener("input", (e) => {
    led.brightness = Number(e.target.value);
    el.brightnessValue.textContent = `${led.brightness}%`;
    refreshLedUI();
  });
  el.brightnessSlider.addEventListener("change", (e) => {
    sendLedCommandStub("brightness");
    addLogEntry(`Brightness set to ${e.target.value}%`, "fa-solid fa-sun");
  });

  /* ===================================================================
     6. FAN / VENTILATION CARD (stepper motor via ULN2003)
     =================================================================== */
  const fan = { isOn: false, speed: 0 };

  function refreshFanUI() {
    el.fanSpeedValue.textContent = `${fan.speed}%`;
    el.fanStatus.textContent = fan.isOn ? "Running" : "Idle";
    el.fanBlades.classList.toggle("is-spinning", fan.isOn && fan.speed > 0);
    if (fan.isOn && fan.speed > 0) {
      // Map 0–100% speed to a 3s (slow) – 0.4s (fast) rotation duration.
      const duration = 3 - (fan.speed / 100) * 2.6;
      el.fanBlades.style.animationDuration = `${duration.toFixed(2)}s`;
    }
    el.chipDevices.textContent = `${(led.red || led.green || led.blue ? 1 : 0) + (fan.isOn ? 1 : 0) + 1} / 3`;
  }

  function sendFanCommandStub() {
    fetch(`${ESP32_IP}/fan/${fan.isOn ? "on" : "off"}`).catch(() => {
      /* board offline — UI state remains authoritative */
    });

    if (fan.speed > 0) {
      fetch(`${ESP32_IP}/speed/${fan.speed}`).catch(() => {
        /* board offline — UI state remains authoritative */
      });
    }
  }

  window.fanOn = () => {
    fan.isOn = true;
    if (fan.speed === 0) {
      fan.speed = 60;
      el.fanSpeedSlider.value = 60;
    }
    refreshFanUI();
    sendFanCommandStub();
    addLogEntry("Fan turned ON", "fa-solid fa-fan");
  };

  window.fanOff = () => {
    fan.isOn = false;
    refreshFanUI();
    sendFanCommandStub();
    addLogEntry("Fan turned OFF", "fa-solid fa-fan");
  };

  el.fanOnBtn.addEventListener("click", () => window.fanOn());
  el.fanOffBtn.addEventListener("click", () => window.fanOff());

  el.fanSpeedSlider.addEventListener("input", (e) => {
    fan.speed = Number(e.target.value);
    fan.isOn = fan.speed > 0;
    refreshFanUI();
  });
  el.fanSpeedSlider.addEventListener("change", () => {
    sendFanCommandStub();
    addLogEntry(`Fan speed set to ${fan.speed}%`, "fa-solid fa-gauge-high");
  });

  refreshLedUI();
  refreshFanUI();

  /* ===================================================================
     7. VOICE CONTROL CARD (Web Speech API)
     =================================================================== */
  const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognizer = null;
  let isListening = false;
  let autoListeningEnabled = true;
  let autoStartAttempted = false;
  let autoStartTimer = null;
  let wakeWordActive = false;
  let voiceActivated = false;

  function setListeningUI(active) {
    isListening = active;
    el.micBtn.classList.toggle("is-listening", active);
    el.voiceStatusText.classList.toggle("is-active", active);
    el.voiceStatusText.innerHTML = active
      ? '<span class="status-dot"></span>Listening…'
      : '<span class="status-dot"></span>Not Listening';
    el.startListeningBtn.innerHTML = active
      ? '<i class="fa-solid fa-stop"></i> Stop Listening'
      : '<i class="fa-solid fa-microphone-lines"></i> Start Listening';
  }

  function startListening() {
    if (!recognizer || isListening || !autoListeningEnabled) return;

    try {
      recognizer.start();
      voiceActivated = true;
    } catch (error) {
      addLogEntry("Voice recognition could not be started", "fa-solid fa-triangle-exclamation");
    }
  }

  async function requestMicPermissionAndStart() {
    if (!recognizer || autoStartAttempted || !autoListeningEnabled) return;
    autoStartAttempted = true;

    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch (error) {
      addLogEntry("Microphone permission was not granted", "fa-solid fa-microphone-slash");
    }

    window.setTimeout(() => {
      if (!isListening) startListening();
    }, 400);
  }

  function stopListening() {
    if (!recognizer || !isListening) return;
    recognizer.stop();
  }

  function restartListening() {
    if (!autoListeningEnabled || !recognizer) return;
    window.setTimeout(() => {
      if (!isListening) startListening();
    }, 650);
  }

  function normalizeVoiceText(text) {
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  }

  function containsWakePhrase(text) {
    const normalized = normalizeVoiceText(text);
    return /(hey|hi|hello|okay)\s*(home|hume|hum)\b/.test(normalized) || /\bhome\b/.test(normalized) && /(hey|hi|hello|okay)/.test(normalized);
  }

  function getCommandAfterWakeWord(text) {
    const normalized = normalizeVoiceText(text);
    const match = normalized.match(/(?:hey|hi|hello|okay)\s*(?:home|hume|hum)\s*(.*)/i);
    return match ? match[1].trim() : normalized;
  }

  function looksLikeCommand(text) {
    const normalized = normalizeVoiceText(text);
    return /(turn|switch|light|lights|fan|red|green|blue|brightness|dim|bright|on|off)/i.test(normalized) && !/^(hey|hello|hi|okay)\s*(home|hume|hum)$/i.test(normalized);
  }

  // PHASE 3 HOOK: each branch below will call the matching ESP32 API,
  // e.g. fetch('/red/on'), fetch('/fan/off'), instead of clicking
  // the on-screen buttons.
  function handleVoiceCommand(transcript) {
    const command = transcript.toLowerCase();
    let matched = true;

    const lightTerms = /(light|lights|lamp|bulb|led)/i;
    const turnOnPhrase = /(turn|switch)\s+(on|enable)/i;
    const turnOffPhrase = /(turn|switch)\s+(off|disable)/i;

    if (command.includes("red") && command.includes("on")) {
      if (el.redToggleBtn.dataset.on !== "true") window.toggleRed();
    } else if (command.includes("red") && command.includes("off")) {
      if (el.redToggleBtn.dataset.on === "true") window.toggleRed();
    } else if (command.includes("green") && command.includes("on")) {
      if (el.greenToggleBtn.dataset.on !== "true") window.toggleGreen();
    } else if (command.includes("green") && command.includes("off")) {
      if (el.greenToggleBtn.dataset.on === "true") window.toggleGreen();
    } else if (command.includes("blue") && command.includes("on")) {
      if (el.blueToggleBtn.dataset.on !== "true") window.toggleBlue();
    } else if (command.includes("blue") && command.includes("off")) {
      if (el.blueToggleBtn.dataset.on === "true") window.toggleBlue();
    } else if ((command.includes("all") || command.includes("every")) && (command.includes("light") || command.includes("lights")) && command.includes("on")) {
      window.ledOn();
    } else if ((command.includes("all") || command.includes("every")) && (command.includes("light") || command.includes("lights")) && command.includes("off")) {
      window.ledOff();
    } else if ((command.includes("fan") || command.includes("ventilation")) && command.includes("on")) {
      window.fanOn();
    } else if ((command.includes("fan") || command.includes("ventilation")) && command.includes("off")) {
      window.fanOff();
    } else if (
      (lightTerms.test(command) && (command.includes("on") || turnOnPhrase.test(command))) ||
      (command.includes("turn on") && (command.includes("this") || command.includes("that") || lightTerms.test(command)))
    ) {
      window.ledOn();
    } else if (
      (lightTerms.test(command) && (command.includes("off") || turnOffPhrase.test(command))) ||
      (command.includes("turn off") && (command.includes("this") || command.includes("that") || lightTerms.test(command)))
    ) {
      window.ledOff();
    } else if (command.includes("all") && command.includes("on")) {
      window.ledOn();
    } else if (command.includes("all") && command.includes("off")) {
      window.ledOff();
    } else {
      matched = false;
    }

    addLogEntry(
      matched ? `Voice command executed: "${transcript}"` : `Voice command not recognised: "${transcript}"`,
      matched ? "fa-solid fa-waveform-lines" : "fa-solid fa-circle-question"
    );
  }

  const isSecureForVoice = window.isSecureContext || location.hostname === "localhost" || location.hostname === "127.0.0.1";

  if (!SpeechRecognitionAPI) {
    el.micBtn.disabled = true;
    el.startListeningBtn.disabled = true;
    el.recognizedText.placeholder = "Voice recognition isn't supported in this browser. Try Chrome or Edge.";
  } else if (!isSecureForVoice) {
    el.micBtn.disabled = true;
    el.startListeningBtn.disabled = true;
    el.recognizedText.placeholder = "Open this page via localhost or HTTPS for voice commands.";
    addLogEntry("Voice commands need a secure connection", "fa-solid fa-triangle-exclamation");
  } else {
    recognizer = new SpeechRecognitionAPI();
    recognizer.lang = "en-US";
    recognizer.continuous = false;
    recognizer.interimResults = false;
    recognizer.maxAlternatives = 3;

    recognizer.addEventListener("start", () => {
      setListeningUI(true);
      el.recognizedText.value = "";
    });

    recognizer.addEventListener("result", (event) => {
      const resultIndex = event.resultIndex ?? event.results.length - 1;
      const finalResult = event.results[resultIndex];
      const spokenText = finalResult?.[0]?.transcript?.trim() || "";
      el.recognizedText.value = spokenText;

      if (!finalResult?.isFinal) return;

      if (!spokenText) {
        restartListening();
        return;
      }

      const normalized = normalizeVoiceText(spokenText);

      if (containsWakePhrase(normalized)) {
        wakeWordActive = true;
        const commandText = getCommandAfterWakeWord(normalized);
        if (commandText && commandText !== "home" && commandText.length > 1) {
          handleVoiceCommand(commandText);
          wakeWordActive = false;
        } else {
          addLogEntry("Wake word detected — waiting for your command", "fa-solid fa-bullhorn");
          el.recognizedText.value = "Wake word detected";
        }
      } else if (wakeWordActive) {
        handleVoiceCommand(spokenText);
        wakeWordActive = false;
      } else if (looksLikeCommand(normalized)) {
        handleVoiceCommand(spokenText);
      } else {
        addLogEntry(`Voice command not recognised: "${spokenText}"`, "fa-solid fa-circle-question");
      }

      restartListening();
    });

    recognizer.addEventListener("end", () => {
      setListeningUI(false);
      if (autoListeningEnabled) restartListening();
    });
    recognizer.addEventListener("error", (event) => {
      setListeningUI(false);
      addLogEntry(`Voice recognition error: ${event.error}`, "fa-solid fa-triangle-exclamation");
      if (autoListeningEnabled && event.error !== "not-allowed") restartListening();
    });

    function toggleListening() {
      if (isListening) stopListening();
      else startListening();
    }

    const activateVoice = () => {
      if (voiceActivated) return;
      autoListeningEnabled = true;
      if (autoStartTimer) window.clearTimeout(autoStartTimer);
      autoStartTimer = window.setTimeout(() => requestMicPermissionAndStart(), 300);
    };

    window.addEventListener("load", activateVoice, { once: true });
    document.addEventListener("pointerdown", activateVoice, { once: true });
    document.addEventListener("keydown", activateVoice, { once: true });

    el.micBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      activateVoice();
      if (isListening) stopListening();
      else startListening();
    });
    el.startListeningBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      activateVoice();
      if (isListening) stopListening();
      else startListening();
    });
  }

});
const ESP32_IP = (window.ESP32_IP || "http://10.98.183.133").replace(/\/$/, "");

function copyCode() {
  const code = document.getElementById("espCodeBlock")?.textContent || "";
  navigator.clipboard?.writeText(code);
}

function toggleRed() {
    const btn = document.getElementById("redToggleBtn");
    const isOn = btn.dataset.on === "true";

    if (isOn) {
        fetch(`${ESP32_IP}/red/off`);
        btn.dataset.on = "false";
        btn.classList.remove("active");
    } else {
        fetch(`${ESP32_IP}/red/on`);
        btn.dataset.on = "true";
        btn.classList.add("active");
    }
}

function toggleGreen() {
    const btn = document.getElementById("greenToggleBtn");
    const isOn = btn.dataset.on === "true";

    if (isOn) {
        fetch(`${ESP32_IP}/green/off`);
        btn.dataset.on = "false";
        btn.classList.remove("active");
    } else {
        fetch(`${ESP32_IP}/green/on`);
        btn.dataset.on = "true";
        btn.classList.add("active");
    }
}

function toggleBlue() {
    const btn = document.getElementById("blueToggleBtn");
    const isOn = btn.dataset.on === "true";

    if (isOn) {
        fetch(`${ESP32_IP}/blue/off`);
        btn.dataset.on = "false";
        btn.classList.remove("active");
    } else {
        fetch(`${ESP32_IP}/blue/on`);
        btn.dataset.on = "true";
        btn.classList.add("active");
    }
}
