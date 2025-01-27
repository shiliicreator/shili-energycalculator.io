// Массив для хранения всех добавленных приборов
let devices = [];

// Селекторы
const addDeviceBtn = document.getElementById('addDeviceBtn');
const calculateBtn = document.getElementById('calculateBtn');
const resetBtn = document.getElementById('resetBtn');

const deviceNameInput = document.getElementById('deviceName');
const usageTimeInput = document.getElementById('usageTime');
const powerInput = document.getElementById('power');
const priceInput = document.getElementById('price');

const resultsContainer = document.getElementById('results-container');
const resultsTable = document.getElementById('results-table');

// Добавляем обработчики событий
addDeviceBtn.addEventListener('click', addDevice);
calculateBtn.addEventListener('click', renderTable); // Пересчитывать по кнопке "Рассчитать"
resetBtn.addEventListener('click', resetAll);

/**
 * Функция добавления нового прибора в массив devices
 * и мгновенной перерисовки таблицы
 */
function addDevice() {
  const nameValue = deviceNameInput.value.trim();
  const usageValue = parseFloat(usageTimeInput.value);
  const powerValue = parseFloat(powerInput.value);
  const priceValue = parseFloat(priceInput.value);

  // Проверим валидность значений
  if (!nameValue) {
    alert('Введите название прибора.');
    return;
  }
  if (isNaN(usageValue) || usageValue < 0 || usageValue > 24) {
    alert('Введите корректное время использования (0..24).');
    return;
  }
  if (isNaN(powerValue) || powerValue < 0) {
    alert('Введите корректную мощность (Вт).');
    return;
  }
  if (isNaN(priceValue) || priceValue < 0) {
    alert('Введите корректную цену (руб/кВт·ч).');
    return;
  }

  // Создаём объект прибора
  const device = {
    id: Date.now(), // уникальный ID
    name: nameValue,
    usageHours: usageValue,
    powerWatts: powerValue,
    pricePerKwh: priceValue,
    enabled: true // По умолчанию прибор включён в расчёты
  };

  // Добавляем в массив
  devices.push(device);

  // Очищаем поля
  deviceNameInput.value = '';
  usageTimeInput.value = '';
  powerInput.value = '';
  priceInput.value = '';

  // Перерисовываем таблицу сразу
  renderTable();
}

/**
 * Функция для удаления прибора из массива по ID
 */
function removeDevice(deviceId) {
  devices = devices.filter(dev => dev.id !== deviceId);
  renderTable();
}

/**
 * Функция переключения (включение/выключение) прибора по чекбоксу
 */
function toggleDevice(deviceId, checked) {
  // Ищем прибор в массиве
  const device = devices.find(dev => dev.id === deviceId);
  if (device) {
    device.enabled = checked;
  }
  renderTable(); // Перерисовываем
}

/**
 * Функция очистки (сброса) — удаляем все приборы
 */
function resetAll() {
  devices = [];
  resultsTable.innerHTML = '';
  resultsContainer.style.display = 'none';
}

/**
 * Основная функция, которая строит таблицу результатов
 * на основании массива devices
 */
