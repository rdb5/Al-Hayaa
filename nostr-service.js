import {
  generateSecretKey,
  getPublicKey,
  finalizeEvent,
  SimplePool,
  nip19,
  nip04
} from 'nostr-tools';

// Default Nostr Relays for Al Hayaa boutique
export const DEFAULT_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.primal.net',
  'wss://nostr.mom'
];

// Default Boutique Administrator Keys (Pre-configured for instant out-of-the-box readiness)
export const DEFAULT_ADMIN = {
  npub: 'npub1jsxj5lzpr8nuacph4ykmqa320wevxnetxypuz3quv8jsaka7cnaqjpmgx3',
  hexPubkey: '940d2a7c4119e7cee037a92db0762a7bb2c34f2b3103c1441c61e50edbbec4fa',
  demoNsec: 'nsec1eulfwyvu9v7fvvna3aqf7n0nfa5e6cycz88kzqewrf6wrhnqn0aq3fvu2u',
  demoHexSeckey: 'cf3e97119c2b3c96327d8f409f4df34f699d609811cf61032e1a74e1de609bfa'
};

// Initial luxury collection catalog for "Al Hayaa"
export const INITIAL_PRODUCTS = [
  {
    id: 'prod-001',
    slug: 'jilbab-royal-noir',
    name: 'جلباب الحياء الملكي - أسود كلاسيكي',
    title: 'جلباب الحياء الملكي - أسود كلاسيكي',
    category: 'جلباب قطعتين',
    price: 8900,
    currency: 'DZD',
    summary: 'جلباب فاخر من قطعتين بقماش كريب كوري كافيار ناعم مع تفاصيل معصم مطاطية مخفية وستر كامل بانسيابية تامة.',
    description: 'تم تصميم هذا الجلباب الملكي ليوفر أعلى درجات الحشمة والراحة. مصنوع من قماش الكريب الكوري الممتاز المقاوم للتجعد والخفيف على البشرة، بلون أسود داكن فاحم ملكي. يشمل خماراً علوياً واسعاً وتنورة بخصر مطاطي محكم، مع أكمام مبطنة مريحة للغاية.',
    fabric: 'كريب كوري كافيار درجة أولى',
    colors: ['أسود داكن', 'كحلي ليلي'],
    sizes: ['مقاس 1 (155-163 سم)', 'مقاس 2 (164-172 سم)', 'مقاس 3 (173-180 سم)'],
    images: [
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=900&q=80'
    ],
    inStock: true,
    featured: true
  },
  {
    id: 'prod-002',
    slug: 'jilbab-soie-emeraude',
    name: 'جلباب حرير المدينة الإمبراطوري - زمردي فاخر',
    title: 'جلباب حرير المدينة الإمبراطوري - زمردي فاخر',
    category: 'جلباب قطعتين',
    price: 9800,
    currency: 'DZD',
    summary: 'تحفة من حرير المدينة الفاخر بلمعة مطفية راقية بلون أخضر زمردي استثنائي، انسيابية ساحرة غير شفافة.',
    description: 'جلباب حرير المدينة الأصلي المستورد، يتميز بملمس حريري فائق النعومة، وثقل مثالي يمنع تطايره مع الرياح. قصة فرنسية واسعة ومريحة مع تفاصيل خياطة يدوية دقيقة على الحواف وأزرار كبس مخفية عند المعصم.',
    fabric: 'حرير المدينة الأصلي (Soie de Médine)',
    colors: ['أخضر زمردي', 'زيتي ملكي'],
    sizes: ['مقاس 1 (155-163 سم)', 'مقاس 2 (164-172 سم)', 'مقاس 3 (173-180 سم)'],
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80'
    ],
    inStock: true,
    featured: true
  },
  {
    id: 'prod-003',
    slug: 'jilbab-crepe-saharien',
    name: 'جلباب الكريب الصوف الصحراوي - بيج رملي',
    title: 'جلباب الكريب الصوف الصحراوي - بيج رملي',
    category: 'جلباب قطعة واحدة',
    price: 7800,
    currency: 'DZD',
    summary: 'جلباب قطعة واحدة بقصة فراشة انسيابية ولون بيج صحراوي طبيعي هادئ مستوحى من رمال الطاسيلي.',
    description: 'جلباب متصل من قطعة واحدة يوفر سهولة وسرعة في الارتداء دون المساس بالفخامة. القماش خفيف ومسامي مناسب لجميع الفصول، بتشطيبات ناعمة ورباط رأس مدمج يثبت بإحكام طوال اليوم.',
    fabric: 'كريب صوف ناعم مسامي',
    colors: ['بيج رملي', 'عاجي فاتح', 'ترابي دافئ'],
    sizes: ['مقاس 1 (155-163 سم)', 'مقاس 2 (164-172 سم)', 'مقاس 3 (173-180 سم)'],
    images: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=900&q=80'
    ],
    inStock: true,
    featured: false
  },
  {
    id: 'prod-004',
    slug: 'coffret-hijab-medina-prestige',
    name: 'صندوق حجابات حرير المدينة الملكية - 4 ألوان',
    title: 'صندوق حجابات حرير المدينة الملكية - 4 ألوان',
    category: 'طقم حجاب',
    price: 5900,
    currency: 'DZD',
    summary: 'صندوق هدايا ملكي يحتوي على 4 شالات حجاب من حرير المدينة الفاخر مع دبابيس مغناطيسية ذهبية.',
    description: 'مجموعة مختارة بعناية لأصحاب الذوق الرفيع تضم أربعة ألوان كلاسيكية تناسب جميع إطلالاتك اليومية والمناسبات (أسود فاحم، بيج لؤلؤي، بني شوكولا، كراميل دافئ). أبعاد كل حجاب 200 سم × 75 سم لستر كامل وثبات يدوم.',
    fabric: '100% حرير المدينة الممتاز',
    colors: ['مجموعة النيود الكلاسيكية', 'مجموعة الألوان الداكنة'],
    sizes: ['مقاس موحد (200 × 75 سم)'],
    images: [
      'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=900&q=80'
    ],
    inStock: true,
    featured: true
  },
  {
    id: 'prod-005',
    slug: 'jilbab-soie-prune-imperial',
    name: 'جلباب الحرير الفرنسي المنسدل - برغندي باذنجاني',
    title: 'جلباب الحرير الفرنسي المنسدل - برغندي باذنجاني',
    category: 'جلباب قطعتين',
    price: 9400,
    currency: 'DZD',
    summary: 'لون شتوي ملكي دافئ وقماش حرير تركي فائق الجودة ذو لمعة خافتة ونعومة استثنائية.',
    description: 'قطعة فنية تجمع بين الهيبة والوقار. مصممة بتنورة واسعة بطيات متوازنة تتيح سهولة الحركة، مع خمار واسع يغطي الصدر والظهر بالكامل. أكمام مزمومة أنيقة ومريحة للوضوء.',
    fabric: 'حرير تركي كريب فاخر',
    colors: ['برغندي داكن', 'باذنجاني ملكي'],
    sizes: ['مقاس 1 (155-163 سم)', 'مقاس 2 (164-172 سم)', 'مقاس 3 (173-180 سم)'],
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80'
    ],
    inStock: true,
    featured: false
  },
  {
    id: 'prod-006',
    slug: 'jilbab-dentelle-pure-white',
    name: 'جلباب العروس الملكي - أبيض عاجي نقي',
    title: 'جلباب العروس الملكي - أبيض عاجي نقي',
    category: 'جلباب قطعتين',
    price: 11500,
    currency: 'DZD',
    summary: 'إصدار استثنائي مخصص للمناسبات الخاصة والأفراح، مطرز بدقة خيوط حريرية ناصعة مع بطانة مضاعفة تمنع الشفافية.',
    description: 'جلباب النخبة بلون العاج الساحر، يتميز ببطانة مزدوجة صممت خصيصاً لتمنع الشفافية بنسبة 100% مع الحفاظ على الخفة. مزين بتطريز رقيق على الأكمام وخمار يمنح طلة تجمع بين الطهر والنقاء والأناقة العصرية.',
    fabric: 'كريب حريري دبل استرتش + بطانة قطنية',
    colors: ['أبيض عاجي (Blanc Cassé)'],
    sizes: ['مقاس 1 (155-163 سم)', 'مقاس 2 (164-172 سم)', 'مقاس 3 (173-180 سم)'],
    images: [
      'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80'
    ],
    inStock: true,
    featured: true
  }
];

