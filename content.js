// content.js — calls local LangChain backend at localhost:5000

(function () {
  'use strict';

  const BACKEND = 'http://localhost:5000';

  const TEXTAREA_SELECTORS = [
    '#prompt-textarea',
    'textarea[data-id="root"]',
    'div.ProseMirror[contenteditable="true"]',
    '[data-placeholder="How can Claude help you today?"]',
    '[data-placeholder="Reply to Claude…"]',
    'div[contenteditable="true"][aria-label*="prompt"]',
    'rich-textarea div[contenteditable="true"]',
    'textarea#searchbox',
    'div[contenteditable="true"][aria-label*="Ask"]',
    'textarea[class*="GrowingTextArea"]',
    'textarea[placeholder*="Ask"]',
    'textarea[placeholder*="message" i]',
    'textarea[placeholder*="prompt" i]',
    'div[contenteditable="true"][role="textbox"]',
  ];

  let button = null;
  let loadingOverlay = null;
  let attached = false;

  function init() {
    injectStyles();
    tryAttach();
    new MutationObserver(() => { if (!attached) tryAttach(); })
      .observe(document.body, { childList: true, subtree: true });
  }

  function tryAttach() {
    const input = findInput();
    if (!input) return;
    if (button && document.body.contains(button)) return;
    injectButton(input);
    attached = true;
  }

  function findInput() {
    for (const sel of TEXTAREA_SELECTORS) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function getText(el) {
    return el.tagName === 'TEXTAREA'
      ? el.value.trim()
      : (el.innerText || el.textContent || '').trim();
  }

  function setText(el, text) {
    el.focus();
    if (el.tagName === 'TEXTAREA') {
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')
        .set.call(el, text);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      document.execCommand('selectAll', false, null);
      document.execCommand('delete', false, null);
      document.execCommand('insertText', false, text);
      el.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }));
    }
  }

  function injectButton(inputEl) {
    if (button) button.remove();

    button = document.createElement('button');
    button.id = 'optimize-prompt-btn';
    button.innerHTML = '<span class="op-icon">✦</span><span class="op-spinner" id="op-spinner"></span><span class="op-label">Optimize Prompt</span>';
    document.body.appendChild(button);

    loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'optimize-loading-overlay';
    loadingOverlay.innerHTML = `<span class="op-ov-spinner"></span><span>Optimizing…</span>`;
    document.body.appendChild(loadingOverlay);

    positionButton();
    window.addEventListener('scroll', positionButton, { passive: true });
    window.addEventListener('resize', positionButton, { passive: true });
    button.addEventListener('click', handleOptimize);
  }

  function positionButton() {
    if (!button) return;
    const inputEl = findInput();
    if (!inputEl) return;
    const rect = inputEl.getBoundingClientRect();
    if (!rect.width) return;
    button.style.top  = (rect.top + window.scrollY - 44) + 'px';
    button.style.left = (rect.left + window.scrollX) + 'px';
    loadingOverlay.style.cssText += `top:${rect.top + window.scrollY}px;left:${rect.left}px;width:${rect.width}px;height:${rect.height}px;`;
  }

  async function handleOptimize() {
    const inputEl = findInput();
    if (!inputEl) return;

    const raw = getText(inputEl);
    if (!raw) { showToast('Type a prompt first!', 'warn'); return; }

    const data = await chrome.storage.local.get(['provider', 'model', 'apiKey']);
    const provider = data.provider || 'anthropic';
    const model    = data.model    || 'claude-haiku-4-5-20251001';
    const apiKey   = data.apiKey   || '';

    if (provider !== 'ollama' && !apiKey) {
      showToast('Add your API key — click the ✦ icon', 'warn');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BACKEND}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: raw, provider, model, api_key: apiKey })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Server error ${res.status}`);

      setText(inputEl, json.optimized);
      showToast(`✓ Optimized via ${model.split('-')[0]}`, 'success');
    } catch (e) {
      if (e.message.includes('fetch')) {
        showToast('Backend offline — run start.sh first', 'error');
      } else {
        showToast('Error: ' + e.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  function setLoading(on) {
    button.classList.toggle('op-loading', on);
    button.disabled = on;
    document.getElementById('op-spinner').style.display = on ? 'inline-block' : 'none';
    loadingOverlay.classList.toggle('op-visible', on);
  }

  function showToast(msg, type = 'success') {
    const old = document.getElementById('op-toast');
    if (old) old.remove();
    const t = document.createElement('div');
    t.id = 'op-toast';
    t.className = `op-toast op-toast-${type}`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('op-toast-show'), 10);
    setTimeout(() => { t.classList.remove('op-toast-show'); setTimeout(() => t.remove(), 300); }, 2600);
  }

  function injectStyles() {
    if (document.getElementById('op-styles')) return;
    const s = document.createElement('style');
    s.id = 'op-styles';
    s.textContent = `
      #optimize-prompt-btn {
        position: absolute; z-index: 2147483640;
        display: flex; align-items: center; gap: 5px;
        padding: 6px 13px 6px 10px;
        background: #1c1c1c; color: #f0f0f0;
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 20px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 13px; font-weight: 500; cursor: pointer;
        box-shadow: 0 2px 12px rgba(0,0,0,0.35);
        transition: background 0.15s, border-color 0.15s, transform 0.1s;
        user-select: none; white-space: nowrap;
      }
      #optimize-prompt-btn:hover { background: #2a2a2a; border-color: rgba(255,255,255,0.28); transform: translateY(-1px); }
      #optimize-prompt-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
      #optimize-prompt-btn .op-icon { font-size: 13px; color: #f0a070; }
      #optimize-prompt-btn .op-spinner {
        display: none; width: 12px; height: 12px;
        border: 2px solid rgba(255,255,255,0.2); border-top-color: #f0a070;
        border-radius: 50%; animation: op-spin 0.7s linear infinite;
      }
      #optimize-prompt-btn.op-loading .op-icon { display: none; }
      @keyframes op-spin { to { transform: rotate(360deg); } }
      #optimize-loading-overlay {
        position: absolute; z-index: 2147483639; display: none;
        align-items: center; justify-content: center; gap: 8px;
        background: rgba(10,10,10,0.5); border-radius: 12px;
        color: #e0e0e0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 13px; pointer-events: none;
      }
      #optimize-loading-overlay.op-visible { display: flex; }
      .op-ov-spinner {
        width: 15px; height: 15px;
        border: 2px solid rgba(255,255,255,0.15); border-top-color: #f0a070;
        border-radius: 50%; animation: op-spin 0.7s linear infinite; display: inline-block;
      }
      .op-toast {
        position: fixed; bottom: 80px; left: 50%;
        transform: translateX(-50%) translateY(8px);
        z-index: 2147483647; padding: 8px 16px; border-radius: 100px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 13px; font-weight: 500; opacity: 0;
        transition: opacity 0.2s, transform 0.2s; pointer-events: none;
        white-space: nowrap; box-shadow: 0 4px 20px rgba(0,0,0,0.4);
      }
      .op-toast.op-toast-show { opacity: 1; transform: translateX(-50%) translateY(0); }
      .op-toast-success { background:#1a3a2a; color:#4ade80; border:1px solid rgba(74,222,128,0.25); }
      .op-toast-warn    { background:#3a2e10; color:#fbbf24; border:1px solid rgba(251,191,36,0.25); }
      .op-toast-error   { background:#3a1010; color:#f87171; border:1px solid rgba(248,113,113,0.25); }
    `;
    document.head.appendChild(s);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
