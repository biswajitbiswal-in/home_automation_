/* ===================================================================
   SMART HOME AI ASSISTANT — PREMIUM INTERACTION SCRIPT
   Offline/local response mode (no external API calls).
   =================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const floatBtn = document.getElementById("aiFloatBtn");
  const chatWindow = document.getElementById("aiChatWindow");
  const closeBtn = document.getElementById("aiCloseBtn");
  const minimizeBtn = document.getElementById("aiMinimizeBtn");
  const maximizeBtn = document.getElementById("aiMaximizeBtn");
  const chatBody = document.getElementById("aiChatBody");
  const chatInput = document.getElementById("aiChatInput");
  const sendBtn = document.getElementById("aiSendBtn");

  // Mic and Attachment Buttons (UI only with feedback)
  const micBtn = document.getElementById("aiMicBtn");
  const attachBtn = document.getElementById("aiAttachBtn");

  let isThinking = false;

  // Toggle Chat Window
  if (floatBtn && chatWindow) {
    floatBtn.addEventListener("click", () => {
      chatWindow.classList.add("is-open");
      chatInput.focus();
      scrollToBottom();
    });
  }

  if (closeBtn && chatWindow) {
    closeBtn.addEventListener("click", () => {
      chatWindow.classList.remove("is-open");
    });
  }

  // Minimize Window (Toggle collapsed state)
  if (minimizeBtn && chatWindow) {
    minimizeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      chatWindow.classList.toggle("is-minimized");
      const icon = minimizeBtn.querySelector("i");
      if (chatWindow.classList.contains("is-minimized")) {
        icon.className = "fa-solid fa-window-restore";
        minimizeBtn.title = "Restore";
      } else {
        icon.className = "fa-solid fa-minus";
        minimizeBtn.title = "Minimize";
        scrollToBottom();
      }
    });
  }

  // Maximize Window (Toggle size expand)
  if (maximizeBtn && chatWindow) {
    maximizeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (chatWindow.classList.contains("is-minimized")) {
        chatWindow.classList.remove("is-minimized");
        const minIcon = minimizeBtn.querySelector("i");
        minIcon.className = "fa-solid fa-minus";
        minimizeBtn.title = "Minimize";
      }
      chatWindow.classList.toggle("is-maximized");
      const icon = maximizeBtn.querySelector("i");
      if (chatWindow.classList.contains("is-maximized")) {
        icon.className = "fa-solid fa-compress";
        maximizeBtn.title = "Restore Size";
      } else {
        icon.className = "fa-solid fa-expand";
        maximizeBtn.title = "Maximize";
      }
      scrollToBottom();
    });
  }

  // Suggested Questions click handlers
  document.querySelectorAll(".ai-suggestion-card").forEach(card => {
    card.addEventListener("click", () => {
      const text = card.dataset.question || card.textContent.trim();
      handleUserSubmit(text);
    });
  });

  // Attach Mic & Attachment handlers for clean visual feedback
  if (micBtn) {
    micBtn.addEventListener("click", () => {
      showToast("Voice transcription is simulated in UI mode.");
    });
  }

  if (attachBtn) {
    attachBtn.addEventListener("click", () => {
      showToast("File attachment is simulated in UI mode.");
    });
  }

  // Send message on click
  if (sendBtn) {
    sendBtn.addEventListener("click", () => {
      const text = chatInput.value.trim();
      if (text) {
        handleUserSubmit(text);
        chatInput.value = "";
      }
    });
  }

  // Send message on Enter key (without Shift)
  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const text = chatInput.value.trim();
        if (text) {
          handleUserSubmit(text);
          chatInput.value = "";
        }
      }
    });
  }

  // Main Submit Handler
  function handleUserSubmit(text) {
    if (isThinking) return;

    // Remove welcome screen if it exists
    const welcomeScreen = document.getElementById("aiWelcomeScreen");
    if (welcomeScreen) {
      welcomeScreen.style.display = "none";
    }

    // Append User Bubble
    appendMessage(text, "user");

    isThinking = true;
    showThinkingIndicator();

    // Simulate a short "thinking" delay, then reply with the local
    // mock responder so the widget feels alive without any network call.
    setTimeout(() => {
      hideThinkingIndicator();
      const response = getMockResponse(text);
      appendMessage(response, "assistant");
      isThinking = false;
    }, 600 + Math.random() * 500);
  }

  // Append Message to chat body. Returns the bubble element in case
  // callers want to reference it later.
  function appendMessage(text, sender) {
    const timeString = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });

    const msgRow = document.createElement("div");
    msgRow.className = `ai-message-row ai-message-row--${sender}`;

    if (sender === "assistant") {
      const avatar = document.createElement("div");
      avatar.className = "ai-msg-avatar";
      avatar.innerHTML = '<i class="fa-solid fa-robot"></i>';
      msgRow.appendChild(avatar);
    }

    const contentDiv = document.createElement("div");
    contentDiv.className = "ai-message-content";

    const bubble = document.createElement("div");
    bubble.className = "ai-message-bubble";
    bubble.innerHTML = formatMessageHTML(text);

    const timeSpan = document.createElement("span");
    timeSpan.className = "ai-message-time";
    timeSpan.textContent = timeString;

    contentDiv.appendChild(bubble);
    contentDiv.appendChild(timeSpan);
    msgRow.appendChild(contentDiv);

    chatBody.appendChild(msgRow);
    scrollToBottom();

    return bubble;
  }

  // Format code blocks or markdown-like styles in messages
  function formatMessageHTML(text) {
    let escaped = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    escaped = escaped.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    escaped = escaped.replace(/`(.*?)`/g, "<code>$1</code>");

    return escaped;
  }

  // Thinking State Management
  function showThinkingIndicator() {
    if (document.getElementById("aiThinkingIndicator")) return;

    const thinkingRow = document.createElement("div");
    thinkingRow.className = "ai-thinking-row";
    thinkingRow.id = "aiThinkingIndicator";

    const avatar = document.createElement("div");
    avatar.className = "ai-msg-avatar";
    avatar.innerHTML = '<i class="fa-solid fa-robot"></i>';

    const bubble = document.createElement("div");
    bubble.className = "ai-thinking-bubble";

    const dots = document.createElement("div");
    dots.className = "ai-thinking-dots";
    dots.innerHTML = "<span></span><span></span><span></span>";

    const text = document.createElement("div");
    text.className = "ai-thinking-text";
    text.textContent = "AERO AI Thinking";

    bubble.appendChild(dots);
    bubble.appendChild(text);
    thinkingRow.appendChild(avatar);
    thinkingRow.appendChild(bubble);

    chatBody.appendChild(thinkingRow);

    const headerAvatar = document.querySelector(".ai-chat-header .ai-avatar");
    if (headerAvatar) headerAvatar.classList.add("is-thinking");

    scrollToBottom();
  }

  function hideThinkingIndicator() {
    const indicator = document.getElementById("aiThinkingIndicator");
    if (indicator) {
      indicator.remove();
    }
    const headerAvatar = document.querySelector(".ai-chat-header .ai-avatar");
    if (headerAvatar) headerAvatar.classList.remove("is-thinking");
  }

  function scrollToBottom() {
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  // Display clean notification toast for attachment/mic simulation & errors
  function showToast(message) {
    const toast = document.createElement("div");
    toast.style.position = "fixed";
    toast.style.bottom = "110px";
    toast.style.right = "40px";
    toast.style.maxWidth = "320px";
    toast.style.background = "#171c1a";
    toast.style.border = "1px solid rgba(255, 176, 32, 0.4)";
    toast.style.color = "#edefea";
    toast.style.padding = "8px 16px";
    toast.style.borderRadius = "8px";
    toast.style.fontSize = "12px";
    toast.style.zIndex = "1005";
    toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.4)";
    toast.style.animation = "ai-fade-in 0.3s ease";
    toast.textContent = message;

    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // Clear Chat function exposed to header/footer spans
  window.clearAiChat = () => {
    chatBody.innerHTML = "";

    const welcome = document.createElement("div");
    welcome.className = "ai-welcome-container";
    welcome.id = "aiWelcomeScreen";
    welcome.innerHTML = `
      <div class="ai-welcome-avatar">
        <i class="fa-solid fa-robot"></i>
      </div>
      <h4>Hello 👋</h4>
      <div class="ai-welcome-text">
        <p>I'm your Smart Home AI Assistant.</p>
        <p>I can help you understand your Home Automation Project, explain components, analyze live sensor information, and answer technical questions.</p>
      </div>
      <span class="ai-suggestions-title">Suggested Questions</span>
      <div class="ai-suggestions-grid">
        <button class="ai-suggestion-card" type="button" data-question="Current Temperature">🌡 Temperature</button>
        <button class="ai-suggestion-card" type="button" data-question="Current Humidity">💧 Humidity</button>
        <button class="ai-suggestion-card" type="button" data-question="Wi-Fi Status">📶 Wi-Fi Status</button>
        <button class="ai-suggestion-card" type="button" data-question="System Health">⚙ System Health</button>
        <button class="ai-suggestion-card" type="button" data-question="Explain ESP32">📖 Explain ESP32</button>
        <button class="ai-suggestion-card" type="button" data-question="Explain DHT11">📘 Explain DHT11</button>
        <button class="ai-suggestion-card" type="button" data-question="Explain Circuit">🔌 Explain Circuit</button>
        <button class="ai-suggestion-card" type="button" data-question="Explain Project">🏠 Explain Project</button>
        <button class="ai-suggestion-card" type="button" data-question="Working Principle">🧠 Working Principle</button>
        <button class="ai-suggestion-card" type="button" data-question="Analyze Room">📊 Analyze Room</button>
        <button class="ai-suggestion-card" type="button" data-question="Recommendations">💡 Recommendations</button>
        <button class="ai-suggestion-card" type="button" data-question="Help">❓ Help</button>
      </div>
    `;
    chatBody.appendChild(welcome);

    welcome.querySelectorAll(".ai-suggestion-card").forEach(card => {
      card.addEventListener("click", () => {
        const text = card.dataset.question || card.textContent.trim();
        handleUserSubmit(text);
      });
    });
  };

  // -------------------------------------------------------------
  // LOCAL RESPONDER — generates answers from live dashboard state
  // -------------------------------------------------------------
  function getMockResponse(query) {
    const q = query.toLowerCase();

    const tempVal = document.getElementById("tempValue")?.textContent || "--";
    const humVal = document.getElementById("humidityValue")?.textContent || "--";
    const connVal = document.getElementById("chipConnValue")?.textContent || "Offline";
    const activeChipText = document.getElementById("chipDevices")?.textContent || "0 / 3";

    if (q.includes("temperature") || q.includes("temp")) {
      return `The current indoor climate temperature reads **${tempVal}°C**.\n\nThis climate reading is pulled directly from the **DHT11 Sensor** connected to **GPIO Pin 4** of your ESP32 controller board.`;
    }

    if (q.includes("humidity") || q.includes("humid")) {
      return `The current relative humidity in the room is **${humVal}%**.\n\nThis data is measured by the digital capacitive humidity element inside your **DHT11 Sensor**.`;
    }

    if (q.includes("wi-fi") || q.includes("wifi") || q.includes("connection")) {
      return `The network connection status for your ESP32 controller is currently **${connVal}**.\n\nWhen online, the board serves local REST requests and syncs state parameters with the **Blynk Cloud IoT server**.`;
    }

    if (q.includes("system health") || q.includes("health") || q.includes("devices active")) {
      return `**Smart Home System Health Check:**\n\n• **ESP32 Connection:** ${connVal}\n• **Active Devices:** ${activeChipText}\n• **Climate Sensors:** DHT11 reporting normally (${tempVal}°C, ${humVal}%).\n• **Log Status:** Systems are nominal. No hardware faults reported.`;
    }

    if (q.includes("esp32")) {
      return `The **ESP32** is a low-cost, low-power system-on-a-chip (SoC) with integrated **Wi-Fi and dual-mode Bluetooth**.\n\nIn this project, it acts as the primary microcontroller node: hosting the local HTTP Web Server, reading the DHT11 climate readings, controlling the RGB LED lighting channels, and driving the ULN2003 stepper driver to run the ventilation fan.`;
    }

    if (q.includes("dht11")) {
      return `The **DHT11** is a basic, low-cost digital temperature and humidity sensor.\n\nIt utilizes a capacitive humidity sensor and a thermistor to measure the surrounding air, sending a digital signal out on the data pin (connected to ESP32 **GPIO 4**). It reads temperature from 0 to 50°C and humidity from 20 to 90%.`;
    }

    if (q.includes("circuit") || q.includes("diagram") || q.includes("pin")) {
      return `**Circuit Configuration & Pin Map:**\n\n• **DHT11 Sensor:** Data pin linked to **GPIO 4**\n• **RGB LED Strip:** Channels linked to **GPIO 13 (Red)**, **GPIO 27 (Green)**, and **GPIO 14 (Blue)**\n• **28BYJ-48 Stepper Motor (Fan):** Driven by ULN2003 inputs on **GPIO 26 (IN1)**, **GPIO 33 (IN2)**, **GPIO 25 (IN3)**, and **GPIO 32 (IN4)**.`;
    }

    if (q.includes("project") || q.includes("explain project")) {
      return `This is a **Voice-Controlled Home Automation System**.\n\nIt features a custom responsive web console dashboard, Blynk Cloud synchronization, local micro-routing, and voice command controls. It supports real-time climate monitoring and manual/automated control of multi-channel LED lighting and fan ventilation.`;
    }

    if (q.includes("principle") || q.includes("work") || q.includes("how it works")) {
      return `**System Working Principle:**\n\n1. **Input:** Controls are sent via the Website UI, Voice Speech synthesis, or Blynk mobile application.\n2. **Transfer:** Requests hit the ESP32 via Wi-Fi HTTP endpoints (like \`/red/on\`, \`/fan/off\`).\n3. **Execution:** The ESP32 processes requests, executes hardware operations (writing pin states, pulsing coils), and updates internal state variables.\n4. **Telemetry:** The ESP32 outputs live climate parameters over HTTP status streams to refresh the dashboard.`;
    }

    if (q.includes("analyze") || q.includes("comfort")) {
      const temp = parseFloat(tempVal) || 25;
      const hum = parseFloat(humVal) || 50;
      let analysis = "Current comfort index: **Optimized**.\n\n";

      if (temp > 30 || hum > 60) {
        analysis += `• Temperature is high (**${tempVal}°C**).\n• Humidity is (**${humVal}%**).\n\n**Recommendation:** Switch the Fan to **AUTO mode** or manual speed **> 60%** to cool the climate and optimize ventilation.`;
      } else {
        analysis += `• Environmental parameters are in the optimal comfort zone (Temp: **${tempVal}°C**, Hum: **${humVal}%**).\n\nNo automation adjustments are currently required.`;
      }
      return analysis;
    }

    if (q.includes("recommend") || q.includes("advise")) {
      const temp = parseFloat(tempVal) || 25;
      return `**Energy & Comfort Recommendations:**\n\n1. ${temp > 30 ? "The ambient room temperature is warm. Consider enabling the **Ventilation Fan** to encourage air circulation." : "Ambient conditions are normal. The ventilation fan can remain off to conserve power."}\n2. Use **RGB lighting** on single-channel settings (e.g. Red, Green, or Blue) rather than full-white color mixing when using battery packs to extend ESP32 operational lifetime.`;
    }

    if (q.includes("help") || q.includes("commands") || q.includes("what can you")) {
      return `I'm here to assist you with the Home Automation Dashboard! You can ask questions like:\n\n• **"Tell me the current temperature"**\n• **"Explain the ESP32 controller"**\n• **"How does this circuit look?"**\n• **"Analyze my room comfort"**\n• **"How does the Blynk integration work?"**`;
    }

    const responses = [
      `I understand you're asking about: "${query}".\n\nAs your Home Automation AI, I can tell you that the ESP32 is running a Web Server routing endpoints like \`/status\` and \`/sensor\` over Wi-Fi. Feel free to query current sensor stats or hardware modules!`,
      `That is an interesting technical question! In this configuration, the DHT11 reads temperature and humidity which can automatically control the ULN2003 stepper fan. Let me know if you would like me to retrieve the **Current Temperature** or **Current Humidity** statistics.`,
      `Your Home Automation setup is fully equipped with Blynk Cloud support. The virtual pins V0-V6 map to active channels. Ask me to **Analyze Room** or query **System Health** for live indicators.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
});
