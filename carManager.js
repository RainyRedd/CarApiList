import { apiGetCars, apiAddCar, apiUpdateCar, apiDeleteCar, setUserName } from './carApiHandler.js';

class Car {
    constructor(brand, model, price, year, id = null) {
        this.id = id;
        this.brand = brand;
        this.model = model;
        this.price = Number(price) || 0;
        this.year = Number(year) || null;
    }

    age() {
        if (!this.year) return '';
        return new Date().getFullYear() - this.year;
    }
}

const brandInput = document.getElementById('brandInput');
const modelInput = document.getElementById('modelInput');
const priceInput = document.getElementById('priceInput');
const yearInput = document.getElementById('yearInput');
const saveBtn = document.getElementById('saveCarBtn');
const tableBody = document.querySelector('#carTable tbody');

let cars = [];
let editIndex = null;


async function reloadFromServer() {
    try {
        const apiCars = await apiGetCars();

        cars = apiCars.map(c => new Car(c.brand, c.model, c.price, c.year, c.id));
        renderTable();
    } catch (err) {
        console.error(err);
        alert('Failed to load cars from server. See console for details.');
    }
}

function renderTable() {
    tableBody.innerHTML = '';
    cars.forEach((car, idx) => {
        const row = document.createElement('tr');
        row.innerHTML = `
      <td>${car.brand ?? ''}</td>
      <td>${car.model ?? ''}</td>
      <td>$${Number(car.price).toFixed(2)}</td>
      <td>${car.year ?? ''}</td>
      <td>${car.age()}</td>
      <td>
        <button data-action="edit" data-index="${idx}">Edit</button>
        <button data-action="delete" data-index="${idx}">Delete</button>
      </td>
    `;
        tableBody.appendChild(row);
    });
}

function resetForm() {
    brandInput.value = '';
    modelInput.value = '';
    priceInput.value = '';
    yearInput.value = '';
    saveBtn.textContent = 'Save Car';
    editIndex = null;
}

async function handleSaveOrUpdate() {
    const brand = brandInput.value.trim();
    const model = modelInput.value.trim();
    const price = parseFloat(priceInput.value);
    const year = parseInt(yearInput.value, 10);

    if (!brand || isNaN(price) || isNaN(year)) {
        alert('Please fill out brand, price, and year correctly.');
        return;
    }

    try {
        if (editIndex === null) {

            const created = await apiAddCar({ brand, model, price, year });
            if (created) {
                cars.push(new Car(created.brand ?? brand, created.model ?? model, created.price ?? price, created.year ?? year, created.id ?? null));
            } else {
                await reloadFromServer();
            }
        } else {

            const current = cars[editIndex];
            const updated = await apiUpdateCar({
                id: current.id,
                brand,
                model,
                price,
                year,
            });
            if (updated) {
                cars[editIndex] = new Car(updated.brand ?? brand, updated.model ?? model, updated.price ?? price, updated.year ?? year, updated.id ?? current.id);
            } else {
                await reloadFromServer();
            }
        }
        renderTable();
        resetForm();
    } catch (err) {
        console.error(err);
        alert('Save failed. See console for details.');
    }
}

async function handleTableClick(e) {
    const btn = e.target;
    if (!btn.dataset.action) return;

    const idx = Number(btn.dataset.index);

    if (btn.dataset.action === 'edit') {
        const car = cars[idx];
        brandInput.value = car.brand ?? '';
        modelInput.value = car.model ?? '';
        priceInput.value = car.price ?? '';
        yearInput.value = car.year ?? '';
        saveBtn.textContent = 'Update Car';
        editIndex = idx;
    }

    if (btn.dataset.action === 'delete') {
        if (!confirm('Remove this car?')) return;
        const car = cars[idx];
        try {
            if (car.id == null) {
                cars.splice(idx, 1);
            } else {
                await apiDeleteCar(car.id);
                cars.splice(idx, 1);
            }
            renderTable();
            if (editIndex === idx) resetForm();
        } catch (err) {
            console.error(err);
            alert('Delete failed. See console for details.');
        }
    }
}

saveBtn.addEventListener('click', handleSaveOrUpdate);
tableBody.addEventListener('click', handleTableClick);


reloadFromServer();