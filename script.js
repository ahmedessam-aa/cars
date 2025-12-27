let licenseWarningDays = 20;
let editingVehicleId = null;
let listenersInitialized = false;



const appData = {
    vehicles: [],
    maintenance: [],
    violations: [],
    expenses: [],
    advance: [],
};



function initializeApp() {
    loadData();
    setupEventListeners();
    updateDateTime();
    loadLicenseWarningDays();
    renderDashboard();
    setInterval(updateDateTime, 1000);
}

function loadData() {
    try {
        appData.vehicles = JSON.parse(localStorage.getItem('vehicles')) || [];
        appData.maintenance = JSON.parse(localStorage.getItem('maintenance')) || [];
        appData.violations = JSON.parse(localStorage.getItem('violations')) || [];
        appData.expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        appData.advance = JSON.parse(localStorage.getItem('advance')) || [];
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        // Reset to empty arrays if parsing fails
        appData.vehicles = [];
        appData.maintenance = [];
        appData.violations = [];
        appData.expenses = [];
        appData.advance = [];
    }
}

function saveData() {
    try {
        localStorage.setItem('vehicles', JSON.stringify(appData.vehicles));
        localStorage.setItem('maintenance', JSON.stringify(appData.maintenance));
        localStorage.setItem('violations', JSON.stringify(appData.violations));
        localStorage.setItem('expenses', JSON.stringify(appData.expenses));
        localStorage.setItem('advance', JSON.stringify(appData.advance));
    } catch (error) {
        console.error('خطأ في حفظ البيانات:', error);
    }
}

function loadLicenseWarningDays() {
    const saved = localStorage.getItem('licenseWarningDays');
    if (saved) {
        licenseWarningDays = parseInt(saved);
        document.getElementById('licenseWarningDays').value = licenseWarningDays;
    }
}

function saveLicenseWarningDays() {
    const value = parseInt(document.getElementById('licenseWarningDays').value);
    if (value >= 1 && value <= 365) {
        licenseWarningDays = value;
        localStorage.setItem('licenseWarningDays', value);
        alert('تم حفظ الإعدادات بنجاح');
        renderDashboard();
    } else {
        alert('يرجى إدخال عدد أيام صحيح (بين 1 و 365)');
    }
}

function setupEventListeners() {
    if (listenersInitialized) return;

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            showSection(section);
        });
    });

    document.getElementById('vehicleForm').addEventListener('submit', handleVehicleSubmit);
    document.getElementById('maintenanceForm').addEventListener('submit', handleMaintenanceSubmit);
    document.getElementById('violationForm').addEventListener('submit', handleViolationSubmit);
    document.getElementById('expensesForm').addEventListener('submit', handleExpensesSubmit);
    document.getElementById('advanceForm').addEventListener('submit', handleAdvanceSubmit);
    document.getElementById('vehicleSearch').addEventListener('input', filterVehicles);
    document.getElementById('vehicleStatusFilter').addEventListener('change', filterVehicles);
    document.getElementById('maintenanceSearch').addEventListener('input', filterMaintenance);
    document.getElementById('maintenanceStatusFilter').addEventListener('change', filterMaintenance);
    document.getElementById('licenseSearch').addEventListener('input', filterLicenses);
    document.getElementById('licenseStatusFilter').addEventListener('change', filterLicenses);
    document.getElementById('violationSearch').addEventListener('input', filterViolations);
    document.getElementById('violationStatusFilter').addEventListener('change', filterViolations);
    document.getElementById('expensesSearch').addEventListener('input', filterExpenses);

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeVehicleModal();
            closeMaintenanceModal();
            closeViolationModal();
            closeExpensesModal();
        }
    });

    listenersInitialized = true;
}

function updateDateTime() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };
    const formatted = now.toLocaleDateString('ar-EG', options);
    document.getElementById('dateTime').textContent = formatted;
    document.getElementById('lastUpdate').textContent = formatted.split(',')[0];
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');

    if (sectionId === 'dashboard') {
        renderDashboard();
    } else if (sectionId === 'vehicles') {
        populateVehiclesList();
    } else if (sectionId === 'maintenance') {
        populateMaintenanceList();
    } else if (sectionId === 'violations') {
        populateViolationsList();
    } else if (sectionId === 'licenses') {
        populateLicensesList();
    } else if (sectionId === 'expenses') {
        populateExpensesList();
    } else if (sectionId === 'advance') {
        populateAdvanceList();
    }
}

function openVehicleModal(vehicleId = null) {
    editingVehicleId = vehicleId;
    const modal = document.getElementById('vehicleModal');
    const form = document.getElementById('vehicleForm');
    const title = document.getElementById('vehicleModalTitle');

    if (vehicleId) {
        title.textContent = 'تعديل بيانات المركبة';
        const vehicle = appData.vehicles.find(v => v.id === vehicleId);
        if (vehicle) {
            document.getElementById('plateNumber').value = vehicle.plate_number;
            document.getElementById('vehicleModel').value = vehicle.model;
            document.getElementById('vehicleYear').value = vehicle.year;
            document.getElementById('vinNumber').value = vehicle.vin_number || '';
            document.getElementById('vehicleStatus').value = vehicle.status;
            document.getElementById('licenseNumber').value = vehicle.license_number;
            document.getElementById('licenseExpiry').value = vehicle.license_expiry;
            document.getElementById('violationCount').value = vehicle.violation_count || 0;
            document.getElementById('violationPaid').value = vehicle.violation_paid || 0;
            document.getElementById('vehicleNotes').value = vehicle.notes || '';
        }
    } else {
        title.textContent = 'إضافة مركبة جديدة';
        form.reset();
        document.getElementById('violationCount').value = 0;
        document.getElementById('violationPaid').value = 0;
    }

    modal.classList.add('show');
}

function closeVehicleModal() {
    document.getElementById('vehicleModal').classList.remove('show');
    editingVehicleId = null;
    document.getElementById('vehicleForm').reset();
}

function handleVehicleSubmit(e) {
    e.preventDefault();

    const vehicleData = {
        id: editingVehicleId || Date.now().toString(),
        plate_number: document.getElementById('plateNumber').value,
        model: document.getElementById('vehicleModel').value,
        year: parseInt(document.getElementById('vehicleYear').value),
        vin_number: document.getElementById('vinNumber').value,
        status: document.getElementById('vehicleStatus').value,
        license_number: document.getElementById('licenseNumber').value,
        license_expiry: document.getElementById('licenseExpiry').value,
        violation_count: parseInt(document.getElementById('violationCount').value) || 0,
        violation_paid: parseFloat(document.getElementById('violationPaid').value) || 0,
        notes: document.getElementById('vehicleNotes').value
    };

    try {
        if (editingVehicleId) {
            const index = appData.vehicles.findIndex(v => v.id === editingVehicleId);
            if (index !== -1) {
                appData.vehicles[index] = vehicleData;
            }
        } else {
            appData.vehicles.push(vehicleData);
        }

        saveData();
        closeVehicleModal();
        populateVehiclesList();
        renderDashboard();
        alert('تم حفظ البيانات بنجاح');
    } catch (error) {
        console.error('خطأ:', error);
        alert('حدث خطأ في حفظ البيانات: ' + error.message);
    }
}

function deleteVehicle(vehicleId) {
    if (confirm('هل أنت متأكد من حذف هذه المركبة؟')) {
        try {
            appData.vehicles = appData.vehicles.filter(v => v.id !== vehicleId);
            saveData();
            populateVehiclesList();
            renderDashboard();
        } catch (error) {
            console.error('خطأ:', error);
            alert('حدث خطأ في حذف البيانات');
        }
    }
}

function openMaintenanceModal(maintenanceId = null) {
    const modal = document.getElementById('maintenanceModal');
    const form = document.getElementById('maintenanceForm');
    const vehicleSelect = document.getElementById('maintenanceVehicle');

    vehicleSelect.innerHTML = '<option value="">اختر مركبة</option>';
    appData.vehicles.forEach(v => {
        const option = document.createElement('option');
        option.value = v.id;
        option.textContent = `${v.plate_number} - ${v.model}`;
        vehicleSelect.appendChild(option);
    });

    if (maintenanceId) {
        const maintenance = appData.maintenance.find(m => m.id === maintenanceId);
        if (maintenance) {
            document.getElementById('maintenanceVehicle').value = maintenance.vehicle_id;
            document.getElementById('maintenanceType').value = maintenance.maintenance_type;
            document.getElementById('maintenanceDate').value = maintenance.maintenance_date;
            document.getElementById('maintenanceCost').value = maintenance.cost;
            document.getElementById('maintenanceStatus').value = maintenance.status;
            document.getElementById('maintenanceNotes').value = maintenance.notes || '';
        }
    } else {
        form.reset();
    }

    modal.classList.add('show');
}

function closeMaintenanceModal() {
    document.getElementById('maintenanceModal').classList.remove('show');
    document.getElementById('maintenanceForm').reset();
}

function openViolationModal(violationId = null) {
    const modal = document.getElementById('violationModal');
    const form = document.getElementById('violationForm');
    const vehicleSelect = document.getElementById('violationVehicle');

    vehicleSelect.innerHTML = '<option value="">اختر مركبة</option>';
    appData.vehicles.forEach(v => {
        const option = document.createElement('option');
        option.value = v.id;
        option.textContent = `${v.plate_number} - ${v.model}`;
        vehicleSelect.appendChild(option);
    });

    if (violationId) {
        const violation = appData.violations.find(v => v.id === violationId);
        if (violation) {
            document.getElementById('violationVehicle').value = violation.vehicle_id;
            document.getElementById('violationType').value = violation.violation_type;
            document.getElementById('violationDate').value = violation.violation_date;
            document.getElementById('violationAmount').value = violation.amount;
            document.getElementById('violationStatus').value = violation.status;
            document.getElementById('violationNotes').value = violation.notes || '';
        }
    } else {
        form.reset();
    }

    modal.classList.add('show');
}

