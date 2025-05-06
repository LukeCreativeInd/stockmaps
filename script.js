
let map;
let markers = [];
let postcodes = new Set();
let bounds;

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 4,
    center: { lat: -25.2744, lng: 133.7751 },
  });

  bounds = new google.maps.LatLngBounds();

  fetch("public/stockists_for_map.csv")
    .then((response) => response.text())
    .then((data) => {
      const parsed = Papa.parse(data, { header: true });
      parsed.data.forEach((row) => {
        const { Company, Address1, City, State, Postcode, Phone, Email, "Full Address": FullAddress } = row;
        if (!FullAddress) return;

        if (Postcode) postcodes.add(Postcode.trim());

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: FullAddress }, (results, status) => {
          if (status === "OK") {
            const position = results[0].geometry.location;

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

            markers.push({ marker, company: Company, postcode: Postcode.trim(), position });

            addToStockistList(Company, FullAddress, marker);
            map.fitBounds(bounds);
          }
        });
      });

      setupPostcodeAutocomplete();
    });

  document.getElementById("search-name")?.addEventListener("input", function () {
    const value = this.value.toLowerCase();
    markers.forEach(({ marker, company }) => {
      const visible = company.toLowerCase().includes(value);
      marker.setVisible(visible);
    });
  });

  document.getElementById("clear-filters")?.addEventListener("click", () => {
    document.getElementById("search-name").value = "";
    document.getElementById("search-postcode").value = "";
    markers.forEach(({ marker }) => marker.setVisible(true));
    map.fitBounds(bounds);
  });
}

function setupPostcodeAutocomplete() {
  const input = document.getElementById("search-postcode");
  if (!input) return;
  const datalist = document.createElement("datalist");
  datalist.id = "postcode-options";
  document.body.appendChild(datalist);
  input.setAttribute("list", "postcode-options");

  Array.from(postcodes)
    .sort()
    .forEach((pc) => {
      const option = document.createElement("option");
      option.value = pc;
      datalist.appendChild(option);
    });

  input.addEventListener("input", () => {
    const value = input.value.trim();

    if (value === "") {
      markers.forEach(({ marker }) => marker.setVisible(true));
      map.fitBounds(bounds);
      return;
    }

    let zoomed = false;
    markers.forEach(({ marker, postcode, position }) => {
      const visible = postcode === value;
      marker.setVisible(visible);
      if (visible && !zoomed) {
        map.setZoom(12);
        map.panTo(position);
        zoomed = true;
      }
    });
  });
}

function addToStockistList(company, address, marker) {
  const container = document.getElementById("stockist-list");
  if (!container) return;

  const div = document.createElement("div");
  div.className = "stockist";
  div.innerHTML = `<strong>${company}</strong><br>${address}`;
  
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

  container.appendChild(div);
}

window.initMap = initMap;