function renderTable() {
  // Если нет приборов — скрываем таблицу и выходим
  if (devices.length === 0) {
    resultsTable.innerHTML = '';
    resultsContainer.style.display = 'none';
    return;
  }
  resultsContainer.style.display = 'block';

  // Шапка таблицы (thead)
  // Первая ячейка — "Период", дальше по 2 столбца на каждый прибор
  let theadHtml = `<thead><tr><th rowspan="2">Период</th>`;
  devices.forEach(device => {
    theadHtml += `
      <th colspan="2" class="device-header">
        <input 
          type="checkbox" 
          class="toggle-device" 
          ${device.enabled ? 'checked' : ''} 
          onchange="toggleDevice(${device.id}, this.checked)"
          title="Включить/Выключить из расчётов"
        />
        ${device.name}
        <button 
          class="remove-device-btn" 
          onclick="removeDevice(${device.id})"
          title="Удалить прибор"
        >&times;</button>
      </th>
    `;
  });
  theadHtml += `</tr><tr>`;

  // Вторая строка заголовка — подписи "Потребление" и "Цена" на каждый прибор
  devices.forEach(() => {
    theadHtml += `
      <th>Потребление (кВт·ч)</th>
      <th>Цена (руб.)</th>
    `;
  });
  theadHtml += `</tr></thead>`;

  // Тело таблицы (tbody)
  let tbodyHtml = `<tbody>`;

  // Массив периодов для отображения в первой колонке
  const periods = [
    { label: '1 час', hours: 1 },
    { label: '1 день', hours: null }, // null - особый случай, берём usageHours
    { label: '1 месяц', hours: null }, // для месяца будет usageHours * 30.44
    { label: '1 год', hours: null }, // для года будет usageHours * 365.25
    { label: '', hours: null } // для "Пользовательское время (H)"
  ];

  // Построим каждую строку: 1 час, 1 день, 1 месяц, 1 год, Пользовательское время(H)
  periods.forEach((period, index) => {
    // Левый столбец
    let rowLabel = '';
    switch (index) {
      case 0:
        rowLabel = '1 час';
        break;
      case 1:
        rowLabel = '1 день';
        break;
      case 2:
        rowLabel = '1 месяц';
        break;
      case 3:
        rowLabel = '1 год';
        break;
      case 4:
        rowLabel = 'Пользовательское время';
        break;
      default:
        rowLabel = '';
    }

    tbodyHtml += `<tr><td>${rowLabel}${ index === 4 ? ' (' + getHoursList(devices) + ' ч)' : '' }</td>`;

    // Для каждого прибора вычисляем потребление и цену
    devices.forEach(device => {
      // Если прибор выключен, потребление и цена = 0
      if (!device.enabled) {
        tbodyHtml += `<td>0</td><td>0</td>`;
        return;
      }

      // Мощность (Вт) -> кВт
      const powerKwh = device.powerWatts / 1000;

      let consumption = 0; 
      let cost = 0;

      switch (index) {
        // 1 час: просто 1 час использования
        case 0:
          consumption = powerKwh * 1; 
          cost = consumption * device.pricePerKwh;
          break;
        
        // 1 день: usageHours часов * powerKwh
        case 1:
          consumption = powerKwh * device.usageHours;
          cost = consumption * device.pricePerKwh;
          break;

        // 1 месяц: 1 день * 30.44
        case 2:
          consumption = powerKwh * device.usageHours * 30.44;
          cost = consumption * device.pricePerKwh;
          break;

        // 1 год: 1 день * 365.25
        case 3:
          consumption = powerKwh * device.usageHours * 365.25;
          cost = consumption * device.pricePerKwh;
          break;

        // Пользовательское время (usageHours), 
        // хотя по сути схоже с "1 день", но выводим отдельно по ТЗ
        case 4:
          consumption = powerKwh * device.usageHours;
          cost = consumption * device.pricePerKwh;
          break;
      }

      if (isNaN(consumption)) consumption = 0;
      if (isNaN(cost)) cost = 0;

      // Округлим чуть-чуть (2 знака после запятой)
      consumption = Math.round(consumption * 100) / 100;
      cost = Math.round(cost * 100) / 100;

      // Если результат 0 или NaN -> ставим 0
      if (!consumption) consumption = 0;
      if (!cost) cost = 0;

      tbodyHtml += `<td>${consumption}</td><td>${cost}</td>`;
    });

    tbodyHtml += `</tr>`;
  });

  tbodyHtml += `</tbody>`;

  // Итоговая сборка HTML для таблицы
  resultsTable.innerHTML = theadHtml + tbodyHtml;
}

/**
 * Вспомогательная функция для вывода списком пользовательских часов
 * Например, если в списке 2 прибора: 10 ч, 5 ч => "(10,5 ч)"
 * Но в задаче говорится: "Пользовательское время (из переменной время использования в часах)". 
 * ТЗ не уточняет, как именно выводить для нескольких приборов, 
 * поэтому можно вывести среднее или все значения через запятую.
 * Для наглядности выведем все значения через запятую.
 */
function getHoursList(devices) {
  let hoursSet = new Set();
  devices.forEach(d => {
    if (d.enabled) {
      hoursSet.add(d.usageHours);
    }
  });
  // Преобразуем в массив и отсортируем
  let hoursArray = Array.from(hoursSet).sort((a, b) => a - b);
  if (hoursArray.length === 0) {
    return '0'; 
  }
  return hoursArray.join(', ');
}