function closeViolationModal() {
    document.getElementById('violationModal').classList.remove('show');
    document.getElementById('violationForm').reset();
}

let editingExpenseId = null;

function openExpensesModal(expenseId = null) {
    editingExpenseId = expenseId;
    const modal = document.getElementById('expensesModal');
    const form = document.getElementById('expensesForm');
    const vehicleSelect = document.getElementById('expensesVehicle');
    const advanceSelect = document.getElementById('expensesAdvance');
    const title = document.getElementById('expensesModalTitle');

    vehicleSelect.innerHTML = '<option value="">اختر مركبة (اختياري)</option>';
    appData.vehicles.forEach(v => {
        const option = document.createElement('option');
        option.value = v.id;
        option.textContent = `${v.plate_number} - ${v.model}`;
        vehicleSelect.appendChild(option);
    });

    advanceSelect.innerHTML = '<option value="">لم ترتبط بعهدة</option>';
    appData.advance.filter(a => a.is_active).forEach(a => {
        const option = document.createElement('option');
        option.value = a.id;
        option.textContent = `عهدة ${a.amount} جنيه - ${a.advance_date}`;
        advanceSelect.appendChild(option);
    });

    if (expenseId) {
        title.textContent = 'تعديل بيانات النفقة';
        const expense = appData.expenses.find(e => e.id === expenseId);
        if (expense) {
            document.getElementById('expensesVehicle').value = expense.vehicle_id || '';
            document.getElementById('expensesType').value = expense.expense_type || '';
            document.getElementById('customExpenseType').value = expense.is_custom_type ? expense.expense_type : '';
            document.getElementById('expensesDate').value = expense.expense_date;
            document.getElementById('expensesAmount').value = expense.amount;
            document.getElementById('expensesAdvance').value = expense.advance_id || '';
            document.getElementById('expensesNotes').value = expense.notes || '';
        }
    } else {
        title.textContent = 'إضافة نفقة جديدة';
        form.reset();
        document.getElementById('customExpenseType').value = '';
    }

    modal.classList.add('show');
}

function closeExpensesModal() {
    document.getElementById('expensesModal').classList.remove('show');
    editingExpenseId = null;
    document.getElementById('expensesForm').reset();
}

function handleMaintenanceSubmit(e) {
    e.preventDefault();

    const vehicleId = document.getElementById('maintenanceVehicle').value;
    const vehicle = appData.vehicles.find(v => v.id === vehicleId);

    const maintenanceData = {
        id: Date.now().toString(),
        vehicle_id: vehicleId,
        plate_number: vehicle ? vehicle.plate_number : '',
        maintenance_type: document.getElementById('maintenanceType').value,
        maintenance_date: document.getElementById('maintenanceDate').value,
        cost: parseFloat(document.getElementById('maintenanceCost').value),
        status: document.getElementById('maintenanceStatus').value,
        notes: document.getElementById('maintenanceNotes').value
    };

    try {
        appData.maintenance.push(maintenanceData);
        saveData();
        closeMaintenanceModal();
        populateMaintenanceList();
        renderDashboard();
        alert('تم تسجيل الصيانة بنجاح');
    } catch (error) {
        console.error('خطأ:', error);
        alert('حدث خطأ في تسجيل الصيانة: ' + error.message);
    }
}

function handleViolationSubmit(e) {
    e.preventDefault();

    const vehicleId = document.getElementById('violationVehicle').value;
    const vehicle = appData.vehicles.find(v => v.id === vehicleId);

    const violationData = {
        id: Date.now().toString(),
        vehicle_id: vehicleId,
        plate_number: vehicle ? vehicle.plate_number : '',
        violation_type: document.getElementById('violationType').value,
        violation_date: document.getElementById('violationDate').value,
        amount: parseFloat(document.getElementById('violationAmount').value),
        status: document.getElementById('violationStatus').value,
        notes: document.getElementById('violationNotes').value
    };

    try {
        appData.violations.push(violationData);
        saveData();
        closeViolationModal();
        populateViolationsList();
        renderDashboard();
        alert('تم تسجيل المخالفة بنجاح');
    } catch (error) {
        console.error('خطأ:', error);
        alert('حدث خطأ في تسجيل المخالفة: ' + error.message);
    }
}

function deleteMaintenance(maintenanceId) {
    if (confirm('هل أنت متأكد من حذف سجل الصيانة؟')) {
        try {
            appData.maintenance = appData.maintenance.filter(m => m.id !== maintenanceId);
            saveData();
            populateMaintenanceList();
            renderDashboard();
        } catch (error) {
            console.error('خطأ:', error);
            alert('حدث خطأ في حذف البيانات');
        }
    }
}

function deleteViolation(violationId) {
    if (confirm('هل أنت متأكد من حذف المخالفة؟')) {
        try {
            appData.violations = appData.violations.filter(v => v.id !== violationId);
            saveData();
            populateViolationsList();
            renderDashboard();
        } catch (error) {
            console.error('خطأ:', error);
            alert('حدث خطأ في حذف البيانات');
        }
    }
}

function handleExpensesSubmit(e) {
    e.preventDefault();

    const vehicleId = document.getElementById('expensesVehicle').value;
    const vehicle = vehicleId ? appData.vehicles.find(v => v.id === vehicleId) : null;

    let expenseType = document.getElementById('expensesType').value;
    let isCustom = false;
    const customType = document.getElementById('customExpenseType').value;

    if (customType) {
        expenseType = customType;
        isCustom = true;
    }

    const expenseData = {
        id: editingExpenseId || Date.now().toString(),
        vehicle_id: vehicleId || null,
        plate_number: vehicle ? vehicle.plate_number : '',
        expense_type: expenseType,
        is_custom_type: isCustom,
        expense_date: document.getElementById('expensesDate').value,
        amount: parseFloat(document.getElementById('expensesAmount').value),
        advance_id: document.getElementById('expensesAdvance').value || null,
        notes: document.getElementById('expensesNotes').value
    };

    try {
        if (editingExpenseId) {
            const index = appData.expenses.findIndex(e => e.id === editingExpenseId);
            if (index !== -1) {
                appData.expenses[index] = expenseData;
            }
        } else {
            appData.expenses.push(expenseData);
        }

        saveData();
        closeExpensesModal();
        populateExpensesList();
        populateAdvanceList();
        renderDashboard();
        alert('تم حفظ بيانات النفقة بنجاح');
    } catch (error) {
        console.error('خطأ:', error);
        alert('حدث خطأ في حفظ البيانات: ' + error.message);
    }
}

function deleteExpense(expenseId) {
    if (confirm('هل أنت متأكد من حذف هذه النفقة؟')) {
        try {
            appData.expenses = appData.expenses.filter(e => e.id !== expenseId);
            saveData();
            populateExpensesList();
            renderDashboard();
        } catch (error) {
            console.error('خطأ:', error);
            alert('حدث خطأ في حذف البيانات');
        }
    }
}

function openAdvanceModal(advanceId = null) {
    const modal = document.getElementById('advanceModal');
    const form = document.getElementById('advanceForm');
    const title = document.getElementById('advanceModalTitle');

    if (advanceId) {
        title.textContent = 'تعديل بيانات العهدة';
        const advance = appData.advance.find(a => a.id === advanceId);
        if (advance) {
            document.getElementById('advanceAmount').value = advance.amount;
            document.getElementById('advanceDate').value = advance.advance_date;
            document.getElementById('advanceNotes').value = advance.notes || '';
        }
    } else {
        title.textContent = 'إضافة عهدة جديدة';
        form.reset();
    }

    modal.classList.add('show');
}

function closeAdvanceModal() {
    document.getElementById('advanceModal').classList.remove('show');
    document.getElementById('advanceForm').reset();
}

function handleAdvanceSubmit(e) {
    e.preventDefault();

    const advanceData = {
        id: Date.now().toString(),
        amount: parseFloat(document.getElementById('advanceAmount').value),
        advance_date: document.getElementById('advanceDate').value,
        is_active: true,
        notes: document.getElementById('advanceNotes').value
    };

    try {
        appData.advance.push(advanceData);
        saveData();
        closeAdvanceModal();
        populateAdvanceList();
        renderDashboard();
        alert('تم إضافة العهدة بنجاح');
    } catch (error) {
        console.error('خطأ:', error);
        alert('حدث خطأ في حفظ البيانات: ' + error.message);
    }
}

function deleteAdvance(advanceId) {
    if (confirm('هل أنت متأكد من حذف هذه العهدة؟')) {
        try {
            appData.advance = appData.advance.filter(a => a.id !== advanceId);
            saveData();
            populateAdvanceList();
            renderDashboard();
        } catch (error) {
            console.error('خطأ:', error);
            alert('حدث خطأ في حذف البيانات');
        }
    }
}

