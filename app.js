const STORAGE_KEY = "banca-prime-state";
const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const defaults = {
  settings: {
    initialBankroll: 1000,
    stakePercent: 3,
  },
  entries: [],
};

const state = loadState();

const elements = {
  entryForm: document.querySelector("#entryForm"),
  settingsForm: document.querySelector("#settingsForm"),
  entryRows: document.querySelector("#entryRows"),
  emptyStateTemplate: document.querySelector("#emptyStateTemplate"),
  bankrollChart: document.querySelector("#bankrollChart"),
  importData: document.querySelector("#importData"),
  exportData: document.querySelector("#exportData"),
  clearEntries: document.querySelector("#clearEntries"),
  currentBankroll: document.querySelector("#currentBankroll"),
  bankrollDelta: document.querySelector("#bankrollDelta"),
  netProfit: document.querySelector("#netProfit"),
  roi: document.querySelector("#roi"),
  hitRate: document.querySelector("#hitRate"),
  winLoss: document.querySelector("#winLoss"),
  avgStake: document.querySelector("#avgStake"),
  oddsDiscipline: document.querySelector("#oddsDiscipline"),
  riskBadge: document.querySelector("#riskBadge"),
  grossProfit: document.querySelector("#grossProfit"),
  grossLoss: document.querySelector("#grossLoss"),
  profitBar: document.querySelector("#profitBar"),
  lossBar: document.querySelector("#lossBar"),
  totalEntries: document.querySelector("#totalEntries"),
  pendingEntries: document.querySelector("#pendingEntries"),
  bestReturn: document.querySelector("#bestReturn"),
  worstReturn: document.querySelector("#worstReturn"),
};

const inputs = {
  entryDate: document.querySelector("#entryDate"),
  strategy: document.querySelector("#strategy"),
  market: document.querySelector("#market"),
  stake: document.querySelector("#stake"),
  odd: document.querySelector("#odd"),
  result: document.querySelector("#result"),
  notes: document.querySelector("#notes"),
  initialBankroll: document.querySelector("#initialBankroll"),
  stakePercent: document.querySelector("#stakePercent"),
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      settings: { ...defaults.settings, ...saved?.settings },
      entries: Array.isArray(saved?.entries) ? saved.entries.map(normalizeEntry) : [],
    };
  } catch {
    return structuredClone(defaults);
  }
}

