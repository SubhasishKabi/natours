//console.log('Hello from the client side');
//const locations = JSON.parse(document.getElementById('map').dataset.locations);
//console.log(locations);

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1Ijoic3ViaGFzaXNoa2FiaSIsImEiOiJjbGkzZ2sydHgwZTR0M3Bud2pzNjV0MmN1In0.M5CMPNysiqTumr4vzzXx3Q';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/subhasishkabi/cli3gvtgy02kf01pn60tx2n4r',
    //   center: [-118.11349, 34.1111745],
    zoom: 12,
    scrollZoom: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    const el = document.createElement('div');
    el.className = 'marker';

    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    new mapboxgl.Popup({
      offset: 30,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p> Day: ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    bounds.extend(loc.coordinates);
  });

  map.fitBounds(bounds, {
    padding: {
      top: 200,
      bottom: 200,
      left: 100,
      right: 100,
    },
  });
};