// Default Store Settings
export const DEFAULT_SETTINGS = {
  facebookPixelId: '984512347612984',
  deliveryPricing: {
    defaultHome: 600,
    defaultOffice: 350,
    overrides: {
      '16': { home: 400, office: 200, name: 'الجزائر العاصمة' },
      '09': { home: 450, office: 250, name: 'البليدة' },
      '35': { home: 450, office: 250, name: 'بومرداس' },
      '42': { home: 500, office: 300, name: 'تيبازة' },
      '31': { home: 650, office: 400, name: 'وهران' },
      '25': { home: 650, office: 400, name: 'قسنطينة' },
      '19': { home: 600, office: 350, name: 'سطيف' },
      '30': { home: 900, office: 600, name: 'ورقلة' },
      '47': { home: 950, office: 650, name: 'غرداية' },
      '11': { home: 1100, office: 750, name: 'تمنراست' }
    }
  },
  // Communes that have an active delivery desk / office for pick-up
  officeCommunes: [
    'سيدي امحمد', 'الجزائر الوسطى', 'باب الوادي', 'الدار البيضاء', 'الحراش', 'الرويبة', 'بئر مراد رايس', 'الشراقة', 'بئر خادم',
    'وهران', 'السانية', 'بئر الجير', 'أرزيو',
    'قسنطينة', 'الخروب', 'علي منجلي',
    'سطيف', 'العلمة',
    'البليدة', 'بوفاريك', 'أولاد يعيش',
    'بومرداس', 'برج منايل', 'بودواو',
    'عنابة', 'البوني',
    'باتنة', 'عين توتة',
    'تلمسان', 'الرمشي', 'مغنية',
    'بسكرة', 'طولقة',
    'غرداية', 'القرارة',
    'ورقلة', 'حاسي مسعود',
    'الشلف', 'تنس',
    'بجاية', 'أقبو',
    'تيزي وزو', 'ذراع بن خدة',
    'المدية', 'البرواقية',
    'مستغانم', 'عين تادلس'
  ]
};

