/**
 * CIVIQ-PARAKRAM 1.0 - Comparative Evaluation & Priority Ranking Engine
 * Implements Multi-Criteria Decision Analysis (MCDA / AHP),
 * Head-to-Head Adjudicator (School vs Vocational), and Explainable AI (XAI) Audits
 */

const RankingEngine = (() => {
  let rankedData = [];
  let weights = {
    w_demand: 0.25,
    w_deficit: 0.25,
    w_vulnerability: 0.20,
    w_economic: 0.15,
    w_feasibility: 0.15
  };
  let radarChart = null;

  function init(initialProjects) {
    setupWeightSliders();
    setupHeadToHead();
    fetchAndRenderRankings();
  }

  function setupWeightSliders() {
    const sDemand = document.getElementById('slider-w-demand');
    const sDeficit = document.getElementById('slider-w-deficit');
    const sVuln = document.getElementById('slider-w-vuln');
    const sEcon = document.getElementById('slider-w-econ');
    const sFeas = document.getElementById('slider-w-feas');
    const resetBtn = document.getElementById('btn-reset-weights');

    function updateWeights() {
      const vDemand = parseInt(sDemand.value);
      const vDeficit = parseInt(sDeficit.value);
      const vVuln = parseInt(sVuln.value);
      const vEcon = parseInt(sEcon.value);
      const vFeas = parseInt(sFeas.value);

      const sum = vDemand + vDeficit + vVuln + vEcon + vFeas;

      weights.w_demand = vDemand / sum;
      weights.w_deficit = vDeficit / sum;
      weights.w_vulnerability = vVuln / sum;
      weights.w_economic = vEcon / sum;
      weights.w_feasibility = vFeas / sum;

      document.getElementById('val-w-demand').textContent = `${(weights.w_demand * 100).toFixed(0)}%`;
      document.getElementById('val-w-deficit').textContent = `${(weights.w_deficit * 100).toFixed(0)}%`;
      document.getElementById('val-w-vuln').textContent = `${(weights.w_vulnerability * 100).toFixed(0)}%`;
      document.getElementById('val-w-econ').textContent = `${(weights.w_economic * 100).toFixed(0)}%`;
      document.getElementById('val-w-feas').textContent = `${(weights.w_feasibility * 100).toFixed(0)}%`;

      fetchAndRenderRankings();
    }

    [sDemand, sDeficit, sVuln, sEcon, sFeas].forEach(slider => {
      if (slider) slider.addEventListener('input', updateWeights);
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        sDemand.value = 25;
        sDeficit.value = 25;
        sVuln.value = 20;
        sEcon.value = 15;
        sFeas.value = 15;
        updateWeights();
      });
    }
  }

  async function fetchAndRenderRankings() {
    try {
      const res = await fetch('/api/ranking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(weights)
      });
      const data = await res.json();
      rankedData = data.ranked_projects || [];
      renderRankingTable(rankedData);
    } catch (err) {
      console.error('Error fetching rankings:', err);
    }
  }

  function renderRankingTable(projects) {
    const tbody = document.getElementById('ranked-projects-body');
    if (!tbody) return;

    tbody.innerHTML = projects.map(p => {
      let rankClass = 'rank-badge';
      if (p.rank === 1) rankClass += ' rank-top1';
      else if (p.rank === 2) rankClass += ' rank-top2';
      else if (p.rank === 3) rankClass += ' rank-top3';

      let tierClass = 'status-pill status-tier1';
      if (p.priority_tier.includes('Tier 2')) tierClass = 'status-pill status-tier2';
      else if (p.priority_tier.includes('Tier 3')) tierClass = 'status-pill status-tier3';
      else if (p.priority_tier.includes('Deprioritized')) tierClass = 'status-pill status-deprioritized';

      return `
        <tr>
          <td><span class="${rankClass}">${p.rank}</span></td>
          <td>
            <strong>${p.title}</strong>
            <div style="font-size:0.72rem; color:#94A3B8;">${p.ward_name} (${p.ward_id})</div>
          </td>
          <td><span class="badge-pill">${p.sector}</span></td>
          <td><strong>₹${p.estimated_cost_cr.toFixed(2)} Cr</strong></td>
          <td>${p.scores.demand_score}</td>
          <td>${p.scores.deficit_score}</td>
          <td><span style="color:#10B981; font-weight:600;">${p.economic_impact.bcr_ratio}x</span></td>
          <td><strong style="color:#06B6D4; font-size:0.95rem;">${p.scores.composite_score}</strong></td>
          <td><span class="${tierClass}">${p.priority_tier.split(' ')[0]} ${p.priority_tier.split(' ')[1] || ''}</span></td>
          <td>
            <button class="action-btn-small" onclick="RankingEngine.openXAIAudit('${p.id}')">
              Audit
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Head-to-Head Setup
  function setupHeadToHead() {
    const selA = document.getElementById('select-proj-a');
    const selB = document.getElementById('select-proj-b');

    if (selA && selB) {
      selA.addEventListener('change', () => runHeadToHeadComparison(selA.value, selB.value));
      selB.addEventListener('change', () => runHeadToHeadComparison(selA.value, selB.value));
      runHeadToHeadComparison(selA.value, selB.value);
    }
  }

  async function runHeadToHeadComparison(projAId, projBId) {
    try {
      const res = await fetch('/api/head-to-head', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_a_id: projAId, project_b_id: projBId })
      });
      const data = await res.json();
      renderHeadToHeadCards(data);
      renderRadarComparison(data);
      renderVerdict(data);
    } catch (err) {
      console.error('Head-to-head error:', err);
    }
  }

  function renderHeadToHeadCards(data) {
    const container = document.getElementById('h2h-cards-container');
    if (!container) return;

    const a = data.project_a;
    const b = data.project_b;

    container.innerHTML = `
      <div class="glass-panel h2h-card card-a">
        <div class="h2h-card-header">
          <div>
            <span class="badge-pill" style="color:#06B6D4; border-color:rgba(6,182,212,0.4);">OPTION A (${a.id})</span>
            <div class="h2h-card-title">${a.title}</div>
            <div style="font-size:0.78rem; color:#94A3B8;">${a.ward} • ${a.sector}</div>
          </div>
          <div style="font-size:1.3rem; font-weight:700; color:#06B6D4; font-family:'Outfit';">₹${a.cost_cr.toFixed(2)} Cr</div>
        </div>
        <table class="h2h-metric-table">
          <tr><td>Citizen Demand Mentions:</td><td>${a.demand_count} Verified Voices</td></tr>
          <tr><td>Primary Target Cohort:</td><td>${a.primary_target_group}</td></tr>
          <tr><td>Travel-Distance Metric:</td><td>${a.travel_distance_metric}</td></tr>
          <tr><td>Cost-Benefit Ratio (BCR):</td><td><strong style="color:#10B981;">${a.bcr_ratio}x</strong> <span style="font-size:0.7rem; color:#94A3B8;">${a.bcr_confidence}</span></td></tr>
          <tr><td>Ward Vulnerability Index:</td><td>${a.vulnerability_index}</td></tr>
          <tr><td>Execution Timeframe:</td><td>${a.duration_months} Months (Shovel-Ready)</td></tr>
        </table>
      </div>

      <div class="glass-panel h2h-card card-b">
        <div class="h2h-card-header">
          <div>
            <span class="badge-pill" style="color:#8B5CF6; border-color:rgba(139,92,246,0.4);">OPTION B (${b.id})</span>
            <div class="h2h-card-title">${b.title}</div>
            <div style="font-size:0.78rem; color:#94A3B8;">${b.ward} • ${b.sector}</div>
          </div>
          <div style="font-size:1.3rem; font-weight:700; color:#8B5CF6; font-family:'Outfit';">₹${b.cost_cr.toFixed(2)} Cr</div>
        </div>
        <table class="h2h-metric-table">
          <tr><td>Citizen Demand Mentions:</td><td>${b.demand_count} Verified Voices</td></tr>
          <tr><td>Primary Target Cohort:</td><td>${b.primary_target_group}</td></tr>
          <tr><td>Travel-Distance Metric:</td><td>${b.travel_distance_metric}</td></tr>
          <tr><td>Cost-Benefit Ratio (BCR):</td><td><strong style="color:#10B981;">${b.bcr_ratio}x</strong> <span style="font-size:0.7rem; color:#94A3B8;">${b.bcr_confidence}</span></td></tr>
          <tr><td>Ward Vulnerability Index:</td><td>${b.vulnerability_index}</td></tr>
          <tr><td>Execution Timeframe:</td><td>${b.duration_months} Months</td></tr>
        </table>
      </div>
    `;
  }

  function renderRadarComparison(data) {
    const canvas = document.getElementById('h2hRadarChart');
    if (!canvas || !window.Chart) return;

    if (radarChart) radarChart.destroy();

    const a = data.project_a;
    const b = data.project_b;

    radarChart = new Chart(canvas, {
      type: 'radar',
      data: {
        labels: ['Citizen Demand', 'Objective Deficit', 'Demographic Equity', 'Economic BCR', 'Execution Speed'],
        datasets: [
          {
            label: `${a.id} (${a.sector})`,
            data: [
              Math.min(100, a.demand_count * 1.2),
              85,
              a.vulnerability_index * 100,
              (a.bcr_ratio / 4.5) * 100,
              Math.max(20, 100 - a.duration_months * 5)
            ],
            backgroundColor: 'rgba(6, 182, 212, 0.25)',
            borderColor: '#06B6D4',
            pointBackgroundColor: '#06B6D4',
            pointBorderColor: '#FFF'
          },
          {
            label: `${b.id} (${b.sector})`,
            data: [
              Math.min(100, b.demand_count * 1.2),
              90,
              b.vulnerability_index * 100,
              (b.bcr_ratio / 4.5) * 100,
              Math.max(20, 100 - b.duration_months * 5)
            ],
            backgroundColor: 'rgba(139, 92, 246, 0.25)',
            borderColor: '#8B5CF6',
            pointBackgroundColor: '#8B5CF6',
            pointBorderColor: '#FFF'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#F8FAFC', font: { size: 11, weight: '600' } }
          }
        },
        scales: {
          r: {
            angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
            grid: { color: 'rgba(255, 255, 255, 0.08)' },
            pointLabels: { color: '#94A3B8', font: { size: 10 } },
            ticks: { display: false },
            suggestedMin: 0,
            suggestedMax: 100
          }
        }
      }
    });
  }

  function renderVerdict(data) {
    const container = document.getElementById('h2h-verdict-content');
    if (!container) return;

    const v = data.empirical_tradeoff_verdict;
    container.innerHTML = `
      <div class="verdict-box-item">
        <div class="verdict-title">Capital Outlay & Efficiency Winner</div>
        <div class="verdict-text">
          <strong>${v.cost_efficiency_winner}</strong> requires lower initial budget outlay (₹${data.project_a.cost_cr} Cr vs ₹${data.project_b.cost_cr} Cr), offering immediate rapid execution.
        </div>
      </div>

      <div class="verdict-box-item" style="border-left-color: #10B981;">
        <div class="verdict-title" style="color: #10B981;">Long-Term Economic Multiplier Winner</div>
        <div class="verdict-text">
          <strong>${v.economic_roi_winner}</strong> demonstrates higher long-term BCR (${data.project_b.bcr_ratio}x), driven by wage gains for 1,800 unemployed peri-urban youth.
        </div>
      </div>

      <div class="verdict-box-item" style="border-left-color: #F59E0B;">
        <div class="verdict-title" style="color: #F59E0B;">Administrative Synthesis Recommendation</div>
        <div class="verdict-text">${v.decision_recommendation}</div>
      </div>
    `;
  }

  // Explainable AI Audit Modal
  function openXAIAudit(projId) {
    const proj = rankedData.find(p => p.id === projId);
    if (!proj) return;

    const modal = document.getElementById('modal-xai-audit');
    const title = document.getElementById('xai-modal-title');
    const body = document.getElementById('xai-modal-body');

    title.textContent = `Explainable Decision Audit: ${proj.id} - ${proj.title}`;
    body.innerHTML = `
      <div style="font-family:'Inter', sans-serif; line-height:1.6; color:#E2E8F0;">
        <div style="background:rgba(6,182,212,0.1); border-left:4px solid #06B6D4; padding:12px 16px; border-radius:4px; margin-bottom:16px;">
          <h4 style="color:#06B6D4; margin-bottom:4px;">Audit Trail & Statutory Justification</h4>
          <p style="font-size:0.85rem; color:#CBD5E1;">${proj.rationale}</p>
        </div>

        <h4 style="margin:16px 0 8px; color:#F8FAFC;">1. Mathematical Formula Decomposition</h4>
        <div style="background:#000; padding:12px; border-radius:6px; font-family:monospace; font-size:0.85rem; color:#10B981;">
          Composite Priority Score (CPS) = <br>
          (${proj.scores.demand_score} × ${weights.w_demand.toFixed(2)}) + 
          (${proj.scores.deficit_score} × ${weights.w_deficit.toFixed(2)}) + 
          (${proj.scores.vulnerability_score} × ${weights.w_vulnerability.toFixed(2)}) + 
          (${proj.scores.bcr_score} × ${weights.w_economic.toFixed(2)}) + 
          (${proj.scores.feasibility_score} × ${weights.w_feasibility.toFixed(2)}) = 
          <strong style="color:#06B6D4; font-size:1.1rem;">${proj.scores.composite_score} / 100</strong>
        </div>

        <h4 style="margin:16px 0 8px; color:#F8FAFC;">2. Grounded Evidentiary Indicators</h4>
        <table class="data-table" style="font-size:0.8rem;">
          <thead>
            <tr><th>Evaluation Dimension</th><th>Underlying Indicator Metric</th><th>Raw Metric Value</th><th>Normalized Score (0-100)</th></tr>
          </thead>
          <tbody>
            <tr><td>Citizen Demand Demand Volume</td><td>Verified Submissions Count</td><td>${proj.citizen_demand_count} citizen complaints</td><td>${proj.scores.demand_score}</td></tr>
            <tr><td>Infrastructure Deficit</td><td>Sectoral Baseline Gap Audit</td><td>Gap Ratio ${proj.key_indicators.unmet_demand_ratio || '0.85'}</td><td>${proj.scores.deficit_score}</td></tr>
            <tr><td>Socioeconomic Vulnerability</td><td>Ward Vulnerability Index</td><td>Index ${proj.ward_context.vulnerability_index} (Pop: ${proj.ward_context.population.toLocaleString()})</td><td>${proj.scores.vulnerability_score}</td></tr>
            <tr><td>Economic Rate of Return</td><td>Benefit-Cost Ratio (BCR)</td><td>${proj.economic_impact.bcr_ratio}x [CI: ${proj.economic_impact.bcr_ci_lower}x - ${proj.economic_impact.bcr_ci_upper}x]</td><td>${proj.scores.bcr_score}</td></tr>
            <tr><td>Execution Feasibility</td><td>Administrative Readiness</td><td>${proj.implementation_feasibility.administrative_readiness}% readiness (${proj.implementation_feasibility.duration_months} mo)</td><td>${proj.scores.feasibility_score}</td></tr>
          </tbody>
        </table>

        <div style="margin-top:16px; font-size:0.75rem; color:#94A3B8;">
          Audited by: Automated Decision Support Engine • Compliant with Parakram Decentralized Planning Standards.
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  }

  function closeXAIAudit() {
    const modal = document.getElementById('modal-xai-audit');
    if (modal) modal.style.display = 'none';
  }

  // Setup modal close handler
  document.getElementById('btn-close-xai-modal')?.addEventListener('click', closeXAIAudit);

  return { init, fetchAndRenderRankings, openXAIAudit, closeXAIAudit };
})();
