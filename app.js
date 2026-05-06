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

const defaultStrategies = [
  "Dupla chance mandante",
  "Dupla chance visitante",
  "Empate anula mandante",
  "Empate anula visitante",
  "Over cantos asiatico",
  "Under gols ao vivo",
  "Over 0.5 HT",
  "Lay zebra protegido",
];

const defaultMarkets = [
  "Futebol",
  "Basquete",
  "Tenis",
  "Volei",
  "Futebol americano",
  "Baseball",
  "Hockey",
  "MMA / Boxe",
  "eSports",
];

const bettingOptionLabels = [
  ...defaultStrategies,
  "Dupla chance",
  "Empate anula",
  "Under / Over",
  "Over cantos",
  "Escanteios",
  "Gols",
  "Live",
  "Exchange",
];

const state = loadState();
let historyFilter = "all";

const elements = {
  entryForm: document.querySelector("#entryForm"),
  settingsForm: document.querySelector("#settingsForm"),
  entryRows: document.querySelector("#entryRows"),
  emptyStateTemplate: document.querySelector("#emptyStateTemplate"),
  bankrollChart: document.querySelector("#bankrollChart"),
  resultDonut: document.querySelector("#resultDonut"),
  importData: document.querySelector("#importData"),
  exportData: document.querySelector("#exportData"),
  loadDemo: document.querySelector("#loadDemo"),
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
  customStrategy: document.querySelector("#customStrategy"),
  market: document.querySelector("#market"),
  customMarket: document.querySelector("#customMarket"),
  stake: document.querySelector("#stake"),
  odd: document.querySelector("#odd"),
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
  const settled = state.entries.filter((entry) => entry.result === "win" || entry.result === "loss");
  const wins = settled.filter((entry) => entry.result === "win");
  const losses = settled.filter((entry) => entry.result === "loss");
  const pending = state.entries.filter((entry) => entry.result === "pending");
  const voided = state.entries.filter((entry) => entry.result === "void");
  const profits = settled.map(calculateProfit);
  const grossProfit = wins.reduce((total, entry) => total + calculateProfit(entry), 0);
  const grossLoss = Math.abs(losses.reduce((total, entry) => total + calculateProfit(entry), 0));
  const netProfit = grossProfit - grossLoss;
  const totalStake = settled.reduce((total, entry) => total + entry.stake, 0);
  const averageStake = settled.length ? totalStake / settled.length : 0;
  const averageOdd = settled.length
    ? settled.reduce((total, entry) => total + entry.odd, 0) / settled.length
    : 0;

  return {
    completed: settled,
    settled,
    wins,
    losses,
    pending,
    voided,
    grossProfit,
    grossLoss,
    netProfit,
    totalStake,
    averageStake,
    averageOdd,
    currentBankroll: state.settings.initialBankroll + netProfit,
    hitRate: settled.length ? (wins.length / settled.length) * 100 : 0,
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
  elements.riskBadge.textContent = isAlert ? "Atencao nos numeros" : "Operacao limpa";
  elements.riskBadge.classList.toggle("danger", isAlert);
}

function renderHistory() {
  elements.entryRows.replaceChildren();
  const visibleEntries =
    historyFilter === "pending" ? state.entries.filter((entry) => entry.result === "pending") : state.entries;

  if (visibleEntries.length === 0) {
    const emptyState = elements.emptyStateTemplate.content.cloneNode(true);
    const cell = emptyState.querySelector(".empty-state");
    cell.textContent =
      historyFilter === "pending"
        ? "Nenhuma entrada em aberto no momento."
        : "Registre a primeira entrada para iniciar a leitura da banca.";
    elements.entryRows.append(emptyState);
    return;
  }

  visibleEntries
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .forEach((entry) => {
      const profit = calculateProfit(entry);
      const pendingActions =
        entry.result === "pending"
          ? `<div class="resolve-actions">
              <button class="mini-action win-action" type="button" data-resolve-id="${entry.id}" data-result="win">Green</button>
              <button class="mini-action loss-action" type="button" data-resolve-id="${entry.id}" data-result="loss">Red</button>
            </div>`
          : "";
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
        <td>
          ${pendingActions}
          <button class="row-action" type="button" title="Remover entrada" aria-label="Remover entrada" data-id="${entry.id}">&times;</button>
        </td>
      `;
      elements.entryRows.append(row);
    });
}

function renderSuggestionLists() {
  renderSelectOptions(inputs.strategy, mergeOptionsByUsage("strategy", defaultStrategies));
  renderSelectOptions(inputs.market, mergeOptionsByUsage("market", defaultMarkets, bettingOptionLabels));
}

function mergeOptionsByUsage(key, fallbackOptions, excludedOptions = []) {
  const counts = new Map();
  const excluded = new Set(excludedOptions.map((value) => value.toLowerCase()));

  state.entries.forEach((entry) => {
    const value = String(entry[key] || "").trim();
    if (!value) return;
    if (excluded.has(value.toLowerCase())) return;
    counts.set(value, (counts.get(value) || 0) + 1);
  });

  fallbackOptions.forEach((value) => {
    if (!counts.has(value)) counts.set(value, 0);
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))
    .map(([value]) => value);
}

function renderSelectOptions(element, options) {
  const selected = element.value;
  element.replaceChildren(
    ...options.map((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      return option;
    }),
  );
  const customOption = document.createElement("option");
  customOption.value = "__custom";
  customOption.textContent = "Adicionar nova opcao";
  element.append(customOption);
  if (options.includes(selected)) element.value = selected;
  if (!element.value && options.length > 0) element.value = options[0];
}

function getSelectValue(selectElement, customInput) {
  if (selectElement.value !== "__custom") return selectElement.value;
  return customInput.value.trim();
}

function syncCustomOptionInputs() {
  inputs.customStrategy.classList.toggle("is-visible", inputs.strategy.value === "__custom");
  inputs.customMarket.classList.toggle("is-visible", inputs.market.value === "__custom");
  inputs.customStrategy.required = inputs.strategy.value === "__custom";
  inputs.customMarket.required = inputs.market.value === "__custom";
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
  const lineColor = getMetrics().netProfit >= 0 ? "#79c69a" : "#d98780";
  const fillGradient = ctx.createLinearGradient(0, padding, 0, height - padding);
  fillGradient.addColorStop(
    0,
    getMetrics().netProfit >= 0 ? "rgba(121, 198, 154, 0.2)" : "rgba(217, 135, 128, 0.2)",
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

function renderResultDonut() {
  const canvas = elements.resultDonut;
  const ctx = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(240, rect.width * ratio);
  canvas.height = 190 * ratio;
  ctx.scale(ratio, ratio);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const metrics = getMetrics();
  const slices = [
    { value: metrics.wins.length, color: "#79c69a" },
    { value: metrics.losses.length, color: "#d98780" },
    { value: metrics.pending.length + metrics.voided.length, color: "#8fb7d3" },
  ];
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const centerX = (rect.width || 240) / 2;
  const centerY = 92;
  const radius = 68;
  let startAngle = -Math.PI / 2;

  if (total === 0) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 18;
    ctx.stroke();
  } else {
    slices.forEach((slice) => {
      const angle = (slice.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + angle);
      ctx.strokeStyle = slice.color;
      ctx.lineWidth = 18;
      ctx.lineCap = "round";
      ctx.stroke();
      startAngle += angle;
    });
  }

  ctx.fillStyle = "#f7f4ea";
  ctx.font = "800 22px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${Math.round(metrics.hitRate)}%`, centerX, centerY + 2);
  ctx.fillStyle = "#747f78";
  ctx.font = "12px Inter, sans-serif";
  ctx.fillText("acerto", centerX, centerY + 20);
}

function translateResult(result) {
  return {
    win: "Green",
    loss: "Red",
    void: "Anulada",
    pending: "Em aberto",
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
  renderSuggestionLists();
  syncCustomOptionInputs();
  renderMetrics();
  renderHistory();
  renderChart();
  renderResultDonut();
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
    strategy: getSelectValue(inputs.strategy, inputs.customStrategy),
    market: getSelectValue(inputs.market, inputs.customMarket),
    stake: toNumber(inputs.stake.value),
    odd,
    result: new FormData(elements.entryForm).get("result"),
    notes: inputs.notes.value.trim(),
  });

  persist();
  elements.entryForm.reset();
  inputs.entryDate.valueAsDate = new Date();
  render();
});

