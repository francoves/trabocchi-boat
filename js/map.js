/* =========================================================
   Pescara Boat View — coastal route map (MapLibre GL)
   Fixed showcase: locked view, permanent labels, offshore route.
   Style: Carto Positron (free, no token), recolored to brand sea tones.
   ========================================================= */
(function () {
  const el = document.getElementById("map");
  if (!el || !window.maplibregl) return;

  // Markers: ports (coral) + beaches/coves (teal). side = which side the label sits.
  const POIS = [
    { n: "Pescara",            c: [14.2156, 42.4664], type: "port",  major: true, side: "top" },
    { n: "Francavilla al Mare", c: [14.2903, 42.4184], type: "port",  side: "bottom" },
    { n: "Ortona",             c: [14.4046, 42.3553], type: "port",  side: "top" },
    { n: "Ripari di Giobbe",   c: [14.4200, 42.3360], type: "beach", side: "bottom" },
    { n: "Cala Turchino",      c: [14.4600, 42.2890], type: "beach", side: "top" },
    { n: "Punta Cavalluccio",  c: [14.4830, 42.2620], type: "beach", side: "bottom" },
    { n: "Punta Aderci",       c: [14.7030, 42.1550], type: "beach", side: "top" },
    { n: "Vasto",              c: [14.6680, 42.1190], type: "port",  major: true, side: "bottom" },
  ];

  // Route well offshore (east) so it clearly reads as a sea route
  const ROUTE = [
    [14.275, 42.462], [14.345, 42.415], [14.420, 42.378],
    [14.490, 42.340], [14.535, 42.295], [14.575, 42.250],
    [14.660, 42.195], [14.730, 42.150],
  ];

  // rotate the map so the Pescara->Vasto coast sits horizontally (everything reads cleanly)
  function bearingBetween(a, b) {
    const toR = d => d * Math.PI / 180, toD = r => r * 180 / Math.PI;
    const y = Math.sin(toR(b[0] - a[0])) * Math.cos(toR(b[1]));
    const x = Math.cos(toR(a[1])) * Math.sin(toR(b[1])) - Math.sin(toR(a[1])) * Math.cos(toR(b[1])) * Math.cos(toR(b[0] - a[0]));
    return (toD(Math.atan2(y, x)) + 360) % 360;
  }
  const BEARING = bearingBetween([14.2156, 42.4664], [14.6680, 42.1190]) - 90;

  let started = false;
  function init() {
    if (started) return; started = true;

    const BOUNDS = [[14.18, 42.09], [14.78, 42.50]];
    // keep the coast framed clear of the overlaid text (right side on desktop, top on mobile)
    const pad = () => {
      const w = el.clientWidth || 900;
      return w > 760
        ? { top: 36, bottom: 36, left: Math.min(Math.round(w * 0.48), 560), right: 28 }
        : { top: 18, bottom: 235, left: 22, right: 22 };
    };

    const map = new maplibregl.Map({
      container: "map",
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      bounds: BOUNDS,
      bearing: BEARING,
      fitBoundsOptions: { padding: pad(), bearing: BEARING },
      interactive: false,            // fully fixed view
      attributionControl: { compact: true },
    });

    let rt;
    window.addEventListener("resize", () => {
      clearTimeout(rt);
      rt = setTimeout(() => map.fitBounds(BOUNDS, { padding: pad(), bearing: BEARING, duration: 0 }), 150);
    });

    map.on("load", () => {
      // brand sea colour on water layers
      try {
        map.getStyle().layers.forEach(l => {
          if (l.type === "fill" && /water|ocean|sea|marine/i.test(l.id)) {
            map.setPaintProperty(l.id, "fill-color", "#cfe8f4");
          }
        });
      } catch (e) {}

      // route line (glow + dashed)
      const route = { type: "Feature", geometry: { type: "LineString", coordinates: ROUTE } };
      map.addSource("route", { type: "geojson", data: route });
      map.addLayer({
        id: "route-glow", type: "line", source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#15a3a3", "line-width": 9, "line-opacity": 0.16 },
      });
      map.addLayer({
        id: "route-line", type: "line", source: "route",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#0f7d80", "line-width": 3, "line-dasharray": [1.4, 1.4] },
      });

      // permanent labelled pins
      POIS.forEach(p => {
        const mk = document.createElement("div");
        mk.className = "map-mk map-mk-" + p.type + (p.major ? " map-mk-major" : "") + " side-" + p.side;
        mk.innerHTML = '<span class="map-lbl">' + p.n + '</span><span class="map-dot"></span>';
        new maplibregl.Marker({ element: mk, anchor: p.side === "bottom" ? "top" : "bottom" })
          .setLngLat(p.c)
          .addTo(map);
      });
    });
  }

  // lazy-init when the map scrolls into view
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { init(); io.disconnect(); } });
  }, { rootMargin: "250px" });
  io.observe(el);
})();
