let pickedLocation = null;
let map;
let marker = null;
let pickMode = false;
let routeLine = null;

document.getElementById('openMapBtn').onclick = () => {
  document.getElementById('mapWrapper').style.display = 'block';

  if (!map) {
    map = L.map('map').setView([43.2389, 76.8897], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    map.on('click', e => {
        if (!pickMode) return;
      
        if (marker) map.removeLayer(marker);
        marker = L.marker(e.latlng).addTo(map);
      
        pickedLocation = {
          lat: e.latlng.lat,
          lng: e.latlng.lng
        };
      
        pickMode = false;
        alert('Точка выбрана');
      });
      
  }

  pickMode = true;
};

document.getElementById('closeMapBtn').onclick = () => {
  document.getElementById('mapWrapper').style.display = 'none';
  pickMode = false;
};

/* ---------- ВХОД / ВЫХОД ---------- */

function login() {
  const username = document.getElementById("username").value.trim();
  const role = document.getElementById("role").value;

  if (!username) return alert("Введите имя");

  currentUser = { username, role };
  localStorage.setItem("user", JSON.stringify(currentUser));

  document.getElementById("loginPanel").style.display = "none";
  document.getElementById("mainInterface").style.display = "block";

  document.getElementById("welcome").innerText =
    `Привет, ${username} (${role})`;

  loadLots();
}
  
function logout() {
  localStorage.removeItem("user");
  currentUser = null;

  document.getElementById("mainInterface").style.display = "none";
  document.getElementById("loginPanel").style.display = "block";
}

/* ---------- СОЗДАНИЕ ЛОТА ---------- */

function createLot() {
  const title = document.getElementById("title").value.trim();
  const price = +document.getElementById("price").value;
  const amount = +document.getElementById("amount").value;
  const unit = document.getElementById("unit").value;

  if (!title || price <= 0 || amount <= 0)
    return alert("Заполни все поля");

    if (!pickedLocation)
  return alert("Выберите точку на карте");

location: pickedLocation


  const type = currentUser.role === "buyer" ? "buy" : "sell";

  const lots = JSON.parse(localStorage.getItem("lots")) || [];

  lots.push({
    title,
    price,
    amount,
    unit,
    type,
    owner: currentUser.username,
    dealWith: null,
    location: pickedLocation
  });
  

  localStorage.setItem("lots", JSON.stringify(lots));
  loadLots();
}

/* ---------- ОТОБРАЖЕНИЕ ЛОТОВ ---------- */

function loadLots() {
  const lotsDiv = document.getElementById("lots");
  lotsDiv.innerHTML = "";

  const lots = JSON.parse(localStorage.getItem("lots")) || [];

  lots.forEach((lot, index) => {
    const div = document.createElement("div");
    div.className = `lot ${lot.type === "sell" ? "seller" : "buyer"}`;

    let buttons = "";

    if (!lot.dealWith && lot.amount >= 50) {
      if (currentUser.role === "buyer" && lot.type === "sell") {
        buttons = `<button onclick="buyLot(${index})">Купить</button>`;
      }

      if (currentUser.role === "seller" && lot.type === "buy") {
        buttons = `<button onclick="sellLot(${index})">Продать</button>`;
      }
    }

    if (lot.amount < 50) {
      buttons = `<span style="color:red">Мин. 50 ${lot.unit}</span>`;
    }

    if (lot.owner === currentUser.username) {
      buttons += `
        <button style="background:#e74c3c" onclick="deleteLot(${index})">
          Удалить
        </button>`;
    }

    div.innerHTML = `
  <b>${lot.title}</b><br>
  <i>${lot.type === "sell" ? "Продаю" : "Скупаем"}</i><br>
  Цена: ${lot.price} тг / ${lot.unit}<br>
  Количество: ${lot.amount} ${lot.unit}<br>
  Создал: ${lot.owner}<br>

  <button onclick="showLotOnMap(${index})">
    🗺 Показать на карте
  </button>

  ${lot.dealWith ? `Сделка с: ${lot.dealWith}` : buttons}
`;


    lotsDiv.appendChild(div);
  });
}

/* ---------- СДЕЛКИ ---------- */

function buyLot(index) {
  const lots = JSON.parse(localStorage.getItem("lots"));
  lots[index].dealWith = currentUser.username;
  localStorage.setItem("lots", JSON.stringify(lots));
  loadLots();
}

function sellLot(index) {
  const lots = JSON.parse(localStorage.getItem("lots"));
  lots[index].dealWith = currentUser.username;
  localStorage.setItem("lots", JSON.stringify(lots));
  loadLots();
}

/* ---------- УДАЛЕНИЕ ---------- */

function deleteLot(index) {
  const lots = JSON.parse(localStorage.getItem("lots"));
  if (confirm("Удалить этот лот?")) {
    lots.splice(index, 1);
    localStorage.setItem("lots", JSON.stringify(lots));
    loadLots();
  }
}

function clearHistory() {
  if (confirm("Удалить все лоты?")) {
    localStorage.removeItem("lots");
    loadLots();
  }
}

/* ---------- СТАРТ ---------- */

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loginPanel").style.display = "block";
  document.getElementById("mainInterface").style.display = "none";
});
function showLotOnMap(index) {
    const lots = JSON.parse(localStorage.getItem("lots")) || [];
    const lot = lots[index];
  
    if (!lot.location) {
      alert("У этого лота нет точки");
      return;
    }
  
    document.getElementById("mapWrapper").style.display = "block";
  
    setTimeout(() => {
      map.invalidateSize();
  
      if (marker) map.removeLayer(marker);
      if (routeLine) map.removeLayer(routeLine);
  
      const lotLatLng = [lot.location.lat, lot.location.lng];
  
      marker = L.marker(lotLatLng).addTo(map)
        .bindPopup("📍 Точка лота")
        .openPopup();
  
      map.setView(lotLatLng, 13);
  
      // ЕСЛИ ПОКУПАТЕЛЬ — СТРОИМ МАРШРУТ
      if (currentUser.role === "buyer" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
          const userLatLng = [
            pos.coords.latitude,
            pos.coords.longitude
          ];
  
          routeLine = L.polyline(
            [userLatLng, lotLatLng],
            { color: "blue" }
          ).addTo(map);
  
          map.fitBounds(routeLine.getBounds());
        });
      }
    }, 200);
  }
  let lotMapInstance = null;
