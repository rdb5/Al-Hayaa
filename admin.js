import {
  parseNostrKey,
  fetchAdminOrders,
  setOrderStatus,
  hideOrderPermanently,
  publishNostrProduct,
  fetchNostrProducts,
  saveNostrSettings,
  fetchNostrSettings,
  getCachedSettings,
  getCachedProducts,
  DEFAULT_ADMIN,
  DEFAULT_SETTINGS,
  DEFAULT_RELAYS
} from './nostr-service.js';

// Algeria Cities URL
const CITIES_JSON_URL = 'https://raw.githubusercontent.com/othmanus/algeria-cities/refs/heads/master/json/ar/algeria_cities.json';

const FALLBACK_WILAYAS = [
  { code: '01', name: 'أدرار' }, { code: '02', name: 'الشلف' }, { code: '03', name: 'الأغواط' },
  { code: '04', name: 'أم البواقي' }, { code: '05', name: 'باتنة' }, { code: '06', name: 'بجاية' },
  { code: '07', name: 'بسكرة' }, { code: '08', name: 'بشار' }, { code: '09', name: 'البليدة' },
  { code: '10', name: 'البويرة' }, { code: '11', name: 'تمنراست' }, { code: '12', name: 'تبسة' },
  { code: '13', name: 'تلمسان' }, { code: '14', name: 'تيارت' }, { code: '15', name: 'تيزي وزو' },
  { code: '16', name: 'الجزائر العاصمة' }, { code: '17', name: 'الجلفة' }, { code: '18', name: 'جيجل' },
  { code: '19', name: 'سطيف' }, { code: '20', name: 'سعيدة' }, { code: '21', name: 'سكيكدة' },
  { code: '22', name: 'سيدي بلعباس' }, { code: '23', name: 'عنابة' }, { code: '24', name: 'قالمة' },
  { code: '25', name: 'قسنطينة' }, { code: '26', name: 'المدية' }, { code: '27', name: 'مستغانم' },
  { code: '28', name: 'المسيلة' }, { code: '29', name: 'معسكر' }, { code: '30', name: 'ورقلة' },
  { code: '31', name: 'وهران' }, { code: '32', name: 'البيض' }, { code: '33', name: 'إليزي' },
  { code: '34', name: 'برج بوعريريج' }, { code: '35', name: 'بومرداس' }, { code: '36', name: 'الطارف' },
  { code: '37', name: 'تندوف' }, { code: '38', name: 'تيسمسيلت' }, { code: '39', name: 'الوادي' },
  { code: '40', name: 'خنشلة' }, { code: '41', name: 'سوق أهراس' }, { code: '42', name: 'تيبازة' },
  { code: '43', name: 'ميلة' }, { code: '44', name: 'عين الدفلى' }, { code: '45', name: 'النعامة' },
  { code: '46', name: 'عين تموشنت' }, { code: '47', name: 'غرداية' }, { code: '48', name: 'غليزان' },
  { code: '49', name: 'تيميمون' }, { code: '50', name: 'برج باجي مختار' }, { code: '51', name: 'أولاد جلال' },
  { code: '52', name: 'بني عباس' }, { code: '53', name: 'إن صالح' }, { code: '54', name: 'إن قزام' },
  { code: '55', name: 'تقرت' }, { code: '56', name: 'جانت' }, { code: '57', name: 'المغير' },
  { code: '58', name: 'المنيعة' }
];

// Admin Dashboard State
const adminState = {
  auth: null, // { type: 'nsec' | 'extension', pubkeyHex, seckeyBytes? }
  activeTab: 'orders', // 'orders' | 'products' | 'settings'
  orders: [],
  ordersFilter: 'all', // 'all' | 'pending' | 'confirmed' | 'shipped'
  ordersSearch: '',
  products: [],
  settings: getCachedSettings(),
  algeriaCities: [],
  isLoadingOrders: false,
  isSavingSettings: false,
  isPublishingProduct: false,
  editingProduct: null,
  editingOrder: null
};

/**
 * Initialize Admin Authentication from Session
 */
function initAdminAuth() {
  try {
    const saved = sessionStorage.getItem('al_hayaa_admin_auth');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.seckeyHex) {
        const parsedKey = parseNostrKey(parsed.seckeyHex);
        if (parsedKey) {
          adminState.auth = parsedKey;
        }
      } else if (parsed.type === 'extension') {
        adminState.auth = parsed;
      }
    }
  } catch (e) {
    console.warn('Session restoration error:', e);
  }

  updateAuthUI();
}

