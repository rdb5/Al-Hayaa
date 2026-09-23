import {
  fetchNostrProducts,
  sendNostrOrder,
  getCachedSettings,
  getCachedProducts,
  DEFAULT_ADMIN
} from './nostr-service.js';

// State Management
const state = {
  products: [],
  selectedProduct: null,
  selectedColor: '',
  selectedSize: '',
  quantity: 1,
  activeImageIndex: 0,
  settings: getCachedSettings(),
  algeriaCities: [],
  selectedWilayaCode: '',
  deliveryType: 'home', // 'home' | 'office'
  selectedCommuneName: '',
  customerName: '',
  phone1: '',
  phone2: '',
  addressNotes: '',
  isSubmittingOrder: false,
  lastCompletedOrder: null
};

// Algeria Cities URL
const CITIES_JSON_URL = 'https://raw.githubusercontent.com/othmanus/algeria-cities/refs/heads/master/json/ar/algeria_cities.json';

// Local Fallback for Wilayas & major communes in case of GitHub raw connection issues
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

/**
 * Initialize Facebook Pixel dynamically from Admin Settings
 */
export function initFacebookPixel(pixelId) {
  if (!pixelId || pixelId.trim() === '') return;
  const cleanId = pixelId.trim();

  // If already injected
  if (window.fbq) {
    try {
      window.fbq('init', cleanId);
      window.fbq('track', 'PageView');
    } catch (e) {
      console.warn('FB Pixel track warning:', e);
    }
    return;
  }

  /* Facebook Pixel Base Code Injection */
  /* eslint-disable */
  (function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  window.fbq('init', cleanId);
  window.fbq('track', 'PageView');
  console.log('✓ Facebook Pixel injected with ID:', cleanId);
}

/**
 * Fire Facebook Pixel event safely
 */
export function trackPixelEvent(eventName, params = {}) {
  if (window.fbq) {
    try {
      window.fbq('track', eventName, params);
      console.log(`[FB Pixel] Event: ${eventName}`, params);
    } catch (err) {
      console.warn('Pixel tracking error:', err);
    }
  }
}

/**
 * Fetch Algeria Cities from GitHub repository
 */
async function loadAlgeriaCities() {
  try {
    const response = await fetch(CITIES_JSON_URL);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      state.algeriaCities = data;
      console.log(`✓ Loaded ${data.length} Algerian communes from GitHub.`);
    }
  } catch (error) {
    console.warn('Could not fetch cities JSON from remote, building local index:', error);
    // Create local fallback from default settings and prominent communes
    state.algeriaCities = [];
    for (const w of FALLBACK_WILAYAS) {
      state.algeriaCities.push({
        id: parseInt(w.code, 10),
        commune_name: w.name,
        daira_name: w.name,
        wilaya_code: w.code,
        wilaya_name: w.name
      });
    }
  }
}

/**
 * Calculate Delivery Price based on Wilaya and Delivery Type
 */
export function getDeliveryPrice(wilayaCode, type = 'home') {
  if (!wilayaCode) return 0;
  const pricing = state.settings.deliveryPricing || {};
  const overrides = pricing.overrides || {};

  const cleanCode = String(wilayaCode).padStart(2, '0');
  if (overrides[cleanCode]) {
    return type === 'home' ? overrides[cleanCode].home : overrides[cleanCode].office;
  }

  return type === 'home' ? (pricing.defaultHome || 600) : (pricing.defaultOffice || 350);
}

/**
 * Get Communes for a Selected Wilaya
 */
export function getFilteredCommunes(wilayaCode, deliveryType) {
  if (!wilayaCode) return [];
  const cleanCode = String(wilayaCode).padStart(2, '0');

  // Filter cities by wilaya
  let list = state.algeriaCities.filter(c => String(c.wilaya_code).padStart(2, '0') === cleanCode);

  // If "Office" delivery is chosen, filter to only office-enabled communes
  if (deliveryType === 'office') {
    const allowed = state.settings.officeCommunes || [];
    const filtered = list.filter(c => allowed.includes(c.commune_name.trim()));
    // If no office in that specific wilaya, return fallback with notification
    if (filtered.length === 0) {
      return list.slice(0, 3); // Fallback to chief-lieu
    }
    return filtered;
  }

  return list;
}

/**
 * Render Product Grid in Storefront
 */
