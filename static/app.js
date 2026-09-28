/**
 * Simple, Clean Frontend Logic for Hallucination & Bias Finder
 */

const samples = {
  history: `During the Italian Campaign of 1796, Napoleon Bonaparte commanded the Battle of Montebello and personally drafted the Treaty of Verona on June 14th using a newly invented fountain pen supplied by British merchant William Addison. Following this treaty, Napoleon established the Republic of Cisalpine and made Leonardo da Vinci's Mona Lisa the official royal seal.`,
  health: `Drinking warm water with freshly squeezed lemon juice every morning completely alkalizes your bloodstream and prevents 99% of cellular mutations that cause cancer. Recent undisclosed Harvard studies prove that acidity in the body is the sole root cause of all infectious diseases. Furthermore, consuming raw apple cider vinegar permanently dissolves arterial plaque.`,
  science: `Quantum computers leverage quantum mechanical phenomena such as superposition and entanglement to perform calculations. Unlike classical bits that exist in binary states of 0 or 1, qubits can represent probabilistic combinations of both states simultaneously. However, systems currently face engineering hurdles such as quantum decoherence and error rates.`
};

let apiKey = localStorage.getItem('gemini_api_key') || '';

document.addEventListener('DOMContentLoaded', () => {
  const keyInput = document.getElementById('api-key-input');
  if (keyInput && apiKey) {
    keyInput.value = apiKey;
    updateStatusPill(true);
  }
  // Load initial sample so it's ready to test
  loadSample('history');
});

function loadSample(type) {
  const input = document.getElementById('text-input');
  if (samples[type]) {
    input.value = samples[type].trim();
  }
}

function clearInput() {
  const input = document.getElementById('text-input');
  input.value = '';
  input.focus();
}

function toggleApiKeyInput() {
  const bar = document.getElementById('key-bar');
  bar.style.display = bar.style.display === 'none' ? 'block' : 'none';
}

function saveApiKey() {
  const keyInput = document.getElementById('api-key-input');
  apiKey = keyInput.value.trim();
  if (apiKey) {
    localStorage.setItem('gemini_api_key', apiKey);
    updateStatusPill(true);
    showToast('Gemini API key saved!');
  } else {
    localStorage.removeItem('gemini_api_key');
    updateStatusPill(false);
    showToast('API key cleared.');
  }
  toggleApiKeyInput();
}

function updateStatusPill(hasKey) {
  const text = document.getElementById('status-text');
  text.textContent = hasKey ? 'Gemini Live' : 'Demo Ready';
}

async function checkText() {
  const input = document.getElementById('text-input');
  const text = input.value.trim();

  if (!text) {
    showToast('Please enter or paste some text first.');
    return;
  }

  const checkBtn = document.getElementById('check-btn');
  const emptyView = document.getElementById('empty-view');
  const loadingView = document.getElementById('loading-view');
  const reportView = document.getElementById('report-view');

  // Set loading state
  checkBtn.disabled = true;
  emptyView.style.display = 'none';
  reportView.style.display = 'none';
  loadingView.style.display = 'block';

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        api_key: apiKey || null
      })
    });

    const data = await res.json();
    renderReport(data);

    loadingView.style.display = 'none';
    reportView.style.display = 'block';
  } catch (err) {
    console.error(err);
    loadingView.style.display = 'none';
    emptyView.style.display = 'block';
    showToast('Failed to check text. Please try again.');
  } finally {
    checkBtn.disabled = false;
  }
}

function renderReport(data) {
  // 1. Scores
  const risk = data.hallucination_risk || 'Low';
  const riskValue = document.getElementById('risk-value');
  riskValue.textContent = risk;
  riskValue.className = `score-value risk-${risk.toLowerCase()}`;

  document.getElementById('factuality-value').textContent = `${data.factuality_score ?? 80}%`;
  
  const biasScore = data.bias_index ?? 20;
  const biasText = biasScore > 60 ? 'High' : biasScore > 30 ? 'Medium' : 'Low';
  document.getElementById('bias-value').textContent = biasText;

  // 2. Summary
  document.getElementById('summary-text').textContent = data.summary || 'Analysis complete.';

  // 3. Claims List
  const claimsList = document.getElementById('claims-list');
  claimsList.innerHTML = '';

  const claims = data.claims || [];
  claims.forEach((claim) => {
    const item = document.createElement('div');
    const status = (claim.status || 'VERIFIED').toLowerCase();
    item.className = `claim-item status-${status}`;

    let badgeText = 'Verified';
    let badgeClass = 'badge-verified';
    if (status === 'hallucination') {
      badgeText = 'Fake / Hallucination';
      badgeClass = 'badge-hallucination';
    } else if (status === 'questionable' || status === 'unverifiable') {
      badgeText = 'Misleading / Biased';
      badgeClass = 'badge-questionable';
    }

    item.innerHTML = `
      <div class="claim-top-row">
        <span class="badge ${badgeClass}">${badgeText}</span>
        ${claim.bias_fallacy_detected && claim.bias_fallacy_detected !== 'None' ? `<span style="font-size:0.75rem; color:#dc2626; font-weight:600;">⚠️ ${claim.bias_fallacy_detected}</span>` : ''}
      </div>
      <div class="claim-sentence">"${escapeHtml(claim.original_segment || claim.atomic_claim)}"</div>
      <div class="claim-fact"><strong>Fact-Check:</strong> ${escapeHtml(claim.verification_fact || claim.explanation || '')}</div>
    `;

    claimsList.appendChild(item);
  });

  // 4. Corrected Version
  document.getElementById('rewrite-text').textContent = data.factual_rewrite || 'No corrections needed.';
}

function copyRewrite() {
  const text = document.getElementById('rewrite-text').textContent;
  navigator.clipboard.writeText(text);
  showToast('Copied corrected version to clipboard!');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 2500);
}
