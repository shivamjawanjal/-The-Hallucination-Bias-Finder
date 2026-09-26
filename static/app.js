/**
 * Prompt Detective - Frontend Logic & Epistemic Audit Client
 */

// Global State
let appState = {
  presets: {},
  currentAudit: null,
  currentSourceText: '',
  chatMessages: [],
  apiKey: localStorage.getItem('prompt_detective_gemini_key') || '',
  selectedModel: localStorage.getItem('prompt_detective_model') || 'gemini-2.5-flash',
  promptsData: null,
  activePromptSnippet: 'system',
  isAuditing: false
};

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
  initInputListeners();
  await checkSystemHealth();
  await fetchPresets();
  await fetchPrompts();
  
  // Set saved settings in modal inputs
  if (appState.apiKey) {
    const keyInput = document.getElementById('gemini-api-key-input');
    if (keyInput) keyInput.value = appState.apiKey;
  }
  const modelSelect = document.getElementById('model-select');
  if (modelSelect && appState.selectedModel) {
    modelSelect.value = appState.selectedModel;
  }

  // Load initial preset automatically so the user immediately sees content
  loadPreset('historical_hallucination');
});

// ----------------- System Health & Presets ----------------- //
async function checkSystemHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    const statusLabel = document.getElementById('status-label');
    const statusPill = document.getElementById('system-status-pill');
    const dot = statusPill.querySelector('.status-dot');

    if (appState.apiKey) {
      statusLabel.textContent = `Live API (${appState.selectedModel})`;
      dot.className = 'status-dot live-api';
    } else if (data.has_env_key) {
      statusLabel.textContent = `Server API (${data.default_model})`;
      dot.className = 'status-dot live-api';
    } else {
      statusLabel.textContent = 'Demo Simulation (Offline)';
      dot.className = 'status-dot online';
    }
  } catch (err) {
    console.warn('Backend connection note:', err);
  }
}

async function fetchPresets() {
  try {
    const res = await fetch('/api/presets');
    appState.presets = await res.json();
  } catch (err) {
    console.error('Failed to load presets:', err);
  }
}

async function fetchPrompts() {
  try {
    const res = await fetch('/api/prompts');
    appState.promptsData = await res.json();
    showPromptSnippet('system');
  } catch (err) {
    console.error('Failed to load prompts:', err);
  }
}

// ----------------- Input & Presets Handling ----------------- //
function initInputListeners() {
  const textarea = document.getElementById('source-text-input');
  if (textarea) {
    textarea.addEventListener('input', () => {
      updateWordCount(textarea.value);
    });
  }
}

function updateWordCount(text) {
  const charCountEl = document.getElementById('char-count');
  if (!charCountEl) return;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  charCountEl.textContent = `${words} words (${chars} chars)`;
}

function loadPreset(presetKey) {
  // Update chips styling
  document.querySelectorAll('.preset-chip').forEach(btn => btn.classList.remove('active-preset'));
  const activeBtn = document.querySelector(`[onclick="loadPreset('${presetKey}')"]`);
  if (activeBtn) activeBtn.classList.add('active-preset');

  const textarea = document.getElementById('source-text-input');
  if (appState.presets && appState.presets[presetKey]) {
    textarea.value = appState.presets[presetKey].text.trim();
    updateWordCount(textarea.value);
  }
}

function clearInput() {
  const textarea = document.getElementById('source-text-input');
  textarea.value = '';
  updateWordCount('');
  textarea.focus();
}

async function pasteClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    const textarea = document.getElementById('source-text-input');
    textarea.value = text;
    updateWordCount(text);
    showToast('Pasted content from clipboard');
  } catch (err) {
    showToast('Clipboard access denied or unsupported');
  }
}

