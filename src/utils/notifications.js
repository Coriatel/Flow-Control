export function requestNotificationPermission() {
  if (!("Notification" in window)) return Promise.resolve("denied");
  if (Notification.permission === "granted") return Promise.resolve("granted");
  if (Notification.permission === "denied") return Promise.resolve("denied");
  return Notification.requestPermission();
}

export function showNotification(title, body) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    new Notification(title, {
      body,
      icon: "/logo-icon.png",
      dir: "rtl",
    });
  } catch {
    // Fallback for browsers that don't support Notification constructor
  }
}
