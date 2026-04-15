// popup.js — LangChain multi-model settings

const MODELS = {
  anthropic: [
    { id: "claude-3-5-haiku-latest", label: "Claude 3.5 Haiku — cheapest & fast" },
    { id: "claude-3-5-sonnet-latest", label: "Claude 3.5 Sonnet — balanced" },
    { id: "claude-3-opus-latest", label: "Claude 3 Opus — most powerful" },
  ],
  openai: [
    { id: "gpt-4o-mini", label: "GPT-4o Mini — cheapest" },
    { id: "gpt-4o", label: "GPT-4o — balanced" },
    { id: "gpt-4-turbo", label: "GPT-4 Turbo — powerful" },
  ],
  google: [
    { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash — fast" },
    { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro — powerful" },
  ],
  mistral: [
    { id: "mistral-small-latest", label: "Mistral Small — cheap" },
    { id: "mistral-large-latest", label: "Mistral Large — powerful" },
  ],
  ollama: [
    { id: "llama3", label: "Llama 3" },
    { id: "mistral", label: "Mistral" },
    { id: "phi3", label: "Phi-3" },
  ]
};

const API_HINTS = {
  anthropic: 'Get free key at <a href="https://console.anthropic.com" target="_blank">console.anthropic.com</a>',
  openai: 'Get key at <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com/api-keys</a>',
  google: 'Get key at <a href="https://aistudio.google.com/app/apikey" target="_blank">aistudio.google.com</a>',
  mistral: 'Get key at <a href="https://console.mistral.ai" target="_blank">console.mistral.ai</a>',
  ollama: ''
};

let isShowing = false;

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  checkServer();

  document.getElementById('server-badge').addEventListener('click', checkServer);
  document.getElementById('provider-select').addEventListener('change', onProviderChange);
  document.getElementById('model-select').addEventListener('change', (e) => selectChip(e.target.value));
  document.getElementById('show-btn').addEventListener('click', toggleShow);
  document.getElementById('save-btn').addEventListener('click', saveSettings);

  document.getElementById('chip-row').addEventListener('click', (e) => {
    if (e.target.classList.contains('model-chip')) {
      const modelId = e.target.dataset.id;
      if (modelId) selectChip(modelId);
    }
  });
});

async function loadSettings() {
  const data = await chrome.storage.local.get(['provider', 'model', 'apiKey']);
  const provider = data.provider || 'anthropic';

  document.getElementById('provider-select').value = provider;
  renderModels(provider, data.model);
  if (data.apiKey) document.getElementById('api-key').value = data.apiKey;
  updateProviderUI(provider);
}

function renderModels(provider, selectedModel) {
  const sel = document.getElementById('model-select');
  const chips = document.getElementById('chip-row');
  const list = MODELS[provider] || [];

  sel.innerHTML = list.map(m =>
    `<option value="${m.id}" ${m.id === selectedModel ? 'selected' : ''}>${m.label}</option>`
  ).join('');

  chips.innerHTML = list.map(m =>
    `<div class="model-chip ${m.id === (selectedModel || list[0]?.id) ? 'active' : ''}" 
      data-id="${m.id}">${m.label.split(' — ')[0]}</div>`
  ).join('');
}

function selectChip(modelId) {
  document.getElementById('model-select').value = modelId;
  renderModels(document.getElementById('provider-select').value, modelId);
}

function onProviderChange() {
  const provider = document.getElementById('provider-select').value;
  renderModels(provider, null);
  updateProviderUI(provider);
  document.getElementById('api-key').value = '';
}

function updateProviderUI(provider) {
  const isOllama = provider === 'ollama';
  document.getElementById('api-key-section').style.display = isOllama ? 'none' : 'block';
  document.getElementById('ollama-note').classList.toggle('show', isOllama);
  document.getElementById('api-hint').innerHTML = API_HINTS[provider] || '';
}

function toggleShow() {
  isShowing = !isShowing;
  const input = document.getElementById('api-key');
  input.type = isShowing ? 'text' : 'password';
  document.getElementById('show-btn').textContent = isShowing ? 'hide' : 'show';
}

async function saveSettings() {
  const provider = document.getElementById('provider-select').value;
  const model = document.getElementById('model-select').value;
  const apiKey = document.getElementById('api-key').value.trim();

  await chrome.storage.local.set({ provider, model, apiKey });

  const msg = document.getElementById('saved-msg');
  msg.style.display = 'block';
  setTimeout(() => { msg.style.display = 'none'; }, 3000);
}

async function checkServer() {
  const badge = document.getElementById('server-badge');
  const txt = document.getElementById('server-txt');
  badge.className = 'server-badge';
  txt.textContent = 'checking…';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('http://localhost:5000/health', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      badge.classList.add('ok');
      txt.textContent = 'server ok';
    } else {
      throw new Error();
    }
  } catch {
    badge.classList.add('error');
    txt.textContent = 'server offline';
  }
}