inputs.strategy.addEventListener("change", syncCustomOptionInputs);
inputs.market.addEventListener("change", syncCustomOptionInputs);

elements.settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.settings = {
    initialBankroll: toNumber(inputs.initialBankroll.value),
    stakePercent: toNumber(inputs.stakePercent.value),
  };
  persist();
  render();
});

elements.loadDemo.addEventListener("click", () => {
  if (state.entries.length > 0) {
    const confirmed = confirm("Carregar a demo vai substituir os dados locais atuais. Deseja continuar?");
    if (!confirmed) return;
  }

  state.settings = {
    initialBankroll: 1500,
    stakePercent: 3,
  };
  state.entries = createDemoEntries();
  persist();
  render();
});

elements.entryRows.addEventListener("click", (event) => {
  const resolveButton = event.target.closest("[data-resolve-id]");
  if (resolveButton) {
    const entry = state.entries.find((item) => item.id === resolveButton.dataset.resolveId);
    if (entry) {
      entry.result = resolveButton.dataset.result;
      persist();
      render();
    }
    return;
  }

  const button = event.target.closest("[data-id]");
  if (!button) return;

  const index = state.entries.findIndex((entry) => entry.id === button.dataset.id);
  if (index >= 0) {
    state.entries.splice(index, 1);
    persist();
    render();
  }
});