/**
 * Switch Auth UI: Login Gate vs Dashboard
 */
function updateAuthUI() {
  const loginGate = document.getElementById('login-gate');
  const dashboard = document.getElementById('admin-dashboard');
  const adminNpubEl = document.getElementById('admin-npub-display');

  if (adminState.auth) {
    if (loginGate) loginGate.classList.add('hidden');
    if (dashboard) dashboard.classList.remove('hidden');
    if (adminNpubEl) {
      adminNpubEl.textContent = adminState.auth.pubkeyHex.slice(0, 8) + '...' + adminState.auth.pubkeyHex.slice(-6);
    }
    loadDashboardData();
  } else {
    if (loginGate) loginGate.classList.remove('hidden');
    if (dashboard) dashboard.classList.add('hidden');
  }
}

/**
 * Handle Login via NIP-07 Extension
 */
export async function loginWithExtension() {
  const errorEl = document.getElementById('login-error');
  if (errorEl) errorEl.textContent = '';

  if (!window.nostr) {
    if (errorEl) {
      errorEl.textContent = 'لم يتم العثور على إضافة Nostr (مثل Alby أو nos2x). يرجى تثبيتها أو الدخول بالمفتاح الخاص.';
    }
    return;
  }

  try {
    const pubkey = await window.nostr.getPublicKey();
    if (!pubkey) throw new Error('تعذر استخراج المفتاح العام من الإضافة.');

    adminState.auth = {
      type: 'extension',
      pubkeyHex: pubkey
    };

    sessionStorage.setItem('al_hayaa_admin_auth', JSON.stringify({ type: 'extension', pubkeyHex: pubkey }));
    updateAuthUI();
  } catch (err) {
    console.error('Extension login error:', err);
    if (errorEl) errorEl.textContent = `فشل تسجيل الدخول عبر الإضافة: ${err.message}`;
  }
}

/**
 * Handle Login via Private Key (nsec or hex)
 */
export function loginWithKey(keyInput) {
  const errorEl = document.getElementById('login-error');
  if (errorEl) errorEl.textContent = '';

  const parsed = parseNostrKey(keyInput);
  if (!parsed || !parsed.seckeyBytes) {
    if (errorEl) {
      errorEl.textContent = 'المفتاح الخاص غير صالح. يرجى إدخال مفتاح بصيغة nsec1... أو 64 رمز hex.';
    }
    return;
  }

  adminState.auth = parsed;
  sessionStorage.setItem('al_hayaa_admin_auth', JSON.stringify({
    type: 'nsec',
    seckeyHex: parsed.seckeyHex,
    pubkeyHex: parsed.pubkeyHex
  }));

  updateAuthUI();
}

/**
 * Handle Login with Preconfigured Demo Boutique Key
 */
export function loginWithDemoKey() {
  loginWithKey(DEFAULT_ADMIN.demoNsec);
}

/**
 * Handle Logout
 */
export function logoutAdmin() {
  adminState.auth = null;
  sessionStorage.removeItem('al_hayaa_admin_auth');
  updateAuthUI();
}

/**
 * Switch Active Tab
 */
export function switchTab(tabId) {
  adminState.activeTab = tabId;

  // Update tab buttons
  document.querySelectorAll('.admin-nav-tab').forEach(btn => {
    const target = btn.getAttribute('data-tab');
    if (target === tabId) {
      btn.className = 'admin-nav-tab px-4 py-2.5 text-xs font-bold text-stone-900 border-b-2 border-[#9A7B4F] bg-stone-50 flex items-center gap-2';
    } else {
      btn.className = 'admin-nav-tab px-4 py-2.5 text-xs font-medium text-stone-500 hover:text-stone-900 flex items-center gap-2';
    }
  });

  // Update tab panels
  document.getElementById('tab-orders').classList.toggle('hidden', tabId !== 'orders');
  document.getElementById('tab-products').classList.toggle('hidden', tabId !== 'products');
  document.getElementById('tab-settings').classList.toggle('hidden', tabId !== 'settings');

  if (tabId === 'orders') renderOrdersTable();
  if (tabId === 'products') renderProductsList();
  if (tabId === 'settings') populateSettingsForm();
}

/**
 * Load Initial Dashboard Data
 */
