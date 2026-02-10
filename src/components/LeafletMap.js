import { useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS } from '../utils/colors';
import i18n from '../i18n';

/**
 * Componente mapa basado en Leaflet + OpenStreetMap (sin API keys).
 *
 * Props:
 * - markers: [{ id, lat, lng, title, subtitle, color }]
 * - ccaaMarkers: [{ region, lat, lng, total }]
 * - center: { lat, lng }
 * - zoom: number
 * - height: number | string
 * - interactive: boolean (scroll/zoom enabled)
 * - onMarkerPress: (id) => void
 * - onRegionChange: ({ lat, lng, zoom, bounds }) => void
 * - showLegend: boolean
 * - translations: object with translated strings
 */
export default function LeafletMap({
  markers = [],
  ccaaMarkers = [],
  center = { lat: 43.0, lng: -2.0 },
  zoom = 5,
  height = 300,
  interactive = true,
  onMarkerPress,
  onRegionChange,
  showLegend = false,
  singleMarker,
  translations,
}) {
  const webviewRef = useRef(null);

  // Build translations with fallback to i18n.t()
  const t = translations || {
    viewDetail: i18n.t('map.viewDetail'),
    monuments: i18n.t('map.monuments'),
    zoomHint: i18n.t('map.zoomHint'),
    legendCastles: i18n.t('map.legend.castles'),
    legendChurches: i18n.t('map.legend.churches'),
    legendPalaces: i18n.t('map.legend.palaces'),
    legendArchaeology: i18n.t('map.legend.archaeology'),
    legendEthnologic: i18n.t('map.legend.ethnologic'),
    legendOthers: i18n.t('map.legend.others'),
  };

  // Send data updates to the webview
  useEffect(() => {
    if (webviewRef.current) {
      webviewRef.current.postMessage(JSON.stringify({
        type: 'setMarkers',
        markers,
        ccaaMarkers,
      }));
    }
  }, [markers, ccaaMarkers]);

  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'markerPress' && onMarkerPress) {
        onMarkerPress(data.id);
      }
      if (data.type === 'regionChange' && onRegionChange) {
        onRegionChange(data);
      }
    } catch (e) {}
  }, [onMarkerPress, onRegionChange]);

  const html = generateHTML({
    center, zoom, interactive, showLegend, singleMarker, markers, ccaaMarkers, t,
  });

  return (
    <View style={[styles.container, { height }]}>
      <WebView
        ref={webviewRef}
        source={{ html }}
        style={styles.webview}
        onMessage={handleMessage}
        scrollEnabled={interactive}
        nestedScrollEnabled={interactive}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}
      />
    </View>
  );
}

function escapeHTML(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function generateHTML({ center, zoom, interactive, showLegend, singleMarker, markers, ccaaMarkers, t }) {
  const markersJSON = JSON.stringify(markers || []);
  const ccaaJSON = JSON.stringify(ccaaMarkers || []);
  const singleJSON = singleMarker ? JSON.stringify(singleMarker) : 'null';

  const viewDetail = escapeHTML(t.viewDetail);
  const monuments = escapeHTML(t.monuments);
  const zoomHint = escapeHTML(t.zoomHint);
  const legendCastles = escapeHTML(t.legendCastles);
  const legendChurches = escapeHTML(t.legendChurches);
  const legendPalaces = escapeHTML(t.legendPalaces);
  const legendArchaeology = escapeHTML(t.legendArchaeology);
  const legendEthnologic = escapeHTML(t.legendEthnologic);
  const legendOthers = escapeHTML(t.legendOthers);

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body, #map { width:100%; height:100%; }
  .ccaa-marker {
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    border-radius:50%; border:3px solid #fff; color:#fff; font-weight:700;
    box-shadow:0 2px 6px rgba(0,0,0,0.3); text-align:center; line-height:1.1;
  }
  .ccaa-count { font-size:12px; }
  .ccaa-name { font-size:8px; opacity:0.9; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .popup-btn {
    display:block; margin-top:6px; padding:4px 8px; background:#3b82f6; color:#fff;
    border:none; border-radius:4px; cursor:pointer; font-size:12px; text-align:center;
  }
  .legend {
    position:absolute; bottom:10px; left:10px; background:#fff; padding:8px 10px;
    border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,0.2); z-index:1000; font-size:11px;
  }
  .legend-item { display:flex; align-items:center; gap:4px; padding:2px 0; }
  .legend-dot { width:10px; height:10px; border-radius:50%; }
</style>
</head>
<body>
<div id="map"></div>
${showLegend ? `
<div class="legend">
  <div class="legend-item"><span class="legend-dot" style="background:#7c3aed"></span> ${legendCastles}</div>
  <div class="legend-item"><span class="legend-dot" style="background:#be185d"></span> ${legendChurches}</div>
  <div class="legend-item"><span class="legend-dot" style="background:#0369a1"></span> ${legendPalaces}</div>
  <div class="legend-item"><span class="legend-dot" style="background:#92400e"></span> ${legendArchaeology}</div>
  <div class="legend-item"><span class="legend-dot" style="background:#065f46"></span> ${legendEthnologic}</div>
  <div class="legend-item"><span class="legend-dot" style="background:#3b82f6"></span> ${legendOthers}</div>
</div>` : ''}
<script>
var TRANSLATIONS = {
  viewDetail: ${JSON.stringify(t.viewDetail)},
  monuments: ${JSON.stringify(t.monuments)},
  zoomHint: ${JSON.stringify(t.zoomHint)}
};

var map = L.map('map', {
  center: [${center.lat}, ${center.lng}],
  zoom: ${zoom},
  zoomControl: ${interactive},
  dragging: ${interactive},
  scrollWheelZoom: ${interactive},
  touchZoom: ${interactive},
  doubleClickZoom: ${interactive},
});
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap',
  maxZoom: 19,
}).addTo(map);

