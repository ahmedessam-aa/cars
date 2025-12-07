let licenseWarningDays = 20;
let editingVehicleId = null;
let currentUser = null;

const SUPABASE_URL = 'https://okdukpeqdljyuphcosra.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rZHVrcGVxZGxqeXVwaGNvc3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MzcyMjYsImV4cCI6MjA3OTMxMzIyNn0.QOBk8CBQe8sz8NabxAFLOmaC0MBaYdedN09x76AEEFo';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const appData = {
    vehicles: [],
    maintenance: [],
    violations: [],
    expenses: [],
    advance: [],
};

function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(btn => btn.classList.remove('active'));
    loginForm.classList.remove('active-form');
    registerForm.classList.remove('active-form');
    
    if (tab === 'login') {
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
        loginForm.classList.add('active-form');
    } else {
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
        registerForm.classList.add('active-form');
    }
    
    document.getElementById('loginError').classList.remove('show');
    document.getElementById('registerError').classList.remove('show');
}

async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();
        
        if (error || !data) {
            errorDiv.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
            errorDiv.classList.add('show');
            return;
        }
        
        currentUser = username;
        localStorage.setItem('currentUser', username);
        showMainSystem();
    } catch (err) {
        errorDiv.textContent = 'حدث خطأ في الاتصال: ' + err.message;
        errorDiv.classList.add('show');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    const errorDiv = document.getElementById('registerError');
    
    if (password !== passwordConfirm) {
        errorDiv.textContent = 'كلمات المرور غير متطابقة';
        errorDiv.classList.add('show');
        return;
    }
    
    if (username.length < 3) {
        errorDiv.textContent = 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل';
        errorDiv.classList.add('show');
        return;
    }
    
    if (password.length < 4) {
        errorDiv.textContent = 'كلمة المرور يجب أن تكون 4 أحرف على الأقل';
        errorDiv.classList.add('show');
        return;
    }
    
    try {
        const { data, error } = await supabase
            .from('users')
            .insert([{ username, password }]);
        
        if (error) {
            if (error.message.includes('duplicate') || error.message.includes('username')) {
                errorDiv.textContent = 'اسم المستخدم موجود بالفعل';
            } else {
                errorDiv.textContent = 'خطأ في التسجيل: ' + error.message;
            }
            errorDiv.classList.add('show');
            return;
        }
        
        errorDiv.classList.remove('show');
        alert('تم التسجيل بنجاح! يمكنك الآن تسجيل الدخول');
        switchTab('login');
        document.getElementById('loginUsername').value = username;
        document.getElementById('regUsername').value = '';
        document.getElementById('regPassword').value = '';
        document.getElementById('regPasswordConfirm').value = '';
    } catch (err) {
        errorDiv.textContent = 'حدث خطأ: ' + err.message;
        errorDiv.classList.add('show');
    }
}

function handleLogout() {
    if (confirm('هل تريد تسجيل الخروج؟')) {
        currentUser = null;
        localStorage.removeItem('currentUser');
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginError').classList.remove('show');
        switchTab('login');
        document.getElementById('mainSystem').style.display = 'none';
        document.getElementById('loginPage').style.display = 'flex';
    }
}

function showMainSystem() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('mainSystem').style.display = 'grid';
    document.getElementById('currentUser').textContent = `مرحباً: ${currentUser}`;
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
}

function checkAuthOnLoad() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = savedUser;
        showMainSystem();
    }
}

async function initializeApp() {
    await loadData();
    setupEventListeners();
    updateDateTime();
    loadLicenseWarningDays();
    renderDashboard();
    setInterval(updateDateTime, 1000);
}

async function loadData() {
    try {
        const [vehiclesRes, maintenanceRes, violationsRes, expensesRes, advanceRes] = await Promise.all([
            supabase.from('vehicles').select('*').eq('username', currentUser),
            supabase.from('maintenance').select('*').eq('username', currentUser),
            supabase.from('violations').select('*').eq('username', currentUser),
            supabase.from('expenses').select('*').eq('username', currentUser),
            supabase.from('advance').select('*').eq('username', currentUser)
        ]);

        appData.vehicles = vehiclesRes.data || [];
        appData.maintenance = maintenanceRes.data || [];
        appData.violations = violationsRes.data || [];
        appData.expenses = expensesRes.data || [];
        appData.advance = advanceRes.data || [];
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
    }
}