async function loadDashboardData() {
  if (!adminState.auth) return;

  // 1. Fetch Algeria Cities
  fetch(CITIES_JSON_URL).then(r => r.json()).then(data => {
    adminState.algeriaCities = data;
    renderOfficeCommunesManager();
  }).catch(() => {
    // Fallback
    adminState.algeriaCities = [];
    for (const w of FALLBACK_WILAYAS) {
      adminState.algeriaCities.push({ id: parseInt(w.code), commune_name: w.name, wilaya_code: w.code, wilaya_name: w.name });
    }
    renderOfficeCommunesManager();
  });

  // 2. Load cached products
  adminState.products = getCachedProducts();
  renderProductsList();

  // 3. Load Settings from Nostr / Cache
  fetchNostrSettings(adminState.auth).then(settings => {
    adminState.settings = settings;
    populateSettingsForm();
  });

  // 4. Load Orders from Nostr
  refreshOrders();
}

/**
 * Refresh Orders from Relays
 */
export async function refreshOrders() {
  if (!adminState.auth) return;
  adminState.isLoadingOrders = true;
  renderOrdersTable();

  try {
    const orders = await fetchAdminOrders(adminState.auth);
    adminState.orders = orders;
  } catch (err) {
    console.error('Error refreshing orders:', err);
  } finally {
    adminState.isLoadingOrders = false;
    renderOrdersTable();
  }
}

/**
 * Render Orders Table & Stats
 */
