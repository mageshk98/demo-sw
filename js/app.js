const APP = {
  SW: null,
  init() {
    //
    APP.registerServiceWorker();
    document.getElementById("form").addEventListener("submit", APP.saveForm);
  },
  registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/service-worker.js", { scope: "/" })
        .then((registration) => {
          APP.SW =
            registration.installing ||
            registration.waiting ||
            registration.active;
          console.log("[Registered] Service Worker is", APP.SW);
        });

      if (navigator.serviceWorker.controller) {
        console.log("Service Registered Already");
      }
      // To get info when we have an update from service worker after it is installed & activated
      navigator.serviceWorker.oncontrollerchange = (ev) => {
        console.log("New Service is Installed or Activated", ev);
        APP.SW = navigator.serviceWorker.controller;
      };
      navigator.serviceWorker.addEventListener("message", APP.onMessage);
      // To unregister all service Worker
      //   navigator.serviceWorker.getRegistrations().then((regs) => {
      //     for (let reg of regs) {
      //       reg.unregister().then((res) => console.log(res));
      //     }
      //   });
    }
  },
  saveForm(ev) {
    ev.preventDefault();
    let color = document.getElementById("color").value;
    if (color) {
      APP.sendMessage({
        action: "update-theme",
        theme: color,
      });
    }
  },
  sendMessage(data) {
    if (APP.SW) {
      APP.SW.postMessage(data);
    }
  },
  onMessage(message) {
    console.log("Message received", message);
    if (message.data.action === "update-theme") {
      document.body.style.backgroundColor = message.data.theme;
    }
  },
};

document.addEventListener("DOMContentLoaded", APP.init);
