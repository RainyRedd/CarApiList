const CONFIG = {
    baseUrl: 'http://ltpe4.web.techcollege.dk',
    resource: '/api/CarFamily',
    userNameParamName: 'userName',
    typeEnabled: true,
    mapping: {

        id: 'carId',
        brand: 'carName',
        model: 'carModel',
        price: 'carPrice',
        year: 'carYear',

        typeField: '$type',
        typeValues: {
            base: 'car',
            model: 'carModel',
        },
    },
};

const IS_LOG_ENABLED = true;


let USER_NAME = localStorage.getItem('userName') || 'Default VSCode User';
export function setUserName(name) {
    USER_NAME = (name || '').trim() || 'Default VSCode User';
    localStorage.setItem('userName', USER_NAME);
}

export function setApiConfig(partial) {
    Object.assign(CONFIG, partial);
    if (partial.mapping) {
        Object.assign(CONFIG.mapping, partial.mapping);
    }
}


function buildUrl(id = null) {
    const base = CONFIG.baseUrl.replace(/\/+$/, '');
    const res = CONFIG.resource.startsWith('/') ? CONFIG.resource : `/${CONFIG.resource}`;
    const path = id == null ? `${base}${res}` : `${base}${res}/${encodeURIComponent(id)}`;
    const params = new URLSearchParams();
    if (CONFIG.userNameParamName) {
        params.set(CONFIG.userNameParamName, USER_NAME);
    }
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
}


function normalizeFromApi(apiObj) {
    const m = CONFIG.mapping;
    const year = Number(apiObj[m.year]);
    const price = Number(apiObj[m.price]);
    return {
        id: apiObj[m.id],
        name: apiObj[m.brand],
        brand: apiObj[m.brand],
        model: apiObj[m.model] ?? '',
        year: Number.isFinite(year) ? year : null,
        price: Number.isFinite(price) ? price : 0,
    };
}

function payloadToApi({ id, brand, model, price, year }) {
    const m = CONFIG.mapping;
    const api = {};
    if (CONFIG.typeEnabled) {
        const typeVal =
            model && String(model).trim().length > 0 ? m.typeValues.model : m.typeValues.base;
        api[m.typeField] = typeVal;
    }
    if (id !== undefined && id !== null) api[m.id] = id;
    api[m.brand] = brand;
    api[m.year] = year;
    api[m.price] = price;
    if (model && String(model).trim().length > 0) {
        api[m.model] = model;
    }
    return api;
}

async function parseJsonSafe(res) {
    try {
        return await res.json();
    } catch {
        return null;
    }
}


export async function apiGetCars() {
    const url = buildUrl();
    if (IS_LOG_ENABLED) console.log('GET', url);
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`GET ${url} failed: ${res.status} ${text}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data.map(normalizeFromApi) : [];
}

export async function apiAddCar({ brand, model, price, year }) {
    const url = buildUrl();
    const payload = payloadToApi({ brand, model, price, year });
    if (IS_LOG_ENABLED) console.log('POST', url, payload);

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`POST ${url} failed: ${res.status} ${text}`);
    }
    const created = await parseJsonSafe(res);
    return created ? normalizeFromApi(created) : null;
}

export async function apiUpdateCar({ id, brand, model, price, year }) {
    if (id == null) throw new Error('apiUpdateCar requires id');
    const url = buildUrl(id);
    const payload = payloadToApi({ id, brand, model, price, year });
    if (IS_LOG_ENABLED) console.log('PUT', url, payload);

    const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`PUT ${url} failed: ${res.status} ${text}`);
    }
    const updated = await parseJsonSafe(res);
    return updated ? normalizeFromApi(updated) : null;
}

export async function apiDeleteCar(id) {
    if (id == null) throw new Error('apiDeleteCar requires id');
    const url = buildUrl(id);
    if (IS_LOG_ENABLED) console.log('DELETE', url);

    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`DELETE ${url} failed: ${res.status} ${text}`);
    }
    return true;
}

export const API_META = {
    get baseUrl() { return CONFIG.baseUrl; },
    get resource() { return CONFIG.resource; },
    get userNameParamName() { return CONFIG.userNameParamName; },
    get mapping() { return CONFIG.mapping; },
    get typeEnabled() { return CONFIG.typeEnabled; },
};