function populateAdvanceList() {
    const tbody = document.getElementById('advanceTable');
    tbody.innerHTML = '';

    if (appData.advance.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="5">لا توجد عهد مسجلة</td></tr>';
        updateAdvanceSummary();
        return;
    }

    appData.advance.forEach(advance => {
        const row = document.createElement('tr');
        const statusText = advance.is_active ? 'نشطة' : 'مستخدمة';
        const statusBadge = advance.is_active ? 'status-in-progress' : 'status-complete';
        
        row.innerHTML = `
            <td>${advance.amount.toLocaleString('ar-SA')} جنيه</td>
            <td>${advance.advance_date}</td>
            <td><span class="status-badge ${statusBadge}">${statusText}</span></td>
            <td>${advance.notes || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-danger btn-small" onclick="deleteAdvance('${advance.id}')">حذف</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    updateAdvanceSummary();
}

function updateAdvanceSummary() {
    const totalAdvance = appData.advance.reduce((sum, a) => sum + a.amount, 0);
    const usedAdvance = appData.expenses.reduce((sum, e) => sum + e.amount, 0);
    const remainingAdvance = totalAdvance - usedAdvance;

    document.getElementById('totalAdvance').textContent = totalAdvance.toLocaleString('ar-SA') + ' جنيه';
    document.getElementById('usedAdvance').textContent = usedAdvance.toLocaleString('ar-SA') + ' جنيه';
    document.getElementById('remainingAdvance').textContent = remainingAdvance.toLocaleString('ar-SA') + ' جنيه';
}

function populateExpensesList() {
    filterExpenses();
}

function filterExpenses() {
    const searchValue = document.getElementById('expensesSearch').value.toLowerCase();

    const filtered = appData.expenses.filter(e => {
        const vehiclePlate = e.plate_number ? e.plate_number.toLowerCase() : '';
        const matchesSearch = vehiclePlate.includes(searchValue) || 
                            (e.expense_type ? e.expense_type.toLowerCase().includes(searchValue) : false);
        return matchesSearch;
    });

    const tbody = document.getElementById('expensesTable');
    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="6">لا توجد نفقات مسجلة</td></tr>';
        return;
    }

    filtered.forEach(expense => {
        const vehiclePlate = expense.plate_number || 'عام';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${vehiclePlate}</td>
            <td>${expense.expense_type}</td>
            <td>${expense.expense_date}</td>
            <td>${expense.amount.toLocaleString('en-US')} جنيه</td>
            <td>${expense.notes || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary btn-small" onclick="openExpensesModal('${expense.id}')">تعديل</button>
                    <button class="btn btn-danger btn-small" onclick="deleteExpense('${expense.id}')">حذف</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderDashboard() {
    const now = new Date();
    document.getElementById('totalVehicles').textContent = appData.vehicles.length;

    const expiringLicenses = appData.vehicles.filter(v => {
        const expiry = new Date(v.license_expiry);
        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        return daysLeft <= licenseWarningDays && daysLeft > 0;
    }).length;
    document.getElementById('expiringLicenses').textContent = expiringLicenses;

    const inMaintenance = appData.vehicles.filter(v => v.status === 'في الصيانة').length;
    document.getElementById('inMaintenance').textContent = inMaintenance;

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlyExpenses = appData.maintenance
        .filter(m => {
            const mDate = new Date(m.maintenance_date);
            return mDate.getMonth() === currentMonth && mDate.getFullYear() === currentYear;
        })
        .reduce((sum, m) => sum + m.cost, 0);
    document.getElementById('monthlyExpenses').textContent = monthlyExpenses.toLocaleString('ar-SA') + ' جنيه';

    const totalViolations = appData.violations.length;
    document.getElementById('totalViolations').textContent = totalViolations;

    const pendingViolations = appData.violations.filter(v => v.status === 'معلقة').length;
    document.getElementById('pendingViolations').textContent = pendingViolations;

    renderAlerts();
    displayDashboardVehicles();
}

function renderAlerts() {
    const alertsList = document.getElementById('alertsList');
    alertsList.innerHTML = '';

    const now = new Date();
    const alerts = [];

    appData.vehicles.forEach(v => {
        const expiry = new Date(v.license_expiry);
        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

        if (daysLeft <= 0) {
            alerts.push({
                text: `🚨 المركبة ${v.plate_number} - انتهت رخصتها في ${v.license_expiry}`,
                critical: true
            });
        } else if (daysLeft <= licenseWarningDays) {
            alerts.push({
                text: `⚠️ المركبة ${v.plate_number} - تنتهي الرخصة في ${daysLeft} أيام`,
                critical: false
            });
        }

        if (v.status === 'معطوبة') {
            alerts.push({
                text: `⛔ المركبة ${v.plate_number} - في حالة معطوبة`,
                critical: true
            });
        }
    });

    if (alerts.length === 0) {
        alertsList.innerHTML = '<p class="empty-message">لا توجد تنبيهات</p>';
    } else {
        alerts.forEach(alert => {
            const div = document.createElement('div');
            div.className = `alert-item ${alert.critical ? 'critical' : ''}`;
            div.textContent = alert.text;
            alertsList.appendChild(div);
        });
    }
}

function populateVehiclesList() {
    filterVehicles();
}

function displayDashboardVehicles() {
    const tbody = document.getElementById('dashboardVehiclesTable');
    tbody.innerHTML = '';

    if (appData.vehicles.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="6">لا توجد مركبات</td></tr>';
        return;
    }

    appData.vehicles.forEach(vehicle => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${vehicle.plate_number}</td>
            <td>${vehicle.model}</td>
            <td>${vehicle.vin_number || '-'}</td>
            <td>${vehicle.status}</td>
            <td>${vehicle.license_expiry}</td>
            <td>${vehicle.notes || '-'}</td>
        `;
        tbody.appendChild(row);
    });
}