// ----------------- Audit Execution ----------------- //
async function runEpistemicAudit() {
  const textarea = document.getElementById('source-text-input');
  const text = textarea.value.trim();

  if (!text) {
    showToast('Please provide text or select a preset to audit.');
    return;
  }

  const rigor = document.getElementById('rigor-select').value;
  const framework = document.getElementById('framework-select').value;
  const runBtn = document.getElementById('run-audit-btn');

  // UI state to Loading
  appState.isAuditing = true;
  runBtn.disabled = true;
  document.getElementById('empty-state-view').style.display = 'none';
  document.getElementById('active-results-view').style.display = 'none';
  document.getElementById('loading-state-view').style.display = 'flex';

  // Animated progress texts for academic presentation effect
  const stages = [
    { title: "Deconstructing Atomic Claims...", sub: "Phase 1: Parsing assertions via Semantic Chunking..." },
    { title: "Formulating Orthogonal Queries...", sub: "Phase 2: Generating unbiased verification questions via CoVe..." },
    { title: "Cross-Referencing Ground Truth...", sub: "Phase 3: Validating claims against empirical consensus..." },
    { title: "Synthesizing Cognitive Fallacies...", sub: "Phase 4: Structuring JSON schema and risk metrics..." }
  ];

  let stageIndex = 0;
  const stageInterval = setInterval(() => {
    stageIndex = (stageIndex + 1) % stages.length;
    document.getElementById('loading-stage-text').textContent = stages[stageIndex].title;
    document.querySelector('.loading-subtitle').textContent = stages[stageIndex].sub;
    
    // Update dots
    const dots = document.querySelectorAll('.p-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx <= stageIndex);
    });
  }, 700);

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        api_key: appState.apiKey,
        model_name: appState.selectedModel,
        rigor: rigor,
        framework: framework
      })
    });

    const data = await res.json();
    clearInterval(stageInterval);

    appState.currentAudit = data;
    appState.currentSourceText = text;
    
    // Render Results
    renderAuditResults(data);
    updateSidebarContext(data, text);

    document.getElementById('loading-state-view').style.display = 'none';
    document.getElementById('active-results-view').style.display = 'block';

    showToast('Epistemic audit completed successfully');
  } catch (err) {
    clearInterval(stageInterval);
    console.error('Audit failed:', err);
    document.getElementById('loading-state-view').style.display = 'none';
    document.getElementById('empty-state-view').style.display = 'flex';
    showToast('Audit request failed. Please check network connection.');
  } finally {
    appState.isAuditing = false;
    runBtn.disabled = false;
  }
}

// ----------------- Results Rendering ----------------- //
function renderAuditResults(data) {
  // 1. Factuality Gauge
  const factScore = data.factuality_score !== undefined ? data.factuality_score : 50;
  document.getElementById('factuality-score-val').textContent = `${factScore}%`;
  setCircleProgress('factuality-ring', factScore, '#10b981');
  
  const factRatingEl = document.getElementById('factuality-rating');
  if (factScore >= 80) {
    factRatingEl.textContent = 'High Epistemic Calibration';
    factRatingEl.style.color = 'var(--status-verified)';
  } else if (factScore >= 45) {
    factRatingEl.textContent = 'Mixed / Questionable';
    factRatingEl.style.color = 'var(--status-questionable)';
  } else {
    factRatingEl.textContent = 'Severe Fabrications';
    factRatingEl.style.color = 'var(--status-hallucination)';
  }

  // 2. Hallucination Risk Badge
  const riskVal = data.hallucination_risk || 'Medium';
  const riskPill = document.getElementById('hallucination-risk-val');
  riskPill.textContent = riskVal;
  riskPill.className = `risk-pill-large risk-${riskVal.toLowerCase()}`;

  // 3. Bias Index Gauge
  const biasScore = data.bias_index !== undefined ? data.bias_index : 20;
  document.getElementById('bias-index-val').textContent = `${biasScore}%`;
  setCircleProgress('bias-ring', biasScore, '#f59e0b');

  const biasRatingEl = document.getElementById('bias-rating');
  if (biasScore >= 60) {
    biasRatingEl.textContent = 'Heavy Rhetorical Distortion';
    biasRatingEl.style.color = 'var(--status-hallucination)';
  } else if (biasScore >= 30) {
    biasRatingEl.textContent = 'Moderate Framing Bias';
    biasRatingEl.style.color = 'var(--status-questionable)';
  } else {
    biasRatingEl.textContent = 'Objective & Balanced';
    biasRatingEl.style.color = 'var(--status-verified)';
  }

  // 4. Executive Summary
  document.getElementById('audit-summary-text').textContent = data.summary || 'Audit evaluation complete.';

  // 5. Claims Count Chips
  const claims = data.claims || [];
  const verifiedCount = claims.filter(c => c.status === 'VERIFIED').length;
  const hallucinationCount = claims.filter(c => c.status === 'HALLUCINATION').length;
  const questionableCount = claims.filter(c => c.status === 'QUESTIONABLE' || c.status === 'UNVERIFIABLE').length;

  document.getElementById('count-verified').textContent = `${verifiedCount} Verified`;
  document.getElementById('count-hallucination').textContent = `${hallucinationCount} Hallucinations`;
  document.getElementById('count-questionable').textContent = `${questionableCount} Questionable`;

  // 6. Claims Dossier List
  const claimsContainer = document.getElementById('claims-list-container');
  claimsContainer.innerHTML = '';

  claims.forEach((claim, idx) => {
    const card = document.createElement('div');
    card.className = `claim-card ${idx === 0 ? 'expanded' : ''}`; // Expand first card by default
    card.id = `claim-card-${claim.id || idx + 1}`;

    const statusClass = `status-${(claim.status || 'questionable').toLowerCase()}`;
    const fallacyHtml = claim.bias_fallacy_detected && claim.bias_fallacy_detected !== 'None'
      ? `<div class="dossier-field">
           <span class="dossier-label">Detected Fallacy / Bias:</span>
           <span class="fallacy-tag">${escapeHtml(claim.bias_fallacy_detected)}</span>
         </div>`
      : '';

    card.innerHTML = `
      <div class="claim-summary-bar" onclick="toggleClaimAccordion('${card.id}')">
        <div class="claim-summary-left">
          <span class="claim-id-badge">#${claim.id || idx + 1}</span>
          <span class="claim-assertion-text">${escapeHtml(claim.atomic_claim || claim.original_segment)}</span>
        </div>
        <div class="claim-summary-right">
          <span class="status-badge ${statusClass}">${escapeHtml(claim.status || 'AUDITED')}</span>
          <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
      <div class="claim-dossier-body">
        <div class="dossier-field">
          <span class="dossier-label">Original Quoted Segment:</span>
          <p class="dossier-quote">"${escapeHtml(claim.original_segment || '')}"</p>
        </div>
        <div class="dossier-field">
          <span class="dossier-label">CoVe Orthogonal Query:</span>
          <p class="dossier-value">❓ ${escapeHtml(claim.verification_question || 'Formulated verification query.')}</p>
        </div>
        <div class="dossier-field">
          <span class="dossier-label">Empirical Baseline Truth:</span>
          <p class="dossier-value">🛡️ ${escapeHtml(claim.verification_fact || 'Empirical evidence recorded.')}</p>
        </div>
        ${fallacyHtml}
        <div class="dossier-field">
          <span class="dossier-label">Epistemic Verdict Rationale:</span>
          <p class="dossier-value">${escapeHtml(claim.explanation || '')}</p>
        </div>
      </div>
    `;

    claimsContainer.appendChild(card);
  });

  // 7. Factual Neutralized Rewrite
  document.getElementById('factual-rewrite-text').textContent = data.factual_rewrite || 'Factual calibration in progress.';
}

