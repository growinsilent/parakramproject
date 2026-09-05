/**
 * CIVIQ-PARAKRAM-01 - Main Application Orchestrator
 * Connects all subsystems, manages state, handles view transitions and data sync
 */

const App = (() => {
  let wards = [];
  let submissions = [];
  let hotspots = {};
  let projects = [];

  async function init() {
    console.log('Initializing CIVIQ-PARAKRAM 1.0...');
    setupPersonaTabs();
    setupSubNavigationTabs();

    await loadAllData();

    // Initialize all subsystems
    CitizenPortal.init();
    MapEngine.init(wards, submissions, hotspots);
    Analytics.init(hotspots, wards);
    RankingEngine.init(projects);
    PortfolioOptimizer.init();

    updateKPISummaries();
  }

  async function loadAllData() {
    try {
      const [wardsRes, subsRes, hotRes, projRes] = await Promise.all([
        fetch('/api/wards'),
        fetch('/api/submissions'),
        fetch('/api/hotspots'),
        fetch('/api/projects')
      ]);

      wards = await wardsRes.json();
      submissions = await subsRes.json();
      hotspots = await hotRes.json();
      projects = await projRes.json();
    } catch (err) {
      console.error('Data loading error:', err);
    }
  }

  function setupPersonaTabs() {
    const btnPrashasan = document.getElementById('btn-tab-prashasan');
    const btnCitizen = document.getElementById('btn-tab-citizen');
    const prashasanView = document.getElementById('prashasan-view');
    const citizenView = document.getElementById('citizen-view');

    btnPrashasan.addEventListener('click', () => {
      btnPrashasan.classList.add('active');
      btnCitizen.classList.remove('active');
      prashasanView.classList.add('active');
      citizenView.classList.remove('active');
    });

    btnCitizen.addEventListener('click', () => {
      btnCitizen.classList.add('active');
      btnPrashasan.classList.remove('active');
      citizenView.classList.add('active');
      prashasanView.classList.remove('active');
    });
  }

  function setupSubNavigationTabs() {
    const subnavBtns = document.querySelectorAll('.subnav-btn');
    const subviewPanels = document.querySelectorAll('.subview-panel');

    subnavBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        subnavBtns.forEach(b => b.classList.remove('active'));
        subviewPanels.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetId = btn.getAttribute('data-subview');
        const targetPanel = document.getElementById(targetId);
        if (targetPanel) {
          targetPanel.classList.add('active');

          // Trigger map invalidateSize if GIS subview opened
          if (targetId === 'gis-map-subview' && window.L && MapEngine) {
            setTimeout(() => {
              const mapEl = document.getElementById('gis-map');
              if (mapEl && mapEl._leaflet_id) {
                // Leaflet redraw fix
                window.dispatchEvent(new Event('resize'));
              }
            }, 100);
          }
        }
      });
    });

    // Inspector tabs toggle inside GIS view
    const inspTabs = document.querySelectorAll('.insp-tab');
    const inspContents = document.querySelectorAll('.insp-content');
    inspTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        inspTabs.forEach(t => t.classList.remove('active'));
        inspContents.forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        const targetTabId = tab.getAttribute('data-tab');
        const targetContent = document.getElementById(targetTabId);
        if (targetContent) targetContent.classList.add('active');
      });
    });
  }

  function updateKPISummaries() {
    const validVoices = submissions.filter(s => !s.anomaly_flag).length;
    const kpiVoices = document.getElementById('kpi-total-voices');
    if (kpiVoices) kpiVoices.textContent = validVoices.toLocaleString();

    const kpiThemes = document.getElementById('kpi-themes-count');
    if (kpiThemes && hotspots.macro_themes) {
      kpiThemes.textContent = `${hotspots.macro_themes.length} Macro`;
    }

    const criticalHotspots = (hotspots.ward_hotspots || []).filter(h => h.quadrant.includes('Critical Priority'));
    const kpiCritical = document.getElementById('kpi-critical-hotspots');
    if (kpiCritical) {
      kpiCritical.textContent = `${criticalHotspots.length} Wards`;
    }
  }

  async function refreshDashboardData() {
    await loadAllData();
    MapEngine.updateData(wards, submissions, hotspots);
    Analytics.init(hotspots, wards);
    RankingEngine.fetchAndRenderRankings();
    PortfolioOptimizer.runOptimization();
    updateKPISummaries();
  }

  return { init, refreshDashboardData };
})();

// Auto bootstrap on DOM load
window.App = App;
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