var markerLayer = L.layerGroup().addTo(map);
var ccaaLayer = L.layerGroup().addTo(map);

// Single marker mode (detail screen)
var single = ${singleJSON};
if (single) {
  L.marker([single.lat, single.lng]).addTo(map)
    .bindPopup(single.title || '').openPopup();
}

// Category color helper
function getCatColor(cat, tipo) {
  cat = (cat||'').toLowerCase(); tipo = (tipo||'').toLowerCase();
  if (cat.includes('arqueol')) return '#92400e';
  if (cat.includes('etnol')) return '#065f46';
  if (cat.includes('obra civil')) return '#475569';
  if (tipo.includes('castillo')||tipo.includes('fortaleza')||tipo.includes('torre')) return '#7c3aed';
  if (tipo.includes('iglesia')||tipo.includes('catedral')||tipo.includes('ermita')||cat.includes('religio')) return '#be185d';
  if (tipo.includes('palacio')||tipo.includes('casa')) return '#0369a1';
  if (tipo.includes('puente')) return '#475569';
  return '#3b82f6';
}

function renderMarkers(data) {
  markerLayer.clearLayers();
  data.forEach(function(m) {
    var color = m.color || getCatColor(m.categoria, m.tipo);
    var circle = L.circleMarker([m.lat, m.lng], {
      radius: 6, fillColor: color, fillOpacity: 0.8, color: '#fff', weight: 1,
    }).addTo(markerLayer);
    circle.bindPopup('<b>'+( m.title||'')+'</b><br>'+(m.subtitle||'')+
      '<button class="popup-btn" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:\\'markerPress\\',id:'+m.id+'}))">' + TRANSLATIONS.viewDetail + '</button>');
  });
}

function renderCCAA(data) {
  ccaaLayer.clearLayers();
  data.forEach(function(c) {
    var count = c.total;
    var size = count > 20000 ? 60 : count > 10000 ? 50 : count > 5000 ? 42 : 35;
    var label = count > 999 ? Math.round(count/1000)+'k' : count;
    var name = (c.region||'').replace('Comunidad de ','').replace('Comunitat ','').replace('Region de ','').substring(0,12);
    var icon = L.divIcon({
      html: '<div class="ccaa-marker" style="width:'+size+'px;height:'+size+'px;background:#3b82f6"><span class="ccaa-count">'+label+'</span><span class="ccaa-name">'+name+'</span></div>',
      className: '',
      iconSize: [size, size],
      iconAnchor: [size/2, size/2],
    });
    L.marker([c.lat, c.lng], { icon: icon }).addTo(ccaaLayer)
      .bindPopup('<b>'+c.region+'</b><br>'+count.toLocaleString()+' ' + TRANSLATIONS.monuments + '<br><small>' + TRANSLATIONS.zoomHint + '</small>');
  });
}

// Initial data
var initMarkers = ${markersJSON};
var initCCAA = ${ccaaJSON};
if (initMarkers.length) renderMarkers(initMarkers);
if (initCCAA.length) renderCCAA(initCCAA);

// Listen for data from React Native
document.addEventListener('message', function(e) { handleMsg(e); });
window.addEventListener('message', function(e) { handleMsg(e); });
function handleMsg(e) {
  try {
    var d = JSON.parse(e.data);
    if (d.type === 'setMarkers') {
      if (d.markers) renderMarkers(d.markers);
      if (d.ccaaMarkers) renderCCAA(d.ccaaMarkers);
    }
  } catch(ex) {}
}

// Notify RN of region changes
map.on('moveend', function() {
  var c = map.getCenter();
  var b = map.getBounds();
  window.ReactNativeWebView.postMessage(JSON.stringify({
    type: 'regionChange',
    lat: c.lat, lng: c.lng, zoom: map.getZoom(),
    bounds: { minLat: b.getSouth(), maxLat: b.getNorth(), minLon: b.getWest(), maxLon: b.getEast() }
  }));
});
</script>
</body>
</html>`;
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 0,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