function normalizeEntry(entry) {
  return {
    id: entry.id || crypto.randomUUID(),
    date: entry.date || new Date().toISOString().slice(0, 10),
    strategy: entry.strategy || entry.market || "Entrada registrada",
    market: entry.market || "Sem mercado",
    stake: toNumber(entry.stake),
    odd: toNumber(entry.odd) || 1.25,
    result: entry.result || "pending",
    notes: entry.notes || "",
  };
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPercent(value) {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function calculateProfit(entry) {
  if (entry.result === "win") return entry.stake * (entry.odd - 1);
  if (entry.result === "loss") return -entry.stake;
  return 0;
}

function getMetrics() {
  const completed = state.entries.filter((entry) => entry.result !== "pending");
  const wins = completed.filter((entry) => entry.result === "win");
  const losses = completed.filter((entry) => entry.result === "loss");
  const pending = state.entries.filter((entry) => entry.result === "pending");
  const profits = completed.map(calculateProfit);
  const grossProfit = wins.reduce((total, entry) => total + calculateProfit(entry), 0);
  const grossLoss = Math.abs(losses.reduce((total, entry) => total + calculateProfit(entry), 0));
  const netProfit = grossProfit - grossLoss;
  const totalStake = completed.reduce((total, entry) => total + entry.stake, 0);
  const averageStake = completed.length ? totalStake / completed.length : 0;
  const averageOdd = completed.length
    ? completed.reduce((total, entry) => total + entry.odd, 0) / completed.length
    : 0;

  return {
    completed,
    wins,
    losses,
    pending,
    grossProfit,
    grossLoss,
    netProfit,
    totalStake,
    averageStake,
    averageOdd,
    currentBankroll: state.settings.initialBankroll + netProfit,
    hitRate: completed.length ? (wins.length / completed.length) * 100 : 0,
    roi: totalStake ? (netProfit / totalStake) * 100 : 0,
    bestReturn: profits.length ? Math.max(...profits) : 0,
    worstReturn: profits.length ? Math.min(...profits) : 0,
  };
}

function syncSettingsForm() {
  inputs.initialBankroll.value = state.settings.initialBankroll;
  inputs.stakePercent.value = state.settings.stakePercent;
}

function renderMetrics() {
  const metrics = getMetrics();
  const bankrollDelta = metrics.currentBankroll - state.settings.initialBankroll;
  const totalOutcome = metrics.grossProfit + metrics.grossLoss || 1;

  elements.currentBankroll.textContent = currency.format(metrics.currentBankroll);
  elements.bankrollDelta.textContent = `${bankrollDelta >= 0 ? "+" : ""}${currency.format(bankrollDelta)} desde o inicio`;
  elements.netProfit.textContent = currency.format(metrics.netProfit);
  elements.netProfit.className = metrics.netProfit >= 0 ? "positive" : "negative";
  elements.roi.textContent = `ROI ${formatPercent(metrics.roi)}`;
  elements.hitRate.textContent = formatPercent(metrics.hitRate);
  elements.winLoss.textContent = `${metrics.wins.length} greens / ${metrics.losses.length} reds`;
  elements.avgStake.textContent = currency.format(metrics.averageStake);
  elements.oddsDiscipline.textContent = metrics.averageOdd ? `Odd media ${metrics.averageOdd.toFixed(2)}` : "Sem entradas";
  elements.grossProfit.textContent = currency.format(metrics.grossProfit);
  elements.grossLoss.textContent = currency.format(metrics.grossLoss);
  elements.profitBar.style.width = `${Math.round((metrics.grossProfit / totalOutcome) * 100)}%`;
  elements.lossBar.style.width = `${Math.round((metrics.grossLoss / totalOutcome) * 100)}%`;
  elements.totalEntries.textContent = state.entries.length;
  elements.pendingEntries.textContent = metrics.pending.length;
  elements.bestReturn.textContent = currency.format(metrics.bestReturn);
  elements.worstReturn.textContent = currency.format(metrics.worstReturn);

  const isAlert = metrics.roi < -8 || (metrics.hitRate < 75 && metrics.completed.length >= 8);
  elements.riskBadge.textContent = isAlert ? "Atenção nos números" : "Operacao limpa";
  elements.riskBadge.classList.toggle("danger", isAlert);
}

function renderHistory() {
  elements.entryRows.replaceChildren();

  if (state.entries.length === 0) {
    elements.entryRows.append(elements.emptyStateTemplate.content.cloneNode(true));
    return;
  }

  state.entries
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((entry) => {
      const profit = calculateProfit(entry);
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${entry.date}</td>
        <td>
          <span class="context-stack">
            <strong>${escapeHtml(entry.strategy)}</strong>
            <small>${escapeHtml(entry.market)}${entry.notes ? ` | ${escapeHtml(entry.notes)}` : ""}</small>
          </span>
        </td>
        <td>${currency.format(entry.stake)}</td>
        <td>${entry.odd.toFixed(2)}</td>
        <td class="result-${entry.result}">${translateResult(entry.result)}</td>
        <td class="${profit >= 0 ? "positive" : "negative"}">${currency.format(profit)}</td>
        <td><button class="row-action" type="button" title="Remover entrada" aria-label="Remover entrada" data-id="${entry.id}">&times;</button></td>
      `;
      elements.entryRows.append(row);
    });
}

function renderChart() {
  const canvas = elements.bankrollChart;
  const ctx = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(600, rect.width * ratio);
  canvas.height = 320 * ratio;
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const points = [{ value: state.settings.initialBankroll }];
  state.entries
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach((entry) => {
      points.push({ value: points.at(-1).value + calculateProfit(entry) });
    });

  const width = rect.width || 600;
  const height = 280;
  const padding = 32;
  const minValue = Math.min(...points.map((point) => point.value), state.settings.initialBankroll) * 0.98;
  const maxValue = Math.max(...points.map((point) => point.value), state.settings.initialBankroll) * 1.02;
  const range = maxValue - minValue || 1;

  ctx.strokeStyle = "rgba(245, 241, 232, 0.12)";
  ctx.lineWidth = 1;
  for (let line = 0; line < 4; line += 1) {
    const y = padding + (line * (height - padding * 2)) / 3;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  const coordinates = points.map((point, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(points.length - 1, 1);
    const y = height - padding - ((point.value - minValue) / range) * (height - padding * 2);
    return { x, y };
  });
  const lineColor = getMetrics().netProfit >= 0 ? "#5fd29a" : "#ef7f74";
  const fillGradient = ctx.createLinearGradient(0, padding, 0, height - padding);
  fillGradient.addColorStop(
    0,
    getMetrics().netProfit >= 0 ? "rgba(95, 224, 160, 0.26)" : "rgba(240, 123, 114, 0.24)",
  );
  fillGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.beginPath();
  coordinates.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.lineTo(coordinates.at(-1).x, height - padding);
  ctx.lineTo(coordinates[0].x, height - padding);
  ctx.closePath();
  ctx.fillStyle = fillGradient;
  ctx.fill();

  ctx.beginPath();
  coordinates.forEach((point, index) => {
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 3;
  ctx.stroke();

  const lastPoint = coordinates.at(-1);
  ctx.beginPath();
  ctx.arc(lastPoint.x, lastPoint.y, 5, 0, Math.PI * 2);
  ctx.fillStyle = lineColor;
  ctx.fill();
  ctx.strokeStyle = "#0b0f13";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#f5f1e8";
  ctx.font = "12px Inter, sans-serif";
  ctx.fillText(currency.format(points.at(-1).value), padding, 20);
}

function translateResult(result) {
  return {
    win: "Green",
    loss: "Red",
    void: "Anulada",
    pending: "Pendente",
  }[result];
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character],
  );
}

function render() {
  syncSettingsForm();
  renderMetrics();
  renderHistory();
  renderChart();
}

elements.entryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const odd = toNumber(inputs.odd.value);

  if (odd > 1.3) {
    inputs.odd.setCustomValidity("O modelo foi desenhado para odds ate 1.30.");
    inputs.odd.reportValidity();
    return;
  }

  inputs.odd.setCustomValidity("");
  state.entries.push({
    id: crypto.randomUUID(),
    date: inputs.entryDate.value,
    strategy: inputs.strategy.value.trim(),
    market: inputs.market.value.trim(),
    stake: toNumber(inputs.stake.value),
    odd,
    result: inputs.result.value,
    notes: inputs.notes.value.trim(),
  });

  persist();
  elements.entryForm.reset();
  inputs.entryDate.valueAsDate = new Date();
  render();
});

elements.settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.settings = {
    initialBankroll: toNumber(inputs.initialBankroll.value),
    stakePercent: toNumber(inputs.stakePercent.value),
  };
  persist();
  render();
});

elements.entryRows.addEventListener("click", (event) => {
  const button = event.target.closest("[data-id]");
  if (!button) return;

  const index = state.entries.findIndex((entry) => entry.id === button.dataset.id);
  if (index >= 0) {
    state.entries.splice(index, 1);
    persist();
    render();
  }
});

elements.clearEntries.addEventListener("click", () => {
  if (state.entries.length === 0) return;
  const confirmed = confirm("Limpar todo o historico de entradas?");
  if (!confirmed) return;
  state.entries = [];
  persist();
  render();
});

elements.exportData.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `banca-prime-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
});

elements.importData.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) return;

  try {
    const imported = JSON.parse(await file.text());
    state.settings = { ...defaults.settings, ...imported.settings };
    state.entries = Array.isArray(imported.entries) ? imported.entries.map(normalizeEntry) : [];
    persist();
    render();
  } catch {
    alert("Arquivo invalido. Exporte um JSON do Banca Prime e tente novamente.");
  } finally {
    event.target.value = "";
  }
});

window.addEventListener("resize", renderChart);
inputs.entryDate.valueAsDate = new Date();
render();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").catch(() => {});
}
