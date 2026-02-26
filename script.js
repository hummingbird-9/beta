const container = document.getElementById('container');
const searchBar = document.getElementById('searchBar');
const sortOptions = document.getElementById('sortOptions');
const zoneCount = document.getElementById('zoneCount');
const zoneViewer = document.getElementById('zoneViewer');
const zoneNameText = document.getElementById('zoneName');
const zoneIdText = document.getElementById('zoneId');
const zoneFrame = document.getElementById('zoneFrame');
const darkModeToggle = document.getElementById('darkModeToggle');

const zonesURL = "zones.json";
const coverURL = "https://cdn.jsdelivr.net/gh/hummingbird-9/covers@main";
const htmlURL = "https://cdn.jsdelivr.net/gh/hummingbird-9/html@main";

let zones = [];
let filteredZones = [];
let currentPage = 0;
const zonesPerPage = 20;

async function listZones() {
  try {
    const res = await fetch(zonesURL);
    zones = await res.json();
    filteredZones = [...zones];
    currentPage = 0;
    sortZones();
    displayZonesPaginated();

    // If ?id= is present in URL, open that zone
    const search = new URLSearchParams(window.location.search);
    const id = search.get('id');
    if (id) {
      const zone = zones.find(z => z.id + '' === id);
      if (zone) openZone(zone);
    }
  } catch (e) {
    container.textContent = "Error loading zones: " + e;
  }
}

function displayZonesPaginated() {
  const start = currentPage * zonesPerPage;
  const end = start + zonesPerPage;
  if (start === 0) container.innerHTML = "";
  const fragment = document.createDocumentFragment();

  filteredZones.slice(start, end).forEach(file => {
    const zoneItem = document.createElement("div");
    zoneItem.className = "zone-item";
    zoneItem.onclick = () => openZone(file);

    const img = document.createElement("img");
    img.src = file.cover.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
    zoneItem.appendChild(img);

    const button = document.createElement("button");
    button.textContent = file.name;
    button.onclick = e => {
      e.stopPropagation();
      openZone(file);
    };
    zoneItem.appendChild(button);

    fragment.appendChild(zoneItem);
  });

  container.appendChild(fragment);

  zoneCount.textContent = `Zones Loaded: ${Math.min(end, filteredZones.length)} of ${filteredZones.length}`;

  handleLoadMoreButton(end < filteredZones.length);
}

function handleLoadMoreButton(show) {
  let btn = document.getElementById('loadMoreBtn');
  if (show) {
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'loadMoreBtn';
      btn.textContent = "Load More";
      btn.style.display = "block";
      btn.style.margin = "20px auto";
      btn.style.padding = "10px 20px";
      btn.style.fontSize = "16px";
      btn.onclick = () => {
        currentPage++;
        displayZonesPaginated();
      };
      container.parentElement.appendChild(btn);
    }
  } else {
    if (btn) btn.remove();
  }
}

function filterZones() {
  const q = searchBar.value.toLowerCase();
  filteredZones = zones.filter(z => z.name.toLowerCase().includes(q));
  currentPage = 0;
  container.innerHTML = "";
  displayZonesPaginated();
}

function sortZones() {
  const sortBy = sortOptions.value;
  if (sortBy === 'name') filteredZones.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortBy === 'id') filteredZones.sort((a, b) => a.id - b.id);

  // else leave original order if popularity unavailable or default

  // Reset pagination on new sort
  currentPage = 0;
  container.innerHTML = "";
  displayZonesPaginated();
}

function openZone(zone) {
  if (zone.url.startsWith("http")) {
    window.location.href = zone.url; // external link
  } else {
    const url = zone.url.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
    fetch(url)
      .then(res => res.text())
      .then(html => {
        zoneFrame.contentDocument.open();
        zoneFrame.contentDocument.write(html);
        zoneFrame.contentDocument.close();
        zoneNameText.textContent = zone.name;
        zoneIdText.textContent = zone.id;
        zoneViewer.style.display = "block";
      }).catch(e => alert("Failed to load zone: " + e));
  }
}
function closeZone() {
  zoneViewer.style.display = "none";
}

function fullscreenZone() {
  if (zoneFrame.requestFullscreen) zoneFrame.requestFullscreen();
  else if (zoneFrame.mozRequestFullScreen) zoneFrame.mozRequestFullScreen();
  else if (zoneFrame.webkitRequestFullscreen) zoneFrame.webkitRequestFullscreen();
  else if (zoneFrame.msRequestFullscreen) zoneFrame.msRequestFullscreen();
}

function aboutBlank() {
  const newWin = window.open("about:blank", "_blank");
  if (!newWin) return;
  const zoneIdValue = zoneIdText.textContent;
  const zone = zones.find(z => z.id + '' === zoneIdValue);
  if (!zone) return;
  const url = zone.url.replace("{COVER_URL}", coverURL).replace("{HTML_URL}", htmlURL);
  fetch(url)
    .then(r => r.text())
    .then(html => {
      newWin.document.open();
      newWin.document.write(html);
      newWin.document.close();
    });
}

function saveData() {
  const data = JSON.stringify(localStorage) + "\n\n|\n\n" + document.cookie;
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([data], { type: "text/plain" }));
  link.download = Date.now() + ".data";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function loadData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const content = e.target.result;
    const parts = content.split("\n\n|\n\n");
    try {
      const localeData = JSON.parse(parts[0]);
      for (const key in localeData) localStorage.setItem(key, localeData[key]);
    } catch {
      alert("Failed to parse local storage data");
    }
    if (parts[1]) {
      parts[1].split("; ").forEach(cookieStr => {
        document.cookie = cookieStr;
      });
    }
    alert("Data loaded successfully");
  };
  reader.readAsText(file);
}

darkModeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});

searchBar.addEventListener('input', filterZones);
sortOptions.addEventListener('change', () => {
  sortZones();
  // reset search so it filters sorted zones
  filterZones();
});

listZones();
