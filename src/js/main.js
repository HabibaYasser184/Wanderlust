const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));
const API = {
countries: "https://date.nager.at/api/v3/AvailableCountries"
};
async function loadCountries() {
const countrySelect = document.getElementById("global-country");
try {
const response = await fetch(API.countries);
if (!response.ok) {
throw new Error("Failed to load countries");
}
const countries = await response.json();
countrySelect.innerHTML = `
<option value="">Select Country</option>
`;
countries.sort((a, b) => a.name.localeCompare(b.name));
countries.forEach(country => {
const option = document.createElement("option");
option.value = country.countryCode;
option.textContent = country.name;
countrySelect.appendChild(option);
});
console.log("Countries loaded successfully:", countries);
} catch (error) {
console.error("Error loading countries:", error);
}
}
let cityResults = [];
let selectedCityLocation = null;
let citySearchTimer;
async function searchCities() {
const cityInput = document.getElementById("global-city");
const countryCode = document.getElementById("global-country").value;
const datalist = document.getElementById("city-options");
const cityName = cityInput.value.trim();
selectedCityLocation = null;
clearTimeout(citySearchTimer);
if (!datalist || cityName.length < 2) {
if (datalist) datalist.innerHTML = "";
return;
}
citySearchTimer = setTimeout(async () => {
try {
const params = new URLSearchParams({
name: cityName,
count: "100",
language: "en",
format: "json"
});
if (countryCode) params.set("countryCode", countryCode);
const response = await fetch(
`https://geocoding-api.open-meteo.com/v1/search?${params}`
);
if (!response.ok) throw new Error("City search request failed");
const data = await response.json();
cityResults = (data.results || []).filter(city =>
!countryCode || city.country_code === countryCode
);
datalist.innerHTML = cityResults.map(city => {
const label = [city.name, city.admin1, city.country]
.filter(Boolean)
.join(", ");
return `<option value="${escapeHTML(city.name)}" label="${escapeHTML(label)}"></option>`;
}).join("");
console.log("Cities Found:", cityResults);
} catch (error) {
console.error("City Search Error:", error);
datalist.innerHTML = "";
}
}, 350);
}
async function getCityLocation(cityName) {
const countryCode = document.getElementById("global-country").value;
if (
selectedCityLocation &&
selectedCityLocation.name.toLowerCase() === cityName.toLowerCase() &&
(!countryCode || selectedCityLocation.country_code === countryCode)
) {
return selectedCityLocation;
}
const params = new URLSearchParams({
name: cityName,
count: "100",
language: "en",
format: "json"
});
if (countryCode) params.set("countryCode", countryCode);
const response = await fetch(
`https://geocoding-api.open-meteo.com/v1/search?${params}`
);
if (!response.ok) throw new Error("Unable to find city");
const data = await response.json();
const locations = data.results || [];
const location = locations.find(item =>
!countryCode || item.country_code === countryCode
) || locations[0];
if (!location) throw new Error("City not found. Please choose a city from the suggestions.");
selectedCityLocation = location;
return location;
}
const cityInput = document.getElementById("global-city");
if (cityInput) cityInput.addEventListener("input", searchCities);
async function loadPublicHolidays() {
const countryCode = document.getElementById("global-country").value;
const year = document.getElementById("global-year").value;
const holidaysContent = document.getElementById("holidays-content");
if (!countryCode) {
holidaysContent.innerHTML = "<p>Please select a country first.</p>";
return;
}
try {
holidaysContent.innerHTML = "<p>Loading holidays...</p>";
const response = await fetch(
`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`
);
if (!response.ok) {
throw new Error("Failed to load holidays");
}
const holidays = await response.json();
if (holidays.length === 0) {
holidaysContent.innerHTML = "<p>No holidays found.</p>";
return;
}
holidaysContent.innerHTML = holidays.map(holiday => {
const date = new Date(`${holiday.date}T12:00:00`);
const day = date.getDate();
const month = date.toLocaleDateString("en-US", { month: "short" });
const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
const saved = myPlans.some(plan => plan.type === "holiday" && plan.id === `${holiday.countryCode}-${holiday.date}`);
return `
<div class="holiday-card">
<div class="holiday-card-header">
<div class="holiday-date-box">
<span class="day">${day}</span>
<span class="month">${month}</span>
</div>
<button class="holiday-action-btn ${saved ? "saved" : ""}"
data-date="${holiday.date}"
data-name="${escapeHTML(holiday.name)}"
data-local-name="${escapeHTML(holiday.localName)}"
data-country="${holiday.countryCode}"
aria-label="Save holiday">
<i class="${saved ? "fa-solid" : "fa-regular"} fa-heart"></i>
</button>
</div>
<h3>${escapeHTML(holiday.localName || holiday.name)}</h3>
<p class="holiday-name">${escapeHTML(holiday.name)}</p>
<div class="holiday-card-footer">
<span class="holiday-day-badge"><i class="fa-regular fa-calendar"></i> ${weekday}</span>
<span class="holiday-type-badge">${escapeHTML((holiday.types || ["Public"])[0])}</span>
</div>
</div>
`;
}).join("");
const holidayStat = $("#stat-holidays");
if (holidayStat) holidayStat.textContent = holidays.length;
console.log("Holidays loaded:", holidays);
} catch (error) {
console.error(error);
holidaysContent.innerHTML = "<p>Unable to load holidays. Please try again.</p>";
}
}
// Navigation and global controls
const views = document.querySelectorAll(".view");
const navItems = document.querySelectorAll(".nav-item");
const pageInfo = {
dashboard: {
title: "Dashboard",
subtitle: "Welcome back! Ready to plan your next adventure?"
},
holidays: {
title: "Holidays",
subtitle: "Explore public holidays around the world"
},
events: {
title: "Events",
subtitle: "Discover events and activities around the world"
},
weather: {
title: "Weather",
subtitle: "Check weather forecasts for your destination"
},
"long-weekends": {
title: "Long Weekends",
subtitle: "Find the perfect dates for your next trip"
},
currency: {
title: "Currency Converter",
subtitle: "Convert currencies using live exchange rates"
},
"sun-times": {
title: "Sun Times",
subtitle: "Check sunrise and sunset times"
},
"my-plans": {
title: "My Plans",
subtitle: "Manage your saved travel plans"
}
};
function showView(viewName) {
views.forEach(view => {
view.classList.toggle("active", view.id === `${viewName}-view`);
});
navItems.forEach(item => {
item.classList.toggle("active", item.dataset.view === viewName);
});
const info = pageInfo[viewName];
if (info) {
document.getElementById("page-title").textContent = info.title;
document.getElementById("page-subtitle").textContent = info.subtitle;
}
window.scrollTo({
top: 0,
behavior: "smooth"
});
document.getElementById("sidebar").classList.remove("open");
document.getElementById("sidebar-overlay").classList.add("hidden");
}
navItems.forEach(item => {
item.addEventListener("click", event => {
event.preventDefault();
showView(item.dataset.view);
});
});
$("#start-exploring-btn")?.addEventListener("click", () => showView("dashboard"));
$("#mobile-menu-btn")?.addEventListener("click", () => {
$("#sidebar")?.classList.add("open");
$("#sidebar-overlay")?.classList.remove("hidden");
});
$("#sidebar-overlay")?.addEventListener("click", () => {
$("#sidebar")?.classList.remove("open");
$("#sidebar-overlay")?.classList.add("hidden");
});
async function loadLongWeekends() {
const countryCode = document.getElementById("global-country").value;
const year = document.getElementById("global-year").value;
const content = document.getElementById("lw-content");
if (!countryCode) {
content.innerHTML = "<p>Please select a country first.</p>";
return;
}
try {
content.innerHTML = "<p>Loading long weekends...</p>";
const response = await fetch(
`https://date.nager.at/api/v3/LongWeekend/${year}/${countryCode}`
);
if (!response.ok) {
throw new Error("Failed to load long weekends");
}
const weekends = await response.json();
if (weekends.length === 0) {
content.innerHTML = "<p>No long weekends found for this country.</p>";
return;
}
content.innerHTML = weekends.map((weekend, index) => {
const start = new Date(`${weekend.startDate}T12:00:00`);
const end = new Date(`${weekend.endDate}T12:00:00`);
const savedId = `${countryCode}-${weekend.startDate}-${weekend.endDate}`;
const saved = myPlans.some(plan => plan.type === "longweekend" && plan.id === savedId);
const days = [];
for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
const isWeekend = [0, 5, 6].includes(d.getDay());
days.push(`<div class="lw-day ${isWeekend ? "weekend" : ""}"><span class="name">${weekday}</span><span class="num">${d.getDate()}</span></div>`);
}
return `
<div class="lw-card">
<div class="lw-card-header">
<span class="lw-badge"><i class="fa-solid fa-calendar-days"></i> ${weekend.dayCount} Days</span>
<button class="holiday-action-btn ${saved ? "saved" : ""}"
data-start="${weekend.startDate}" data-end="${weekend.endDate}"
data-days="${weekend.dayCount}" data-country="${countryCode}"
data-bridge="${weekend.needBridgeDay}" aria-label="Save long weekend">
<i class="${saved ? "fa-solid" : "fa-regular"} fa-heart"></i>
</button>
</div>
<h3>Long Weekend #${index + 1}</h3>
<div class="lw-dates"><i class="fa-regular fa-calendar"></i> ${start.toLocaleDateString("en-US", {month:"short",day:"numeric"})} - ${end.toLocaleDateString("en-US", {month:"short",day:"numeric",year:"numeric"})}</div>
<div class="lw-info-box ${weekend.needBridgeDay ? "warning" : "success"}"><i class="fa-solid ${weekend.needBridgeDay ? "fa-circle-info" : "fa-check-circle"}"></i> ${weekend.needBridgeDay ? "Requires taking an extra day off" : "No extra days off needed!"}</div>
<div class="lw-days-visual">${days.join("")}</div>
</div>
`;
}).join("");
console.log("Long weekends loaded:", weekends);
} catch (error) {
console.error("Error loading long weekends:", error);
content.innerHTML = "<p>Unable to load long weekends. Please try again.</p>";
}
}
document.querySelector('[data-view="long-weekends"]')?.addEventListener("click", () => {
loadLongWeekends();
});
const TICKETMASTER_API_KEY = "VwECw2OiAzxVzIqnwmKJUG41FbeXJk1y";
async function loadEvents() {
const city = document.getElementById("global-city").value.trim();
const countryCode = document.getElementById("global-country").value;
const content = document.getElementById("events-content");
if (!city) {
content.innerHTML = "<p>Please enter a city first.</p>";
return;
}
try {
content.innerHTML = "<p>Loading events...</p>";
const params = new URLSearchParams({
apikey: TICKETMASTER_API_KEY,
city: city,
size: 20
});
if (countryCode) {
params.append("countryCode", countryCode);
}
const response = await fetch(
`https://app.ticketmaster.com/discovery/v2/events.json?${params}`
);
if (!response.ok) {
throw new Error("Failed to load events");
}
const data = await response.json();
const events = data._embedded?.events || [];
if (events.length === 0) {
content.innerHTML = "<p>No events found in this city.</p>";
return;
}
window.currentEvents = events;
content.innerHTML = events.map(event => {
const venue = event._embedded?.venues?.[0];
const image = event.images?.find(img => img.ratio === "16_9")?.url || event.images?.[0]?.url || "";
const date = event.dates?.start?.localDate || "Date not available";
const time = event.dates?.start?.localTime || "";
const category = event.classifications?.[0]?.segment?.name || "General";
const place = [venue?.name, venue?.city?.name].filter(Boolean).join(", ") || city;
const price = event.priceRanges?.[0] ? `${event.priceRanges[0].min} - ${event.priceRanges[0].max} ${event.priceRanges[0].currency}` : "Price not available";
const saved = myPlans.some(plan => plan.type === "event" && plan.id === event.id);
return `
<div class="event-card">
<div class="event-card-image">
${image ? `<img src="${image}" alt="${escapeHTML(event.name)}" loading="lazy">` : `<div class="event-image-placeholder"><i class="fa-solid fa-ticket"></i></div>`}
<span class="event-card-category">${escapeHTML(category)}</span>
<button class="event-card-save ${saved ? "saved" : ""}" data-event-id="${event.id}" aria-label="Save event"><i class="${saved ? "fa-solid" : "fa-regular"} fa-heart"></i></button>
</div>
<div class="event-card-body">
<h3>${escapeHTML(event.name)}</h3>
<div class="event-card-info">
<div><i class="fa-regular fa-calendar"></i>${escapeHTML(date)} ${escapeHTML(time)}</div>
<div><i class="fa-solid fa-location-dot"></i>${escapeHTML(place)}</div>
<div><i class="fa-solid fa-ticket"></i>${escapeHTML(price)}</div>
</div>
<div class="event-card-footer">
<button class="btn-event" data-event-id="${event.id}"><i class="${saved ? "fa-solid" : "fa-regular"} fa-heart"></i> ${saved ? "Saved" : "Save"}</button>
<a href="${event.url}" target="_blank" rel="noopener" class="btn-buy-ticket"><i class="fa-solid fa-ticket"></i> Buy Tickets</a>
</div>
</div>
</div>
`;
}).join("");
const eventStat = $("#stat-events");
if (eventStat) eventStat.textContent = events.length;
console.log("Events loaded:", events);
} catch (error) {
console.error("Error loading events:", error);
content.innerHTML = "<p>Unable to load events. Please try again.</p>";
}
}
document.querySelector('[data-view="events"]')?.addEventListener("click", () => {
loadEvents();
});
function getWeatherInfo(code) {
const weather = {
0: ["Clear sky", "fa-sun"],
1: ["Mainly clear", "fa-sun"],
2: ["Partly cloudy", "fa-cloud-sun"],
3: ["Overcast", "fa-cloud"],
45: ["Fog", "fa-smog"],
48: ["Depositing rime fog", "fa-smog"],
51: ["Light drizzle", "fa-cloud-rain"],
53: ["Moderate drizzle", "fa-cloud-rain"],
55: ["Dense drizzle", "fa-cloud-showers-heavy"],
61: ["Slight rain", "fa-cloud-rain"],
63: ["Moderate rain", "fa-cloud-rain"],
65: ["Heavy rain", "fa-cloud-showers-heavy"],
71: ["Slight snow", "fa-snowflake"],
73: ["Moderate snow", "fa-snowflake"],
75: ["Heavy snow", "fa-snowflake"],
80: ["Rain showers", "fa-cloud-showers-heavy"],
81: ["Moderate showers", "fa-cloud-showers-heavy"],
82: ["Heavy showers", "fa-cloud-showers-heavy"],
95: ["Thunderstorm", "fa-cloud-bolt"],
96: ["Thunderstorm with hail", "fa-cloud-bolt"],
99: ["Heavy thunderstorm", "fa-cloud-bolt"]
};
return weather[code] || ["Unknown", "fa-cloud"];
}
function formatWeatherDate(date) {
return new Date(date + "T12:00:00").toLocaleDateString("en-US", {
weekday: "short",
day: "numeric",
month: "short"
});
}
async function loadWeather() {
const city = document.getElementById("global-city").value.trim();
const content = document.getElementById("weather-content");
if (!city) {
content.innerHTML = "<p>Please enter a city first.</p>";
return;
}
try {
content.innerHTML = "<p>Loading weather...</p>";
const location = await getCityLocation(city);
// Get weather forecast
const weatherResponse = await fetch(
`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,uv_index&hourly=temperature_2m,weather_code,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant&timezone=auto`
);
if (!weatherResponse.ok) {
throw new Error("Unable to load weather");
}
const weatherData = await weatherResponse.json();
const current = weatherData.current;
const daily = weatherData.daily;
const hourly = weatherData.hourly;
const currentWeather = getWeatherInfo(current.weather_code);
const currentDate = new Date(current.time).toLocaleDateString("en-US", {
weekday: "long",
day: "numeric",
month: "long",
year: "numeric"
});
const hourlyItems = hourly.time
.map((time, index) => ({ time, index }))
.filter(item => new Date(item.time) >= new Date(current.time))
.slice(0, 8);
content.innerHTML = `
<div class="weather-hero-card weather-sunny">
<div class="weather-location">
<i class="fa-solid fa-location-dot"></i>
<span>${location.name}</span>
<span class="weather-time">${currentDate}</span>
</div>
<div class="weather-hero-main">
<div class="weather-hero-left">
<div class="weather-hero-icon">
<i class="fa-solid ${currentWeather[1]}"></i>
</div>
<div class="weather-hero-temp">
<span class="temp-value">
${Math.round(current.temperature_2m)}
</span>
<span class="temp-unit">°C</span>
</div>
</div>
<div class="weather-hero-right">
<div class="weather-condition">
${currentWeather[0]}
</div>
<div class="weather-feels">
Feels like ${Math.round(current.apparent_temperature)}°C
</div>
<div class="weather-high-low">
<span class="high">
<i class="fa-solid fa-arrow-up"></i>
${Math.round(daily.temperature_2m_max[0])}°
</span>
<span class="low">
<i class="fa-solid fa-arrow-down"></i>
${Math.round(daily.temperature_2m_min[0])}°
</span>
</div>
</div>
</div>
</div>
<div class="weather-details-grid">
<div class="weather-detail-card">
<div class="detail-icon humidity">
<i class="fa-solid fa-droplet"></i>
</div>
<div class="detail-info">
<span class="detail-label">Humidity</span>
<span class="detail-value">
${current.relative_humidity_2m}%
</span>
</div>
</div>
<div class="weather-detail-card">
<div class="detail-icon wind">
<i class="fa-solid fa-wind"></i>
</div>
<div class="detail-info">
<span class="detail-label">Wind</span>
<span class="detail-value">
${current.wind_speed_10m} km/h
</span>
</div>
</div>
<div class="weather-detail-card">
<div class="detail-icon precip">
<i class="fa-solid fa-cloud-rain"></i>
</div>
<div class="detail-info">
<span class="detail-label">Precipitation</span>
<span class="detail-value">${daily.precipitation_probability_max[0] ?? 0}%</span>
</div>
</div>
<div class="weather-detail-card">
<div class="detail-icon uv">
<i class="fa-solid fa-sun"></i>
</div>
<div class="detail-info">
<span class="detail-label">UV Index</span>
<span class="detail-value">
${current.uv_index}
</span>
</div>
</div>
</div>
<div class="weather-section">
<h3 class="weather-section-title">
<i class="fa-solid fa-clock"></i>
Hourly Forecast
</h3>
<div class="hourly-scroll">
${hourlyItems.map(item => {
const index = item.index;
const info = getWeatherInfo(hourly.weather_code[index]);
const time = new Date(item.time).toLocaleTimeString("en-US", {
hour: "numeric",
hour12: true
});
return `
<div class="hourly-item">
<span class="hourly-time">${time}</span>
<div class="hourly-icon">
<i class="fa-solid ${info[1]}"></i>
</div>
<span class="hourly-temp">
${Math.round(hourly.temperature_2m[index])}°
</span>
</div>
`;
}).join("")}
</div>
</div>
<div class="weather-section">
<h3 class="weather-section-title">
<i class="fa-solid fa-calendar-week"></i>
7-Day Forecast
</h3>
<div class="forecast-list">
${daily.time.map((date, index) => {
const info = getWeatherInfo(daily.weather_code[index]);
return `
<div class="forecast-day ${index === 0 ? "today" : ""}">
<div class="forecast-day-name">
<span class="day-label">
${index === 0 ? "Today" : formatWeatherDate(date).split(",")[0]}
</span>
<span class="day-date">
${formatWeatherDate(date)}
</span>
</div>
<div class="forecast-icon">
<i class="fa-solid ${info[1]}"></i>
</div>
<div class="forecast-temps">
<span class="temp-max">
${Math.round(daily.temperature_2m_max[index])}°
</span>
<span class="temp-min">
${Math.round(daily.temperature_2m_min[index])}°
</span>
</div>
<div class="forecast-precip">
${daily.precipitation_probability_max[index] ?? 0}%
</div>
</div>
`;
}).join("")}
</div>
</div>
`;
console.log("Weather displayed successfully!");
} catch (error) {
console.error("Weather error:", error);
content.innerHTML = "<p>Unable to load weather. Please try again.</p>";
}
}
document.querySelector('[data-view="weather"]')?.addEventListener("click", () => {
loadWeather();
});
let exchangeRates = {};
async function loadCurrencies() {
try {
const response = await fetch(
"https://v6.exchangerate-api.com/v6/805842951e5953ad31497176/latest/USD"
);
const data = await response.json();
if (data.result !== "success") {
throw new Error("Failed to load exchange rates");
}
exchangeRates = data.conversion_rates;
const fromSelect = document.getElementById("currency-from");
const toSelect = document.getElementById("currency-to");
const currencies = Object.keys(exchangeRates);
if (!fromSelect || !toSelect) return;
fromSelect.innerHTML = "";
toSelect.innerHTML = "";
currencies.forEach(currency => {
fromSelect.innerHTML += `
<option value="${currency}">${currency}</option>
`;
toSelect.innerHTML += `
<option value="${currency}">${currency}</option>
`;
});
fromSelect.value = "USD";
toSelect.value = "EGP";
const popularContainer = $("#popular-currencies");
const popular = [
["EUR", "Euro", "eu"], ["GBP", "British Pound", "gb"],
["EGP", "Egyptian Pound", "eg"], ["AED", "UAE Dirham", "ae"],
["SAR", "Saudi Riyal", "sa"], ["JPY", "Japanese Yen", "jp"],
["CAD", "Canadian Dollar", "ca"], ["INR", "Indian Rupee", "in"]
];
if (popularContainer) {
popularContainer.innerHTML = popular.filter(item => exchangeRates[item[0]]).map(([code, name, flag]) => `
<button type="button" class="popular-currency-card" data-currency="${code}">
<img src="https://flagcdn.com/w40/${flag}.png" alt="${code}" class="flag">
<div class="info"><div class="code">${code}</div><div class="name">${name}</div></div>
<div class="rate">${Number(exchangeRates[code]).toFixed(4)}</div>
</button>
`).join("");
}
convertCurrency();
} catch (error) {
console.error("Currency Error:", error);
}
}
$("#convert-btn")?.addEventListener("click", convertCurrency);
$("#swap-currencies-btn")?.addEventListener("click", () => {
const fromSelect = document.getElementById("currency-from");
const toSelect = document.getElementById("currency-to");
const temp = fromSelect.value;
fromSelect.value = toSelect.value;
toSelect.value = temp;
convertCurrency();
});
$("#currency-amount")?.addEventListener("input", convertCurrency);
$("#currency-from")?.addEventListener("change", convertCurrency);
$("#currency-to")?.addEventListener("change", convertCurrency);
$("#popular-currencies")?.addEventListener("click", event => {
const card = event.target.closest("[data-currency]");
if (!card) return;
const toSelect = $("#currency-to");
if (toSelect) toSelect.value = card.dataset.currency;
convertCurrency();
});
function convertCurrency() {
const amountInput = $("#currency-amount");
const fromSelect = $("#currency-from");
const toSelect = $("#currency-to");
const resultElement = $("#currency-result");
if (!amountInput || !fromSelect || !toSelect || !resultElement) return;
const amount = Number(amountInput.value);
const from = fromSelect.value;
const to = toSelect.value;
if (!Number.isFinite(amount) || amount <= 0) {
resultElement.textContent = "Please enter a valid amount.";
return;
}
const fromRate = exchangeRates[from];
const toRate = exchangeRates[to];
if (!fromRate || !toRate) {
resultElement.textContent = "Exchange rates are not available.";
return;
}
const result = (amount / fromRate) * toRate;
resultElement.innerHTML = `
<div class="conversion-display">
<div class="conversion-from">
<span class="amount">${amount.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
<span class="currency-code">${from}</span>
</div>
<div class="conversion-equals"><i class="fa-solid fa-equals"></i></div>
<div class="conversion-to">
<span class="amount">${result.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
<span class="currency-code">${to}</span>
</div>
</div>
<div class="exchange-rate-info">
<p>1 ${from} = ${(toRate / fromRate).toFixed(4)} ${to}</p>
<small>Live exchange rate</small>
</div>
`;
}
async function loadCountryInfo() {
const countryCode = document.getElementById("global-country").value;
const container = document.getElementById("dashboard-country-info");
if (!countryCode || !container) return;
try {
const response = await fetch(
`https://countries.dev/alpha/${countryCode}`
);
if (!response.ok) {
throw new Error("Failed to load country information");
}
const country = await response.json();
const currencies = country.currencies || [];
const languages = country.languages || [];
const neighbors = country.borders || [];
const callingCode = country.callingCodes?.[0] || "N/A";
const timezone = country.timezones?.[0] || "N/A";
const currencyHTML = currencies.length
? currencies.map(currency => `
<span class="extra-tag">
${currency.name} (${currency.code} ${currency.symbol || ""})
</span>
`).join("")
: `<span class="extra-tag">N/A</span>`;
const languagesHTML = languages.length
? languages.map(language => `
<span class="extra-tag">${language.name}</span>
`).join("")
: `<span class="extra-tag">N/A</span>`;
const neighborsHTML = neighbors.length
? neighbors.map(neighbor => `
<span class="extra-tag border-tag">${neighbor}</span>
`).join("")
: `<span class="extra-tag">No neighboring countries</span>`;
container.innerHTML = `
<div class="dashboard-country-header">
<img
src="${country.flags?.png || `https://flagcdn.com/w160/${countryCode.toLowerCase()}.png`}"
alt="${country.name}"
class="dashboard-country-flag"
>
<div class="dashboard-country-title">
<h3>${country.name}</h3>
<p class="official-name">
${country.nativeName || country.name}
</p>
<span class="region">
<i class="fa-solid fa-location-dot"></i>
${country.region || "N/A"} • ${country.subregion || "N/A"}
</span>
</div>
</div>
<div class="dashboard-local-time">
<div class="local-time-display">
<i class="fa-solid fa-clock"></i>
<span class="local-time-value">${timezone}</span>
<span class="local-time-zone">Time Zone</span>
</div>
</div>
<div class="dashboard-country-grid">
<div class="dashboard-country-detail">
<i class="fa-solid fa-building-columns"></i>
<span class="label">Capital</span>
<span class="value">${country.capital || "N/A"}</span>
</div>
<div class="dashboard-country-detail">
<i class="fa-solid fa-users"></i>
<span class="label">Population</span>
<span class="value">${country.population?.toLocaleString() || "N/A"}</span>
</div>
<div class="dashboard-country-detail">
<i class="fa-solid fa-ruler-combined"></i>
<span class="label">Area</span>
<span class="value">${country.area?.toLocaleString() || "N/A"} km²</span>
</div>
<div class="dashboard-country-detail">
<i class="fa-solid fa-globe"></i>
<span class="label">Continent</span>
<span class="value">${country.region || "N/A"}</span>
</div>
<div class="dashboard-country-detail">
<i class="fa-solid fa-phone"></i>
<span class="label">Calling Code</span>
<span class="value">+${callingCode}</span>
</div>
<div class="dashboard-country-detail">
<i class="fa-solid fa-car"></i>
<span class="label">Driving Side</span>
<span class="value">${country.car?.side || "N/A"}</span>
</div>
<div class="dashboard-country-detail">
<i class="fa-solid fa-calendar-week"></i>
<span class="label">Week Starts</span>
<span class="value">${country.startOfWeek || "N/A"}</span>
</div>
</div>
<div class="dashboard-country-extras">
<div class="dashboard-country-extra">
<h4><i class="fa-solid fa-coins"></i> Currency</h4>
<div class="extra-tags">
${currencyHTML}
</div>
</div>
<div class="dashboard-country-extra">
<h4><i class="fa-solid fa-language"></i> Languages</h4>
<div class="extra-tags">
${languagesHTML}
</div>
</div>
<div class="dashboard-country-extra">
<h4><i class="fa-solid fa-map-location-dot"></i> Neighbors</h4>
<div class="extra-tags">
${neighborsHTML}
</div>
</div>
</div>
<div class="dashboard-country-actions">
<a
href="https://www.google.com/maps/place/${encodeURIComponent(country.name)}"
target="_blank"
class="btn-map-link"
>
<i class="fa-solid fa-map"></i>
View on Google Maps
</a>
</div>
`;
} catch (error) {
console.error("Country Info Error:", error);
container.innerHTML = "<p>Unable to load country information.</p>";
}
}
async function loadSunTimes() {
const city = document.getElementById("global-city").value.trim();
const container = document.getElementById("sun-times-content");
if (!city) {
if (container) container.innerHTML = "<p>Please enter a city first.</p>";
return;
}
try {
const location = await getCityLocation(city);
const timezoneResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m&timezone=auto`);
const timezoneData = timezoneResponse.ok ? await timezoneResponse.json() : null;
const cityTimezone = timezoneData?.timezone || "UTC";
const dateParts = new Intl.DateTimeFormat("en-GB", {
timeZone: cityTimezone,
year: "numeric",
month: "2-digit",
day: "2-digit"
}).formatToParts(new Date());
const dateValues = Object.fromEntries(dateParts.map(part => [part.type, part.value]));
const date = `${dateValues.year}-${dateValues.month}-${dateValues.day}`;
const response = await fetch(
`https://api.sunrise-sunset.org/json?lat=${location.latitude}&lng=${location.longitude}&date=${date}&formatted=0`
);
if (!response.ok) throw new Error("Failed to load sun times");
const data = await response.json();
if (data.status !== "OK") throw new Error("Sunrise-Sunset API returned an error");
const sun = data.results;
// Format UTC times to the city's local timezone
function formatSunTime(time) {
return new Date(time).toLocaleTimeString("en-US", {
hour: "2-digit",
minute: "2-digit",
hour12: true,
timeZone: cityTimezone
});
}
// Format daylight duration
const hours = Math.floor(sun.day_length / 3600);
const minutes = Math.floor((sun.day_length % 3600) / 60);
const dateObject = new Date(date + "T12:00:00");
container.innerHTML = `
<div class="sun-main-card">
<div class="sun-main-header">
<div class="sun-location">
<h2>
<i class="fa-solid fa-location-dot"></i>
${location.name}
</h2>
<p>Sun times for your selected location</p>
</div>
<div class="sun-date-display">
<div class="date">
${dateObject.toLocaleDateString("en-US", {
month: "long",
day: "numeric",
year: "numeric"
})}
</div>
<div class="day">
${dateObject.toLocaleDateString("en-US", {
weekday: "long"
})}
</div>
</div>
</div>
<div class="sun-times-grid">
<div class="sun-time-card dawn">
<div class="icon"><i class="fa-solid fa-moon"></i></div>
<div class="label">Dawn</div>
<div class="time">${formatSunTime(sun.civil_twilight_begin)}</div>
<div class="sub-label">Civil Twilight</div>
</div>
<div class="sun-time-card sunrise">
<div class="icon"><i class="fa-solid fa-sun"></i></div>
<div class="label">Sunrise</div>
<div class="time">${formatSunTime(sun.sunrise)}</div>
<div class="sub-label">Golden Hour Start</div>
</div>
<div class="sun-time-card noon">
<div class="icon"><i class="fa-solid fa-sun"></i></div>
<div class="label">Solar Noon</div>
<div class="time">${formatSunTime(sun.solar_noon)}</div>
<div class="sub-label">Sun at Highest</div>
</div>
<div class="sun-time-card sunset">
<div class="icon"><i class="fa-solid fa-sun"></i></div>
<div class="label">Sunset</div>
<div class="time">${formatSunTime(sun.sunset)}</div>
<div class="sub-label">Golden Hour End</div>
</div>
<div class="sun-time-card dusk">
<div class="icon"><i class="fa-solid fa-moon"></i></div>
<div class="label">Dusk</div>
<div class="time">${formatSunTime(sun.civil_twilight_end)}</div>
<div class="sub-label">Civil Twilight</div>
</div>
<div class="sun-time-card daylight">
<div class="icon"><i class="fa-solid fa-hourglass-half"></i></div>
<div class="label">Day Length</div>
<div class="time">${hours}h ${minutes}m</div>
<div class="sub-label">Total Daylight</div>
</div>
</div>
</div>
<div class="day-length-card">
<h3><i class="fa-solid fa-chart-pie"></i> Daylight Distribution</h3>
<div class="day-progress"><div class="day-progress-bar"><div class="day-progress-fill" style="width: ${(sun.day_length / 86400 * 100).toFixed(1)}%"></div></div></div>
<div class="day-length-stats">
<div class="day-stat"><div class="value">${hours}h ${minutes}m</div><div class="label">Daylight</div></div>
<div class="day-stat"><div class="value">${(sun.day_length / 86400 * 100).toFixed(1)}%</div><div class="label">of 24 Hours</div></div>
<div class="day-stat"><div class="value">${Math.floor((86400-sun.day_length)/3600)}h ${Math.floor(((86400-sun.day_length)%3600)/60)}m</div><div class="label">Darkness</div></div>
</div>
</div>
`;
} catch (error) {
console.error("Sun Times Error:", error);
container.innerHTML = "<p>Unable to load sun times.</p>";
}
}
document.querySelector('[data-view="sun-times"]')?.addEventListener("click", () => {
loadSunTimes();
});
// ==================== MY PLANS ====================
let myPlans = [];
try {
myPlans = JSON.parse(localStorage.getItem("wanderlust-plans") || "[]");
if (!Array.isArray(myPlans)) myPlans = [];
} catch {
myPlans = [];
}
function savePlans() {
localStorage.setItem("wanderlust-plans", JSON.stringify(myPlans));
renderMyPlans();
updateSavedCount();
}
function showToast(message, type = "success") {
const container = $("#toast-container");
if (!container) return;
const toast = document.createElement("div");
toast.className = `toast toast-${type}`;
toast.innerHTML = `<i class="fa-solid ${type === "success" ? "fa-circle-check" : "fa-circle-info"}"></i><span>${escapeHTML(message)}</span>`;
container.appendChild(toast);
setTimeout(() => toast.remove(), 3000);
}
function updateSavedCount() {
const count = $("#stat-saved");
if (count) count.textContent = myPlans.length;
}
function addPlan(plan) {
if (myPlans.some(item => item.id === plan.id && item.type === plan.type)) {
showToast("This item is already in My Plans", "info");
return;
}
myPlans.push({ ...plan, savedAt: new Date().toISOString() });
savePlans();
showToast("Added to My Plans");
}
function renderMyPlans(filter = "all") {
const container = $("#plans-content");
if (!container) return;
const filtered = filter === "all" ? myPlans : myPlans.filter(plan => plan.type === filter);
if (!filtered.length) {
container.innerHTML = `
<div class="empty-state">
<div class="empty-icon"><i class="fa-solid fa-heart-crack"></i></div>
<h3>No Saved Plans Yet</h3>
<p>Start exploring and save holidays, events, or long weekends you like!</p>
<button class="btn-primary" id="start-exploring-btn"><i class="fa-solid fa-compass"></i> Start Exploring</button>
</div>`;
$("#start-exploring-btn")?.addEventListener("click", () => showView("dashboard"));
} else {
container.innerHTML = filtered.map(plan => `
<article class="plan-card">
<div class="plan-card-header">
<span class="plan-type-badge ${plan.type}">${plan.type === "longweekend" ? "Long Weekend" : plan.type}</span>
<button class="delete-plan-btn" data-plan-id="${escapeHTML(plan.id)}" data-plan-type="${plan.type}" aria-label="Delete plan"><i class="fa-solid fa-trash"></i></button>
</div>
<h3>${escapeHTML(plan.title)}</h3>
<p>${escapeHTML(plan.subtitle || "")}</p>
<div class="plan-card-date"><i class="fa-regular fa-calendar"></i> ${escapeHTML(plan.date || "")}</div>
</article>`).join("");
}
const count = id => { const el = $(id); if (el) el.textContent = myPlans.filter(p => id === "#filter-all-count" || p.type === ({"#filter-holiday-count":"holiday","#filter-event-count":"event","#filter-lw-count":"longweekend"}[id])).length; };
count("#filter-all-count"); count("#filter-holiday-count"); count("#filter-event-count"); count("#filter-lw-count");
}
function handleSaveClick(button) {
if (button.matches(".holiday-action-btn") && button.dataset.date) {
const country = button.dataset.country || $("#global-country")?.value || "";
const date = button.dataset.date;
const id = `${country}-${date}`;
const existing = myPlans.some(plan => plan.type === "holiday" && plan.id === id);
if (existing) {
myPlans = myPlans.filter(plan => !(plan.type === "holiday" && plan.id === id));
savePlans(); showToast("Removed from My Plans", "info");
} else {
addPlan({ id, type: "holiday", title: button.dataset.localName || button.dataset.name, subtitle: button.dataset.name, date, country });
}
button.classList.toggle("saved", !existing);
button.innerHTML = `<i class="${existing ? "fa-regular" : "fa-solid"} fa-heart"></i>`;
return;
}
if (button.matches(".holiday-action-btn") && button.dataset.start) {
const id = `${button.dataset.country}-${button.dataset.start}-${button.dataset.end}`;
const existing = myPlans.some(plan => plan.type === "longweekend" && plan.id === id);
if (existing) {
myPlans = myPlans.filter(plan => !(plan.type === "longweekend" && plan.id === id));
savePlans(); showToast("Removed from My Plans", "info");
} else {
addPlan({ id, type: "longweekend", title: `Long Weekend (${button.dataset.days} days)`, subtitle: button.dataset.bridge === "true" ? "Requires an extra day off" : "No extra days off needed", date: `${button.dataset.start} - ${button.dataset.end}`, country: button.dataset.country });
}
button.classList.toggle("saved", !existing);
button.innerHTML = `<i class="${existing ? "fa-regular" : "fa-solid"} fa-heart"></i>`;
return;
}
const eventId = button.dataset.eventId;
if (eventId) {
const event = (window.currentEvents || []).find(item => item.id === eventId);
if (!event) return;
const existing = myPlans.some(plan => plan.type === "event" && plan.id === eventId);
if (existing) {
myPlans = myPlans.filter(plan => !(plan.type === "event" && plan.id === eventId));
savePlans(); showToast("Removed from My Plans", "info");
} else {
addPlan({ id: event.id, type: "event", title: event.name, subtitle: event._embedded?.venues?.[0]?.name || "", date: event.dates?.start?.localDate || "", url: event.url });
}
$$(`.event-card [data-event-id="${CSS.escape(eventId)}"]`).forEach(el => {
el.classList.toggle("saved", !existing);
if (el.classList.contains("btn-event")) el.innerHTML = `<i class="${existing ? "fa-regular" : "fa-solid"} fa-heart"></i> ${existing ? "Save" : "Saved"}`;
else el.innerHTML = `<i class="${existing ? "fa-regular" : "fa-solid"} fa-heart"></i>`;
});
}
}
document.addEventListener("click", event => {
const saveButton = event.target.closest(".holiday-action-btn, .event-card-save, .btn-event");
if (saveButton) handleSaveClick(saveButton);
const deleteButton = event.target.closest(".delete-plan-btn");
if (deleteButton) {
myPlans = myPlans.filter(plan => !(plan.id === deleteButton.dataset.planId && plan.type === deleteButton.dataset.planType));
savePlans(); showToast("Plan deleted", "info");
}
});
$$(".plan-filter").forEach(button => button.addEventListener("click", () => {
$$(".plan-filter").forEach(item => item.classList.toggle("active", item === button));
renderMyPlans(button.dataset.filter);
}));
$("#clear-all-plans-btn")?.addEventListener("click", () => {
if (!myPlans.length) return showToast("My Plans is already empty", "info");
if (confirm("Are you sure you want to clear all saved plans?")) {
myPlans = []; savePlans(); showToast("All plans cleared", "info");
}
});
// ==================== GLOBAL SEARCH & INITIALIZATION ====================
function updateSelectionLabels() {
const countrySelect = $("#global-country");
const city = $("#global-city")?.value.trim();
const year = $("#global-year")?.value;
const countryName = countrySelect?.selectedOptions[0]?.textContent || "";
$$(".current-selection-badge").forEach(badge => {
const flag = badge.querySelector(".selection-flag");
if (flag && countrySelect?.value) {
flag.src = `https://flagcdn.com/w40/${countrySelect.value.toLowerCase()}.png`;
flag.alt = countryName;
}
const countrySpan = badge.querySelector("span:first-of-type");
if (countrySpan && countryName) countrySpan.textContent = countryName;
const citySpan = badge.querySelector(".selection-city");
if (citySpan && city) citySpan.textContent = `• ${city}`;
const yearSpan = badge.querySelector(".selection-year");
if (yearSpan && year) yearSpan.textContent = year;
});
}
$("#global-search-btn")?.addEventListener("click", async () => {
updateSelectionLabels();
await Promise.allSettled([loadCountryInfo(), loadPublicHolidays()]);
showToast("Destination updated");
});
$("#global-country")?.addEventListener("change", () => {
selectedCityLocation = null;
const city = $("#global-city");
if (city) city.value = "";
const options = $("#city-options");
if (options) options.innerHTML = "";
loadCountryInfo();
updateSelectionLabels();
});
$("#global-city")?.addEventListener("change", () => {
const match = cityResults.find(item => item.name.toLowerCase() === $("#global-city").value.trim().toLowerCase());
if (match) selectedCityLocation = match;
updateSelectionLabels();
});
$("#global-year")?.addEventListener("change", updateSelectionLabels);
$("[data-view=holidays]")?.addEventListener("click", loadPublicHolidays);
function updateDateTime() {
const el = $("#current-datetime");
if (el) el.textContent = new Date().toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
async function initializeApp() {
await loadCountries();
const countrySelect = $("#global-country");
if (countrySelect && !countrySelect.value && [...countrySelect.options].some(option => option.value === "EG")) {
countrySelect.value = "EG";
}
await loadCountryInfo();
await loadCurrencies();
renderMyPlans();
updateSavedCount();
updateSelectionLabels();
updateDateTime();
setInterval(updateDateTime, 60000);
}
initializeApp();