async function saveData() {
    console.log('Data synced with Supabase');
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

async function handleVehicleSubmit(e) {
    e.preventDefault();

    const vehicleData = {
        plate_number: document.getElementById('plateNumber').value,
        model: document.getElementById('vehicleModel').value,
        year: parseInt(document.getElementById('vehicleYear').value),
        vin_number: document.getElementById('vinNumber').value,
        status: document.getElementById('vehicleStatus').value,
        license_number: document.getElementById('licenseNumber').value,
        license_expiry: document.getElementById('licenseExpiry').value,
        violation_count: parseInt(document.getElementById('violationCount').value) || 0,
        violation_paid: parseFloat(document.getElementById('violationPaid').value) || 0,
        notes: document.getElementById('vehicleNotes').value,
        username: currentUser
    };

    try {
        if (editingVehicleId) {
            const { error } = await supabase
                .from('vehicles')
                .update(vehicleData)
                .eq('id', editingVehicleId);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('vehicles')
                .insert([vehicleData]);
            if (error) throw error;
        }

        await loadData();
        closeVehicleModal();
        populateVehiclesList();
        renderDashboard();
        alert('تم حفظ البيانات بنجاح');
    } catch (error) {
        console.error('خطأ:', error);
        alert('حدث خطأ في حفظ البيانات: ' + error.message);
    }
}

async function deleteVehicle(vehicleId) {
    if (confirm('هل أنت متأكد من حذف هذه المركبة؟')) {
        try {
            await supabase
                .from('vehicles')
                .delete()
                .eq('id', vehicleId);

            await loadData();
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

async function handleMaintenanceSubmit(e) {
    e.preventDefault();

    const vehicleId = document.getElementById('maintenanceVehicle').value;
    const vehicle = appData.vehicles.find(v => v.id === vehicleId);

    const maintenanceData = {
        vehicle_id: vehicleId,
        plate_number: vehicle ? vehicle.plate_number : '',
        maintenance_type: document.getElementById('maintenanceType').value,
        maintenance_date: document.getElementById('maintenanceDate').value,
        cost: parseFloat(document.getElementById('maintenanceCost').value),
        status: document.getElementById('maintenanceStatus').value,
        notes: document.getElementById('maintenanceNotes').value,
        username: currentUser
    };

    try {
        const { error } = await supabase
            .from('maintenance')
            .insert([maintenanceData]);
        if (error) throw error;

        await loadData();
        closeMaintenanceModal();
        populateMaintenanceList();
        renderDashboard();
        alert('تم تسجيل الصيانة بنجاح');
    } catch (error) {
        console.error('خطأ:', error);
        alert('حدث خطأ في تسجيل الصيانة: ' + error.message);
    }
}

async function handleViolationSubmit(e) {
    e.preventDefault();

    const vehicleId = document.getElementById('violationVehicle').value;
    const vehicle = appData.vehicles.find(v => v.id === vehicleId);

    const violationData = {
        vehicle_id: vehicleId,
        plate_number: vehicle ? vehicle.plate_number : '',
        violation_type: document.getElementById('violationType').value,
        violation_date: document.getElementById('violationDate').value,
        amount: parseFloat(document.getElementById('violationAmount').value),
        status: document.getElementById('violationStatus').value,
        notes: document.getElementById('violationNotes').value,
        username: currentUser
    };

    try {
        const { error } = await supabase
            .from('violations')
            .insert([violationData]);
        if (error) throw error;

        await loadData();
        closeViolationModal();
        populateViolationsList();
        renderDashboard();
        alert('تم تسجيل المخالفة بنجاح');
    } catch (error) {
        console.error('خطأ:', error);
        alert('حدث خطأ في تسجيل المخالفة: ' + error.message);
    }
}

async function deleteMaintenance(maintenanceId) {
    if (confirm('هل أنت متأكد من حذف سجل الصيانة؟')) {
        try {
            await supabase
                .from('maintenance')
                .delete()
                .eq('id', maintenanceId);

            await loadData();
            populateMaintenanceList();
            renderDashboard();
        } catch (error) {
            console.error('خطأ:', error);
            alert('حدث خطأ في حذف البيانات');
        }
    }
}

async function deleteViolation(violationId) {
    if (confirm('هل أنت متأكد من حذف المخالفة؟')) {
        try {
            await supabase
                .from('violations')
                .delete()
                .eq('id', violationId);

            await loadData();
            populateViolationsList();
            renderDashboard();
        } catch (error) {
            console.error('خطأ:', error);
            alert('حدث خطأ في حذف البيانات');
        }
    }
}

async function handleExpensesSubmit(e) {
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
        vehicle_id: vehicleId || null,
        plate_number: vehicle ? vehicle.plate_number : '',
        expense_type: expenseType,
        is_custom_type: isCustom,
        expense_date: document.getElementById('expensesDate').value,
        amount: parseFloat(document.getElementById('expensesAmount').value),
        advance_id: document.getElementById('expensesAdvance').value || null,
        notes: document.getElementById('expensesNotes').value,
        username: currentUser
    };

    try {
        if (editingExpenseId) {
            const { error } = await supabase
                .from('expenses')
                .update(expenseData)
                .eq('id', editingExpenseId);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('expenses')
                .insert([expenseData]);
            if (error) throw error;
        }

        await loadData();
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

async function deleteExpense(expenseId) {
    if (confirm('هل أنت متأكد من حذف هذه النفقة؟')) {
        try {
            await supabase
                .from('expenses')
                .delete()
                .eq('id', expenseId);

            await loadData();
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

async function handleAdvanceSubmit(e) {
    e.preventDefault();

    const advanceData = {
        amount: parseFloat(document.getElementById('advanceAmount').value),
        advance_date: document.getElementById('advanceDate').value,
        is_active: true,
        notes: document.getElementById('advanceNotes').value,
        username: currentUser
    };

    try {
        const { error } = await supabase
            .from('advance')
            .insert([advanceData]);
        if (error) throw error;

        await loadData();
        closeAdvanceModal();
        populateAdvanceList();
        renderDashboard();
        alert('تم إضافة العهدة بنجاح');
    } catch (error) {
        console.error('خطأ:', error);
        alert('حدث خطأ في حفظ البيانات: ' + error.message);
    }
}

async function deleteAdvance(advanceId) {
    if (confirm('هل أنت متأكد من حذف هذه العهدة؟')) {
        try {
            await supabase
                .from('advance')
                .delete()
                .eq('id', advanceId);

            await loadData();
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
            <td>${expense.amount.toLocaleString('ar-SA')} جنيه</td>
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
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 10px;">
            <div style="text-align: center; margin-bottom: 10px; border-bottom: 2px solid #333; padding-bottom: 5px;">
                <h1 style="margin: 0; font-size: 18px; color: #1a252f;">مصنع البهنساوي</h1>
                <h2 style="margin: 5px 0; font-size: 14px; color: #34495e;">تقرير المركبات - ${new Date().toLocaleDateString('ar-EG')}</h2>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin: 10px 0; line-height: 1.4;">
                <thead>
                    <tr style="background-color: #1a252f; color: white;">
                        <th style="padding: 8px 10px; text-align: right; border: 1px solid #666; font-size: 12px; white-space: nowrap;">اللوحة</th>
                        <th style="padding: 8px 10px; text-align: right; border: 1px solid #666; font-size: 12px; white-space: nowrap;">النموذج</th>
                        <th style="padding: 8px 10px; text-align: right; border: 1px solid #666; font-size: 12px; white-space: nowrap;">اسم السائق</th>
                        <th style="padding: 8px 10px; text-align: right; border: 1px solid #666; font-size: 12px; white-space: nowrap;">السنة</th>
                        <th style="padding: 8px 10px; text-align: right; border: 1px solid #666; font-size: 12px; white-space: nowrap;">الحالة</th>
                        <th style="padding: 8px 10px; text-align: right; border: 1px solid #666; font-size: 12px; white-space: nowrap;">انتهاء الرخصة</th>
                        <th style="padding: 8px 10px; text-align: right; border: 1px solid #666; font-size: 12px; white-space: nowrap;">الملاحظات</th>
                    </tr>
                </thead>
                <tbody>
    `;

    appData.vehicles.forEach((vehicle, index) => {
        const bgColor = index % 2 === 0 ? '#ffffff' : '#f0f0f0';
        html += `<tr style="background-color: ${bgColor};"><td style="padding: 6px 8px; border: 1px solid #ccc; font-size: 11px;">${vehicle.plate_number}</td><td style="padding: 6px 8px; border: 1px solid #ccc; font-size: 11px;">${vehicle.model}</td><td style="padding: 6px 8px; border: 1px solid #ccc; font-size: 11px;">${vehicle.vin_number || '-'}</td><td style="padding: 6px 8px; border: 1px solid #ccc; font-size: 11px;">${vehicle.year}</td><td style="padding: 6px 8px; border: 1px solid #ccc; font-size: 11px;">${vehicle.status}</td><td style="padding: 6px 8px; border: 1px solid #ccc; font-size: 11px;">${vehicle.license_expiry}</td><td style="padding: 6px 8px; border: 1px solid #ccc; font-size: 11px;">${(vehicle.notes || '-').substring(0, 25)}</td></tr>`;
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
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px;">
                <h1 style="margin: 0; font-size: 24px;">مصنع البهنساوي</h1>
                <h2 style="margin: 5px 0; font-size: 18px;">تقرير الصيانة والتصليح</h2>
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
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

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

    let html = `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px;">
                <h1 style="margin: 0; font-size: 24px;">مصنع البهنساوي</h1>
                <h2 style="margin: 5px 0; font-size: 18px;">تقرير المصروفات السنوي</h2>
                <p style="margin: 5px 0; font-size: 12px; color: #666;">
                    السنة: ${currentYear} | التاريخ: ${new Date().toLocaleDateString('ar-EG')}
                </p>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                    <tr style="background-color: #2c3e50; color: white;">
                        <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">الشهر</th>
                        <th style="padding: 12px; text-align: right; border: 1px solid #ddd;">المصروفات (جنيه)</th>
                    </tr>
                </thead>
                <tbody>
    `;

    let totalExpenses = 0;
    monthNames.forEach((month, index) => {
        const expense = monthlyData[index];
        totalExpenses += expense;
        const bgColor = index % 2 === 0 ? '#f9f9f9' : 'white';
        html += `
            <tr style="background-color: ${bgColor};">
                <td style="padding: 10px; border: 1px solid #ddd;">${month}</td>
                <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${expense.toLocaleString('ar-SA')}</td>
            </tr>
        `;
    });

    html += `
                </tbody>
                <tfoot>
                    <tr style="background-color: #2c3e50; color: white; font-weight: bold;">
                        <td style="padding: 12px; border: 1px solid #ddd;">الإجمالي السنوي</td>
                        <td style="padding: 12px; border: 1px solid #ddd; text-align: center;">${totalExpenses.toLocaleString('ar-SA')}</td>
                    </tr>
                </tfoot>
            </table>
            <div style="margin-top: 20px; padding: 15px; background-color: #ecf0f1; border-radius: 5px;">
                <p style="margin: 0; font-size: 14px;"><strong>الإجمالي العام للمصروفات:</strong> ${totalExpenses.toLocaleString('ar-SA')} جنيه</p>
                <p style="margin: 5px 0; font-size: 14px;"><strong>متوسط المصروفات الشهرية:</strong> ${(totalExpenses / 12).toLocaleString('ar-SA')} جنيه</p>
            </div>
            <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666;">
                <p>تم إنشاء هذا التقرير بواسطة نظام إدارة المركبات - مصنع البهنساوي</p>
            </div>
        </div>
    `;

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
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px;">
                <h1 style="margin: 0; font-size: 24px;">مصنع البهنساوي</h1>
                <h2 style="margin: 5px 0; font-size: 18px;">تقرير الرخص</h2>
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
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px;">
                <h1 style="margin: 0; font-size: 24px;">مصنع البهنساوي</h1>
                <h2 style="margin: 5px 0; font-size: 18px;">تقرير المخالفات المرورية</h2>
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
                <td style="padding: 4px 5px; border: 1px solid #ccc;">${vehiclePlate}</td>
                <td style="padding: 4px 5px; border: 1px solid #ccc;">${expense.expense_type}</td>
                <td style="padding: 4px 5px; border: 1px solid #ccc;">${expense.expense_date}</td>
                <td style="padding: 4px 5px; border: 1px solid #ccc; text-align: center; font-weight: 500;">${expense.amount.toLocaleString('ar-SA')}</td>
                <td style="padding: 4px 5px; border: 1px solid #ccc;">${expense.notes || '-'}</td>
            </tr>
        `;
    });
    
    expensesTable += `
        <tr style="background-color: #2c3e50; color: white; font-weight: bold; font-size: 10px;">
            <td style="padding: 4px 5px; border: 1px solid #999;"></td>
            <td style="padding: 4px 5px; border: 1px solid #999;"></td>
            <td style="padding: 4px 5px; border: 1px solid #999; text-align: right;">الإجمالي:</td>
            <td style="padding: 4px 5px; border: 1px solid #999; text-align: center; font-weight: bold;">${usedAdvance.toLocaleString('ar-SA')}</td>
            <td style="padding: 4px 5px; border: 1px solid #999;"></td>
        </tr>
    `;

    let html = `
        <div dir="rtl" style="font-family: Arial, sans-serif; padding: 10px; line-height: 1.4;">
            <div style="text-align: center; margin-bottom: 10px; border-bottom: 3px solid #2c3e50; padding-bottom: 8px;">
                <h1 style="margin: 0; font-size: 24px; font-weight: bold;">مصنع البهنساوي</h1>
                <h2 style="margin: 2px 0; font-size: 15px; font-weight: bold;">تقرير النفقات والعهدة</h2>
                <p style="margin: 2px 0; font-size: 10px; color: #666;">
                    التاريخ: ${new Date().toLocaleDateString('ar-EG')}
                </p>
            </div>

            <div style="margin-bottom: 8px; background-color: #f5f5f5; padding: 6px; border-radius: 3px; border-left: 4px solid #2c3e50;">
                <h3 style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold; color: #2c3e50;">ملخص العهدة والنفقات</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <tr>
                        <td style="padding: 4px 5px; border: 1px solid #bbb; background-color: #e8f4f8; font-weight: bold; width: 50%;">العهدة المتاحة:</td>
                        <td style="padding: 4px 5px; border: 1px solid #bbb; text-align: center; font-weight: bold; font-size: 12px;">${totalAdvance.toLocaleString('ar-SA')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 5px; border: 1px solid #bbb; background-color: #fff3cd; font-weight: bold;">المصروف:</td>
                        <td style="padding: 4px 5px; border: 1px solid #bbb; text-align: center; font-weight: bold; color: #c00; font-size: 12px;">${usedAdvance.toLocaleString('ar-SA')}</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 5px; border: 1px solid #bbb; background-color: #d4edda; font-weight: bold;">المتبقي:</td>
                        <td style="padding: 4px 5px; border: 1px solid #bbb; text-align: center; font-weight: bold; color: #060; font-size: 12px;">${remainingAdvance.toLocaleString('ar-SA')}</td>
                    </tr>
                </table>
            </div>

            <div style="margin-bottom: 2px;">
                <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold; color: #2c3e50; border-bottom: 2px solid #2c3e50; padding-bottom: 2px;">تفاصيل النفقات</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                    <thead>
                        <tr style="background-color: #2c3e50; color: white; font-weight: bold;">
                            <th style="padding: 4px 4px; text-align: right; border: 1px solid #999;">اللوحة</th>
                            <th style="padding: 4px 4px; text-align: right; border: 1px solid #999;">نوع النفقة</th>
                            <th style="padding: 4px 4px; text-align: right; border: 1px solid #999;">التاريخ</th>
                            <th style="padding: 4px 4px; text-align: right; border: 1px solid #999;">المبلغ</th>
                            <th style="padding: 4px 4px; text-align: right; border: 1px solid #999;">ملاحظات</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expensesTable || '<tr><td colspan="5" style="padding: 8px; text-align: center; color: #999;">لا توجد نفقات</td></tr>'}
                    </tbody>
                </table>
            </div>

            <div style="margin-top: 6px; padding: 5px 0; border-top: 2px solid #333;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="text-align: center; width: 45%;">
                        <p style="margin: 0 0 16px 0; font-size: 10px;">التوقيع</p>
                        <p style="margin: 0; font-size: 10px; font-weight: bold; border-top: 2px solid #333; padding-top: 3px;">مدير الحركة</p>
                    </div>
                    <div style="text-align: center; width: 45%;">
                        <p style="margin: 0 0 16px 0; font-size: 10px;">التوقيع</p>
                        <p style="margin: 0; font-size: 10px; font-weight: bold; border-top: 2px solid #333; padding-top: 3px;">المدير المالي</p>
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

async function confirmClearAllData() {
    if (confirm('تحذير: هذا سيحذف جميع بيانات حسابك بشكل نهائي. هل أنت متأكد؟')) {
        if (confirm('هل أنت متأكد تماماً؟ لا يمكن التراجع عن هذا الإجراء!')) {
            try {
                await supabase.from('violations').delete().eq('username', currentUser);
                await supabase.from('maintenance').delete().eq('username', currentUser);
                await supabase.from('expenses').delete().eq('username', currentUser);
                await supabase.from('advance').delete().eq('username', currentUser);
                await supabase.from('vehicles').delete().eq('username', currentUser);
                
                appData.vehicles = [];
                appData.maintenance = [];
                appData.violations = [];
                appData.expenses = [];
                appData.advance = [];
                alert('تم حذف جميع بيانات حسابك');
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

document.addEventListener('DOMContentLoaded', () => {
    checkAuthOnLoad();
    if (currentUser) {
        initializeApp();
    }
});