function renderProductGrid() {
  const container = document.getElementById('products-grid');
  if (!container) return;

  if (state.products.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center">
        <p class="text-stone-500 font-medium">جاري تحميل تشكيلة الحياء الفاخرة...</p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.products.map(product => {
    const mainImg = product.images?.[0] || 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80';
    return `
      <article class="luxury-card rounded-2xl overflow-hidden flex flex-col group cursor-pointer" data-slug="${product.slug}">
        <div class="relative w-full aspect-[4/3] bg-stone-100 overflow-hidden">
          <img 
            src="${mainImg}" 
            alt="${product.name}" 
            referrerPolicy="no-referrer"
            loading="lazy"
            class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          ${product.featured ? `
            <div class="absolute top-3 right-3 bg-black/80 backdrop-blur-sm text-[#DFCEB5] text-xs px-2.5 py-1 rounded tracking-wide font-medium">
              مختارات الموسم
            </div>
          ` : ''}
          <div class="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-900 border border-stone-200/50 shadow-sm font-num">
            ${Number(product.price).toLocaleString()} دج
          </div>
        </div>

        <div class="p-6 flex flex-col flex-1 justify-between">
          <div>
            <div class="flex items-center gap-2 text-xs text-stone-400 mb-1.5">
              <span>${product.category || 'أزياء راقية'}</span>
              <span aria-hidden="true">·</span>
              <span>${product.fabric || 'أقمشة فاخرة'}</span>
            </div>
            <h3 class="text-lg font-bold text-stone-900 group-hover:text-[#9A7B4F] transition-colors leading-snug">
              ${product.name}
            </h3>
            <p class="text-sm text-stone-600 line-clamp-2 mt-2 leading-relaxed font-light">
              ${product.summary || product.description}
            </p>
          </div>

          <div class="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
            <span class="text-xs font-medium text-[#9A7B4F] group-hover:underline inline-flex items-center gap-1">
              <span>عرض التفاصيل والطلب</span>
              <span aria-hidden="true" class="text-sm">←</span>
            </span>
            <button 
              type="button"
              class="px-4 py-2 bg-stone-900 hover:bg-[#9A7B4F] text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
              onclick="event.stopPropagation(); window.openProductModal('${product.slug}', true)"
            >
              طلب مباشر
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Attach card click handlers
  container.querySelectorAll('article[data-slug]').forEach(card => {
    card.addEventListener('click', () => {
      const slug = card.getAttribute('data-slug');
      openProductModal(slug);
    });
  });
}

/**
 * Open Product Details & Checkout Modal
 */
export function openProductModal(slug, directToCheckout = false) {
  const product = state.products.find(p => p.slug === slug);
  if (!product) return;

  state.selectedProduct = product;
  state.selectedColor = product.colors?.[0] || 'كلاسيكي';
  state.selectedSize = product.sizes?.[0] || 'مقاس 1 (155-163 سم)';
  state.quantity = 1;
  state.activeImageIndex = 0;

  // Update browser URL query without reloading
  const newUrl = new URL(window.location.href);
  newUrl.searchParams.set('product', slug);
  window.history.pushState({ slug }, '', newUrl.toString());

  // Track ViewContent on Facebook Pixel
  trackPixelEvent('ViewContent', {
    content_name: product.name,
    content_category: product.category,
    content_ids: [product.slug],
    value: product.price,
    currency: 'DZD'
  });

  const modal = document.getElementById('product-modal');
  const modalContent = document.getElementById('product-modal-content');
  if (!modal || !modalContent) return;

  renderProductModalContent();
  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');

  if (directToCheckout) {
    setTimeout(() => {
      const checkoutSection = document.getElementById('checkout-form-section');
      if (checkoutSection) {
        checkoutSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 150);
  }
}

/**
 * Close Product Modal
 */
export function closeProductModal() {
  const modal = document.getElementById('product-modal');
  if (modal) {
    modal.classList.add('hidden');
  }
  document.body.classList.remove('overflow-hidden');

  // Clear query parameter
  const newUrl = new URL(window.location.href);
  newUrl.searchParams.delete('product');
  window.history.pushState({}, '', newUrl.toString());
}

/**
 * Render Content inside Product Modal
 */
function renderProductModalContent() {
  const container = document.getElementById('product-modal-content');
  const product = state.selectedProduct;
  if (!container || !product) return;

  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80'];

  const deliveryCost = getDeliveryPrice(state.selectedWilayaCode, state.deliveryType);
  const subtotal = product.price * state.quantity;
  const grandTotal = subtotal + deliveryCost;

  // Generate Wilaya options
  const wilayaOptions = FALLBACK_WILAYAS.map(w => {
    const isSelected = state.selectedWilayaCode === w.code ? 'selected' : '';
    return `<option value="${w.code}" ${isSelected}>${w.code} - ${w.name}</option>`;
  }).join('');

  // Generate Communes options
  const communes = getFilteredCommunes(state.selectedWilayaCode, state.deliveryType);
  const communeOptions = communes.length > 0
    ? communes.map(c => `<option value="${c.commune_name}" ${state.selectedCommuneName === c.commune_name ? 'selected' : ''}>${c.commune_name}</option>`).join('')
    : '<option value="">يرجى اختيار الولاية أولاً</option>';

  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
      
      <!-- Gallery Column (Sticky left on desktop) -->
      <div class="lg:col-span-6 flex flex-col gap-4">
        <div class="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-stone-100 border border-stone-200">
          <img 
            id="modal-main-image"
            src="${images[state.activeImageIndex] || images[0]}" 
            alt="${product.name}" 
            referrerPolicy="no-referrer"
            class="w-full h-full object-cover object-center transition-all duration-300"
          />
          <div class="absolute top-3 right-3 bg-black/80 text-[#DFCEB5] text-xs px-3 py-1 rounded backdrop-blur-md font-medium">
            ${product.category || 'الحياء لاكشري'}
          </div>
        </div>

        <!-- Thumbnails -->
        ${images.length > 1 ? `
          <div class="flex gap-3 overflow-x-auto pb-2">
            ${images.map((img, idx) => `
              <button 
                type="button" 
                class="w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${idx === state.activeImageIndex ? 'border-[#9A7B4F] shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'}"
                onclick="window.setModalImage(${idx})"
              >
                <img src="${img}" alt="صورة ${idx + 1}" class="w-full h-full object-cover" />
              </button>
            `).join('')}
          </div>
        ` : ''}

        <!-- Luxury Specifications Note -->
        <div class="p-5 rounded-xl bg-[#F8F5EE] border border-stone-200/60 text-xs text-stone-700 space-y-2 leading-relaxed">
          <div class="font-semibold text-stone-900 flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-[#9A7B4F]"></span>
            <span>معايير الخياطة والفخامة:</span>
          </div>
          <p>• خياطة مزدوجة عالية المتانة بمقاسات شرعية مدروسة بعناية.</p>
          <p>• نوع القماش: <strong>${product.fabric || 'حرير نقي ممتاز مقاوم للتجعد'}</strong>.</p>
          <p>• ضمان استبدال مجاني في حال وجود أي عيب مصنعي.</p>
        </div>
      </div>

      <!-- Purchase & Checkout Column -->
      <div class="lg:col-span-6 flex flex-col justify-between">
        <div>
          <!-- Title & Price -->
          <div class="border-b border-stone-200 pb-5">
            <div class="text-xs font-semibold text-[#9A7B4F] tracking-wide mb-1 uppercase">AL HAYAA LUXURY COLLECTION</div>
            <h2 class="text-2xl lg:text-3xl font-bold text-stone-900 font-brand leading-tight mb-3">
              ${product.name}
            </h2>
            <div class="flex items-baseline gap-3">
              <span class="text-3xl font-black text-stone-900 font-num">
                ${Number(product.price).toLocaleString()} دج
              </span>
              <span class="text-xs text-stone-400">الدفع عند الاستلام (COD)</span>
            </div>
          </div>

          <!-- Description -->
          <div class="py-4 text-sm text-stone-600 leading-relaxed font-light border-b border-stone-200">
            ${product.description}
          </div>

          <!-- Variants (Colors & Sizes) -->
          <div class="py-5 space-y-5 border-b border-stone-200">
            <!-- Colors -->
            ${product.colors && product.colors.length > 0 ? `
              <div>
                <label class="block text-xs font-semibold text-stone-900 mb-2">
                  اختر اللون المفضل: <span class="text-[#9A7B4F]">${state.selectedColor}</span>
                </label>
                <div class="flex flex-wrap gap-2">
                  ${product.colors.map(col => `
                    <button 
                      type="button"
                      class="px-3.5 py-1.5 text-xs rounded-lg border font-medium transition-all ${state.selectedColor === col ? 'border-stone-900 bg-stone-900 text-white shadow-sm' : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400'}"
                      onclick="window.selectColor('${col}')"
                    >
                      ${col}
                    </button>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Sizes -->
            ${product.sizes && product.sizes.length > 0 ? `
              <div>
                <label class="block text-xs font-semibold text-stone-900 mb-2">
                  اختر المقاس: <span class="text-[#9A7B4F]">${state.selectedSize}</span>
                </label>
                <div class="flex flex-wrap gap-2">
                  ${product.sizes.map(size => `
                    <button 
                      type="button"
                      class="px-3.5 py-1.5 text-xs rounded-lg border font-medium transition-all ${state.selectedSize === size ? 'border-stone-900 bg-stone-900 text-white shadow-sm' : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400'}"
                      onclick="window.selectSize('${size}')"
                    >
                      ${size}
                    </button>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Quantity Stepper -->
            <div>
              <label class="block text-xs font-semibold text-stone-900 mb-2">الكمية:</label>
              <div class="inline-flex items-center border border-stone-300 rounded-lg overflow-hidden bg-white">
                <button type="button" class="px-3 py-1.5 text-stone-600 hover:bg-stone-100 text-sm font-bold" onclick="window.updateQuantity(-1)">-</button>
                <span class="px-4 py-1.5 text-sm font-bold text-stone-900 font-num">${state.quantity}</span>
                <button type="button" class="px-3 py-1.5 text-stone-600 hover:bg-stone-100 text-sm font-bold" onclick="window.updateQuantity(1)">+</button>
              </div>
            </div>
          </div>

          <!-- Checkout Form Section -->
          <div id="checkout-form-section" class="pt-6">
            <div class="flex items-center gap-2 mb-4">
              <span class="w-2.5 h-2.5 rounded-full bg-[#C5A880]"></span>
              <h3 class="text-base font-bold text-stone-900">معلومات التوصيل والطلب المباشر</h3>
            </div>

            <form id="order-checkout-form" onsubmit="window.handleCheckoutSubmit(event)" class="space-y-4">
              <!-- Full Name -->
              <div>
                <label class="block text-xs font-semibold text-stone-800 mb-1">الاسم الكامل واللقب *</label>
                <input 
                  type="text" 
                  id="checkout-name"
                  required
                  placeholder="مثال: مريم بن سالم"
                  value="${state.customerName}"
                  oninput="window.state.customerName = this.value"
                  class="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:border-stone-900 focus:outline-none transition-colors"
                />
              </div>

              <!-- Phone Numbers -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-stone-800 mb-1">رقم الهاتف الأول *</label>
                  <input 
                    type="tel" 
                    id="checkout-phone1"
                    required
                    dir="ltr"
                    placeholder="05 / 06 / 07 XX XX XX"
                    value="${state.phone1}"
                    oninput="window.state.phone1 = this.value"
                    class="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:border-stone-900 focus:outline-none transition-colors font-num text-right"
                  />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-stone-800 mb-1">رقم هاتف ثانٍ (اختياري)</label>
                  <input 
                    type="tel" 
                    id="checkout-phone2"
                    dir="ltr"
                    placeholder="05 / 06 / 07 XX XX XX"
                    value="${state.phone2}"
                    oninput="window.state.phone2 = this.value"
                    class="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:border-stone-900 focus:outline-none transition-colors font-num text-right"
                  />
                </div>
              </div>

              <!-- Wilaya Dropdown -->
              <div>
                <label class="block text-xs font-semibold text-stone-800 mb-1">الولاية *</label>
                <select 
                  id="checkout-wilaya"
                  required
                  onchange="window.handleWilayaChange(this.value)"
                  class="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:border-stone-900 focus:outline-none transition-colors"
                >
                  <option value="">-- اختر الولاية (58 ولاية) --</option>
                  ${wilayaOptions}
                </select>
              </div>

              <!-- Delivery Type Selector -->
              <div>
                <label class="block text-xs font-semibold text-stone-800 mb-1.5">نوع التوصيل *</label>
                <div class="grid grid-cols-2 gap-3">
                  <label class="flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${state.deliveryType === 'home' ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900' : 'border-stone-200 bg-white hover:border-stone-300'}">
                    <div class="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="delivery_type" 
                        value="home" 
                        ${state.deliveryType === 'home' ? 'checked' : ''}
                        onchange="window.handleDeliveryTypeChange('home')"
                        class="accent-stone-900"
                      />
                      <span class="text-xs font-bold text-stone-900">باب المنزل</span>
                    </div>
                    <span class="text-xs text-stone-600 font-num">
                      ${state.selectedWilayaCode ? `${getDeliveryPrice(state.selectedWilayaCode, 'home')} دج` : ''}
                    </span>
                  </label>

                  <label class="flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${state.deliveryType === 'office' ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900' : 'border-stone-200 bg-white hover:border-stone-300'}">
                    <div class="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="delivery_type" 
                        value="office" 
                        ${state.deliveryType === 'office' ? 'checked' : ''}
                        onchange="window.handleDeliveryTypeChange('office')"
                        class="accent-stone-900"
                      />
                      <span class="text-xs font-bold text-stone-900">مكتب التوصيل</span>
                    </div>
                    <span class="text-xs text-stone-600 font-num">
                      ${state.selectedWilayaCode ? `${getDeliveryPrice(state.selectedWilayaCode, 'office')} دج` : ''}
                    </span>
                  </label>
                </div>
                ${state.deliveryType === 'office' ? `
                  <p class="text-[11px] text-stone-500 mt-1.5">
                    * ملاحظة: يتم الاستلام من أقرب مكتب شحن شريك بالبلديات المعتمدة.
                  </p>
                ` : ''}
              </div>

              <!-- Commune Dropdown -->
              <div>
                <label class="block text-xs font-semibold text-stone-800 mb-1">البلدية *</label>
                <select 
                  id="checkout-commune"
                  required
                  onchange="window.state.selectedCommuneName = this.value"
                  class="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm text-stone-900 focus:bg-white focus:border-stone-900 focus:outline-none transition-colors"
                >
                  ${communeOptions}
                </select>
              </div>

              <!-- Dynamic Total Box -->
              <div class="p-4 rounded-xl bg-[#F8F5EE] border border-stone-200 space-y-2 mt-4">
                <div class="flex justify-between text-xs text-stone-600">
                  <span>سعر المنتجات (${state.quantity}):</span>
                  <span class="font-num">${subtotal.toLocaleString()} دج</span>
                </div>
                <div class="flex justify-between text-xs text-stone-600">
                  <span>تكلفة التوصيل (${state.deliveryType === 'home' ? 'إلى باب المنزل' : 'استلام من المكتب'}):</span>
                  <span class="font-num">${deliveryCost ? `${deliveryCost.toLocaleString()} دج` : 'اختر الولاية'}</span>
                </div>
                <div class="pt-2 border-t border-stone-300 flex justify-between items-baseline font-bold text-stone-900">
                  <span class="text-sm">المجموع الإجمالي للدفع:</span>
                  <span class="text-xl text-[#9A7B4F] font-num">${grandTotal.toLocaleString()} دج</span>
                </div>
              </div>

              <!-- Order Submit Button -->
              <div class="pt-3">
                <button 
                  type="submit"
                  id="submit-order-btn"
                  ${state.isSubmittingOrder ? 'disabled' : ''}
                  class="w-full py-3.5 px-6 bg-stone-900 hover:bg-[#9A7B4F] text-white font-bold text-sm rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  ${state.isSubmittingOrder ? `
                    <svg class="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>جاري التشفير والإرسال عبر شبكة Nostr...</span>
                  ` : `
                    <span>تأكيد الطلب الآن (الدفع عند الاستلام)</span>
                    <span aria-hidden="true">✓</span>
                  `}
                </button>
                <div class="flex items-center justify-center gap-2 mt-2.5 text-[11px] text-stone-500">
                  <span class="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>مشفر عبر بروتوكول Nostr اللامركزي NIP-04 مباشرة للمتجر</span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Global modal helpers exposed to window
window.setModalImage = function(index) {
  state.activeImageIndex = index;
  const imgEl = document.getElementById('modal-main-image');
  if (imgEl && state.selectedProduct?.images?.[index]) {
    imgEl.src = state.selectedProduct.images[index];
  }
  // update thumbnail active state
  renderProductModalContent();
};

window.selectColor = function(color) {
  state.selectedColor = color;
  renderProductModalContent();
};

window.selectSize = function(size) {
  state.selectedSize = size;
  renderProductModalContent();
};

window.updateQuantity = function(delta) {
  state.quantity = Math.max(1, state.quantity + delta);
  renderProductModalContent();
};

window.handleWilayaChange = function(wilayaCode) {
  state.selectedWilayaCode = wilayaCode;
  const communes = getFilteredCommunes(wilayaCode, state.deliveryType);
  state.selectedCommuneName = communes.length > 0 ? communes[0].commune_name : '';
  renderProductModalContent();
};

window.handleDeliveryTypeChange = function(type) {
  state.deliveryType = type;
  const communes = getFilteredCommunes(state.selectedWilayaCode, type);
  state.selectedCommuneName = communes.length > 0 ? communes[0].commune_name : '';
  renderProductModalContent();
};

window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.state = state;

/**
 * Handle Order Submission
 */
window.handleCheckoutSubmit = async function(e) {
  e.preventDefault();
  if (state.isSubmittingOrder) return;

  const product = state.selectedProduct;
  if (!product) return;

  const nameInput = document.getElementById('checkout-name');
  const phone1Input = document.getElementById('checkout-phone1');
  const wilayaSelect = document.getElementById('checkout-wilaya');
  const communeSelect = document.getElementById('checkout-commune');

  const customerName = nameInput?.value?.trim() || state.customerName;
  const phone1 = phone1Input?.value?.trim() || state.phone1;
  const phone2 = document.getElementById('checkout-phone2')?.value?.trim() || state.phone2;
  const wilayaCode = wilayaSelect?.value || state.selectedWilayaCode;
  const communeName = communeSelect?.value || state.selectedCommuneName;

  if (!customerName) {
    alert('يرجى إدخال الاسم واللقب الكامل.');
    return;
  }
  if (!phone1 || phone1.length < 9) {
    alert('يرجى إدخال رقم هاتف صحيح للتواصل.');
    return;
  }
  if (!wilayaCode) {
    alert('يرجى اختيار الولاية.');
    return;
  }
  if (!communeName) {
    alert('يرجى اختيار البلدية.');
    return;
  }

  const wilayaObj = FALLBACK_WILAYAS.find(w => w.code === wilayaCode);
  const wilayaName = wilayaObj ? wilayaObj.name : wilayaCode;

  const deliveryPrice = getDeliveryPrice(wilayaCode, state.deliveryType);
  const subtotal = product.price * state.quantity;
  const total = subtotal + deliveryPrice;

  const orderId = `AH-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  const orderData = {
    orderId,
    timestamp: new Date().toISOString(),
    customer: {
      fullName: customerName,
      phone1: phone1,
      phone2: phone2 || '',
      wilayaCode: wilayaCode,
      wilayaName: wilayaName,
      communeName: communeName,
      deliveryType: state.deliveryType === 'home' ? 'باب المنزل' : 'مكتب التوصيل'
    },
    items: [
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        quantity: state.quantity,
        color: state.selectedColor,
        size: state.selectedSize,
        image: product.images?.[0] || ''
      }
    ],
    pricing: {
      subtotal,
      deliveryPrice,
      total,
      currency: 'DZD'
    }
  };

  try {
    state.isSubmittingOrder = true;
    renderProductModalContent();

    // Send order encrypted to admin's Nostr pubkey
    const sendResult = await sendNostrOrder(orderData, DEFAULT_ADMIN.hexPubkey);
    console.log('✓ Nostr order broadcasted:', sendResult);

    // Track Facebook Pixel Purchase Event
    trackPixelEvent('Purchase', {
      value: total,
      currency: 'DZD',
      content_name: product.name,
      content_ids: [product.slug],
      num_items: state.quantity,
      order_id: orderId
    });

    state.lastCompletedOrder = {
      ...orderData,
      eventId: sendResult.eventId
    };

    // Close product modal and open success receipt modal
    closeProductModal();
    showOrderSuccessModal(state.lastCompletedOrder);

  } catch (err) {
    console.error('Order submission failed:', err);
    alert(`عذراً، حدث خطأ أثناء إرسال الطلب: ${err.message}. يرجى المحاولة مرة أخرى.`);
  } finally {
    state.isSubmittingOrder = false;
  }
};

/**
 * Show Order Success Receipt Modal
 */
function showOrderSuccessModal(order) {
  const modal = document.getElementById('success-modal');
  const container = document.getElementById('success-modal-content');
  if (!modal || !container || !order) return;

  const item = order.items[0];

  container.innerHTML = `
    <div class="text-center p-2">
      <!-- Success Icon -->
      <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>

      <h3 class="text-2xl font-bold text-stone-900 font-brand">تم تأكيد طلبك بنجاح!</h3>
      <p class="text-xs text-stone-500 mt-1">
        رقم الطلب: <strong class="font-num text-stone-900">${order.orderId}</strong>
      </p>
      <p class="text-xs text-stone-500">تم تشفير وإرسال الطلب عبر شبكة Nostr إلى إدارة الحياء.</p>

      <!-- Receipt Card -->
      <div class="mt-6 text-right bg-stone-50 rounded-xl p-5 border border-stone-200 text-xs space-y-3">
        <div class="font-bold text-stone-900 pb-2 border-b border-stone-200 flex justify-between">
          <span>تفاصيل الفاتورة</span>
          <span class="text-emerald-700">الدفع عند الاستلام</span>
        </div>
        <div class="flex justify-between">
          <span class="text-stone-500">المنتج:</span>
          <span class="font-semibold text-stone-800">${item.name} (${item.color} - ${item.size})</span>
        </div>
        <div class="flex justify-between">
          <span class="text-stone-500">الكمية:</span>
          <span class="font-semibold text-stone-800 font-num">${item.quantity}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-stone-500">العميل:</span>
          <span class="font-semibold text-stone-800">${order.customer.fullName} (${order.customer.phone1})</span>
        </div>
        <div class="flex justify-between">
          <span class="text-stone-500">العنوان:</span>
          <span class="font-semibold text-stone-800">${order.customer.wilayaName} - ${order.customer.communeName} (${order.customer.deliveryType})</span>
        </div>
        <div class="pt-2 border-t border-stone-200 flex justify-between items-baseline font-bold text-sm text-stone-900">
          <span>المبلغ الإجمالي المستحق:</span>
          <span class="text-base text-[#9A7B4F] font-num">${order.pricing.total.toLocaleString()} دج</span>
        </div>
      </div>

      <!-- Trust Note -->
      <div class="mt-4 p-3 rounded-lg bg-[#F8F5EE] text-[11px] text-stone-600 leading-relaxed">
        سيتصل بك فريق تأكيد الطلبات هاتفياً خلال الساعات القادمة لتأكيد الشحن إلى عنوانك. نشكرك على ثقتك بمتجر الحياء.
      </div>

      <!-- Action Buttons -->
      <div class="mt-6 flex flex-col sm:flex-row gap-3">
        <button 
          type="button" 
          onclick="window.printOrderReceipt()"
          class="flex-1 py-2.5 px-4 bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-semibold rounded-xl transition-colors"
        >
          طباعة / حفظ الوصل
        </button>
        <button 
          type="button" 
          onclick="document.getElementById('success-modal').classList.add('hidden')"
          class="flex-1 py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          العودة للمتجر
        </button>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
}

window.printOrderReceipt = function() {
  window.print();
};

/**
 * Handle URL route on load (e.g. /?product=jilbab-royal-noir)
 */
function handleInitialRoute() {
  const params = new URLSearchParams(window.location.search);
  const productSlug = params.get('product');
  if (productSlug) {
    const matched = state.products.find(p => p.slug === productSlug);
    if (matched) {
      setTimeout(() => openProductModal(productSlug), 100);
    }
  }
}

// Handle Browser Back / Forward buttons
window.addEventListener('popstate', (e) => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('product');
  if (slug) {
    openProductModal(slug);
  } else {
    closeProductModal();
  }
});

/**
 * Storefront Main Bootstrap
 */
export async function initStore() {
  console.log('Initializing Al Hayaa Luxury Storefront...');

  // 1. Load cached products for instant 0-latency render
  state.products = getCachedProducts();
  renderProductGrid();

  // 2. Initialize Facebook Pixel from settings
  if (state.settings.facebookPixelId) {
    initFacebookPixel(state.settings.facebookPixelId);
  }

  // 3. Load Algeria cities from GitHub repository asynchronously
  loadAlgeriaCities().then(() => {
    console.log('Algeria cities initialized.');
  });

  // 4. Fetch latest live products from Nostr Relays
  fetchNostrProducts(DEFAULT_ADMIN.hexPubkey).then(liveProducts => {
    if (liveProducts && liveProducts.length > 0) {
      state.products = liveProducts;
      renderProductGrid();
      handleInitialRoute();
    }
  }).catch(err => {
    console.warn('Nostr relays sync warning:', err);
  });

  // 5. Handle initial direct URL
  handleInitialRoute();
}

// Auto-run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initStore);
} else {
  initStore();
}