function renderOrdersTable() {
  const container = document.getElementById('orders-table-container');
  const statsEl = document.getElementById('orders-stats-bar');
  if (!container) return;

  // Calculate stats
  const totalCount = adminState.orders.length;
  const pendingCount = adminState.orders.filter(o => o.status === 'pending').length;
  const confirmedCount = adminState.orders.filter(o => o.status === 'confirmed').length;
  const totalRevenue = adminState.orders.reduce((sum, o) => sum + (o.pricing?.total || 0), 0);

  if (statsEl) {
    statsEl.innerHTML = `
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div class="bg-white p-4 rounded-xl border border-stone-200">
          <div class="text-xs text-stone-500">إجمالي الطلبات</div>
          <div class="text-2xl font-bold text-stone-900 font-num mt-1">${totalCount}</div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-stone-200">
          <div class="text-xs text-amber-600 font-medium">قيد الانتظار</div>
          <div class="text-2xl font-bold text-amber-700 font-num mt-1">${pendingCount}</div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-stone-200">
          <div class="text-xs text-emerald-600 font-medium">مؤكدة للشحن</div>
          <div class="text-2xl font-bold text-emerald-700 font-num mt-1">${confirmedCount}</div>
        </div>
        <div class="bg-white p-4 rounded-xl border border-stone-200">
          <div class="text-xs text-stone-500">حجم المبيعات الإجمالي</div>
          <div class="text-2xl font-bold text-[#9A7B4F] font-num mt-1">${totalRevenue.toLocaleString()} دج</div>
        </div>
      </div>
    `;
  }

  // Filter orders
  let filtered = adminState.orders;
  if (adminState.ordersFilter !== 'all') {
    filtered = filtered.filter(o => o.status === adminState.ordersFilter);
  }

  if (adminState.ordersSearch) {
    const q = adminState.ordersSearch.toLowerCase();
    filtered = filtered.filter(o => 
      (o.orderId && o.orderId.toLowerCase().includes(q)) ||
      (o.customer?.fullName && o.customer.fullName.toLowerCase().includes(q)) ||
      (o.customer?.phone1 && o.customer.phone1.includes(q)) ||
      (o.customer?.wilayaName && o.customer.wilayaName.includes(q))
    );
  }

  if (adminState.isLoadingOrders) {
    container.innerHTML = `
      <div class="p-12 text-center text-stone-500">
        <svg class="animate-spin h-6 w-6 text-stone-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-xs">جاري سحب وفك تشفير الرسائل والطلبات عبر خوادم Nostr...</p>
      </div>
    `;
    return;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="p-12 text-center text-stone-400 bg-white rounded-xl border border-stone-200">
        <p class="text-sm font-medium">لا توجد طلبات مطابقة حالياً.</p>
        <p class="text-xs text-stone-400 mt-1">عند قيام أي عميل بالطلب من المتجر، ستصلك رسالة مشفرة فورية عبر Nostr هنا.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="overflow-x-auto bg-white rounded-xl border border-stone-200 shadow-sm">
      <table class="w-full text-right text-xs">
        <thead class="bg-stone-50 text-stone-600 border-b border-stone-200">
          <tr>
            <th class="py-3 px-4 font-semibold">رقم الطلب والتاريخ</th>
            <th class="py-3 px-4 font-semibold">الزبونة والهاتف</th>
            <th class="py-3 px-4 font-semibold">العنوان ونوع التوصيل</th>
            <th class="py-3 px-4 font-semibold">المنتجات المطلوبة</th>
            <th class="py-3 px-4 font-semibold">المبلغ الإجمالي</th>
            <th class="py-3 px-4 font-semibold">الحالة</th>
            <th class="py-3 px-4 font-semibold text-center">إجراءات</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100">
          ${filtered.map(order => {
            const item = order.items?.[0] || {};
            const dateStr = new Date(order.createdAt).toLocaleDateString('ar-DZ', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            let statusBadge = '';
            if (order.status === 'confirmed') {
              statusBadge = '<span class="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200">مؤكد للشحن</span>';
            } else if (order.status === 'shipped') {
              statusBadge = '<span class="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[11px] border border-blue-200">في الطريق</span>';
            } else if (order.status === 'delivered') {
              statusBadge = '<span class="px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-800 font-semibold text-[11px]">تم التسليم</span>';
            } else {
              statusBadge = '<span class="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold text-[11px] border border-amber-200">قيد الانتظار</span>';
            }

            return `
              <tr class="hover:bg-stone-50/70 transition-colors">
                <td class="py-3 px-4">
                  <div class="font-bold text-stone-900 font-num">${order.orderId}</div>
                  <div class="text-[11px] text-stone-400 font-num">${dateStr}</div>
                </td>
                <td class="py-3 px-4">
                  <div class="font-semibold text-stone-900">${order.customer?.fullName || 'غير محدد'}</div>
                  <div class="text-[11px] text-stone-500 font-num" dir="ltr">${order.customer?.phone1 || ''}</div>
                  ${order.customer?.phone2 ? `<div class="text-[10px] text-stone-400 font-num" dir="ltr">${order.customer.phone2}</div>` : ''}
                </td>
                <td class="py-3 px-4">
                  <div class="text-stone-800">${order.customer?.wilayaName} - ${order.customer?.communeName}</div>
                  <div class="text-[11px] text-stone-500">${order.customer?.deliveryType || 'باب المنزل'}</div>
                </td>
                <td class="py-3 px-4">
                  <div class="font-medium text-stone-900">${item.name || 'منتج الحياء'}</div>
                  <div class="text-[11px] text-stone-500">${item.color || ''} · ${item.size || ''} (الكمية: ${item.quantity || 1})</div>
                </td>
                <td class="py-3 px-4 font-bold text-stone-900 font-num text-sm">
                  ${(order.pricing?.total || 0).toLocaleString()} دج
                </td>
                <td class="py-3 px-4">
                  ${statusBadge}
                </td>
                <td class="py-3 px-4 text-center">
                  <div class="inline-flex items-center gap-1.5">
                    ${order.status === 'pending' ? `
                      <button 
                        type="button"
                        class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition-colors"
                        onclick="window.confirmOrder('${order.orderId}')"
                      >
                        تأكيد
                      </button>
                    ` : ''}
                    <button 
                      type="button"
                      class="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-[11px] transition-colors"
                      onclick="window.openEditOrderModal('${order.orderId}')"
                    >
                      تعديل
                    </button>
                    <button 
                      type="button"
                      class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[11px] transition-colors"
                      onclick="window.deleteOrderPermanently('${order.orderId}', '${order.eventId}')"
                    >
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// Order Actions exposed to window
window.confirmOrder = function(orderId) {
  setOrderStatus(orderId, 'confirmed');
  const target = adminState.orders.find(o => o.orderId === orderId);
  if (target) target.status = 'confirmed';
  renderOrdersTable();
};

window.deleteOrderPermanently = function(orderId, eventId) {
  if (!confirm(`هل أنتِ متأكدة من حذف الطلب رقم ${orderId} نهائياً من اللوحة؟`)) return;
  hideOrderPermanently(orderId, eventId);
  adminState.orders = adminState.orders.filter(o => o.orderId !== orderId && o.eventId !== eventId);
  renderOrdersTable();
};

window.openEditOrderModal = function(orderId) {
  const order = adminState.orders.find(o => o.orderId === orderId);
  if (!order) return;
  adminState.editingOrder = JSON.parse(JSON.stringify(order));

  const modal = document.getElementById('edit-order-modal');
  const content = document.getElementById('edit-order-modal-content');
  if (!modal || !content) return;

  content.innerHTML = `
    <h3 class="text-lg font-bold text-stone-900 mb-4">تعديل بيانات الطلب: ${order.orderId}</h3>
    <form onsubmit="window.saveEditedOrder(event)" class="space-y-3 text-xs">
      <div>
        <label class="block font-semibold mb-1">اسم الزبونة:</label>
        <input type="text" id="edit-cust-name" value="${order.customer?.fullName || ''}" class="w-full p-2 border rounded" required />
      </div>
      <div class="grid grid-cols-2 gap-2">
        <div>
          <label class="block font-semibold mb-1">رقم الهاتف 1:</label>
          <input type="tel" id="edit-cust-phone1" value="${order.customer?.phone1 || ''}" class="w-full p-2 border rounded" required />
        </div>
        <div>
          <label class="block font-semibold mb-1">رقم الهاتف 2:</label>
          <input type="tel" id="edit-cust-phone2" value="${order.customer?.phone2 || ''}" class="w-full p-2 border rounded" />
        </div>
      </div>
      <div>
        <label class="block font-semibold mb-1">البلدية:</label>
        <input type="text" id="edit-cust-commune" value="${order.customer?.communeName || ''}" class="w-full p-2 border rounded" required />
      </div>
      <div>
        <label class="block font-semibold mb-1">حالة الطلب:</label>
        <select id="edit-cust-status" class="w-full p-2 border rounded">
          <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>قيد الانتظار</option>
          <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>مؤكد للشحن</option>
          <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>في الطريق</option>
          <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>تم التسليم</option>
        </select>
      </div>
      <div class="pt-4 flex justify-end gap-2">
        <button type="button" onclick="document.getElementById('edit-order-modal').classList.add('hidden')" class="px-3 py-1.5 border rounded">إلغاء</button>
        <button type="submit" class="px-4 py-1.5 bg-stone-900 text-white rounded font-bold">حفظ التعديلات</button>
      </div>
    </form>
  `;

  modal.classList.remove('hidden');
};

window.saveEditedOrder = function(e) {
  e.preventDefault();
  const order = adminState.editingOrder;
  if (!order) return;

  const newName = document.getElementById('edit-cust-name').value.trim();
  const newPhone1 = document.getElementById('edit-cust-phone1').value.trim();
  const newPhone2 = document.getElementById('edit-cust-phone2').value.trim();
  const newCommune = document.getElementById('edit-cust-commune').value.trim();
  const newStatus = document.getElementById('edit-cust-status').value;

  order.customer.fullName = newName;
  order.customer.phone1 = newPhone1;
  order.customer.phone2 = newPhone2;
  order.customer.communeName = newCommune;
  order.status = newStatus;

  setOrderStatus(order.orderId, newStatus);

  const idx = adminState.orders.findIndex(o => o.orderId === order.orderId);
  if (idx >= 0) adminState.orders[idx] = order;

  document.getElementById('edit-order-modal').classList.add('hidden');
  renderOrdersTable();
};

/**
 * Export Orders to CSV (Compatible with Excel and Courier dispatch)
 */
export function exportOrdersCSV() {
  if (adminState.orders.length === 0) {
    alert('لا توجد طلبات لتصديرها.');
    return;
  }

  const rows = [
    ['رقم الطلب', 'التاريخ', 'اسم الزبونة', 'الهاتف 1', 'الهاتف 2', 'الولاية', 'البلدية', 'نوع التوصيل', 'المنتج', 'اللون والمقاس', 'الكمية', 'المبلغ الإجمالي دج', 'الحالة']
  ];

  for (const o of adminState.orders) {
    const item = o.items?.[0] || {};
    rows.push([
      o.orderId,
      new Date(o.createdAt).toLocaleString('ar-DZ'),
      `"${(o.customer?.fullName || '').replace(/"/g, '""')}"`,
      o.customer?.phone1 || '',
      o.customer?.phone2 || '',
      o.customer?.wilayaName || '',
      o.customer?.communeName || '',
      o.customer?.deliveryType || '',
      `"${(item.name || '').replace(/"/g, '""')}"`,
      `"${item.color || ''} - ${item.size || ''}"`,
      item.quantity || 1,
      o.pricing?.total || 0,
      o.status
    ]);
  }

  const csvContent = '\uFEFF' + rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Al-Hayaa-Orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

/**
 * Render Product Catalog List
 */
function renderProductsList() {
  const container = document.getElementById('products-admin-list');
  if (!container) return;

  container.innerHTML = adminState.products.map(prod => `
    <div class="bg-white p-4 rounded-xl border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <img 
          src="${prod.images?.[0] || ''}" 
          alt="${prod.name}" 
          referrerPolicy="no-referrer"
          class="w-16 h-16 rounded-lg object-cover bg-stone-100"
        />
        <div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-[#9A7B4F]">${prod.category}</span>
            <span class="text-xs text-stone-400">·</span>
            <span class="text-xs text-stone-400 font-mono">${prod.slug}</span>
          </div>
          <h4 class="text-sm font-bold text-stone-900">${prod.name}</h4>
          <div class="text-xs font-bold text-stone-800 font-num mt-0.5">${Number(prod.price).toLocaleString()} دج</div>
        </div>
      </div>

      <div class="flex items-center gap-2 self-end sm:self-center">
        <a 
          href="/?product=${prod.slug}" 
          target="_blank" 
          class="px-3 py-1.5 border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs rounded-lg transition-colors"
        >
          معاينة في المتجر ↗
        </a>
        <button 
          type="button" 
          onclick="window.editProductForm('${prod.slug}')"
          class="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-lg transition-colors"
        >
          تعديل
        </button>
      </div>
    </div>
  `).join('');
}

/**
 * Pre-fill Product Form for Editing
 */
window.editProductForm = function(slug) {
  const prod = adminState.products.find(p => p.slug === slug);
  if (!prod) return;

  adminState.editingProduct = prod;
  document.getElementById('prod-title').value = prod.name || prod.title;
  document.getElementById('prod-slug').value = prod.slug;
  document.getElementById('prod-price').value = prod.price;
  document.getElementById('prod-category').value = prod.category || 'جلباب قطعتين';
  document.getElementById('prod-fabric').value = prod.fabric || '';
  document.getElementById('prod-colors').value = (prod.colors || []).join(', ');
  document.getElementById('prod-sizes').value = (prod.sizes || []).join(', ');
  document.getElementById('prod-images').value = (prod.images || []).join('\n');
  document.getElementById('prod-desc').value = prod.description || '';

  document.getElementById('product-form-section').scrollIntoView({ behavior: 'smooth' });
};

/**
 * Reset Product Form
 */
export function resetProductForm() {
  adminState.editingProduct = null;
  document.getElementById('product-upsert-form').reset();
  document.getElementById('prod-slug').value = `jilbab-${Date.now().toString(36)}`;
}

/**
 * Handle Publishing / Updating Product to Nostr (Kind 30402)
 */
export async function handleProductSubmit(e) {
  e.preventDefault();
  if (!adminState.auth) {
    alert('يرجى تسجيل الدخول أولاً لنشر المنتجات.');
    return;
  }

  const title = document.getElementById('prod-title').value.trim();
  const slug = document.getElementById('prod-slug').value.trim() || `prod-${Date.now()}`;
  const price = parseFloat(document.getElementById('prod-price').value);
  const category = document.getElementById('prod-category').value;
  const fabric = document.getElementById('prod-fabric').value.trim();
  const colors = document.getElementById('prod-colors').value.split(',').map(s => s.trim()).filter(Boolean);
  const sizes = document.getElementById('prod-sizes').value.split(',').map(s => s.trim()).filter(Boolean);
  const images = document.getElementById('prod-images').value.split('\n').map(s => s.trim()).filter(Boolean);
  const desc = document.getElementById('prod-desc').value.trim();

  const productData = {
    id: adminState.editingProduct?.id || `prod-${Date.now()}`,
    slug,
    name: title,
    title,
    price,
    currency: 'DZD',
    category,
    fabric,
    colors: colors.length > 0 ? colors : ['كلاسيكي'],
    sizes: sizes.length > 0 ? sizes : ['مقاس موحد'],
    images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80'],
    summary: desc.slice(0, 120),
    description: desc,
    inStock: true
  };

  const submitBtn = document.getElementById('publish-product-btn');
  try {
    adminState.isPublishingProduct = true;
    if (submitBtn) submitBtn.textContent = 'جاري التوقيع والنشر إلى شبكة Nostr...';

    await publishNostrProduct(productData, adminState.auth);
    alert('✓ تم نشر وتحديث المنتج بنجاح كحدث لامركزي (Kind 30402)!');

    // Reload products list
    adminState.products = getCachedProducts();
    renderProductsList();
    resetProductForm();
  } catch (err) {
    console.error('Failed to publish product:', err);
    alert(`خطأ أثناء النشر على Nostr: ${err.message}`);
  } finally {
    adminState.isPublishingProduct = false;
    if (submitBtn) submitBtn.textContent = 'حفظ ونشر المنتج عبر Nostr';
  }
}

/**
 * Populate Store Settings in Tab Form
 */
function populateSettingsForm() {
  const settings = adminState.settings || DEFAULT_SETTINGS;

  const pixelInput = document.getElementById('setting-pixel-id');
  if (pixelInput) pixelInput.value = settings.facebookPixelId || '';

  const defaultHomeInput = document.getElementById('setting-default-home');
  if (defaultHomeInput) defaultHomeInput.value = settings.deliveryPricing?.defaultHome || 600;

  const defaultOfficeInput = document.getElementById('setting-default-office');
  if (defaultOfficeInput) defaultOfficeInput.value = settings.deliveryPricing?.defaultOffice || 350;

  renderWilayaOverridesTable();
}

/**
 * Render Wilaya Overrides Table
 */
function renderWilayaOverridesTable() {
  const tbody = document.getElementById('wilaya-overrides-tbody');
  if (!tbody) return;

  const overrides = adminState.settings.deliveryPricing?.overrides || {};
  tbody.innerHTML = FALLBACK_WILAYAS.map(w => {
    const ov = overrides[w.code] || {
      home: adminState.settings.deliveryPricing?.defaultHome || 600,
      office: adminState.settings.deliveryPricing?.defaultOffice || 350
    };

    return `
      <tr class="hover:bg-stone-50 text-xs">
        <td class="py-2 px-3 font-semibold text-stone-900">${w.code} - ${w.name}</td>
        <td class="py-2 px-3">
          <input 
            type="number" 
            class="w-24 p-1.5 border border-stone-300 rounded font-num"
            value="${ov.home}" 
            onchange="window.updateWilayaRate('${w.code}', 'home', this.value)"
          /> دج
        </td>
        <td class="py-2 px-3">
          <input 
            type="number" 
            class="w-24 p-1.5 border border-stone-300 rounded font-num"
            value="${ov.office}" 
            onchange="window.updateWilayaRate('${w.code}', 'office', this.value)"
          /> دج
        </td>
      </tr>
    `;
  }).join('');
}

window.updateWilayaRate = function(code, type, val) {
  if (!adminState.settings.deliveryPricing) {
    adminState.settings.deliveryPricing = { overrides: {} };
  }
  if (!adminState.settings.deliveryPricing.overrides) {
    adminState.settings.deliveryPricing.overrides = {};
  }
  if (!adminState.settings.deliveryPricing.overrides[code]) {
    const w = FALLBACK_WILAYAS.find(x => x.code === code);
    adminState.settings.deliveryPricing.overrides[code] = {
      home: adminState.settings.deliveryPricing.defaultHome || 600,
      office: adminState.settings.deliveryPricing.defaultOffice || 350,
      name: w ? w.name : code
    };
  }
  adminState.settings.deliveryPricing.overrides[code][type] = parseFloat(val) || 0;
};

/**
 * Render Office Communes Manager (Organized by Wilaya)
 */
function renderOfficeCommunesManager() {
  const container = document.getElementById('office-communes-container');
  if (!container) return;

  const selectedCommunes = new Set(adminState.settings.officeCommunes || []);

  // Filter cities by active wilaya or show prominent
  const prominentWilayas = ['16', '31', '25', '19', '09', '35', '23', '05', '13', '30', '47'];
  
  container.innerHTML = prominentWilayas.map(wCode => {
    const wObj = FALLBACK_WILAYAS.find(w => w.code === wCode);
    const communes = adminState.algeriaCities.filter(c => String(c.wilaya_code).padStart(2, '0') === wCode);

    return `
      <div class="bg-white p-4 rounded-xl border border-stone-200">
        <div class="font-bold text-stone-900 text-xs pb-2 border-b border-stone-100 flex justify-between items-center">
          <span>${wCode} - ${wObj ? wObj.name : ''}</span>
          <span class="text-[11px] text-stone-400 font-normal">(${communes.length} بلدية)</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 text-xs">
          ${communes.map(c => {
            const isChecked = selectedCommunes.has(c.commune_name.trim());
            return `
              <label class="flex items-center gap-1.5 cursor-pointer text-stone-700">
                <input 
                  type="checkbox" 
                  value="${c.commune_name}" 
                  ${isChecked ? 'checked' : ''}
                  onchange="window.toggleOfficeCommune('${c.commune_name}', this.checked)"
                  class="rounded accent-stone-900"
                />
                <span class="truncate">${c.commune_name}</span>
              </label>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');
}

window.toggleOfficeCommune = function(name, enabled) {
  if (!Array.isArray(adminState.settings.officeCommunes)) {
    adminState.settings.officeCommunes = [];
  }
  const set = new Set(adminState.settings.officeCommunes);
  if (enabled) {
    set.add(name);
  } else {
    set.delete(name);
  }
  adminState.settings.officeCommunes = Array.from(set);
};

/**
 * Test Facebook Pixel button
 */
export function testFacebookPixel() {
  const pixelId = document.getElementById('setting-pixel-id').value.trim();
  if (!pixelId) {
    alert('يرجى إدخال معرّف Facebook Pixel ID أولاً.');
    return;
  }

  // Trigger test event
  if (window.fbq) {
    try {
      window.fbq('track', 'TestEvent', { pixel_id: pixelId, test: true, timestamp: Date.now() });
      alert(`✓ تم إرسال حدث الاختبار بنجاح إلى Facebook Pixel (${pixelId})! تفقد تقرير الأحداث في Meta Events Manager.`);
    } catch (e) {
      alert(`تنبيه: ${e.message}`);
    }
  } else {
    // Inject and test
    /* eslint-disable */
    (function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)})(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', pixelId);
    window.fbq('track', 'TestEvent', { status: 'tested_from_al_hayaa_admin' });
    alert(`✓ تم حقن Pixel ID (${pixelId}) وإطلاق حدث الاختبار بنجاح!`);
  }
}

/**
 * Save Admin Settings to Nostr Profile (Kind 30078 Encrypted App Data)
 */
export async function handleSettingsSave(e) {
  e.preventDefault();
  if (!adminState.auth) {
    alert('يرجى تسجيل الدخول أولاً لحفظ الإعدادات.');
    return;
  }

  const pixelId = document.getElementById('setting-pixel-id').value.trim();
  const defaultHome = parseFloat(document.getElementById('setting-default-home').value) || 600;
  const defaultOffice = parseFloat(document.getElementById('setting-default-office').value) || 350;

  adminState.settings.facebookPixelId = pixelId;
  if (!adminState.settings.deliveryPricing) adminState.settings.deliveryPricing = {};
  adminState.settings.deliveryPricing.defaultHome = defaultHome;
  adminState.settings.deliveryPricing.defaultOffice = defaultOffice;

  const btn = document.getElementById('save-settings-btn');
  try {
    adminState.isSavingSettings = true;
    if (btn) btn.textContent = 'جاري التشفير والحفظ على Nostr...';

    await saveNostrSettings(adminState.settings, adminState.auth);
    alert('✓ تم تشفير وحفظ إعدادات المتجر وأسعار التوصيل على بروفايلك في Nostr بنجاح!');
  } catch (err) {
    console.error('Error saving settings to Nostr:', err);
    alert(`فشل الحفظ على Nostr: ${err.message}`);
  } finally {
    adminState.isSavingSettings = false;
    if (btn) btn.textContent = 'حفظ الإعدادات بأمان على Nostr (NIP-78)';
  }
}

// Global attachments
window.loginWithExtension = loginWithExtension;
window.loginWithKey = loginWithKey;
window.loginWithDemoKey = loginWithDemoKey;
window.logoutAdmin = logoutAdmin;
window.switchTab = switchTab;
window.refreshOrders = refreshOrders;
window.exportOrdersCSV = exportOrdersCSV;
window.handleProductSubmit = handleProductSubmit;
window.resetProductForm = resetProductForm;
window.testFacebookPixel = testFacebookPixel;
window.handleSettingsSave = handleSettingsSave;

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdminAuth);
} else {
  initAdminAuth();
}