function filterVehicles() {
    const searchValue = document.getElementById('vehicleSearch').value.toLowerCase();
    const statusFilter = document.getElementById('vehicleStatusFilter').value;

    const filtered = appData.vehicles.filter(v => {
        const matchesSearch = v.plate_number.toLowerCase().includes(searchValue) ||
                            v.model.toLowerCase().includes(searchValue);
        const matchesStatus = statusFilter === '' || v.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const tbody = document.getElementById('vehiclesTable');
    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="8">لا توجد مركبات</td></tr>';
        return;
    }

    filtered.forEach(vehicle => {
        const expiry = new Date(vehicle.license_expiry);
        const now = new Date();
        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

        let licenseStatus = '';
        if (daysLeft <= 0) {
            licenseStatus = '<span class="status-badge license-status-expired">منتهية</span>';
        } else if (daysLeft <= licenseWarningDays) {
            licenseStatus = `<span class="status-badge license-status-expiring">${daysLeft} أيام</span>`;
        } else {
            licenseStatus = '<span class="status-badge license-status-valid">سارية</span>';
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${vehicle.plate_number}</td>
            <td>${vehicle.model}</td>
            <td>${vehicle.year}</td>
            <td><span class="status-badge status-${vehicle.status === 'نشطة' ? 'active' : vehicle.status === 'في الصيانة' ? 'maintenance' : 'inactive'}">${vehicle.status}</span></td>
            <td>${licenseStatus}</td>
            <td>${vehicle.violation_count || 0}</td>
            <td>${(vehicle.violation_paid || 0).toLocaleString('ar-SA')}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary btn-small" onclick="openVehicleModal('${vehicle.id}')">تعديل</button>
                    <button class="btn btn-danger btn-small" onclick="deleteVehicle('${vehicle.id}')">حذف</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function populateMaintenanceList() {
    filterMaintenance();
}

function filterMaintenance() {
    const searchValue = document.getElementById('maintenanceSearch').value.toLowerCase();
    const statusFilter = document.getElementById('maintenanceStatusFilter').value;

    const filtered = appData.maintenance.filter(m => {
        const vehiclePlate = m.plate_number ? m.plate_number.toLowerCase() : '';
        const matchesSearch = vehiclePlate.includes(searchValue);
        const matchesStatus = statusFilter === '' || m.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const tbody = document.getElementById('maintenanceTable');
    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="7">لا توجد سجلات صيانة</td></tr>';
        return;
    }

    filtered.forEach(maintenance => {
        const vehiclePlate = maintenance.plate_number || 'غير محدد';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${vehiclePlate}</td>
            <td>${maintenance.maintenance_type}</td>
            <td>${maintenance.maintenance_date}</td>
            <td>${maintenance.cost.toLocaleString('ar-SA')} جنيه</td>
            <td><span class="status-badge ${maintenance.status === 'مكتملة' ? 'status-complete' : 'status-in-progress'}">${maintenance.status}</span></td>
            <td>${maintenance.notes || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-danger btn-small" onclick="deleteMaintenance('${maintenance.id}')">حذف</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function populateLicensesList() {
    filterLicenses();
}

function filterLicenses() {
    const searchValue = document.getElementById('licenseSearch').value.toLowerCase();
    const statusFilter = document.getElementById('licenseStatusFilter').value;

    const now = new Date();

    const filtered = appData.vehicles.filter(v => {
        const matchesSearch = v.plate_number.toLowerCase().includes(searchValue) ||
                            v.model.toLowerCase().includes(searchValue);

        const expiry = new Date(v.license_expiry);
        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

        let licenseStatus = '';
        if (daysLeft <= 0) {
            licenseStatus = 'منتهية';
        } else if (daysLeft <= licenseWarningDays) {
            licenseStatus = 'قريبة الانتهاء';
        } else {
            licenseStatus = 'سارية';
        }

        const matchesStatus = statusFilter === '' || licenseStatus === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const tbody = document.getElementById('licensesTable');
    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="6">لا توجد بيانات رخص</td></tr>';
        return;
    }

    filtered.forEach(vehicle => {
        const expiry = new Date(vehicle.license_expiry);
        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

        let licenseStatusBadge = '';
        let statusText = '';

        if (daysLeft <= 0) {
            licenseStatusBadge = '<span class="status-badge license-status-expired">منتهية</span>';
            statusText = 'منتهية';
        } else if (daysLeft <= licenseWarningDays) {
            licenseStatusBadge = `<span class="status-badge license-status-expiring">قريبة الانتهاء</span>`;
            statusText = 'قريبة الانتهاء';
        } else {
            licenseStatusBadge = '<span class="status-badge license-status-valid">سارية</span>';
            statusText = 'سارية';
        }

        const issuedDate = new Date(vehicle.license_expiry);
        issuedDate.setFullYear(issuedDate.getFullYear() - 1);
        const issuedDateStr = issuedDate.toISOString().split('T')[0];

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${vehicle.plate_number}</td>
            <td>${vehicle.license_number}</td>
            <td>${issuedDateStr}</td>
            <td>${vehicle.license_expiry}</td>
            <td>${daysLeft > 0 ? daysLeft : 'منتهية'} ${daysLeft > 0 ? 'يوم' : ''}</td>
            <td>${licenseStatusBadge}</td>
        `;
        tbody.appendChild(row);
    });
}

function populateViolationsList() {
    filterViolations();
}

function filterViolations() {
    const searchValue = document.getElementById('violationSearch').value.toLowerCase();
    const statusFilter = document.getElementById('violationStatusFilter').value;

    const filtered = appData.violations.filter(v => {
        const vehiclePlate = v.plate_number ? v.plate_number.toLowerCase() : '';
        const matchesSearch = vehiclePlate.includes(searchValue);
        const matchesStatus = statusFilter === '' || v.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const tbody = document.getElementById('violationsTable');
    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="7">لا توجد مخالفات مسجلة</td></tr>';
        return;
    }

    filtered.forEach(violation => {
        const vehiclePlate = violation.plate_number || 'غير محدد';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${vehiclePlate}</td>
            <td>${violation.violation_type}</td>
            <td>${violation.violation_date}</td>
            <td>${violation.amount.toLocaleString('ar-SA')} جنيه</td>
            <td><span class="status-badge ${violation.status === 'مسددة' ? 'status-complete' : 'status-in-progress'}">${violation.status}</span></td>
            <td>${violation.notes || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-danger btn-small" onclick="deleteViolation('${violation.id}')">حذف</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function generateVehiclesReportPDF() {
    const html = generateVehiclesReportHTML();
    const element = document.createElement('div');
    element.innerHTML = html;

    const options = {
        margin: 10,
        filename: 'تقرير_المركبات.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(options).from(element).save();
}

function generateVehiclesReportHTML() {
    let html = `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 4px; margin: 0; position: relative;">
            <img src="667.jpg" style="position: absolute; top: 0; left: 0; width: 80px; height: 60px; object-fit: contain;">
            <div style="text-align: center; margin-bottom: 4px; border-bottom: 2px solid #2c3e50; padding-bottom: 3px; margin-top: 20px;">
                <h1 style="margin: 0; font-size: 16px; color: #2c3e50; font-weight: bold;">مصنع البهنساوي</h1>
                <h2 style="margin: 2px 0 0 0; font-size: 12px; color: #34495e;">تقرير المركبات - ${new Date().toLocaleDateString('ar-EG')}</h2>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin: 4px 0; line-height: 1.4;">
                <thead>
                    <tr style="background-color: #2c3e50; color: white; height: 18px;">
                        <th style="padding: 4px 6px; text-align: right; border: 2px solid #34495e; font-size: 12px; font-weight: bold;">اللوحة</th>
                        <th style="padding: 4px 6px; text-align: right; border: 2px solid #34495e; font-size: 12px; font-weight: bold;">النموذج</th>
                        <th style="padding: 4px 6px; text-align: right; border: 2px solid #34495e; font-size: 12px; font-weight: bold;">السائق</th>
                        <th style="padding: 4px 6px; text-align: right; border: 2px solid #34495e; font-size: 12px; font-weight: bold;">الحالة</th>
                        <th style="padding: 4px 6px; text-align: right; border: 2px solid #34495e; font-size: 12px; font-weight: bold;">انتهاء الرخصة</th>
                    </tr>
                </thead>
                <tbody>
    `;

    appData.vehicles.forEach((vehicle, index) => {
        const bgColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
        const statusColor = vehicle.status === 'اخضر' ? '#27ae60' : vehicle.status === 'ملاكي' ? '#3498db' : vehicle.status === 'نقل موظفين' ? '#f39c12' : '#6c757d';
        html += `<tr style="background-color: ${bgColor}; height: 16px;"><td style="padding: 3px 4px; border: 1px solid #dee2e6; font-size: 12px; font-weight: bold; color: #2c3e50;">${vehicle.plate_number}</td><td style="padding: 3px 4px; border: 1px solid #dee2e6; font-size: 12px; color: #495057;">${vehicle.model}</td><td style="padding: 3px 4px; border: 1px solid #dee2e6; font-size: 11px; color: #6c757d;">${vehicle.vin_number || '-'}</td><td style="padding: 3px 4px; border: 1px solid #dee2e6; font-size: 12px; color: white; background-color: ${statusColor}; font-weight: bold; text-align: center;">${vehicle.status}</td><td style="padding: 3px 4px; border: 1px solid #dee2e6; font-size: 12px; color: #495057;">${vehicle.license_expiry}</td></tr>`;
    });

    html += `</tbody></table></div>`;

    return html;
}

function generateVehiclesReportExcel() {
    const data = [
        ['تقرير المركبات', '', '', '', '', '', ''],
        ['التاريخ: ' + new Date().toLocaleDateString('ar-EG'), '', '', '', '', '', ''],
        [],
        ['اللوحة', 'النموذج', 'اسم السائق', 'السنة', 'الحالة', 'انتهاء الرخصة', 'الملاحظات']
    ];

    appData.vehicles.forEach(vehicle => {
        data.push([
            vehicle.plate_number,
            vehicle.model,
            vehicle.vin_number || '',
            vehicle.year,
            vehicle.status,
            vehicle.license_expiry,
            vehicle.notes || ''
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المركبات');
    XLSX.writeFile(wb, 'تقرير_المركبات.xlsx');
}

function generateMaintenanceReportPDF() {
    const html = generateMaintenanceReportHTML();
    const element = document.createElement('div');
    element.innerHTML = html;

    const options = {
        margin: 10,
        filename: 'تقرير_الصيانة.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(options).from(element).save();
}

function generateMaintenanceReportHTML() {
    let html = `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; position: relative;">
            <img src="667.jpg" style="position: absolute; top: 0; left: 0; width: 80px; height: 60px; object-fit: contain;">
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; margin-top: 20px;">
                <h1 style="margin: 0; font-size: 24px; font-weight: bold;">مصنع البهنساوي</h1>
                <h2 style="margin: 5px 0; font-size: 18px; font-weight: bold;">تقرير الصيانة والتصليح</h2>
                <p style="margin: 5px 0; font-size: 12px; color: #666;">
                    التاريخ: ${new Date().toLocaleDateString('ar-EG')}
                </p>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background-color: #2c3e50; color: white;">
                        <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">اللوحة</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">نوع الصيانة</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">التاريخ</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">التكلفة</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">الحالة</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">الملاحظات</th>
                    </tr>
                </thead>
                <tbody>
    `;

    let totalCost = 0;
    appData.maintenance.forEach((maintenance, index) => {
        const vehiclePlate = maintenance.plate_number || 'غير محدد';
        const bgColor = index % 2 === 0 ? '#f9f9f9' : 'white';
        totalCost += maintenance.cost;

        html += `
            <tr style="background-color: ${bgColor};">
                <td style="padding: 10px; border: 1px solid #ddd;">${vehiclePlate}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${maintenance.maintenance_type}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${maintenance.maintenance_date}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${maintenance.cost.toLocaleString('ar-SA')} جنيه</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${maintenance.status}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${maintenance.notes || '-'}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
                <tfoot>
                    <tr style="background-color: #ecf0f1; font-weight: bold;">
                        <td colspan="3" style="padding: 12px; border: 1px solid #ddd; text-align: left;">إجمالي التكاليف:</td>
                        <td style="padding: 12px; border: 1px solid #ddd;">${totalCost.toLocaleString('ar-SA')} جنيه</td>
                        <td colspan="2" style="padding: 12px; border: 1px solid #ddd;"></td>
                    </tr>
                </tfoot>
            </table>
            <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666;">
                <p>تم إنشاء هذا التقرير بواسطة نظام إدارة المركبات - مصنع البهنساوي</p>
            </div>
        </div>
    `;

    return html;
}

function generateMaintenanceReportExcel() {
    const data = [
        ['تقرير الصيانة والتصليح', '', '', '', '', ''],
        ['التاريخ: ' + new Date().toLocaleDateString('ar-EG'), '', '', '', '', ''],
        [],
        ['اللوحة', 'نوع الصيانة', 'التاريخ', 'التكلفة', 'الحالة', 'الملاحظات']
    ];

    let totalCost = 0;
    appData.maintenance.forEach(maintenance => {
        const vehiclePlate = maintenance.plate_number || 'غير محدد';
        totalCost += maintenance.cost;

        data.push([
            vehiclePlate,
            maintenance.maintenance_type,
            maintenance.maintenance_date,
            maintenance.cost,
            maintenance.status,
            maintenance.notes || ''
        ]);
    });

    data.push([]);
    data.push(['', '', 'إجمالي التكاليف:', totalCost, '', '']);

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الصيانة');
    XLSX.writeFile(wb, 'تقرير_الصيانة.xlsx');
}

function generateExpensesReportPDF() {
    const html = generateExpensesReportHTML();
    const element = document.createElement('div');
    element.innerHTML = html;

    const options = {
        margin: 10,
        filename: 'تقرير_المصروفات.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(options).from(element).save();
}

function generateExpensesReportHTML() {
    let html = `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 8px; margin: 0; position: relative;">
            <img src="667.jpg" style="position: absolute; top: 0; left: 0; width: 80px; height: 60px; object-fit: contain;">
            <div style="text-align: center; margin-bottom: 8px; border-bottom: 2px solid #1a252f; padding-bottom: 6px; margin-top: 20px;">
                <h1 style="margin: 0; font-size: 16px; color: #1a252f; font-weight: bold;">مصنع البهنساوي</h1>
                <h2 style="margin: 3px 0 0 0; font-size: 12px; color: #34495e; font-weight: bold;">تقرير المصروفات والعهدة الشامل</h2>
                <p style="margin: 2px 0; font-size: 9px; color: #666;">التاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>
            </div>
    `;

    let totalMaintenance = 0;
    let totalViolations = 0;
    let totalExpenses = 0;
    let totalAdvance = 0;

    // مصاريف الصيانة
    appData.maintenance.forEach(m => {
        totalMaintenance += m.cost;
    });

    // مصاريف المخالفات
    appData.violations.forEach(v => {
        if (v.status === 'مسددة') {
            totalViolations += v.amount;
        }
    });

    // مصاريف النفقات
    appData.expenses.forEach(e => {
        totalExpenses += e.amount;
    });

    // مصاريف العهدة
    appData.advance.forEach(a => {
        totalAdvance += a.amount;
    });

    const expensesGrandTotal = totalMaintenance + totalViolations + totalExpenses;

    // جدول مصاريف الصيانة
    if (appData.maintenance.length > 0) {
        html += `
            <div style="margin-top: 8px;">
                <h3 style="margin: 4px 0 2px 0; font-size: 11px; color: white; background-color: #34495e; padding: 3px 6px; font-weight: bold;">🔧 مصاريف الصيانة والتصليح</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 2px 0; font-size: 10px;">
                    <thead>
                        <tr style="background-color: #5d6d7b; color: white; height: 13px;">
                            <th style="padding: 2px 3px; border: 1px solid #666; text-align: right; font-weight: bold;">اللوحة</th>
                            <th style="padding: 2px 3px; border: 1px solid #666; text-align: right; font-weight: bold;">نوع الصيانة</th>
                            <th style="padding: 2px 3px; border: 1px solid #666; text-align: right; font-weight: bold;">التاريخ</th>
                            <th style="padding: 2px 3px; border: 1px solid #666; text-align: center; font-weight: bold;">المبلغ</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        appData.maintenance.forEach((m, idx) => {
            const bgColor = idx % 2 === 0 ? '#fafafa' : '#ffffff';
            html += `<tr style="background-color: ${bgColor}; height: 12px;"><td style="padding: 2px 3px; border: 0.5px solid #ddd; font-size: 10px; font-weight: bold;">${m.plate_number || '-'}</td><td style="padding: 2px 3px; border: 0.5px solid #ddd; font-size: 9px;">${m.maintenance_type}</td><td style="padding: 2px 3px; border: 0.5px solid #ddd; font-size: 9px;">${m.maintenance_date}</td><td style="padding: 2px 3px; border: 0.5px solid #ddd; text-align: center; font-weight: bold; font-size: 10px;">${m.cost.toLocaleString('ar-SA')}</td></tr>`;
        });

        html += `
                    </tbody>
                    <tfoot>
                        <tr style="background-color: #d4edda; font-weight: bold; height: 13px;">
                            <td colspan="3" style="padding: 2px 3px; border: 1px solid #999; text-align: right; font-size: 10px;">إجمالي</td>
                            <td style="padding: 2px 3px; border: 1px solid #999; text-align: center; color: #27ae60; font-size: 11px;">${totalMaintenance.toLocaleString('ar-SA')}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    }

    // جدول مصاريف المخالفات المسددة
    const paidViolations = appData.violations.filter(v => v.status === 'مسددة');
    if (paidViolations.length > 0) {
        html += `
            <div style="margin-top: 8px;">
                <h3 style="margin: 4px 0 2px 0; font-size: 11px; color: white; background-color: #e74c3c; padding: 3px 6px; font-weight: bold;">⚠️ مصاريف المخالفات المسددة</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 2px 0; font-size: 10px;">
                    <thead>
                        <tr style="background-color: #f1948b; color: white; height: 13px;">
                            <th style="padding: 2px 3px; border: 1px solid #666; text-align: right; font-weight: bold;">اللوحة</th>
                            <th style="padding: 2px 3px; border: 1px solid #666; text-align: right; font-weight: bold;">نوع المخالفة</th>
                            <th style="padding: 2px 3px; border: 1px solid #666; text-align: right; font-weight: bold;">التاريخ</th>
                            <th style="padding: 2px 3px; border: 1px solid #666; text-align: center; font-weight: bold;">المبلغ</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        paidViolations.forEach((v, idx) => {
            const bgColor = idx % 2 === 0 ? '#fafafa' : '#ffffff';
            html += `<tr style="background-color: ${bgColor}; height: 12px;"><td style="padding: 2px 3px; border: 0.5px solid #ddd; font-size: 10px; font-weight: bold;">${v.plate_number || '-'}</td><td style="padding: 2px 3px; border: 0.5px solid #ddd; font-size: 9px;">${v.violation_type}</td><td style="padding: 2px 3px; border: 0.5px solid #ddd; font-size: 9px;">${v.violation_date}</td><td style="padding: 2px 3px; border: 0.5px solid #ddd; text-align: center; font-weight: bold; font-size: 10px;">${v.amount.toLocaleString('ar-SA')}</td></tr>`;
        });

        html += `
                    </tbody>
                    <tfoot>
                        <tr style="background-color: #ffebee; font-weight: bold; height: 13px;">
                            <td colspan="3" style="padding: 2px 3px; border: 1px solid #999; text-align: right; font-size: 10px;">إجمالي</td>
                            <td style="padding: 2px 3px; border: 1px solid #999; text-align: center; color: #e74c3c; font-size: 11px;">${totalViolations.toLocaleString('ar-SA')}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    }

    // جدول مصاريف النفقات
    if (appData.expenses.length > 0) {
        html += `
            <div style="margin-top: 8px;">
                <h3 style="margin: 4px 0 2px 0; font-size: 11px; color: white; background-color: #f39c12; padding: 3px 6px; font-weight: bold;">💰 مصاريف النفقات</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 2px 0; font-size: 10px;">
                    <thead>
                        <tr style="background-color: #f5b041; color: white; height: 13px;">
                            <th style="padding: 2px 3px; border: 1px solid #666; text-align: right; font-weight: bold;">اللوحة</th>
                            <th style="padding: 2px 3px; border: 1px solid #666; text-align: right; font-weight: bold;">نوع النفقة</th>
                            <th style="padding: 2px 3px; border: 1px solid #666; text-align: right; font-weight: bold;">التاريخ</th>
                            <th style="padding: 2px 3px; border: 1px solid #666; text-align: center; font-weight: bold;">المبلغ</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        appData.expenses.forEach((e, idx) => {
            const bgColor = idx % 2 === 0 ? '#fafafa' : '#ffffff';
            html += `<tr style="background-color: ${bgColor}; height: 12px;"><td style="padding: 2px 3px; border: 0.5px solid #ddd; font-size: 10px; font-weight: bold;">${e.plate_number || '-'}</td><td style="padding: 2px 3px; border: 0.5px solid #ddd; font-size: 9px;">${e.expense_type}</td><td style="padding: 2px 3px; border: 0.5px solid #ddd; font-size: 9px;">${e.expense_date}</td><td style="padding: 2px 3px; border: 0.5px solid #ddd; text-align: center; font-weight: bold; font-size: 10px;">${e.amount.toLocaleString('ar-SA')}</td></tr>`;
        });

        html += `
                    </tbody>
                    <tfoot>
                        <tr style="background-color: #fffbea; font-weight: bold; height: 13px;">
                            <td colspan="3" style="padding: 2px 3px; border: 1px solid #999; text-align: right; font-size: 10px;">إجمالي</td>
                            <td style="padding: 2px 3px; border: 1px solid #999; text-align: center; color: #f39c12; font-size: 11px;">${totalExpenses.toLocaleString('ar-SA')}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    }



    // الإجمالي العام للمصروفات (بدون العهدة)
    html += `
        <div style="margin-top: 10px; padding: 8px; background-color: #27ae60; color: white; border-radius: 2px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <tr style="height: 13px;">
                    <td style="padding: 3px 4px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.3);">🔧 مصاريف الصيانة</td>
                    <td style="padding: 3px 4px; text-align: center; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.3);">${totalMaintenance.toLocaleString('ar-SA')}</td>
                </tr>
                <tr style="height: 13px;">
                    <td style="padding: 3px 4px; text-align: right; border-bottom: 1px solid rgba(255,255,255,0.3);">⚠️ مصاريف المخالفات المسددة</td>
                    <td style="padding: 3px 4px; text-align: center; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.3);">${totalViolations.toLocaleString('ar-SA')}</td>
                </tr>
                <tr style="height: 13px;">
                    <td style="padding: 3px 4px; text-align: right; border-bottom: 2px solid white;">💰 مصاريف النفقات</td>
                    <td style="padding: 3px 4px; text-align: center; font-weight: bold; border-bottom: 2px solid white;">${totalExpenses.toLocaleString('ar-SA')}</td>
                </tr>
                <tr style="height: 15px;">
                    <td style="padding: 4px; font-size: 12px; text-align: right; font-weight: bold;">💵 إجمالي المصروفات</td>
                    <td style="padding: 4px; font-size: 13px; text-align: center; font-weight: bold; color: #fff000;">${expensesGrandTotal.toLocaleString('ar-SA')} جنيه</td>
                </tr>
            </table>
        </div>
    `;



    html += `</div>`;

    return html;
}

function generateExpensesReportExcel() {
    const now = new Date();
    const currentYear = now.getFullYear();

    const monthlyData = {};
    for (let i = 0; i < 12; i++) {
        monthlyData[i] = 0;
    }

    appData.maintenance.forEach(m => {
        const mDate = new Date(m.maintenance_date);
        if (mDate.getFullYear() === currentYear) {
            monthlyData[mDate.getMonth()] += m.cost;
        }
    });

    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                       'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    const data = [
        ['تقرير المصروفات', ''],
        ['السنة: ' + currentYear, ''],
        ['التاريخ: ' + new Date().toLocaleDateString('ar-EG'), ''],
        [],
        ['الشهر', 'المصروفات (جنيه)']
    ];

    let totalExpenses = 0;
    monthNames.forEach((month, index) => {
        const expense = monthlyData[index];
        totalExpenses += expense;
        data.push([month, expense]);
    });

    data.push([]);
    data.push(['الإجمالي السنوي', totalExpenses]);
    data.push(['متوسط الشهري', totalExpenses / 12]);

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المصروفات');
    XLSX.writeFile(wb, 'تقرير_المصروفات.xlsx');
}

function generateLicensesReportPDF() {
    const html = generateLicensesReportHTML();
    const element = document.createElement('div');
    element.innerHTML = html;

    const options = {
        margin: 10,
        filename: 'تقرير_الرخص.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(options).from(element).save();
}

function generateLicensesReportHTML() {
    const now = new Date();

    let html = `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; position: relative;">
            <img src="667.jpg" style="position: absolute; top: 0; left: 0; width: 80px; height: 60px; object-fit: contain;">
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; margin-top: 20px;">
                <h1 style="margin: 0; font-size: 24px; font-weight: bold;">مصنع البهنساوي</h1>
                <h2 style="margin: 5px 0; font-size: 18px; font-weight: bold;">تقرير الرخص</h2>
                <p style="margin: 5px 0; font-size: 12px; color: #666;">
                    التاريخ: ${new Date().toLocaleDateString('ar-EG')}
                </p>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background-color: #2c3e50; color: white;">
                        <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">اللوحة</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">رقم الرخصة</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">تاريخ الانتهاء</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">الأيام المتبقية</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">الحالة</th>
                    </tr>
                </thead>
                <tbody>
    `;

    appData.vehicles.forEach((vehicle, index) => {
        const expiry = new Date(vehicle.license_expiry);
        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        const bgColor = index % 2 === 0 ? '#f9f9f9' : 'white';

        let status = 'سارية';
        if (daysLeft <= 0) {
            status = 'منتهية';
        } else if (daysLeft <= licenseWarningDays) {
            status = 'قريبة الانتهاء';
        }

        html += `
            <tr style="background-color: ${bgColor};">
                <td style="padding: 10px; border: 1px solid #ddd;">${vehicle.plate_number}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${vehicle.license_number}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${vehicle.license_expiry}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${daysLeft > 0 ? daysLeft : 'منتهية'}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${status}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
            <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666;">
                <p>تم إنشاء هذا التقرير بواسطة نظام إدارة المركبات - مصنع البهنساوي</p>
            </div>
        </div>
    `;

    return html;
}

function generateLicensesReportExcel() {
    const now = new Date();

    const data = [
        ['تقرير الرخص', '', '', '', ''],
        ['التاريخ: ' + new Date().toLocaleDateString('ar-EG'), '', '', '', ''],
        [],
        ['اللوحة', 'رقم الرخصة', 'تاريخ الانتهاء', 'الأيام المتبقية', 'الحالة']
    ];

    appData.vehicles.forEach(vehicle => {
        const expiry = new Date(vehicle.license_expiry);
        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

        let status = 'سارية';
        if (daysLeft <= 0) {
            status = 'منتهية';
        } else if (daysLeft <= licenseWarningDays) {
            status = 'قريبة الانتهاء';
        }

        data.push([
            vehicle.plate_number,
            vehicle.license_number,
            vehicle.license_expiry,
            daysLeft > 0 ? daysLeft : 'منتهية',
            status
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'الرخص');
    XLSX.writeFile(wb, 'تقرير_الرخص.xlsx');
}

function generateViolationsReportPDF() {
    const html = generateViolationsReportHTML();
    const element = document.createElement('div');
    element.innerHTML = html;

    const options = {
        margin: 10,
        filename: 'تقرير_المخالفات.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(options).from(element).save();
}

function generateViolationsReportHTML() {
    let html = `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; position: relative;">
            <img src="667.jpg" style="position: absolute; top: 0; left: 0; width: 80px; height: 60px; object-fit: contain;">
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; margin-top: 20px;">
                <h1 style="margin: 0; font-size: 24px; font-weight: bold;">مصنع البهنساوي</h1>
                <h2 style="margin: 5px 0; font-size: 18px; font-weight: bold;">تقرير المخالفات المرورية</h2>
                <p style="margin: 5px 0; font-size: 12px; color: #666;">
                    التاريخ: ${new Date().toLocaleDateString('ar-EG')}
                </p>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background-color: #2c3e50; color: white;">
                        <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">اللوحة</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">نوع المخالفة</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">التاريخ</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">المبلغ (جنيه)</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">الحالة</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">الملاحظات</th>
                    </tr>
                </thead>
                <tbody>
    `;

    let totalAmount = 0;
    let totalPending = 0;
    
    appData.violations.forEach((violation, index) => {
        const vehiclePlate = violation.plate_number || 'غير محدد';
        const bgColor = index % 2 === 0 ? '#f9f9f9' : 'white';
        
        totalAmount += violation.amount;
        if (violation.status === 'معلقة') totalPending += violation.amount;

        html += `
            <tr style="background-color: ${bgColor};">
                <td style="padding: 10px; border: 1px solid #ddd;">${vehiclePlate}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${violation.violation_type}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${violation.violation_date}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${violation.amount.toLocaleString('ar-SA')}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${violation.status}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${violation.notes || '-'}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
                <tfoot>
                    <tr style="background-color: #ecf0f1; font-weight: bold;">
                        <td colspan="3" style="padding: 12px; border: 1px solid #ddd; text-align: left;">الإجمالي:</td>
                        <td style="padding: 12px; border: 1px solid #ddd;">${totalAmount.toLocaleString('ar-SA')} جنيه</td>
                        <td colspan="2" style="padding: 12px; border: 1px solid #ddd;"></td>
                    </tr>
                    <tr style="background-color: #fff3cd;">
                        <td colspan="3" style="padding: 12px; border: 1px solid #ddd; text-align: left;">المعلق من المخالفات:</td>
                        <td style="padding: 12px; border: 1px solid #ddd;">${totalPending.toLocaleString('ar-SA')} جنيه</td>
                        <td colspan="2" style="padding: 12px; border: 1px solid #ddd;"></td>
                    </tr>
                </tfoot>
            </table>
            <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666;">
                <p>تم إنشاء هذا التقرير بواسطة نظام إدارة المركبات - مصنع البهنساوي</p>
            </div>
        </div>
    `;

    return html;
}

function generateViolationsReportExcel() {
    const data = [
        ['تقرير المخالفات المرورية', '', '', '', '', ''],
        ['التاريخ: ' + new Date().toLocaleDateString('ar-EG'), '', '', '', '', ''],
        [],
        ['اللوحة', 'نوع المخالفة', 'التاريخ', 'المبلغ (جنيه)', 'الحالة', 'الملاحظات']
    ];

    let totalAmount = 0;
    let totalPending = 0;
    
    appData.violations.forEach(violation => {
        const vehiclePlate = violation.plate_number || 'غير محدد';
        
        totalAmount += violation.amount;
        if (violation.status === 'معلقة') totalPending += violation.amount;

        data.push([
            vehiclePlate,
            violation.violation_type,
            violation.violation_date,
            violation.amount,
            violation.status,
            violation.notes || ''
        ]);
    });

    data.push([]);
    data.push(['', '', 'الإجمالي:', totalAmount, '', '']);
    data.push(['', '', 'المعلق:', totalPending, '', '']);

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المخالفات');
    XLSX.writeFile(wb, 'تقرير_المخالفات.xlsx');
}

function generateAdvanceExpensesReportPDF() {
    const html = generateAdvanceExpensesReportHTML();
    const element = document.createElement('div');
    element.innerHTML = html;

    const options = {
        margin: 10,
        filename: 'تقرير_النفقات_والعهدة.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(options).from(element).save();
}

function generateAdvanceExpensesReportHTML() {
    const totalAdvance = appData.advance.reduce((sum, a) => sum + a.amount, 0);
    const usedAdvance = appData.expenses.reduce((sum, e) => sum + e.amount, 0);
    const remainingAdvance = totalAdvance - usedAdvance;

    let expensesTable = '';
    appData.expenses.forEach((expense, index) => {
        const bgColor = index % 2 === 0 ? '#f9f9f9' : 'white';
        const vehiclePlate = expense.plate_number || 'عام';
        
        expensesTable += `
            <tr style="background-color: ${bgColor};">
                <td style="padding: 6px 8px; border: 1px solid #ccc;">${vehiclePlate}</td>
                <td style="padding: 6px 8px; border: 1px solid #ccc;">${expense.expense_type}</td>
                <td style="padding: 6px 8px; border: 1px solid #ccc;">${expense.expense_date}</td>
                <td style="padding: 6px 8px; border: 1px solid #ccc; text-align: center; font-weight: 500;">${expense.amount.toLocaleString('en-US')}</td>
                <td style="padding: 6px 8px; border: 1px solid #ccc;">${expense.notes || '-'}</td>
            </tr>
        `;
    });
    
    expensesTable += `
        <tr style="background-color: #2c3e50; color: white; font-weight: bold; font-size: 12px;">
            <td style="padding: 6px 8px; border: 1px solid #999;"></td>
            <td style="padding: 6px 8px; border: 1px solid #999;"></td>
            <td style="padding: 6px 8px; border: 1px solid #999; text-align: right;">الإجمالي:</td>
            <td style="padding: 6px 8px; border: 1px solid #999; text-align: center; font-weight: bold;">${usedAdvance.toLocaleString('en-US')}</td>
            <td style="padding: 6px 8px; border: 1px solid #999;"></td>
        </tr>
    `;

    let html = `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 10px; line-height: 1.4; position: relative;">
            <img src="667.jpg" style="position: absolute; top: 0; left: 0; width: 80px; height: 60px; object-fit: contain;">
            <div style="text-align: center; margin-bottom: 10px; border-bottom: 3px solid #2c3e50; padding-bottom: 8px; margin-top: 20px;">
                <h1 style="margin: 0; font-size: 24px; font-weight: bold;">مصنع البهنساوي</h1>
                <h2 style="margin: 2px 0; font-size: 15px; font-weight: bold;">تقرير المصروفات والعهدة</h2>
                <p style="margin: 2px 0; font-size: 10px; color: #666;">
                    التاريخ: ${new Date().toLocaleDateString('ar-EG')}
                </p>
            </div>

            <div style="margin-bottom: 8px; background-color: #f5f5f5; padding: 6px; border-radius: 3px; border-left: 4px solid #2c3e50;">
                <h3 style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold; color: #2c3e50;">ملخص العهدة والمصروفات </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <tr>
                        <td style="padding: 6px 8px; border: 1px solid #bbb; background-color: #e8f4f8; font-weight: bold; width: 50%;">العهدة المتاحة:</td>
                        <td style="padding: 6px 8px; border: 1px solid #bbb; text-align: center; font-weight: bold; font-size: 14px;">${totalAdvance.toLocaleString('en-US')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 8px; border: 1px solid #bbb; background-color: #fff3cd; font-weight: bold;">المصروف:</td>
                        <td style="padding: 6px 8px; border: 1px solid #bbb; text-align: center; font-weight: bold; color: #c00; font-size: 14px;">${usedAdvance.toLocaleString('en-US')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 8px; border: 1px solid #bbb; background-color: #d4edda; font-weight: bold;">المتبقي:</td>
                        <td style="padding: 6px 8px; border: 1px solid #bbb; text-align: center; font-weight: bold; color: #060; font-size: 14px;">${remainingAdvance.toLocaleString('en-US')}</td>
                    </tr>
                </table>
            </div>

            <div style="margin-bottom: 2px;">
                <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold; color: #2c3e50; border-bottom: 2px solid #2c3e50; padding-bottom: 2px;">تفاصيل المصروفات </h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <thead>
                        <tr style="background-color: #2c3e50; color: white; font-weight: bold;">
                            <th style="padding: 8px 10px; text-align: right; border: 1px solid #999;">اللوحة</th>
                            <th style="padding: 8px 10px; text-align: right; border: 1px solid #999;">نوع المصروفات</th>
                            <th style="padding: 8px 10px; text-align: right; border: 1px solid #999;">التاريخ</th>
                            <th style="padding: 8px 10px; text-align: right; border: 1px solid #999;">المبلغ</th>
                            <th style="padding: 8px 10px; text-align: right; border: 1px solid #999;">ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expensesTable || '<tr><td colspan="5" style="padding: 8px; text-align: center; color: #999;">لا توجد نفقات</td></tr>'}
                    </tbody>
                </table>
            </div>

            <div style="margin-top: 8px; padding: 7px 0; border-top: 2px solid #333;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="text-align: center; width: 45%;">
                        <p style="margin: 0 0 16px 0; font-size: 12px;">التوقيع</p>
                        <p style="margin: 0; font-size: 12px; font-weight: bold; border-top: 2px solid #333; padding-top: 4px;">مدير الحركة</p>
                    </div>
                    <div style="text-align: center; width: 45%;">
                        <p style="margin: 0 0 16px 0; font-size: 12px;">التوقيع</p>
                        <p style="margin: 0; font-size: 12px; font-weight: bold; border-top: 2px solid #333; padding-top: 4px;">المدير المالي</p>
                    </div>
                </div>
            </div>

            <div style="margin-top: 3px; padding-top: 3px; border-top: 1px solid #ccc; text-align: center; font-size: 9px; color: #777;">
                <p style="margin: 0;">نظام إدارة المركبات - مصنع البهنساوي</p>
            </div>
        </div>
    `;

    return html;
}

function generateAdvanceExpensesReportExcel() {
    const totalAdvance = appData.advance.reduce((sum, a) => sum + a.amount, 0);
    const usedAdvance = appData.expenses.reduce((sum, e) => sum + e.amount, 0);
    const remainingAdvance = totalAdvance - usedAdvance;

    const data = [
        ['تقرير النفقات والعهدة', '', '', '', ''],
        ['التاريخ: ' + new Date().toLocaleDateString('ar-EG'), '', '', '', ''],
        [],
        ['ملخص العهدة والنفقات', '', '', '', ''],
        ['العهدة المتاحة', totalAdvance, '', '', ''],
        ['المصروف من العهدة', usedAdvance, '', '', ''],
        ['المتبقي من العهدة', remainingAdvance, '', '', ''],
        [],
        ['تفاصيل النفقات', '', '', '', ''],
        ['اللوحة', 'نوع النفقة', 'التاريخ', 'المبلغ (جنيه)', 'الملاحظات']
    ];

    appData.expenses.forEach(expense => {
        const vehiclePlate = expense.plate_number || 'عام';
        data.push([
            vehiclePlate,
            expense.expense_type,
            expense.expense_date,
            expense.amount,
            expense.notes || ''
        ]);
    });

    data.push(['الإجمالي', '', '', usedAdvance, '']);

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'النفقات والعهدة');
    XLSX.writeFile(wb, 'تقرير_النفقات_والعهدة.xlsx');
}

function printAdvanceExpensesReport() {
    const html = generateAdvanceExpensesReportHTML();
    const printWindow = window.open('', '', 'width=1200,height=800');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
}

function confirmClearAllData() {
    if (confirm('تحذير: هذا سيحذف جميع بياناتك بشكل نهائي. هل أنت متأكد؟')) {
        if (confirm('هل أنت متأكد تماماً؟ لا يمكن التراجع عن هذا الإجراء!')) {
            try {
                appData.vehicles = [];
                appData.maintenance = [];
                appData.violations = [];
                appData.expenses = [];
                appData.advance = [];
                saveData();
                alert('تم حذف جميع البيانات');
                renderDashboard();
            } catch (error) {
                console.error('خطأ:', error);
                alert('حدث خطأ في حذف البيانات');
            }
        }
    }
}

function printVehiclesReport() {
    const html = generateVehiclesReportHTML();
    const printWindow = window.open('', '', 'width=1200,height=800');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
}

function printMaintenanceReport() {
    const html = generateMaintenanceReportHTML();
    const printWindow = window.open('', '', 'width=1200,height=800');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
}

function printExpensesReport() {
    const html = generateExpensesReportHTML();
    const printWindow = window.open('', '', 'width=1200,height=800');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
}

function printLicensesReport() {
    const html = generateLicensesReportHTML();
    const printWindow = window.open('', '', 'width=1200,height=800');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
}

function printViolationsReport() {
    const html = generateViolationsReportHTML();
    const printWindow = window.open('', '', 'width=1200,height=800');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
}

function printPage() {
    window.print();
}

function openExpensesFilterModal() {
    document.getElementById('expensesFilterModal').classList.add('show');
}

function closeExpensesFilterModal() {
    document.getElementById('expensesFilterModal').classList.remove('show');
}

function getFilteredExpensesData() {
    const fromDate = document.getElementById('expensesFromDate').value;
    const toDate = document.getElementById('expensesToDate').value;
    const fromAmount = parseFloat(document.getElementById('expensesFromAmount').value) || 0;
    const toAmount = parseFloat(document.getElementById('expensesToAmount').value) || Infinity;

    let filteredMaintenance = appData.maintenance;
    let filteredViolations = appData.violations.filter(v => v.status === 'مسددة');
    let filteredExpenses = appData.expenses;
    let filteredAdvance = appData.advance;

    if (fromDate) {
        filteredMaintenance = filteredMaintenance.filter(m => new Date(m.maintenance_date) >= new Date(fromDate));
        filteredViolations = filteredViolations.filter(v => new Date(v.violation_date) >= new Date(fromDate));
        filteredExpenses = filteredExpenses.filter(e => new Date(e.expense_date) >= new Date(fromDate));
        filteredAdvance = filteredAdvance.filter(a => new Date(a.advance_date) >= new Date(fromDate));
    }

    if (toDate) {
        filteredMaintenance = filteredMaintenance.filter(m => new Date(m.maintenance_date) <= new Date(toDate));
        filteredViolations = filteredViolations.filter(v => new Date(v.violation_date) <= new Date(toDate));
        filteredExpenses = filteredExpenses.filter(e => new Date(e.expense_date) <= new Date(toDate));
        filteredAdvance = filteredAdvance.filter(a => new Date(a.advance_date) <= new Date(toDate));
    }

    if (fromAmount > 0 || toAmount !== Infinity) {
        filteredMaintenance = filteredMaintenance.filter(m => m.cost >= fromAmount && m.cost <= toAmount);
        filteredViolations = filteredViolations.filter(v => v.amount >= fromAmount && v.amount <= toAmount);
        filteredExpenses = filteredExpenses.filter(e => e.amount >= fromAmount && e.amount <= toAmount);
        filteredAdvance = filteredAdvance.filter(a => a.amount >= fromAmount && a.amount <= toAmount);
    }

    return { filteredMaintenance, filteredViolations, filteredExpenses, filteredAdvance };
}

function generateFilteredExpensesReportPDF() {
    const html = generateFilteredExpensesReportHTML();
    const element = document.createElement('div');
    element.innerHTML = html;

    const options = {
        margin: 10,
        filename: 'تقرير_المصروفات_مصفاة.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(options).from(element).save();
    closeExpensesFilterModal();
}

function generateFilteredExpensesReportHTML() {
    const { filteredMaintenance, filteredViolations, filteredExpenses, filteredAdvance } = getFilteredExpensesData();
    
    let html = `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 10px; margin: 0; position: relative;">
            <img src="667.jpg" style="position: absolute; top: 0; left: 0; width: 80px; height: 60px; object-fit: contain;">
            <div style="text-align: center; margin-bottom: 12px; border-bottom: 2px solid #333; padding-bottom: 8px; margin-top: 20px;">
                <h1 style="margin: 0; font-size: 18px; color: #1a252f; font-weight: bold;">مصنع البهنساوي</h1>
                <h2 style="margin: 4px 0 0 0; font-size: 13px; color: #34495e; font-weight: bold;">تقرير المصروفات (مصفاة)</h2>
                <p style="margin: 3px 0; font-size: 10px; color: #666;">التاريخ: ${new Date().toLocaleDateString('ar-EG')}</p>
            </div>
    `;

    let totalMaintenance = 0;
    let totalViolations = 0;
    let totalExpenses = 0;
    let totalAdvance = 0;

    filteredMaintenance.forEach(m => { totalMaintenance += m.cost; });
    filteredViolations.forEach(v => { totalViolations += v.amount; });
    filteredExpenses.forEach(e => { totalExpenses += e.amount; });
    filteredAdvance.forEach(a => { totalAdvance += a.amount; });

    const grandTotal = totalMaintenance + totalViolations + totalExpenses;

    if (filteredMaintenance.length > 0) {
        html += `
            <div style="margin-top: 8px;">
                <h3 style="margin: 5px 0; font-size: 12px; color: white; background-color: #34495e; padding: 4px 8px; font-weight: bold;">🔧 مصاريف الصيانة والتصليح</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 4px 0; font-size: 10px;">
                    <thead>
                        <tr style="background-color: #5d6d7b; color: white; height: 12px;">
                            <th style="padding: 3px 4px; border: 0.5px solid #999; text-align: right;">اللوحة</th>
                            <th style="padding: 3px 4px; border: 0.5px solid #999; text-align: right;">نوع الصيانة</th>
                            <th style="padding: 3px 4px; border: 0.5px solid #999; text-align: right;">التاريخ</th>
                            <th style="padding: 3px 4px; border: 0.5px solid #999; text-align: center;">المبلغ</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        filteredMaintenance.forEach((m, idx) => {
            const bgColor = idx % 2 === 0 ? '#ffffff' : '#f5f5f5';
            html += `<tr style="background-color: ${bgColor}; height: 11px;"><td style="padding: 2px 3px; border: 0.5px solid #ddd;">${m.plate_number || '-'}</td><td style="padding: 2px 3px; border: 0.5px solid #ddd; font-size: 9px;">${m.maintenance_type}</td><td style="padding: 2px 3px; border: 0.5px solid #ddd; font-size: 9px;">${m.maintenance_date}</td><td style="padding: 2px 3px; border: 0.5px solid #ddd; text-align: center; font-weight: bold;">${m.cost.toLocaleString('ar-SA')}</td></tr>`;
        });

        html += `
                    </tbody>
                    <tfoot>
                        <tr style="background-color: #ecf0f1; font-weight: bold; height: 12px;">
                            <td colspan="3" style="padding: 3px 4px; border: 0.5px solid #999; text-align: right;">الإجمالي</td>
                            <td style="padding: 3px 4px; border: 0.5px solid #999; text-align: center; color: #27ae60;">${totalMaintenance.toLocaleString('ar-SA')}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    }

    if (filteredViolations.length > 0) {
        html += `
            <div style="margin-top: 8px;">
                <h3 style="margin: 5px 0; font-size: 12px; color: white; background-color: #e74c3c; padding: 4px 8px; font-weight: bold;">⚠️ مصاريف المخالفات</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 4px 0; font-size: 10px;">
                    <thead>
                        <tr style="background-color: #f1948b; color: white; height: 12px;">
                            <th style="padding: 3px 4px; border: 0.5px solid #999; text-align: right;">اللوحة</th>
                            <th style="padding: 3px 4px; border: 0.5px solid #999; text-align: right;">نوع المخالفة</th>
                            <th style="padding: 3px 4px; border: 0.5px solid #999; text-align: right;">التاريخ</th>
                            <th style="padding: 3px 4px; border: 0.5px solid #999; text-align: center;">المبلغ</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        filteredViolations.forEach((v, idx) => {
            const bgColor = idx % 2 === 0 ? '#ffffff' : '#f5f5f5';
            html += `<tr style="background-color: ${bgColor}; height: 11px;"><td style="padding: 2px 3px; border: 0.5px solid #ddd;">${v.plate_number || '-'}</td><td style="padding: 2px 3px; border: 0.5px solid #ddd; font-size: 9px;">${v.violation_type}</td><td style="padding: 2px 3px; border: 0.5px solid #ddd; font-size: 9px;">${v.violation_date}</td><td style="padding: 2px 3px; border: 0.5px solid #ddd; text-align: center; font-weight: bold;">${v.amount.toLocaleString('ar-SA')}</td></tr>`;
        });

        html += `
                    </tbody>
                    <tfoot>
                        <tr style="background-color: #ecf0f1; font-weight: bold; height: 12px;">
                            <td colspan="3" style="padding: 3px 4px; border: 0.5px solid #999; text-align: right;">الإجمالي</td>
                            <td style="padding: 3px 4px; border: 0.5px solid #999; text-align: center; color: #e74c3c;">${totalViolations.toLocaleString('ar-SA')}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    }

    if (filteredExpenses.length > 0) {
        html += `
            <div style="margin-top: 8px;">
                <h3 style="margin: 5px 0; font-size: 12px; color: white; background-color: #f39c12; padding: 4px 8px; font-weight: bold;">💰 مصاريف النفقات</h3>
                <table style="width: 100%; border-collapse: collapse; margin: 4px 0; font-size: 10px;">
                    <thead>
                        <tr style="background-color: #f5b041; color: white; height: 12px;">
                            <th style="padding: 3px 4px; border: 0.5px solid #999; text-align: right;">اللوحة</th>
                            <th style="padding: 3px 4px; border: 0.5px solid #999; text-align: right;">نوع النفقة</th>
                            <th style="padding: 3px 4px; border: 0.5px solid #999; text-align: right;">التاريخ</th>
                            <th style="padding: 3px 4px; border: 0.5px solid #999; text-align: center;">المبلغ</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        filteredExpenses.forEach((e, idx) => {
            const bgColor = idx % 2 === 0 ? '#ffffff' : '#f5f5f5';
            html += `<tr style="background-color: ${bgColor}; height: 11px;"><td style="padding: 2px 3px; border: 0.5px solid #ddd;">${e.plate_number || '-'}</td><td style="padding: 2px 3px; border: 0.5px solid #ddd; font-size: 9px;">${e.expense_type}</td><td style="padding: 2px 3px; border: 0.5px solid #ddd; font-size: 9px;">${e.expense_date}</td><td style="padding: 2px 3px; border: 0.5px solid #ddd; text-align: center; font-weight: bold;">${e.amount.toLocaleString('ar-SA')}</td></tr>`;
        });

        html += `
                    </tbody>
                    <tfoot>
                        <tr style="background-color: #ecf0f1; font-weight: bold; height: 12px;">
                            <td colspan="3" style="padding: 3px 4px; border: 0.5px solid #999; text-align: right;">الإجمالي</td>
                            <td style="padding: 3px 4px; border: 0.5px solid #999; text-align: center; color: #f39c12;">${totalExpenses.toLocaleString('ar-SA')}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    }



    html += `
        <div style="margin-top: 12px; padding: 10px; background-color: #1a252f; color: white; border-radius: 3px;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr style="height: 14px;"><td style="padding: 4px; font-size: 11px; text-align: right;">إجمالي الصيانة:</td><td style="padding: 4px; font-size: 11px; font-weight: bold; text-align: center;">${totalMaintenance.toLocaleString('ar-SA')}</td></tr>
                <tr style="height: 14px; background-color: rgba(255,255,255,0.1);"><td style="padding: 4px; font-size: 11px; text-align: right;">إجمالي المخالفات:</td><td style="padding: 4px; font-size: 11px; font-weight: bold; text-align: center;">${totalViolations.toLocaleString('ar-SA')}</td></tr>
                <tr style="height: 14px;"><td style="padding: 4px; font-size: 11px; text-align: right;">إجمالي النفقات:</td><td style="padding: 4px; font-size: 11px; font-weight: bold; text-align: center;">${totalExpenses.toLocaleString('ar-SA')}</td></tr>
                <tr style="height: 16px; border-top: 2px solid white;"><td style="padding: 5px; font-size: 12px; font-weight: bold; text-align: right;">🔴 الإجمالي العام:</td><td style="padding: 5px; font-size: 13px; font-weight: bold; text-align: center; color: #ffd700;">${grandTotal.toLocaleString('ar-SA')} جنيه</td></tr>
            </table>
        </div>
    `;

    html += `</div>`;
    return html;
}

function generateFilteredExpensesReportExcel() {
    const { filteredMaintenance, filteredViolations, filteredExpenses, filteredAdvance } = getFilteredExpensesData();
    
    const data = [
        ['تقرير المصروفات (مصفاة)', '', '', ''],
        ['التاريخ: ' + new Date().toLocaleDateString('ar-EG'), '', '', ''],
        []
    ];

    if (filteredMaintenance.length > 0) {
        data.push(['مصاريف الصيانة', '', '', '']);
        data.push(['اللوحة', 'نوع الصيانة', 'التاريخ', 'المبلغ']);
        filteredMaintenance.forEach(m => {
            data.push([m.plate_number || '-', m.maintenance_type, m.maintenance_date, m.cost]);
        });
        data.push([]);
    }

    if (filteredViolations.length > 0) {
        data.push(['مصاريف المخالفات', '', '', '']);
        data.push(['اللوحة', 'نوع المخالفة', 'التاريخ', 'المبلغ']);
        filteredViolations.forEach(v => {
            data.push([v.plate_number || '-', v.violation_type, v.violation_date, v.amount]);
        });
        data.push([]);
    }

    if (filteredExpenses.length > 0) {
        data.push(['مصاريف النفقات', '', '', '']);
        data.push(['اللوحة', 'نوع النفقة', 'التاريخ', 'المبلغ']);
        filteredExpenses.forEach(e => {
            data.push([e.plate_number || '-', e.expense_type, e.expense_date, e.amount]);
        });
        data.push([]);
    }

    if (filteredAdvance.length > 0) {
        data.push(['مصاريف العهدة', '', '', '']);
        data.push(['الوصف', 'البيان', 'التاريخ', 'المبلغ']);
        filteredAdvance.forEach(a => {
            data.push([a.description || '-', a.notes || '-', a.advance_date || '-', a.amount]);
        });
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المصروفات');
    XLSX.writeFile(wb, 'تقرير_المصروفات_مصفاة.xlsx');
    closeExpensesFilterModal();
}



document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});