function toggleClaimAccordion(cardId) {
  const card = document.getElementById(cardId);
  if (card) {
    card.classList.toggle('expanded');
  }
}

function setCircleProgress(elementId, percentage, color) {
  const circle = document.getElementById(elementId);
  if (!circle) return;
  const radius = circle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius; // ~201.06
  
  circle.style.strokeDasharray = `${circumference}`;
  const offset = circumference - (percentage / 100) * circumference;
  circle.style.strokeDashoffset = offset;
  circle.style.stroke = color;
}

// ----------------- Copy Actions ----------------- //
function copyExecutiveSummary() {
  const text = document.getElementById('audit-summary-text').textContent;
  navigator.clipboard.writeText(text);
  showToast('Executive Summary copied to clipboard');
}

function copyRewriteText() {
  const text = document.getElementById('factual-rewrite-text').textContent;
  navigator.clipboard.writeText(text);
  showToast('Factual Rewrite copied to clipboard');
}

// ----------------- Chat with Detective ----------------- //
function updateSidebarContext(auditData, sourceText) {
  const statusEl = document.getElementById('sidebar-context-status');
  const bodyEl = document.getElementById('sidebar-context-body');
  
  statusEl.textContent = 'Active Audit Loaded';
  statusEl.style.color = 'var(--cyan-accent)';
  
  const claimsCount = (auditData.claims || []).length;
  bodyEl.innerHTML = `
    <div style="font-weight:700; color:#fff; margin-bottom:0.3rem;">Current Document Under Audit</div>
    <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.5rem; max-height:60px; overflow:hidden; text-overflow:ellipsis;">"${escapeHtml(sourceText.slice(0, 100))}..."</div>
    <div style="display:flex; justify-content:space-between; font-size:0.75rem; border-top:1px solid var(--border-subtle); padding-top:0.4rem;">
      <span>Factuality: <strong>${auditData.factuality_score}%</strong></span>
      <span>Claims: <strong>${claimsCount}</strong></span>
    </div>
  `;

  // Show badge on chat tab
  const badge = document.getElementById('chat-badge');
  if (badge) {
    badge.style.display = 'inline-flex';
    badge.textContent = claimsCount;
  }
}

async function sendChatMessage() {
  const input = document.getElementById('chat-user-input');
  const message = input.value.trim();
  if (!message) return;

  // Add User message
  addChatBubble('user', message);
  input.value = '';

  // Show typing indicator
  const stream = document.getElementById('chat-stream');
  const typingIndicator = document.createElement('div');
  typingIndicator.className = 'chat-bubble bot-bubble typing-bubble';
  typingIndicator.innerHTML = '<span style="color:var(--cyan-accent);">Detective is analyzing prompt context...</span>';
  stream.appendChild(typingIndicator);
  stream.scrollTop = stream.scrollHeight;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: appState.chatMessages,
        context_text: appState.currentSourceText,
        context_analysis: appState.currentAudit,
        api_key: appState.apiKey,
        model_name: appState.selectedModel
      })
    });

    const data = await res.json();
    typingIndicator.remove();
    addChatBubble('assistant', data.reply);
  } catch (err) {
    typingIndicator.remove();
    addChatBubble('assistant', 'Encountered an issue communicating with the reasoning engine. Please try again.');
  }
}

