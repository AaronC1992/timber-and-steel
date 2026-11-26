(() => {
  "use strict";

  let installPrompt = null, registration = null, checking = false;
  let offlineMessage = "Preparing offline play. Keep this page open until it is ready.";
  let installError = "";
  let installed = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const supported = window.isSecureContext && "serviceWorker" in navigator && location.protocol !== "file:";
  if (!supported) offlineMessage = "Installation and offline caching need HTTPS or localhost. Local files can still be played directly.";

  function showStatus() {
    const status = document.getElementById("offline-status");
    if (status) status.textContent = offlineMessage;
    const help = document.getElementById("install-status");
    if (help) help.textContent = installError || (installed ? "Installed on this device." : installPrompt
      ? "Install for a standalone game window."
      : "Use your browser's Install / Add to Home Screen menu. On iPhone or iPad: Safari > Share > Add to Home Screen.");
    const button = document.querySelector("[data-install]");
    if (button) button.hidden = !installPrompt || installed;
  }

  async function checkOffline() {
    showStatus();
    if (!registration?.active || checking) return;
    checking = true;
    const channel = new MessageChannel();
    try {
      const ready = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Offline cache check timed out.")), 5000);
        channel.port1.onmessage = event => {
          clearTimeout(timer);
          resolve(event.data.ready === true);
        };
        registration.active.postMessage("offline-status", [channel.port2]);
      });
      offlineMessage = ready
        ? `${navigator.onLine ? "Offline ready" : "Playing offline"}. All game files are saved on this device.`
        : "Offline files are incomplete. Reconnect and reopen the game to retry.";
      if (registration.waiting) offlineMessage += " Update ready: close all game windows, then reopen.";
    } catch (error) {
      console.warn("Offline readiness could not be checked:", error);
      offlineMessage = "Could not verify offline files. Reconnect and reopen the game to retry.";
    } finally {
      channel.port1.close(); channel.port2.close();
      checking = false; showStatus();
    }
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault(); installPrompt = event; installError = ""; showStatus();
  });
  window.addEventListener("appinstalled", () => {
    installed = true; installPrompt = null; installError = ""; showStatus();
  });
  document.addEventListener("click", async event => {
    if (!event.target.closest("[data-install]") || !installPrompt) return;
    const prompt = installPrompt;
    installPrompt = null; showStatus();
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch (error) {
      console.warn("Game installation failed:", error);
      installError = "Installation could not start. Try your browser's Install / Add to Home Screen menu.";
    }
    showStatus();
  });
  document.addEventListener("pwa-status-request", checkOffline);
  window.addEventListener("online", checkOffline);
  window.addEventListener("offline", checkOffline);

  if (supported) {
    navigator.serviceWorker.register("sw.js", { scope: "./", updateViaCache: "none" }).then(async result => {
      registration = result;
      result.addEventListener("updatefound", () => {
        const worker = result.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed") checkOffline();
          if (worker.state === "redundant") {
            console.warn("Offline game installation did not complete.");
            offlineMessage = "Offline download failed. Any previously saved version is unchanged. Reconnect and reopen to retry.";
            showStatus();
          }
        });
      });
      await navigator.serviceWorker.ready;
      await checkOffline();
    }).catch(error => {
      console.warn("Offline game registration failed:", error);
      offlineMessage = "Offline setup failed. Check your connection and browser storage permissions, then reopen the game.";
      showStatus();
    });
  }
})();
