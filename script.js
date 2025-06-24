let allData = [];
let times = [];
let map;
let slider;
let playing = false;
let interval;
let speed = 1;
const speedOptions = [1, 2, 5, 10];
let speedIndex = 0;

function getColor(windSpeed) {
  const scale = Math.min(Math.max(windSpeed / 20, 0), 1);
  const r = Math.round(80 + scale * 100);
  const g = Math.round(150 - scale * 150);
  const b = Math.round(220 - scale * 220);
  return `rgba(${r},${g},${b},0.8)`;
}

function updateMap(time) {
  if (!map) return;

  map.eachLayer(layer => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });

  const filtered = allData.filter(d => d.datetime === time);
  filtered.forEach(d => {
    const color = getColor(d.wind_speed);
    const icon = L.divIcon({
      html: `
        <svg width="60" height="60" viewBox="0 0 60 60" style="transform: rotate(${}d.direction}deg);">
          <polygon points="0,30 45,15 45,25 60,30 45,35 45,45" fill="${}color}" />
        </svg>
      `,
      className: ''
    });

    L.marker([d.lat, d.lng], { icon: icon })
      .bindPopup(`<b>${}d.name}</b><br>${}d.datetime}<br>風速: ${}d.wind_speed} m/s<br>風向: ${}d.direction}°`)
      .addTo(map);
  });

  const timeLabel = document.getElementById('currentTime');
  if (timeLabel) timeLabel.textContent = time;
  const index = times.indexOf(time);
  if (slider) slider.value = index;
}

window.togglePlayback = function () {
  playing = !playing;
  const btn = document.querySelector("button[onclick='togglePlayback()']");
  btn.textContent = playing ? "⏸ 停止" : "▶ 再生";

  if (playing) {
    interval = setInterval(() => {
      let next = (parseInt(slider.value) + 1) % times.length;
      slider.value = next;
      updateMap(times[next]);
    }, 3000 / speed);
  } else {
    clearInterval(interval);
  }
};

window.changeSpeed = function () {
  speedIndex = (speedIndex + 1) % speedOptions.length;
  speed = speedOptions[speedIndex];
  document.getElementById('speedLabel').textContent = speed + "x";

  if (playing) {
    clearInterval(interval);
    interval = setInterval(() => {
      let next = (parseInt(slider.value) + 1) % times.length;
      slider.value = next;
      updateMap(times[next]);
    }, 3000 / speed);
  }
};

function parseDormCSV(csvText) {
  return csvText.trim().split("
").slice(1).map(row => {
    const cols = row.split(',');
    const date = cols[0].replaceAll('/', '-');
    const time = cols[1].slice(0,5);
    return {
      name: "学生寮屋上",
      datetime: `${}date} ${}time}:00`,
      lat: 35.27549,
      lng: 136.23590,
      direction: parseFloat(cols[2]),
      wind_speed: parseFloat(cols[4])
    };
  });
}

function parseYachtCSV(csvText) {
  return csvText.trim().split("
").slice(1).map(row => {
    const cols = row.split(',');
    const datetime = new Date(cols[0]);
    const y = datetime.getFullYear();
    const m = String(datetime.getMonth() + 1).padStart(2, '0');
    const d = String(datetime.getDate()).padStart(2, '0');
    const hh = String(datetime.getHours()).padStart(2, '0');
    const mm = String(datetime.getMinutes()).padStart(2, '0');
    return {
      name: "ヨット部艇庫",
      datetime: `${}y}-${}m}-${}d} ${}hh}:${}mm}:00`,
      lat: 35.28265,
      lng: 136.24581,
      direction: parseFloat(cols[3]),
      wind_speed: parseFloat(cols[1])
    };
  });
}

window.addEventListener('load', () => {
  slider = document.getElementById('timeSlider');

  Promise.all([
    fetch('学生寮屋上_APR25.csv').then(res => res.text()),
    fetch('ヨット部艇庫_Apr25.csv').then(res => res.text())
  ]).then(([dormCSV, yachtCSV]) => {
    const dormData = parseDormCSV(dormCSV);
    const yachtData = parseYachtCSV(yachtCSV);
    allData = [...dormData, ...yachtData];

    times = [...new Set(allData.map(d => d.datetime))].sort();
    slider.max = times.length - 1;

    slider.addEventListener("input", () => {
      updateMap(times[slider.value]);
    });

    map = L.map('map').setView([35.28, 136.24], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    map.whenReady(() => {
      updateMap(times[times.length - 1]);
      slider.value = times.length - 1;
    });
  });
});
