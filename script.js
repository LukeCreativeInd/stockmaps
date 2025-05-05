let map;
let markers = [];
let postcodes = new Set();

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 4,
    center: { lat: -25.2744, lng: 133.7751 },
  });

  fetch("/stockists_for_map.csv")
    .then((response) => response.text())
    .then((data) => {
      const rows = data.split("\n").slice(1);
      rows.forEach((row) => {
        const cols = row.split(",");
        const [company, address1, city, state, postcode, phone, email, fullAddress] = cols;

        if (postcode) postcodes.add(postcode.trim());

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: fullAddress }, (results, status) => {
          if (status === "OK") {
            const position = results[0].geometry.location;

            const marker = new google.maps.Marker({
              map: map,
              position,
              title: company,
            });

            const infoWindow = new google.maps.InfoWindow({
              content: `<strong>${company}</strong><br>${fullAddress}<br><br>📞 ${phone.replaceAll('"','')}`,
            });

            marker.addListener("click", () => infoWindow.open(map, marker));
            markers.push({ marker, company, postcode: postcode.trim(), position });
          }
        });
      });

      setupPostcodeAutocomplete();
    });

  document.getElementById("search-name").addEventListener("input", function () {
    const value = this.value.toLowerCase();
    markers.forEach(({ marker, company }) => {
      const visible = company.toLowerCase().includes(value);
      marker.setVisible(visible);
    });
  });

  document.getElementById("clear-filters").addEventListener("click", () => {
    document.getElementById("search-name").value = "";
    document.getElementById("search-postcode").value = "";
    markers.forEach(({ marker }) => marker.setVisible(true));
    map.setZoom(4);
    map.setCenter({ lat: -25.2744, lng: 133.7751 });
  });
}

function setupPostcodeAutocomplete() {
  const input = document.getElementById("search-postcode");
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
      map.setZoom(4);
      map.setCenter({ lat: -25.2744, lng: 133.7751 });
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
 
