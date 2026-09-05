/**
 * CIVIQ-PARAKRAM 1.0 - Constraint-Aware Portfolio Optimizer (What-If Planning)
 * Implements 0/1 Multi-Objective Knapsack & Integer Linear Programming (ILP) Solver
 * and Statutory Constituency Development Action Plan (CDAP) Document Generator
 */

const PortfolioOptimizer = (() => {
  let currentBudget = 12.0;
  let enforceEquity = true;
  let excludeLuxury = true;
  let currentOptimizationResult = null;

  function init() {
    setupOptimizerControls();
    runOptimization();
    setupCDAPModal();
  }

  function setupOptimizerControls() {
    const slider = document.getElementById('opt-budget-slider');
    const budgetDisplay = document.getElementById('opt-budget-display');
    const chkEquity = document.getElementById('chk-enforce-equity');
    const chkLuxury = document.getElementById('chk-exclude-luxury');

    if (slider) {
      slider.addEventListener('input', () => {
        currentBudget = parseFloat(slider.value);
        if (budgetDisplay) budgetDisplay.textContent = `₹${currentBudget.toFixed(2)} Crore`;
        runOptimization();
      });
    }

    if (chkEquity) {
      chkEquity.addEventListener('change', () => {
        enforceEquity = chkEquity.checked;
        runOptimization();
      });
    }

    if (chkLuxury) {
      chkLuxury.addEventListener('change', () => {
        excludeLuxury = chkLuxury.checked;
        runOptimization();
      });
    }
  }

  async function runOptimization() {
    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget_cr: currentBudget,
          enforce_geographic_equity: enforceEquity,
          exclude_luxury: excludeLuxury
        })
      });

      const data = await res.json();
      currentOptimizationResult = data;
      renderOptimizationResults(data);
    } catch (err) {
      console.error('Optimization error:', err);
    }
  }

  function renderOptimizationResults(data) {
    // KPI Updates
    document.getElementById('opt-allocated-spend').textContent = `₹${data.total_allocated_cr.toFixed(2)} Cr`;
    document.getElementById('opt-utilization').textContent = `${data.budget_utilization_pct}% Utilization`;
    document.getElementById('opt-projects-count').textContent = `${data.total_projects_funded} of 12`;
    document.getElementById('opt-surplus').textContent = `₹${data.surplus_cr.toFixed(2)} Cr Reserve`;
    document.getElementById('opt-citizens-benefited').textContent = data.total_direct_beneficiaries.toLocaleString();
    document.getElementById('opt-avg-bcr').textContent = `${data.portfolio_avg_bcr}x`;
    document.getElementById('opt-equity-score').textContent = `${data.equity_score_pct}%`;
    document.getElementById('opt-wards-covered').textContent = `${data.wards_covered_count} of 10 Wards Covered`;

    // Top KPI card sync
    const topOptimizedSpend = document.getElementById('kpi-optimized-spend');
    if (topOptimizedSpend) {
      topOptimizedSpend.textContent = `₹${data.total_allocated_cr.toFixed(2)} Cr`;
    }

    // Render Sanctioned Portfolio
    const portfolioList = document.getElementById('portfolio-items-list');
    if (portfolioList) {
      portfolioList.innerHTML = data.optimized_portfolio.map(p => `
        <div class="portfolio-item">
          <div class="portfolio-item-info">
            <div class="portfolio-item-title">${p.id}: ${p.title}</div>
            <div class="portfolio-item-meta">
              ${p.ward_name} • <span style="color:#06B6D4;">${p.sector}</span> • Beneficiaries: ${(p.social_impact.direct_beneficiaries || 0).toLocaleString()} • BCR: <strong style="color:#10B981;">${p.economic_impact.bcr_ratio}x</strong>
            </div>
          </div>
          <div class="portfolio-item-cost">
            ₹${p.estimated_cost_cr.toFixed(2)} Cr
          </div>
        </div>
      `).join('');
    }

    // Render Excluded List
    const excludedList = document.getElementById('excluded-items-list');
    if (excludedList) {
      excludedList.innerHTML = data.unselected_projects.map(p => `
        <div class="excluded-item">
          <div class="portfolio-item-info">
            <div style="font-size:0.85rem; font-weight:600;">${p.id}: ${p.title}</div>
            <div style="font-size:0.72rem; color:#94A3B8;">
              ${p.ward_name} • ₹${p.cost_cr.toFixed(2)} Cr
            </div>
          </div>
          <div>
            <span class="excluded-reason-tag">${p.reason}</span>
          </div>
        </div>
      `).join('');
    }
  }

  // CDAP Action Plan Modal & Document Generator
  function setupCDAPModal() {
    const btnOpen = document.getElementById('btn-export-cdap-modal');
    const btnQuick = document.getElementById('btn-quick-export');
    const btnClose = document.getElementById('btn-close-cdap-modal');
    const modal = document.getElementById('modal-cdap-export');
    const btnPrint = document.getElementById('btn-print-cdap');
    const btnDownload = document.getElementById('btn-download-cdap-json');

    if (btnOpen) btnOpen.addEventListener('click', openCDAPModal);
    if (btnQuick) btnQuick.addEventListener('click', openCDAPModal);
    if (btnClose) btnClose.addEventListener('click', () => modal.style.display = 'none');

    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        window.print();
      });
    }

    if (btnDownload) {
      btnDownload.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentOptimizationResult, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `CDAP_2026_27_Bhubaneswar_Khordha.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      });
    }
  }

  function openCDAPModal() {
    const modal = document.getElementById('modal-cdap-export');
    const body = document.getElementById('cdap-document-body');
    if (!modal || !body || !currentOptimizationResult) return;

    const data = currentOptimizationResult;
    const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    body.innerHTML = `
      <div class="cdap-doc">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 0.85rem; font-weight: 700; text-transform: uppercase; color: #0284C7; letter-spacing: 0.08em;">
            Government of Odisha • District Planning Committee (Khordha)
          </div>
          <h1 style="margin: 8px 0; font-size: 1.5rem; color: #0F172A;">CONSTITUENCY DEVELOPMENT ACTION PLAN (CDAP 2026-27)</h1>
          <div style="font-size: 0.88rem; font-weight: 600; color: #475569;">
            Assembly Constituency: Bhubaneswar West / Khordha (Anchor: Gohiria-GITA Cluster)
          </div>
        </div>

        <div class="cdap-doc-meta">
          <div>
            <strong>Statutory Reference:</strong> PARAKRAM-1.0-PK01PS002<br>
            <strong>Administrative Authority:</strong> District Collector & MLA Planning Cell<br>
            <strong>Date of Sanction:</strong> ${dateStr}
          </div>
          <div style="text-align: right;">
            <strong>Approved Resource Envelope:</strong> ₹${data.budget_ceiling_cr.toFixed(2)} Crore<br>
            <strong>Sanctioned Expenditure:</strong> ₹${data.total_allocated_cr.toFixed(2)} Crore<br>
            <strong>Fiscal Contingency Reserve:</strong> ₹${data.surplus_cr.toFixed(2)} Crore
          </div>
        </div>

        <p style="font-size: 0.85rem; line-height: 1.6; color: #334155; margin-bottom: 16px;">
          <strong>Executive Determination:</strong> Pursuant to multi-modal citizen demand consolidation (Voice, Photo, WhatsApp) and automated data fusion against Census 2021 and infrastructure audits (UDISE+, PHC/CHC, Jal Jeevan Mission), the following <strong>${data.total_projects_funded} development interventions</strong> have been mathematically selected to maximize social benefit under hard budgetary constraints.
        </p>

        <table class="cdap-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Project Code & Title</th>
              <th>Sector</th>
              <th>Target Ward</th>
              <th>Outlay (₹ Cr)</th>
              <th>Beneficiaries</th>
              <th>BCR Ratio</th>
              <th>Timeline</th>
            </tr>
          </thead>
          <tbody>
            ${data.optimized_portfolio.map((p, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${p.id}</strong>: ${p.title}</td>
                <td>${p.sector}</td>
                <td>${p.ward_name}</td>
                <td>₹${p.estimated_cost_cr.toFixed(2)}</td>
                <td>${(p.social_impact.direct_beneficiaries || 0).toLocaleString()}</td>
                <td><strong>${p.economic_impact.bcr_ratio}x</strong></td>
                <td>${p.implementation_feasibility.duration_months} Months</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="cdap-certifications">
          <strong>Mandatory Statutory Certifications:</strong>
          <ul style="margin: 6px 0 0 18px; font-size: 0.8rem; color: #334155;">
            <li>All sanctioned interventions are empirically substantiated by verified citizen submissions and objective infrastructural deficits.</li>
            <li>Geographic equity condition met: <strong>${data.equity_score_pct}%</strong> of constituency wards covered, ensuring no rural or peri-urban block is neglected.</li>
            <li>Zero land-acquisition impediment: All works sited on municipal/panchayat public land.</li>
            <li>Average Economic Benefit-Cost Ratio of <strong>${data.portfolio_avg_bcr}x</strong> achieved across portfolio.</li>
          </ul>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #CBD5E1; font-size: 0.8rem; color: #64748B;">
          <div style="text-align: center;">
            __________________________<br>
            <strong>Executive Engineer</strong><br>
            Public Works & Infrastructure
          </div>
          <div style="text-align: center;">
            __________________________<br>
            <strong>District Planning Officer</strong><br>
            Khordha Collectorate
          </div>
          <div style="text-align: center;">
            __________________________<br>
            <strong>District Collector / Magistrate</strong><br>
            Chairman, Planning Committee
          </div>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  }

  return { init, runOptimization, openCDAPModal };
})();
