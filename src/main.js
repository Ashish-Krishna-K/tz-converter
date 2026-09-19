const { DateTime } = luxon;

const dateInput = document.querySelector("#date");
const hourSelect = document.querySelector("#hour");
const minuteSelect = document.querySelector("#minute");
const fromSelect = document.querySelector("#from-zone");
const toSelect = document.querySelector("#to-zone");
const resultTime = document.querySelector("#result-time");
const resultDetail = document.querySelector("#result-detail");

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

convert();