// Singleton pool instance
let poolInstance = null;
export function getPool() {
  if (!poolInstance) {
    poolInstance = new SimplePool();
  }
  return poolInstance;
}

// Convert hex private key to Uint8Array
export function hexToBytes(hex) {
  if (hex instanceof Uint8Array) return hex;
  const cleanHex = hex.trim().replace(/^0x/, '');
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Convert Uint8Array to hex string
export function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Decode user-provided Nostr Key (nsec, npub, or raw hex)
export function parseNostrKey(input) {
  if (!input) return null;
  const str = input.trim();
  try {
    if (str.startsWith('nsec1')) {
      const decoded = nip19.decode(str);
      const hex = bytesToHex(decoded.data);
      const pubkey = getPublicKey(decoded.data);
      return { type: 'nsec', seckeyBytes: decoded.data, seckeyHex: hex, pubkeyHex: pubkey };
    }
    if (str.startsWith('npub1')) {
      const decoded = nip19.decode(str);
      return { type: 'npub', pubkeyHex: decoded.data };
    }
    if (/^[0-9a-fA-F]{64}$/.test(str)) {
      const bytes = hexToBytes(str);
      const pubkey = getPublicKey(bytes);
      return { type: 'hex_sec', seckeyBytes: bytes, seckeyHex: str.toLowerCase(), pubkeyHex: pubkey };
    }
  } catch (err) {
    console.warn('Error decoding Nostr key:', err);
  }
  return null;
}

/**
 * Local Storage Helper for Offline / Fast Initial State
 */
const STORAGE_KEYS = {
  SETTINGS: 'al_hayaa_store_settings',
  PRODUCTS: 'al_hayaa_store_products',
  ORDERS_STATE: 'al_hayaa_orders_state',
  ADMIN_SESSION: 'al_hayaa_admin_session'
};

export function getCachedSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed reading cached settings:', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveCachedSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed saving cached settings:', e);
  }
}

export function getCachedProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed reading cached products:', e);
  }
  return INITIAL_PRODUCTS;
}

export function saveCachedProducts(products) {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  } catch (e) {
    console.warn('Failed saving cached products:', e);
  }
}

export function getOrdersLocalState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS_STATE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed reading orders state:', e);
  }
  return { statuses: {}, hidden: [] };
}

export function saveOrdersLocalState(state) {
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS_STATE, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed saving orders state:', e);
  }
}

/**
 * Send an Order via Kind 4 Encrypted Direct Message to Admin's Pubkey
 */
export async function sendNostrOrder(orderData, adminPubkeyHex = DEFAULT_ADMIN.hexPubkey) {
  try {
    // 1. Generate ephemeral keypair for client anonymity and serverless messaging
    const ephemeralSk = generateSecretKey();
    const ephemeralPk = getPublicKey(ephemeralSk);

    // 2. Prepare payload
    const payload = JSON.stringify({
      orderId: orderData.orderId,
      timestamp: new Date().toISOString(),
      customer: orderData.customer,
      items: orderData.items,
      pricing: orderData.pricing,
      metadata: {
        clientUserAgent: navigator.userAgent,
        source: 'Al Hayaa Storefront'
      }
    });

    // 3. Encrypt payload using NIP-04 for the Admin
    const encryptedContent = nip04.encrypt(ephemeralSk, adminPubkeyHex, payload);

    // 4. Construct Kind 4 Event
    const eventTemplate = {
      kind: 4,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['p', adminPubkeyHex],
        ['subject', `طلب جديد Al Hayaa #${orderData.orderId}`],
        ['client', 'Al Hayaa Luxe Boutique']
      ],
      content: encryptedContent
    };

    const finalizedEvent = finalizeEvent(eventTemplate, ephemeralSk);

    // 5. Broadcast to Nostr relays
    const pool = getPool();
    const publishPromises = pool.publish(DEFAULT_RELAYS, finalizedEvent);
    
    // Race or wait for at least one successful relay confirmation
    const relayResults = await Promise.allSettled(publishPromises);
    const successfulCount = relayResults.filter(r => r.status === 'fulfilled').length;

    // Cache order in client local list so customer can review receipt
    const customerOrders = JSON.parse(localStorage.getItem('al_hayaa_customer_orders') || '[]');
    customerOrders.unshift({
      ...orderData,
      eventId: finalizedEvent.id,
      publishedToRelays: successfulCount,
      sentAt: new Date().toISOString()
    });
    localStorage.setItem('al_hayaa_customer_orders', JSON.stringify(customerOrders));

    return {
      success: true,
      eventId: finalizedEvent.id,
      orderId: orderData.orderId,
      relaysAcknowledged: successfulCount,
      ephemeralPubkey: ephemeralPk
    };
  } catch (error) {
    console.error('Error sending Nostr order:', error);
    throw new Error(`فشل إرسال الطلب عبر شبكة Nostr: ${error.message}`);
  }
}

/**
 * Fetch and Decrypt Orders for Admin
 */
export async function fetchAdminOrders(auth) {
  const localState = getOrdersLocalState();
  const hiddenIds = new Set(localState.hidden || []);
  const pool = getPool();
  
  const adminPubkey = auth.pubkeyHex;
  const orders = [];

  try {
    // Query Kind 4 DMs where tag 'p' is admin's pubkey
    const events = await pool.querySync(DEFAULT_RELAYS, {
      kinds: [4],
      '#p': [adminPubkey],
      limit: 150
    });

    for (const ev of events) {
      if (hiddenIds.has(ev.id)) continue;

      let decryptedText = null;
      try {
        if (auth.type === 'extension' && window.nostr) {
          decryptedText = await window.nostr.nip04.decrypt(ev.pubkey, ev.content);
        } else if (auth.seckeyBytes) {
          decryptedText = nip04.decrypt(auth.seckeyBytes, ev.pubkey, ev.content);
        }
      } catch (decErr) {
        // Skip messages that couldn't be decrypted (or not for this key)
        continue;
      }

      if (!decryptedText) continue;

      try {
        const orderData = JSON.parse(decryptedText);
        // Validate if it is an Al Hayaa order
        if (orderData.orderId && orderData.customer && orderData.pricing) {
          const status = localState.statuses[orderData.orderId] || localState.statuses[ev.id] || 'pending';
          orders.push({
            eventId: ev.id,
            rawCreatedAt: ev.created_at,
            senderPubkey: ev.pubkey,
            orderId: orderData.orderId,
            createdAt: orderData.timestamp || new Date(ev.created_at * 1000).toISOString(),
            customer: orderData.customer,
            items: orderData.items || [],
            pricing: orderData.pricing,
            status: status
          });
        }
      } catch (jsonErr) {
        // Not a JSON order message
      }
    }
  } catch (err) {
    console.warn('Error fetching orders from relays:', err);
  }

  // Also include any locally stored offline/demo orders
  const localOrders = JSON.parse(localStorage.getItem('al_hayaa_customer_orders') || '[]');
  for (const lo of localOrders) {
    if (!hiddenIds.has(lo.eventId || lo.orderId) && !orders.some(o => o.orderId === lo.orderId)) {
      const status = localState.statuses[lo.orderId] || 'pending';
      orders.push({
        eventId: lo.eventId || `local-${lo.orderId}`,
        rawCreatedAt: Math.floor(new Date(lo.createdAt || Date.now()).getTime() / 1000),
        senderPubkey: 'local-client',
        orderId: lo.orderId,
        createdAt: lo.createdAt || new Date().toISOString(),
        customer: lo.customer,
        items: lo.items || [],
        pricing: lo.pricing,
        status: status
      });
    }
  }

  // Sort orders descending (newest first)
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return orders;
}

/**
 * Update Order Status (Confirmed, Shipped, Delivered, Cancelled)
 */
export function setOrderStatus(orderId, newStatus) {
  const localState = getOrdersLocalState();
  localState.statuses[orderId] = newStatus;
  saveOrdersLocalState(localState);
  return localState;
}

/**
 * Delete Order (Hide permanently from Admin Dashboard)
 */
export function hideOrderPermanently(orderId, eventId) {
  const localState = getOrdersLocalState();
  if (orderId && !localState.hidden.includes(orderId)) {
    localState.hidden.push(orderId);
  }
  if (eventId && !localState.hidden.includes(eventId)) {
    localState.hidden.push(eventId);
  }
  saveOrdersLocalState(localState);
  return localState;
}

/**
 * Publish / Save Product to Nostr (Kind 30402 - Parameterized Replaceable Event)
 */
export async function publishNostrProduct(product, auth) {
  const dTag = product.slug || `prod-${Date.now()}`;
  const pool = getPool();

  const eventTemplate = {
    kind: 30402,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['d', dTag],
      ['title', product.name],
      ['price', String(product.price), 'DZD'],
      ['image', product.images[0] || ''],
      ['category', product.category || 'جلباب'],
      ['summary', product.summary || ''],
      ['t', 'al-hayaa'],
      ['t', 'hijab'],
      ['t', 'jilbab']
    ],
    content: JSON.stringify(product)
  };

  let finalizedEvent = null;

  if (auth.type === 'extension' && window.nostr) {
    finalizedEvent = await window.nostr.signEvent(eventTemplate);
  } else if (auth.seckeyBytes) {
    finalizedEvent = finalizeEvent(eventTemplate, auth.seckeyBytes);
  } else {
    throw new Error('مفتاح التوقيع غير متوفر');
  }

  const publishPromises = pool.publish(DEFAULT_RELAYS, finalizedEvent);
  await Promise.allSettled(publishPromises);

  // Update local cache
  const cached = getCachedProducts();
  const index = cached.findIndex(p => p.slug === dTag || p.id === product.id);
  if (index >= 0) {
    cached[index] = { ...product, slug: dTag };
  } else {
    cached.unshift({ ...product, slug: dTag });
  }
  saveCachedProducts(cached);

  return { success: true, eventId: finalizedEvent.id, slug: dTag };
}

/**
 * Fetch Products from Nostr Relays with Cache Fallback
 */
export async function fetchNostrProducts(adminPubkey = DEFAULT_ADMIN.hexPubkey) {
  const cached = getCachedProducts();
  const pool = getPool();

  try {
    const events = await pool.querySync(DEFAULT_RELAYS, {
      kinds: [30402],
      authors: [adminPubkey],
      limit: 50
    });

    if (events && events.length > 0) {
      const nostrProducts = [];
      for (const ev of events) {
        try {
          const prod = JSON.parse(ev.content);
          const dTag = ev.tags.find(t => t[0] === 'd')?.[1];
          nostrProducts.push({
            ...prod,
            slug: dTag || prod.slug,
            nostrEventId: ev.id,
            updatedAt: ev.created_at
          });
        } catch (e) {
          // Ignore parse errors
        }
      }

      if (nostrProducts.length > 0) {
        // Merge with initial catalog to guarantee a complete boutique experience
        const merged = [...nostrProducts];
        for (const item of INITIAL_PRODUCTS) {
          if (!merged.some(p => p.slug === item.slug)) {
            merged.push(item);
          }
        }
        saveCachedProducts(merged);
        return merged;
      }
    }
  } catch (err) {
    console.warn('Failed querying products from relays, using cache:', err);
  }

  return cached;
}

/**
 * Save Store Settings to Nostr as Encrypted Kind 30078 (NIP-78 App Data)
 */
export async function saveNostrSettings(settings, auth) {
  const pool = getPool();
  const payload = JSON.stringify(settings);
  let encryptedContent = null;

  if (auth.type === 'extension' && window.nostr) {
    encryptedContent = await window.nostr.nip04.encrypt(auth.pubkeyHex, payload);
  } else if (auth.seckeyBytes) {
    encryptedContent = nip04.encrypt(auth.seckeyBytes, auth.pubkeyHex, payload);
  } else {
    throw new Error('مفتاح التشفير غير متوفر');
  }

  const eventTemplate = {
    kind: 30078,
    created_at: Math.floor(Date.now() / 1000),
    tags: [
      ['d', 'al_hayaa_settings'],
      ['app', 'al-hayaa-luxe-store']
    ],
    content: encryptedContent
  };

  let finalizedEvent = null;
  if (auth.type === 'extension' && window.nostr) {
    finalizedEvent = await window.nostr.signEvent(eventTemplate);
  } else if (auth.seckeyBytes) {
    finalizedEvent = finalizeEvent(eventTemplate, auth.seckeyBytes);
  }

  const publishPromises = pool.publish(DEFAULT_RELAYS, finalizedEvent);
  await Promise.allSettled(publishPromises);

  // Update local storage cache
  saveCachedSettings(settings);

  return { success: true, eventId: finalizedEvent.id };
}

/**
 * Fetch Store Settings from Nostr with Cache Fallback
 */
export async function fetchNostrSettings(auth) {
  const cached = getCachedSettings();
  if (!auth) return cached;

  const pool = getPool();
  try {
    const events = await pool.querySync(DEFAULT_RELAYS, {
      kinds: [30078],
      authors: [auth.pubkeyHex],
      '#d': ['al_hayaa_settings'],
      limit: 10
    });

    if (events && events.length > 0) {
      // Sort newest
      events.sort((a, b) => b.created_at - a.created_at);
      const ev = events[0];

      let decrypted = null;
      if (auth.type === 'extension' && window.nostr) {
        decrypted = await window.nostr.nip04.decrypt(auth.pubkeyHex, ev.content);
      } else if (auth.seckeyBytes) {
        decrypted = nip04.decrypt(auth.seckeyBytes, auth.pubkeyHex, ev.content);
      }

      if (decrypted) {
        const parsed = JSON.parse(decrypted);
        saveCachedSettings(parsed);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed querying settings from relays, using cache:', err);
  }

  return cached;
}