let lotMarker = null;
let lotRoute = null;

function showLotOnMap(index) {
  const lots = JSON.parse(localStorage.getItem("lots")) || [];
  const lot = lots[index];

  if (!lot.location) return alert("У этого лота нет точки");

  const modal = document.getElementById("lotMapModal");
  modal.style.display = "block";

  // Если карта уже существует, удаляем старую
  if (lotMapInstance) {
    lotMapInstance.remove();
    lotMapInstance = null;
  }

  // Создаём карту заново
  lotMapInstance = L.map("lotMap").setView([lot.location.lat, lot.location.lng], 13);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(lotMapInstance);

  // Добавляем маркер лота
  lotMarker = L.marker([lot.location.lat, lot.location.lng])
    .addTo(lotMapInstance)
    .bindPopup(`📍 ${lot.title} (${lot.type === 'sell' ? 'Продаю' : 'Скупаем'})`)
    .openPopup();

  // Если покупатель — строим маршрут от его геопозиции
  if (currentUser.role === 'buyer' && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      const userLatLng = [pos.coords.latitude, pos.coords.longitude];
      lotRoute = L.polyline([userLatLng, [lot.location.lat, lot.location.lng]], { color: 'blue' }).addTo(lotMapInstance);
      lotMapInstance.fitBounds(lotRoute.getBounds());
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
    const closeBtn = document.getElementById("closeLotMap");
    const modal = document.getElementById("lotMapModal");
  
    if (closeBtn && modal) {
      closeBtn.addEventListener("click", () => {
        modal.style.display = "none";
  
        // Удаляем карту, чтобы при повторном открытии всё создавалось заново
        if (lotMapInstance) {
          lotMapInstance.remove();
          lotMapInstance = null;
          lotMarker = null;
          lotRoute = null;
        }
      });
    }
  });
  