function addChatBubble(role, text) {
  const stream = document.getElementById('chat-stream');
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${role === 'user' ? 'user-bubble' : 'bot-bubble'}`;

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const nameStr = role === 'user' ? '👤 You' : '🕵️ Prompt Detective';

  bubble.innerHTML = `
    <div class="bubble-header">
      <span class="bot-name">${nameStr}</span>
      <span class="bubble-time">${timeStr}</span>
    </div>
    <div class="bubble-content">${formatChatMarkdown(text)}</div>
  `;

  stream.appendChild(bubble);
  stream.scrollTop = stream.scrollHeight;

  appState.chatMessages.push({ role, content: text });
}

function sendQuickQuestion(questionText) {
  const input = document.getElementById('chat-user-input');
  input.value = questionText;
  sendChatMessage();
}

function formatChatMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br/>');
}

// ----------------- Lab Prompt Inspector ----------------- //
function showPromptSnippet(type) {
  appState.activePromptSnippet = type;
  document.querySelectorAll('.viewer-tab').forEach(tab => tab.classList.remove('active'));
  
  const tabs = document.querySelectorAll('.viewer-tab');
  if (type === 'system' && tabs[0]) tabs[0].classList.add('active');
  if (type === 'chat' && tabs[1]) tabs[1].classList.add('active');
  if (type === 'schema' && tabs[2]) tabs[2].classList.add('active');

  const codeEl = document.getElementById('code-content');
  if (!appState.promptsData) return;

  if (type === 'system') {
    codeEl.textContent = appState.promptsData.system_prompt;
  } else if (type === 'chat') {
    codeEl.textContent = appState.promptsData.chat_system_prompt;
  } else if (type === 'schema') {
    codeEl.textContent = `{
  "summary": "Brief 2-sentence executive summary of the document's reliability.",
  "factuality_score": 0-100,
  "bias_index": 0-100,
  "hallucination_risk": "Low" | "Medium" | "High" | "Critical",
  "claims": [
    {
      "id": 1,
      "original_segment": "Quoted sentence",
      "atomic_claim": "Falsifiable atomic assertion",
      "status": "VERIFIED" | "QUESTIONABLE" | "HALLUCINATION" | "UNVERIFIABLE",
      "confidence": 0-100,
      "verification_question": "Unbiased query formulated via CoVe",
      "verification_fact": "Empirical truth / benchmark evidence",
      "bias_fallacy_detected": "Name of fallacy or 'None'",
      "explanation": "Epistemic rationale"
    }
  ],
  "factual_rewrite": "Calibrated text stripped of hallucinations."
}`;
  }
}

function copyCurrentPromptSnippet() {
  const codeEl = document.getElementById('code-content');
  navigator.clipboard.writeText(codeEl.textContent);
  showToast('Prompt template copied to clipboard');
}

// ----------------- Tab Navigation ----------------- //
function switchTab(tabId) {
  document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(section => section.classList.remove('active'));

  const activeBtn = document.getElementById(`tab-${tabId}-btn`);
  const activeSection = document.getElementById(`tab-${tabId}`);

  if (activeBtn) activeBtn.classList.add('active');
  if (activeSection) activeSection.classList.add('active');

  if (tabId === 'chat') {
    // Focus chat input
    setTimeout(() => {
      const chatInput = document.getElementById('chat-user-input');
      if (chatInput) chatInput.focus();
    }, 150);
  }
}

// ----------------- Modal & Settings ----------------- //
function openSettingsModal() {
  document.getElementById('settings-modal').style.display = 'flex';
}

function closeSettingsModal() {
  document.getElementById('settings-modal').style.display = 'none';
}

function saveSettings() {
  const keyInput = document.getElementById('gemini-api-key-input');
  const modelSelect = document.getElementById('model-select');

  const keyVal = keyInput.value.trim();
  const modelVal = modelSelect.value;

  appState.apiKey = keyVal;
  appState.selectedModel = modelVal;

  if (keyVal) {
    localStorage.setItem('prompt_detective_gemini_key', keyVal);
  } else {
    localStorage.removeItem('prompt_detective_gemini_key');
  }
  localStorage.setItem('prompt_detective_model', modelVal);

  checkSystemHealth();
  closeSettingsModal();
  showToast('API & Model settings updated');
}

// ----------------- Utilities ----------------- //
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}
