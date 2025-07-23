function formatTime(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

window.timerAPI.onTick((seconds) => {
  document.getElementById('timer').textContent = formatTime(seconds);
});

if (window.appAPI) {
  window.appAPI.onAppUpdate((appName) => {
    document.getElementById('current-app').textContent = appName;
  });
}