document.querySelectorAll("[data-history-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    historyFilter = button.dataset.historyFilter;
    document.querySelectorAll("[data-history-filter]").forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });
    renderHistory();
  });
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
window.addEventListener("resize", renderResultDonut);
inputs.entryDate.valueAsDate = new Date();
render();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").catch(() => {});
}

function createDemoEntries() {
  return [
    ["2026-04-18", "Dupla chance mandante", "Futebol", 45, 1.24, "win", "Favorito em casa"],
    ["2026-04-19", "Over cantos asiatico", "Futebol", 50, 1.27, "win", "Pressao alta"],
    ["2026-04-20", "Empate anula visitante", "Futebol", 45, 1.22, "loss", "Jogo travado"],
    ["2026-04-21", "Under gols ao vivo", "Futebol", 40, 1.19, "win", "Ritmo baixo"],
    ["2026-04-22", "Dupla chance mandante", "Futebol", 55, 1.28, "win", "Volume ofensivo"],
    ["2026-04-23", "Over 0.5 HT", "Futebol", 45, 1.21, "void", "Entrada anulada"],
    ["2026-04-24", "Lay zebra protegido", "Tenis", 50, 1.26, "loss", "Mercado virou"],
    ["2026-04-25", "Over cantos asiatico", "Futebol", 60, 1.25, "win", "Laterais agressivos"],
    ["2026-04-26", "Empate anula mandante", "Futebol", 55, 1.23, "win", "Mandante dominante"],
    ["2026-04-27", "Under gols ao vivo", "Basquete", 50, 1.18, "pending", "Aguardando resultado"],
    ["2026-04-28", "Dupla chance mandante", "Futebol", 60, 1.29, "win", "Boa leitura pre-jogo"],
    ["2026-04-29", "Over cantos asiatico", "Futebol", 55, 1.24, "loss", "Expulsao mudou o jogo"],
  ].map(([date, strategy, market, stake, odd, result, notes]) => ({
    id: crypto.randomUUID(),
    date,
    strategy,
    market,
    stake,
    odd,
    result,
    notes,
  }));
}
