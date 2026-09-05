/**
 * CIVIQ-PARAKRAM 1.0 - GIS Map & Spatial Intelligence Engine
 * Built on Leaflet.js for interactive demand hotspots, ward choropleths, and drilldown
 */

const MapEngine = (() => {
  let map = null;
  let heatmapLayer = null;
  let polygonLayers = [];
  let markerLayers = [];
  let heatmapVisible = true;
  let wardsData = [];
  let submissionsData = [];
  let hotspotsData = null;

  const DEFAULT_CENTER = [20.255, 85.785]; // Centered near Gohiria / GITA / West Bhubaneswar
  const DEFAULT_ZOOM = 12;

  function init(wards, submissions, hotspots) {
    wardsData = wards;
    submissionsData = submissions;
    hotspotsData = hotspots;

    if (!document.getElementById('gis-map')) return;

    // Initialize Leaflet Map
    map = L.map('gis-map', {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      attributionControl: false
    });

    // Dark-themed tiles from CartoDB or OpenStreetMap with our dark filter
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    renderWardPolygons();
    renderSubmissionsMarkers('all');
    setupHeatmap();
    setupControls();
  }

  function getQuadrantColor(quadrant) {
    if (quadrant.includes('Critical Priority')) return '#EF4444'; // Red
    if (quadrant.includes('Civic Blindspot')) return '#F59E0B';  // Amber/Orange
    if (quadrant.includes('Maintenance / Perception')) return '#8B5CF6'; // Purple
    return '#10B981'; // Green
  }

  function renderWardPolygons() {
    // Clear old polygons
    polygonLayers.forEach(l => map.removeLayer(l));
    polygonLayers = [];

    const hotspotsList = hotspotsData?.ward_hotspots || [];

    wardsData.forEach(ward => {
      const hotspot = hotspotsList.find(h => h.ward_id === ward.id);
      const quadrant = hotspot?.quadrant || 'Stable';
      const color = getQuadrantColor(quadrant);

      if (ward.polygon_bounds && ward.polygon_bounds.length > 0) {
        const polygon = L.polygon(ward.polygon_bounds, {
          color: color,
          weight: 2,
          opacity: 0.8,
          fillColor: color,
          fillOpacity: 0.18
        }).addTo(map);

        polygon.bindPopup(`
          <div style="font-family: 'Inter', sans-serif; padding: 4px;">
            <div style="font-size: 0.72rem; color: ${color}; font-weight: 700; text-transform: uppercase;">
              ${quadrant}
            </div>
            <h4 style="margin: 4px 0; font-size: 0.95rem; color: #FFF;">${ward.name}</h4>
            <div style="font-size: 0.78rem; color: #94A3B8; margin-bottom: 6px;">
              Pop: ${ward.population.toLocaleString()} • SC/ST: ${ward.sc_st_pct}% • Vuln: ${ward.vulnerability_index}
            </div>
            <div style="font-size: 0.75rem; color: #E2E8F0; background: rgba(255,255,255,0.06); padding: 6px; border-radius: 4px;">
              <strong>Action:</strong> ${hotspot?.action_recommendation || 'Continuous monitoring.'}
            </div>
          </div>
        `);

        polygon.on('click', () => {
          selectWardForDrilldown(ward, hotspot);
        });

        polygonLayers.push(polygon);
      }
    });
  }

  function renderSubmissionsMarkers(sectorFilter = 'all') {
    markerLayers.forEach(m => map.removeLayer(m));
    markerLayers = [];

    const filtered = submissionsData.filter(s => {
      if (s.anomaly_flag) return false;
      if (sectorFilter !== 'all' && s.category !== sectorFilter) return false;
      return true;
    });

    filtered.forEach(sub => {
      if (sub.lat && sub.lng) {
        let badgeColor = '#06B6D4';
        if (sub.category === 'Education') badgeColor = '#3B82F6';
        else if (sub.category === 'Healthcare') badgeColor = '#EF4444';
        else if (sub.category === 'Water & Sanitation') badgeColor = '#06B6D4';
        else if (sub.category === 'Roads & Mobility') badgeColor = '#F59E0B';
        else if (sub.category === 'Youth & Skilling') badgeColor = '#8B5CF6';

        const customIcon = L.divIcon({
          className: 'custom-map-pin',
          html: `<div style="
            width: 14px; 
            height: 14px; 
            background: ${badgeColor}; 
            border: 2px solid #FFF; 
            border-radius: 50%; 
            box-shadow: 0 0 10px ${badgeColor};
          "></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });

        const marker = L.marker([sub.lat, sub.lng], { icon: customIcon }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: 'Inter', sans-serif; max-width: 240px; padding: 2px;">
            <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
              <span style="font-size:0.7rem; color:${badgeColor}; font-weight:700;">${sub.category}</span>
              <span style="font-size:0.68rem; color:#94A3B8;">${sub.id}</span>
            </div>
            <p style="font-size:0.78rem; color:#F8FAFC; margin-bottom: 6px; line-height: 1.35;">${sub.translated_text}</p>
            <div style="font-size:0.7rem; color:#94A3B8;">
              Channel: <strong>${sub.channel.toUpperCase()}</strong> • Urgency: <strong style="color:#F43F5E;">${sub.urgency_score}/5.0</strong>
            </div>
          </div>
        `);

        markerLayers.push(marker);
      }
    });
  }

  function setupHeatmap() {
    if (!window.L || !L.heatLayer) return;

    const heatPoints = submissionsData
      .filter(s => !s.anomaly_flag && s.lat && s.lng)
      .map(s => [s.lat, s.lng, (s.urgency_score || 3.0) / 5.0]);

    if (heatmapLayer) map.removeLayer(heatmapLayer);

    heatmapLayer = L.heatLayer(heatPoints, {
      radius: 35,
      blur: 20,
      maxZoom: 15,
      gradient: { 0.2: '#06B6D4', 0.5: '#10B981', 0.8: '#F59E0B', 1.0: '#EF4444' }
    });

    if (heatmapVisible) {
      heatmapLayer.addTo(map);
    }
  }

  function setupControls() {
    const sectorFilter = document.getElementById('map-sector-filter');
    const toggleHeatmapBtn = document.getElementById('btn-toggle-heatmap');
    const resetMapBtn = document.getElementById('btn-reset-map');

    if (sectorFilter) {
      sectorFilter.addEventListener('change', (e) => {
        renderSubmissionsMarkers(e.target.value);
      });
    }

    if (toggleHeatmapBtn) {
      toggleHeatmapBtn.addEventListener('click', () => {
        heatmapVisible = !heatmapVisible;
        if (heatmapVisible) {
          toggleHeatmapBtn.classList.add('active');
          toggleHeatmapBtn.textContent = 'Heatmap: ON';
          if (heatmapLayer) map.addLayer(heatmapLayer);
        } else {
          toggleHeatmapBtn.classList.remove('active');
          toggleHeatmapBtn.textContent = 'Heatmap: OFF';
          if (heatmapLayer) map.removeLayer(heatmapLayer);
        }
      });
    }

    if (resetMapBtn) {
      resetMapBtn.addEventListener('click', () => {
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      });
    }
  }

  function selectWardForDrilldown(ward, hotspot) {
    // Switch right inspector to drilldown tab
    const tabs = document.querySelectorAll('.insp-tab');
    const contents = document.querySelectorAll('.insp-content');
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));

    const drillTab = document.querySelector('.insp-tab[data-tab="ward-drilldown"]');
    const drillContent = document.getElementById('ward-drilldown');
    if (drillTab && drillContent) {
      drillTab.classList.add('active');
      drillContent.classList.add('active');
    }

    const titleEl = document.getElementById('drilldown-ward-title');
    const bodyEl = document.getElementById('drilldown-ward-body');

    if (titleEl) titleEl.textContent = `${ward.id}: ${ward.name}`;

    const wardSubs = submissionsData.filter(s => s.ward_id === ward.id && !s.anomaly_flag);
    const color = getQuadrantColor(hotspot?.quadrant || '');

    bodyEl.innerHTML = `
      <div class="drilldown-card">
        <div style="background: rgba(255,255,255,0.03); border-left: 3px solid ${color}; padding: 10px; border-radius: 4px;">
          <div style="font-size:0.72rem; color:${color}; font-weight:700; text-transform:uppercase;">
            ${hotspot?.quadrant || 'Grounded Baseline'}
          </div>
          <div style="font-size:0.8rem; color:#E2E8F0; margin-top:2px;">
            ${hotspot?.action_recommendation || 'Standard capital monitoring.'}
          </div>
        </div>

        <div class="drilldown-stat-row">
          <div class="drilldown-stat-box">
            <div class="drilldown-stat-label">Total Population</div>
            <div class="drilldown-stat-value">${ward.population.toLocaleString()}</div>
          </div>
          <div class="drilldown-stat-box">
            <div class="drilldown-stat-label">Vulnerability Index</div>
            <div class="drilldown-stat-value" style="color: ${ward.vulnerability_index > 0.6 ? '#EF4444' : '#10B981'};">
              ${ward.vulnerability_index}
            </div>
          </div>
          <div class="drilldown-stat-box">
            <div class="drilldown-stat-label">SC / ST Ratio</div>
            <div class="drilldown-stat-value">${ward.sc_st_pct}%</div>
          </div>
          <div class="drilldown-stat-box">
            <div class="drilldown-stat-label">Youth Unemployment</div>
            <div class="drilldown-stat-value">${ward.youth_unemployment_pct}%</div>
          </div>
        </div>

        <div style="font-size:0.8rem; font-weight:600; color:#F8FAFC; margin-top:4px;">
          Active Citizen Voices (${wardSubs.length})
        </div>

        <div style="display:flex; flex-direction:column; gap:8px; max-height:220px; overflow-y:auto;">
          ${wardSubs.length === 0 ? '<p style="font-size:0.75rem; color:#64748B;">No recorded citizen complaints yet.</p>' : ''}
          ${wardSubs.map(s => `
            <div style="background:rgba(0,0,0,0.25); border:1px solid rgba(255,255,255,0.05); padding:8px; border-radius:6px;">
              <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:#94A3B8; margin-bottom:2px;">
                <span style="color:#06B6D4; font-weight:600;">${s.category}</span>
                <span>Urgency: ${s.urgency_score}/5.0</span>
              </div>
              <p style="font-size:0.75rem; color:#E2E8F0; line-height:1.35;">${s.translated_text}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function updateData(newWards, newSubmissions, newHotspots) {
    wardsData = newWards;
    submissionsData = newSubmissions;
    hotspotsData = newHotspots;

    renderWardPolygons();
    renderSubmissionsMarkers(document.getElementById('map-sector-filter')?.value || 'all');
    setupHeatmap();
  }

  return { init, updateData, selectWardForDrilldown };
})();
