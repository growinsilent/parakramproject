/**
 * CIVIQ-PARAKRAM 1.0 - Analytics & Evidentiary Data Fusion Engine
 * Implements Chart.js Perception vs Reality Quadrant Matrix and Demographic Integrations
 */

const Analytics = (() => {
  let scatterChart = null;

  function init(hotspotsData, wardsData) {
    renderPerceptionRealityMatrix(hotspotsData?.ward_hotspots || []);
    renderVulnerabilityTable(wardsData, hotspotsData?.ward_hotspots || []);
    renderMacroThemes(hotspotsData?.macro_themes || []);
  }

  function renderPerceptionRealityMatrix(wardHotspots) {
    const canvas = document.getElementById('quadrantScatterChart');
    if (!canvas || !window.Chart) return;

    if (scatterChart) {
      scatterChart.destroy();
    }

    const scatterData = wardHotspots.map(w => {
      let ptColor = '#10B981';
      if (w.quadrant.includes('Critical Priority')) ptColor = '#EF4444';
      else if (w.quadrant.includes('Civic Blindspot')) ptColor = '#F59E0B';
      else if (w.quadrant.includes('Maintenance / Perception')) ptColor = '#8B5CF6';

      return {
        x: w.total_submissions,
        y: w.infrastructure_gap_score,
        label: `${w.ward_id}: ${w.ward_name}`,
        quadrant: w.quadrant,
        pointBackgroundColor: ptColor,
        pointBorderColor: '#FFFFFF',
        pointRadius: 8,
        pointHoverRadius: 12
      };
    });

    scatterChart = new Chart(canvas, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Wards',
          data: scatterData,
          backgroundColor: scatterData.map(d => d.pointBackgroundColor),
          borderColor: '#FFFFFF',
          borderWidth: 1.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(14, 21, 38, 0.95)',
            titleColor: '#06B6D4',
            bodyColor: '#F8FAFC',
            borderColor: 'rgba(6, 182, 212, 0.4)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              title: (ctx) => ctx[0].raw.label,
              label: (ctx) => [
                `Citizen Demand: ${ctx.raw.x} submissions`,
                `Objective Infra Gap: ${(ctx.raw.y * 100).toFixed(0)}%`,
                `Category: ${ctx.raw.quadrant}`
              ]
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Citizen Articulated Demand Volume →',
              color: '#94A3B8',
              font: { weight: '600', size: 12 }
            },
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: { color: '#94A3B8' },
            min: 0,
            max: 10
          },
          y: {
            title: {
              display: true,
              text: 'Objective Infrastructure Deficit (UDISE/PHC/JJM) →',
              color: '#94A3B8',
              font: { weight: '600', size: 12 }
            },
            grid: { color: 'rgba(255, 255, 255, 0.06)' },
            ticks: {
              color: '#94A3B8',
              callback: (val) => `${(val * 100).toFixed(0)}%`
            },
            min: 0,
            max: 1.0
          }
        }
      }
    });
  }

  function renderVulnerabilityTable(wards, wardHotspots) {
    const tbody = document.getElementById('vulnerability-table-body');
    if (!tbody) return;

    // Sort by vulnerability index descending
    const sorted = [...wards].sort((a, b) => b.vulnerability_index - a.vulnerability_index);

    tbody.innerHTML = sorted.map(w => {
      const hotspot = wardHotspots.find(h => h.ward_id === w.id);
      const gapScore = hotspot ? (hotspot.infrastructure_gap_score * 100).toFixed(0) : '45';

      let vulnClass = 'color: #10B981; font-weight:700;';
      if (w.vulnerability_index > 0.7) vulnClass = 'color: #EF4444; font-weight:700;';
      else if (w.vulnerability_index > 0.4) vulnClass = 'color: #F59E0B; font-weight:700;';

      return `
        <tr>
          <td>
            <strong>${w.id}</strong>: ${w.name}
            <div style="font-size:0.7rem; color:#64748B;">${w.type}</div>
          </td>
          <td>${w.population.toLocaleString()}</td>
          <td>${w.sc_st_pct}%</td>
          <td>${w.youth_unemployment_pct}%</td>
          <td><span style="color:#06B6D4;">${gapScore}%</span></td>
          <td style="${vulnClass}">${w.vulnerability_index}</td>
        </tr>
      `;
    }).join('');
  }

  function renderMacroThemes(themes) {
    const container = document.getElementById('themes-container');
    if (!container) return;

    container.innerHTML = themes.map(t => `
      <div class="theme-card">
        <div class="theme-header">
          <span class="theme-title">${t.title}</span>
          <span class="theme-count">${t.mentions} Voices</span>
        </div>
        <p class="theme-desc">${t.cluster_summary}</p>
        <div class="theme-meta">
          <span style="color:#F43F5E; font-weight:600;">${t.severity}</span>
          <span>Primary: ${t.primary_wards.join(', ')}</span>
        </div>
      </div>
    `).join('');
  }

  return { init };
})();
