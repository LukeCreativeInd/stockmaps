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

  fetch("/stockists_for_map.csv")
    .then((response) => response.text())
    .then((data) => {
      const parsed = Papa.parse(data, { header: true });
      
parsed.data.forEach((row) => {
  const { Company, Address1, City, State, Postcode, Phone, Email, "Full Address": FullAddress, Country } = row;
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

      const stockist = {
        marker,
        company: Company,
        postcode: Postcode.trim(),
        position,
        address: FullAddress,
        addressLine1: Address1,
        city: City,
        state: State,
        country: Country
      };
      markers.push(stockist);

      addToStockistList(stockist);
      map.fitBounds(bounds);
    }
  });

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

            const stockist = { marker, company: Company, postcode: Postcode.trim(), position, address: FullAddress };
            markers.push(stockist);

            addToStockistList(stockist);
            map.fitBounds(bounds);
          }
        });
      });

      setupFiltering();
    });
}

function setupFiltering() {
  const nameInput = document.getElementById("search-name");
  const postcodeInput = document.getElementById("search-postcode");

  const applyFilter = () => {
    const nameVal = nameInput.value.toLowerCase();
    const postcodeVal = postcodeInput.value.trim();

    const listContainer = document.getElementById("stockist-entries");
    listContainer.innerHTML = "";

    let newBounds = new google.maps.LatLngBounds();
    markers.forEach(({ marker, company, postcode, position, address }) => {
      const matchesName = company.toLowerCase().includes(nameVal);
      const matchesPostcode = postcode.includes(postcodeVal);
      const visible = matchesName && matchesPostcode;

      marker.setVisible(visible);

      if (visible) {
        newBounds.extend(position);
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
        listContainer.appendChild(div);
      }
    });

    if (!newBounds.isEmpty()) {
      map.fitBounds(newBounds);
    }
  };

  nameInput.addEventListener("input", applyFilter);
  postcodeInput.addEventListener("input", applyFilter);

  document.getElementById("clear-filters").addEventListener("click", () => {
    nameInput.value = "";
    postcodeInput.value = "";
    applyFilter();
  });

  applyFilter(); // Initial render
}

function addToStockistList(stockist) {
  const container = document.getElementById("stockist-entries");
  const div = document.createElement("div");
  div.className = "stockist";
  div.innerHTML = `<strong>${toTitleCase(stockist.company)}</strong><br>
${toTitleCase(stockist.addressLine1)}<br>
${toTitleCase(stockist.city)}, ${toTitleCase(stockist.postcode)} ${toTitleCase(stockist.state)}<br>
${toTitleCase(stockist.country)}`;

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

window.initMap = initMap;


function toTitleCase(str) {
  return (str || "").toLowerCase().replace(/\b\w+/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1);
  });
}
