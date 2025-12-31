console.log("🚀 Chat App v0.3.0 starting...");

// Проверка поддержки браузера
const checkBrowserSupport = () => {
	const required = {
		IndexedDB: "indexedDB" in window,
		"Web Crypto": "crypto" in window && "subtle" in window.crypto,
		"Web Workers": "Worker" in window,
		"Service Workers": "serviceWorker" in navigator,
		"ES Modules": true, // если скрипт загрузился, значит поддерживается
	};

	const missing = Object.entries(required)
		.filter(([_, supported]) => !supported)
		.map(([feature]) => feature);

	if (missing.length > 0) {
		document.body.innerHTML = `
      <div style="padding: 2rem; text-align: center;">
        <h1>❌ Browser not supported</h1>
        <p>Your browser is missing required features:</p>
        <ul style="list-style: none; padding: 0;">
          ${missing.map((f) => `<li>• ${f}</li>`).join("")}
        </ul>
        <p style="margin-top: 2rem;">
          Please use a modern browser like Chrome, Firefox, or Edge.
        </p>
      </div>
    `;
		return false;
	}

	return true;
};

if (!checkBrowserSupport()) {
	throw new Error("Browser not supported");
}

// TODO: Инициализация приложения
console.log("✅ Browser check passed");
console.log("⏳ Initializing...");

// Пока просто заглушка
document.getElementById("app").innerHTML = `
  <div style="padding: 2rem; text-align: center;">
    <h1>🎉 Chat App</h1>
    <p>Ready to build!</p>
  </div>
`;
