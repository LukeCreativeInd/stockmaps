let map;
let markers = [];
let postcodes = new Set();
let bounds;
let uniqueStates = new Set();

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 4,
    center: { lat: -25.2744, lng: 133.7751 },
  });

  bounds = new google.maps.LatLngBounds();

  fetch("/stockists_for_map.csv")
    .then((response) => response.text())
    .then((data) => {
      const parsed = Papa.parse(data, { header: true });
      parsed.data.forEach((row) => {
        const {
          Company,
          Address1,
          City,
          State,
          Postcode,
          Country,
          Phone,
          Email,
          "Full Address": FullAddress,
          Latitude,
          Longitude
        } = row;

        if (!Latitude || !Longitude) return;

        if (Postcode) postcodes.add(Postcode.trim());
        if (State) uniqueStates.add(State.trim().toUpperCase());

        const position = {
          lat: parseFloat(Latitude),
          lng: parseFloat(Longitude)
        };

        const marker = new google.maps.Marker({
          map: map,
          position,
          title: Company,
        });

        bounds.extend(position);

        const infoWindow = new google.maps.InfoWindow({
          content: `<strong>${Company}</strong><br>${FullAddress}<br><br>📞 ${Phone?.replaceAll('"','') || ''}`,
        });

        marker.addListener("click", () => infoWindow.open(map, marker));

        const stockist = {
          marker,
          company: Company,
          postcode: Postcode.trim(),
          position,
          addressLine1: Address1,
          city: City,
          state: State,
          country: Country,
        };

        markers.push(stockist);
        addToStockistList(stockist);
        map.fitBounds(bounds);
      });

      const stateSelect = document.getElementById("state-select");
      stateSelect.innerHTML = '<option value="">All States</option>';
      Array.from(uniqueStates).sort().forEach(state => {
        const option = document.createElement("option");
        option.value = state;
        option.textContent = state;
        stateSelect.appendChild(option);
      });

      setupFiltering();
    });
}

function setupFiltering() {
  const nameInput = document.getElementById("search-name");
  const postcodeInput = document.getElementById("search-postcode");
  const stateSelect = document.getElementById("state-select");

  const applyFilter = () => {
    const nameVal = nameInput.value.toLowerCase();
    const postcodeVal = postcodeInput.value.trim();
    const stateVal = stateSelect.value;

    const listContainer = document.getElementById("stockist-entries");
    listContainer.innerHTML = "";

    let newBounds = new google.maps.LatLngBounds();
    markers.forEach(({ marker, company, postcode, position, addressLine1, city, state, country }) => {
      const matchesName = company?.toLowerCase().includes(nameVal);
      const matchesPostcode = postcode?.includes(postcodeVal);
      const matchesState = !stateVal || (state?.toUpperCase() === stateVal);
      const visible = matchesName && matchesPostcode && matchesState;

      marker.setVisible(visible);

      if (visible) {
        newBounds.extend(position);

        const div = document.createElement("div");
        div.className = "stockist";
        div.innerHTML = `
          <strong>${company}</strong><br>
          ${toTitleCase(addressLine1)}<br>
          ${toTitleCase(city)}, ${postcode} ${(state || "").toUpperCase()}<br>
          ${toTitleCase(country)}
        `;

        div.addEventListener("mouseenter", () => {
          marker.setIcon({
            url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
            scaledSize: new google.maps.Size(50, 50),
          });
        });

        div.addEventListener("mouseleave", () => {
          marker.setIcon(null);
        });

        div.addEventListener("click", () => {
          map.panTo(marker.getPosition());
          map.setZoom(14);
          google.maps.event.trigger(marker, 'click');
        });

        listContainer.appendChild(div);
      }
    });

    if (!newBounds.isEmpty()) {
      map.fitBounds(newBounds);
    }
  };

  nameInput.addEventListener("input", applyFilter);
  postcodeInput.addEventListener("input", applyFilter);
  stateSelect.addEventListener("change", applyFilter);

  document.getElementById("clear-filters").addEventListener("click", () => {
    nameInput.value = "";
    postcodeInput.value = "";
    stateSelect.value = "";
    applyFilter();
  });

  applyFilter();
}

function addToStockistList(stockist) {
  const container = document.getElementById("stockist-entries");
  const div = document.createElement("div");
  div.className = "stockist";
  div.innerHTML = `
    <strong>${stockist.company}</strong><br>
    ${toTitleCase(stockist.addressLine1)}<br>
    ${toTitleCase(stockist.city)}, ${stockist.postcode} ${(stockist.state || "").toUpperCase()}<br>
    ${toTitleCase(stockist.country)}
  `;

  div.addEventListener("mouseenter", () => {
    stockist.marker.setIcon({
      url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
      scaledSize: new google.maps.Size(50, 50),
    });
  });

  div.addEventListener("mouseleave", () => {
    stockist.marker.setIcon(null);
  });

  div.addEventListener("click", () => {
    map.panTo(stockist.marker.getPosition());
    map.setZoom(14);
    google.maps.event.trigger(stockist.marker, 'click');
  });

  container.appendChild(div);
}

function toTitleCase(str) {
  return (str || "").toLowerCase().replace(/\b\w+/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1);
  });
}

window.initMap = initMap;
