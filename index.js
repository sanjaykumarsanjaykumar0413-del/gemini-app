// UPDATED index.js  tries gemini-2.5-flash first, else lists models
async function sendMessage() {
  const inp = document.getElementById("userInput");
  const chat = document.getElementById("chat-box");
  const text = inp.value.trim();
  if (!text) return;
  chat.innerHTML += `<div class="msg-you"><b>You:</b> ${escapeHtml(text)}</div>`;
  inp.value = "";

  const API_KEY = "AIzaSyAIORv6k3ZVG7u5y7byqKPsCXnWb5fPn5o"; // <--  key  

  // Try with a newer model name first
  const tryModel = "gemini-2.5-flash";
  const genUrl = `https://generativelanguage.googleapis.com/v1/models/${tryModel}:generateContent?key=${encodeURIComponent(API_KEY)}`;

  try {
    const resp = await fetch(genUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text }] }] })
    });

    if (resp.ok) {
      const data = await resp.json();
      const ai = data.candidates?.[0]?.content?.parts?.[0]?.text || "Koi jawab nahi mila.";
      chat.innerHTML += `<div class="msg-ai"><b>AI:</b> ${escapeHtml(ai)}</div>`;
      chat.scrollTop = chat.scrollHeight;
      return;
    }

    // If not ok and status 404 (model not found)  fetch list of models
    const status = resp.status;
    const bodyText = await resp.text();
    if (status === 404) {
      chat.innerHTML += `<div class="msg-ai"><b>AI Error:</b> Model ${escapeHtml(tryModel)} not found (404). Fetching available models...</div>`;
      await listAndShowModels(API_KEY, chat);
      return;
    }

    // Other non-ok responses: show error body
    chat.innerHTML += `<div class="msg-ai"><b>AI Error (${status}):</b> ${escapeHtml(bodyText)}</div>`;
    chat.scrollTop = chat.scrollHeight;
    return;

  } catch (e) {
    chat.innerHTML += `<div class="msg-ai"><b>Network/Error:</b> ${escapeHtml(String(e))}</div>`;
    chat.scrollTop = chat.scrollHeight;
  }
}

async function listAndShowModels(API_KEY, chatElem) {
  try {
    const listUrl = `https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(API_KEY)}`;
    const r = await fetch(listUrl);
    if (!r.ok) {
      const txt = await r.text();
      chatElem.innerHTML += `<div class="msg-ai"><b>ListModels Error:</b> ${escapeHtml(txt)}</div>`;
      chatElem.scrollTop = chatElem.scrollHeight;
      return;
    }
    const j = await r.json();
    const models = (j.models || []).map(m => `${m.name}  ${m.supportedMethods || ''}`).slice(0,50);
    if (models.length === 0) {
      chatElem.innerHTML += `<div class="msg-ai"><b>Models:</b>     ( permission issue)</div>`;
    } else {
      chatElem.innerHTML += `<div class="msg-ai"><b>Available models (top):</b><br>${escapeHtml(models.join("<br>"))}</div>`;
      chatElem.innerHTML += `<div class="msg-ai">Use one of the model names above in the generate URL. Example: <code>models/gemini-2.5-flash:generateContent</code></div>`;
    }
    chatElem.scrollTop = chatElem.scrollHeight;
  } catch (err) {
    chatElem.innerHTML += `<div class="msg-ai"><b>Error listing models:</b> ${escapeHtml(String(err))}</div>`;
    chatElem.scrollTop = chatElem.scrollHeight;
  }
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }