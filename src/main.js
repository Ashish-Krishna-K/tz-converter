const { DateTime } = luxon;

const dateInput = document.querySelector("#date");
const hourSelect = document.querySelector("#hour");
const minuteSelect = document.querySelector("#minute");
const fromSelect = document.querySelector("#from-zone");
const toSelect = document.querySelector("#to-zone");
const resultTime = document.querySelector("#result-time");
const resultDetail = document.querySelector("#result-detail");
const saveBtn = document.querySelector("#save-btn");
const savedList = document.querySelector("#saved-list");
const emptyMsg = document.querySelector("#empty-msg");

const userZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const zones = [
    ...new Set(["UTC", userZone, ...Intl.supportedValuesOf("timeZone")]),
]
    .map((name) => ({ name, offset: DateTime.now().setZone(name).offset }))
    .sort((a, b) => a.offset - b.offset || a.name.localeCompare(b.name))
    .map((z) => z.name);

function formatOffset(zone) {
    return `UTC${DateTime.now().setZone(zone).toFormat("ZZ")}`;
}

function fillZones(select, defaultZone) {
    for (const zone of zones) {
        const zne = `${zone} (${formatOffset(zone)})`;
        select.append(new Option(zne, zone));
    }
    select.value = defaultZone;
}

fillZones(fromSelect, userZone);
fillZones(toSelect, "UTC");

function fillRange(select, count) {
    for (let i = 0; i < count; i++) {
        const label = String(i).padStart(2, "0");
        select.append(new Option(label, label));
    }
}

fillRange(hourSelect, 24);
fillRange(minuteSelect, 60);

const now = DateTime.now();
dateInput.value = now.toFormat("yyyy-MM-dd");
hourSelect.value = now.toFormat("HH");
minuteSelect.value = now.toFormat("mm");

function convert() {
    const source = DateTime.fromISO(
        `${dateInput.value}T${hourSelect.value}:${minuteSelect.value}`,
        { zone: fromSelect.value },
    );

    if (!source.isValid) {
        resultTime.textContent = "--:--";
        resultDetail.textContent = "Pick a date and a time";
        return;
    }

    const converted = source.setZone(toSelect.value);

    resultTime.textContent = converted.toFormat("HH:mm");
    resultDetail.textContent = `${converted.toFormat("ccc, dd LLL yyyy")} . ${converted.offsetNameShort}`;
}

for (const el of [dateInput, hourSelect, minuteSelect, fromSelect, toSelect]) {
    el.addEventListener("input", convert);
}

const STORAGE_KEY = "tz-converter:saved";

function loadSaved() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn(error);
        return [];
    }
}
let saved = loadSaved();

function persist() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    } catch (error) {
        console.warn("Could not save to localStorage", err);
    }
}

function convertEntry(entry) {
    const source = DateTime.fromISO(
        `${entry.date}T${entry.hour}:${entry.minute}`,
        { zone: entry.from },
    );
    if (!source.isValid) return null;
    return { source, converted: source.setZone(entry.to) };
}

function renderSaved() {
    savedList.replaceChildren();
    emptyMsg.hidden = saved.length > 0;

    for (const entry of saved) {
        const result = convertEntry(entry);
        if (!result) continue;
        const { source, converted } = result;

        const li = document.createElement("li");
        li.className =
            "flex items-start justify-between gap-2 rounded border border-slate-200 p-3";

        const info = document.createElement("div");
        info.className = "text-sm";

        const main = document.createElement("p");
        main.className = "font-medium";
        main.textContent = `${source.toFormat("HH:mm")} ${entry.from} → ${converted.toFormat("HH:mm")} ${entry.to}`;

        const detail = document.createElement("p");
        detail.className = "text-slate-500";
        detail.textContent = `${source.toFormat("dd LLL yyyy")} → ${converted.toFormat("ccc, dd LLL yyyy")} · ${converted.offsetNameShort}`;

        info.append(main, detail);

        const del = document.createElement("button");
        del.type = "button";
        del.dataset.id = entry.id;
        del.textContent = "X";
        del.setAttribute("aria-label", "Delete saved conversion");
        del.className = "text-slate-400 hover:text-red-600";

        li.append(info, del);
        savedList.append(li);
    }
}

saveBtn.addEventListener("click", () => {
    const entry = {
        id: crypto.randomUUID(),
        date: dateInput.value,
        hour: hourSelect.value,
        minute: minuteSelect.value,
        from: fromSelect.value,
        to: toSelect.value,
    };

    if (!convertEntry(entry)) return;

    saved.unshift(entry);
    persist();
    renderSaved();
});

savedList.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-id]");
    if (!btn) return;

    saved = saved.filter((e) => e.id != btn.dataset.id);
    persist();
    renderSaved();
});

renderSaved();
convert();
