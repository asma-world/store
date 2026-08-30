/**
 * ==========================================================================
 * عالم اسما (Asma World) - E-Commerce Web Application Logic
 * Pure Vanilla JavaScript (ES6+) Architecture
 * ==========================================================================
 */

// Global Default Configuration for Hero Showcase Banner
const DEFAULT_HERO_SHOWCASE = {
  mode: 'single', // 'single' | 'bundle' | 'video'
  badge: {
    text: 'الأكثر مبيعاً',
    icon: '🔥',
    bgColor: '#FDF062',
    textColor: '#111111'
  },
  single: {
    productId: '',
    customTitle: ''
  },
  bundle: {
    title: 'باقة العروسة الذهبية: ثلاجة + بوتاجاز',
    description: 'احصلي على أفضل أجهزة المطبخ معاً بخصم إضافي خاص، ضمان معتمد 100%، وتأكيد الحجز بدفع 20% عربون فقط!',
    productIds: [],
    price: 32000,
    oldPrice: 38500
  },
  timer: {
    enabled: true,
    title: 'بقي على العرض',
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  },
  video: {
    youtubeId: 'W0jLgUu29uU',
    channelName: 'عالم اسما - Asma World',
    channelDesc: 'القناة الرسمية لريفيوهات وتجارب الأجهزة'
  }
};

// Global Application State
const AppState = {
  products: [],
  categories: [],
  cart: [],
  orders: [],
  heroShowcase: { ...DEFAULT_HERO_SHOWCASE },
  currentCategory: 'all',
  searchQuery: '',
  maxPrice: 70000,
  sortBy: 'featured',
  paymentMode: 'deposit', // 'deposit' | 'full'
  activeVideoId: null,
  currentReceiptOrder: null,
};

// --------------------------------------------------------------------------
// 1. Initial Categories & Appliance Products Catalog
// --------------------------------------------------------------------------
const INITIAL_CATEGORIES = [
  { id: 'refrigerators', name: 'ثلاجات وديب فريزر', icon: '❄️' },
  { id: 'cookers', name: 'بوتجازات وأفران', icon: '🔥' },
  { id: 'washers', name: 'غسالات ملابس وأطباق', icon: '🧺' },
  { id: 'kitchen-appliances', name: 'أجهزة مطبخ صغيرة', icon: '🍳' },
  { id: 'tvs', name: 'شاشات وتلفزيونات', icon: '📺' }
];

const INITIAL_PRODUCTS = [];

// --------------------------------------------------------------------------
// 2. Application Initialization & Storage Sync
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  initStorage();
  initEventListeners();
  renderCategoryNav();
  populateCategorySelects();
  renderProducts();
  renderNewlyAddedProducts();
  renderHeroShowcase();
  updateCartUI();
  updateAdminOrdersTable();
  updateAdminProductsTable();
  updateAdminCategoriesTable();
  updateAdminAnalytics();
});

function initStorage() {
  // Load Categories from localStorage
  const savedCategories = localStorage.getItem('asma_categories');
  if (savedCategories) {
    try {
      const parsed = JSON.parse(savedCategories);
      if (Array.isArray(parsed) && parsed.length > 0) {
        AppState.categories = parsed;
      } else {
        AppState.categories = [...INITIAL_CATEGORIES];
      }
    } catch (e) {
      AppState.categories = [...INITIAL_CATEGORIES];
    }
  } else {
    AppState.categories = [...INITIAL_CATEGORIES];
  }

  // Version check: reset previous dummy products once to give user a clean slate
  const catalogVersion = localStorage.getItem('asma_catalog_version');
  if (catalogVersion !== 'v3_clean') {
    localStorage.removeItem('asma_products_catalog');
    localStorage.removeItem('asma_cart');
    localStorage.setItem('asma_catalog_version', 'v3_clean');
    AppState.products = [];
    AppState.cart = [];
  } else {
    // Load Products Catalog from localStorage
    const savedProducts = localStorage.getItem('asma_products_catalog');
    if (savedProducts) {
      try {
        const parsed = JSON.parse(savedProducts);
        AppState.products = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        AppState.products = [];
      }
    } else {
      AppState.products = [];
    }
  }

  // Ensure all products have images array, primaryImageIndex, isAvailable, depositAmount, and shippingFee defaults
  AppState.products = AppState.products.map(p => {
    const galleryImages = (Array.isArray(p.images) && p.images.length > 0)
      ? p.images.filter(Boolean)
      : (p.image ? [p.image] : []);
    const primaryIdx = (typeof p.primaryImageIndex === 'number' && p.primaryImageIndex >= 0 && p.primaryImageIndex < galleryImages.length)
      ? p.primaryImageIndex
      : 0;
    const primaryImg = galleryImages[primaryIdx] || p.image || '';

    return {
      ...p,
      images: galleryImages.length > 0 ? galleryImages : (primaryImg ? [primaryImg] : []),
      primaryImageIndex: primaryIdx,
      image: primaryImg,
      price: Number(p.price) || 0,
      isAvailable: p.isAvailable !== false,
      shippingFee: (p.shippingFee !== undefined && p.shippingFee !== null && p.shippingFee !== '')
        ? Number(p.shippingFee)
        : 0,
      depositAmount: (p.depositAmount !== undefined && p.depositAmount !== null && p.depositAmount !== '' && !isNaN(p.depositAmount)) 
        ? Number(p.depositAmount) 
        : Math.round((Number(p.price) || 0) * 0.20)
    };
  });

  // Load Cart from localStorage (if not already cleared)
  const savedCart = localStorage.getItem('asma_cart');
  if (savedCart) {
    try {
      const parsed = JSON.parse(savedCart);
      AppState.cart = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      AppState.cart = [];
    }
  } else {
    AppState.cart = [];
  }

  // Ensure cart only contains products that exist in current catalog
  AppState.cart = AppState.cart.filter(item => AppState.products.some(p => p.id === item.productId));

  // Load Orders History from localStorage
  const savedOrders = localStorage.getItem('asma_orders');
  if (savedOrders) {
    try {
      const parsed = JSON.parse(savedOrders);
      AppState.orders = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      AppState.orders = [];
    }
  } else {
    AppState.orders = [];
  }

  // Load Hero Showcase configuration from localStorage
  const savedHero = localStorage.getItem('asma_hero_showcase');
  if (savedHero) {
    try {
      const parsed = JSON.parse(savedHero);
      AppState.heroShowcase = Object.assign({}, DEFAULT_HERO_SHOWCASE, parsed);
      if (parsed.badge) AppState.heroShowcase.badge = Object.assign({}, DEFAULT_HERO_SHOWCASE.badge, parsed.badge);
      if (parsed.single) AppState.heroShowcase.single = Object.assign({}, DEFAULT_HERO_SHOWCASE.single, parsed.single);
      if (parsed.bundle) AppState.heroShowcase.bundle = Object.assign({}, DEFAULT_HERO_SHOWCASE.bundle, parsed.bundle);
      if (parsed.timer) AppState.heroShowcase.timer = Object.assign({}, DEFAULT_HERO_SHOWCASE.timer, parsed.timer);
      if (parsed.video) AppState.heroShowcase.video = Object.assign({}, DEFAULT_HERO_SHOWCASE.video, parsed.video);
    } catch (e) {
      AppState.heroShowcase = { ...DEFAULT_HERO_SHOWCASE };
    }
  } else {
    AppState.heroShowcase = { ...DEFAULT_HERO_SHOWCASE };
  }
}

function saveProductsToStorage() {
  localStorage.setItem('asma_products_catalog', JSON.stringify(AppState.products));
}

function saveCategoriesToStorage() {
  localStorage.setItem('asma_categories', JSON.stringify(AppState.categories));
}

function saveCartToStorage() {
  localStorage.setItem('asma_cart', JSON.stringify(AppState.cart));
}

function saveOrdersToStorage() {
  localStorage.setItem('asma_orders', JSON.stringify(AppState.orders));
}

function saveHeroShowcaseToStorage() {
  localStorage.setItem('asma_hero_showcase', JSON.stringify(AppState.heroShowcase));
}

// --------------------------------------------------------------------------
// 4. Deposit, Shipping & Calculation Helpers
// --------------------------------------------------------------------------
function getProductDeposit(prod) {
  if (!prod) return 0;
  const price = Number(prod.price) || 0;
  if (prod.depositAmount !== undefined && prod.depositAmount !== null && prod.depositAmount !== '' && !isNaN(prod.depositAmount) && Number(prod.depositAmount) > 0) {
    return Math.min(Number(prod.depositAmount), price);
  }
  return Math.round(price * 0.20);
}

function getProductShipping(prod) {
  if (!prod) return 0;
  if (prod.shippingFee !== undefined && prod.shippingFee !== null && prod.shippingFee !== '' && !isNaN(prod.shippingFee)) {
    return Math.max(0, Number(prod.shippingFee));
  }
  return 0;
}

function getCategoryName(catId) {
  const cat = AppState.categories.find(c => c && c.id === catId);
  return cat ? cat.name : 'أجهزة منزلية';
}

function getCategoryIcon(catId) {
  const cat = AppState.categories.find(c => c && c.id === catId);
  return cat ? cat.icon : '📦';
}

// --------------------------------------------------------------------------
// 5. Category & Filters Navigation Engine
// --------------------------------------------------------------------------
function renderCategoryNav() {
  const list = document.getElementById('categoryPillsList');
  if (!list) return;

  // Render "الكل" + each category in AppState.categories
  let html = `
    <li class="category-pill-item">
      <button class="category-pill ${AppState.currentCategory === 'all' ? 'active' : ''}" data-category="all" onclick="filterByCategory('all')">
        <span class="cat-icon">🏠</span>
        <span class="cat-name">الكل</span>
        <span class="cat-count" id="count-all">${AppState.products.length}</span>
      </button>
    </li>
  `;

  AppState.categories.forEach(cat => {
    if (!cat) return;
    const count = AppState.products.filter(p => p && p.category === cat.id).length;
    const isActive = AppState.currentCategory === cat.id;
    html += `
      <li class="category-pill-item">
        <button class="category-pill ${isActive ? 'active' : ''}" data-category="${cat.id}" onclick="filterByCategory('${cat.id}')">
          <span class="cat-icon">${cat.icon || '🏷️'}</span>
          <span class="cat-name">${cat.name}</span>
          <span class="cat-count">${count}</span>
        </button>
      </li>
    `;
  });

  list.innerHTML = html;
}

function populateCategorySelects() {
  const selects = [
    document.getElementById('newProdCategory'),
    document.getElementById('editProdCategory'),
    document.getElementById('adminProductCatFilter')
  ];

  selects.forEach(sel => {
    if (!sel) return;
    const isFilter = sel.id === 'adminProductCatFilter';
    let optionsHtml = isFilter ? '<option value="all">كل الأقسام والفلاتر</option>' : '';

    AppState.categories.forEach(cat => {
      if (!cat) return;
      optionsHtml += `<option value="${cat.id}">${cat.icon || '🏷️'} ${cat.name}</option>`;
    });

    sel.innerHTML = optionsHtml;
  });

  // Also populate footer category links
  const footerLinks = document.getElementById('footerCategoryLinks');
  if (footerLinks) {
    footerLinks.innerHTML = AppState.categories.slice(0, 6).map(cat => `
      <li><a href="#catalogSection" onclick="filterByCategory('${cat.id}')">${cat.icon || ''} ${cat.name}</a></li>
    `).join('');
  }
}

// --------------------------------------------------------------------------
// 5.5 Hero Showcase Banner Engine (Single Product, Bundle Deals, Video & Countdown)
// --------------------------------------------------------------------------
let heroCountdownInterval = null;

function startHeroCountdown(endDateString) {
  if (heroCountdownInterval) clearInterval(heroCountdownInterval);

  const daysEl = document.getElementById('heroCountdownDays');
  const hoursEl = document.getElementById('heroCountdownHours');
  const minsEl = document.getElementById('heroCountdownMinutes');
  const secsEl = document.getElementById('heroCountdownSeconds');

  if (!daysEl && !hoursEl && !minsEl && !secsEl) return;

  function update() {
    const end = new Date(endDateString).getTime();
    const now = Date.now();
    const diff = end - now;

    if (diff <= 0 || isNaN(diff)) {
      if (daysEl) daysEl.textContent = '00';
      if (hoursEl) hoursEl.textContent = '00';
      if (minsEl) minsEl.textContent = '00';
      if (secsEl) secsEl.textContent = '00';
      const container = document.getElementById('heroCountdownContainer');
      if (container) container.classList.add('timer-expired');
      clearInterval(heroCountdownInterval);
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minsEl) minsEl.textContent = String(minutes).padStart(2, '0');
    if (secsEl) secsEl.textContent = String(seconds).padStart(2, '0');
  }

  update();
  heroCountdownInterval = setInterval(update, 1000);
}
window.startHeroCountdown = startHeroCountdown;

function addBundleToCart(productIds) {
  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    productIds = AppState.products.slice(0, 2).map(p => p.id);
  }
  if (productIds.length === 0) {
    showToast('لا توجد أجهزة متوفرة في الباقة حالياً!', 'warning');
    return;
  }
  let addedCount = 0;
  productIds.forEach(pId => {
    const prod = AppState.products.find(p => p && p.id === pId);
    if (prod && prod.isAvailable !== false) {
      const existing = AppState.cart.find(c => c && c.id === prod.id);
      if (existing) {
        existing.qty = (Number(existing.qty) || 1) + 1;
      } else {
        AppState.cart.push({
          id: prod.id,
          title: prod.title,
          price: Number(prod.price) || 0,
          depositAmount: getProductDeposit(prod),
          shippingFee: getProductShipping(prod),
          image: prod.image || '',
          category: prod.category || '',
          qty: 1
        });
      }
      addedCount++;
    }
  });

  if (addedCount > 0) {
    saveCartToStorage();
    updateCartUI();
    toggleCartDrawer(true);
    showToast(`تمت إضافة أجهزة الباقة (${addedCount} أجهزة) إلى السلة بنجاح! 🎁`, 'success');
  } else {
    showToast('عذراً، أجهزة الباقة غير متوفرة في المخزن حالياً!', 'warning');
  }
}
window.addBundleToCart = addBundleToCart;

// Fallback demo products for multi-product hero navigation when catalog is empty
const DEMO_HERO_PRODUCTS = [
  {
    id: 'demo_featured_hero_1',
    title: 'ميكروفون لاسلكي ذكي مع خاصية عزل الضوضاء وبطارية تدوم طويلاً',
    price: 5000,
    oldPrice: 5200,
    image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80',
    specs: ['مدمج', 'تحكم دقيق', 'سهل الاستخدام', '3 مستويات', 'ضمان سنتين'],
    category: 'kitchen-appliances',
    youtubeId: 'W0jLgUu29uU',
    isAvailable: true
  },
  {
    id: 'demo_featured_hero_2',
    title: 'ثلاجة شارب إنفرتر ديجيتال 450 لتر نوفروست تيتانيوم بريميوم',
    price: 24500,
    oldPrice: 28900,
    image: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80',
    specs: ['توفير إنفرتر A+++', 'نوفروست متطور', 'شاشة ديجيتال', 'تبريد سريع', 'ضمان 10 سنوات'],
    category: 'refrigerators',
    youtubeId: 'W0jLgUu29uU',
    isAvailable: true
  },
  {
    id: 'demo_featured_hero_3',
    title: 'بوتاجاز فريش بروفيشنال كنترول 5 شعلة أمان كامل مع مروحة تبريد',
    price: 16800,
    oldPrice: 19500,
    image: 'https://images.unsplash.com/photo-1584269600519-112d071b35e6?auto=format&fit=crop&w=800&q=80',
    specs: ['أمان كامل 100%', 'مروحة توزيع حرارة', 'إشعال ذاتي كامل', 'حوامل زهر ثقيلة', 'ضمان معتمد 5 سنوات'],
    category: 'cookers',
    youtubeId: 'W0jLgUu29uU',
    isAvailable: true
  }
];

function navigateHeroProduct(direction, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  const showcase = AppState.heroShowcase || DEFAULT_HERO_SHOWCASE;

  let heroList = [];
  if (showcase.mode === 'bundle') {
    const bundle = showcase.bundle || DEFAULT_HERO_SHOWCASE.bundle;
    heroList = AppState.products.filter(p => bundle.productIds && bundle.productIds.includes(p.id));
    if (heroList.length === 0) {
      heroList = AppState.products.slice(0, 2);
    }
    if (heroList.length === 0) {
      heroList = DEMO_HERO_PRODUCTS;
    }
  } else {
    heroList = (AppState.products && AppState.products.length > 0)
      ? AppState.products
      : DEMO_HERO_PRODUCTS;
  }

  if (heroList.length <= 1) return;

  let currentIdx = (typeof AppState.heroActiveProductIndex === 'number')
    ? AppState.heroActiveProductIndex
    : 0;

  currentIdx = (currentIdx + direction + heroList.length) % heroList.length;
  AppState.heroActiveProductIndex = currentIdx;

  renderHeroShowcase();
}
window.navigateHeroProduct = navigateHeroProduct;

function renderHeroShowcase() {
  const container = document.getElementById('heroVisualContainer');
  if (!container) return;

  const showcase = AppState.heroShowcase || DEFAULT_HERO_SHOWCASE;
  const badge = showcase.badge || DEFAULT_HERO_SHOWCASE.badge;
  const timer = showcase.timer || DEFAULT_HERO_SHOWCASE.timer;

  // Single-line horizontal countdown timer HTML if enabled
  const timerTitleText = timer && timer.title ? timer.title.trim() : 'ينتهي العرض خلال';
  const timerHtml = timer && timer.enabled ? `
    <div class="exclusive-countdown-widget" id="heroCountdownContainer">
      <span class="countdown-label">⏳ ${escapeHtml(timerTitleText)}:</span>
      <div class="countdown-units-row">
        <div class="countdown-unit-box">
          <strong id="heroCountdownDays">02</strong>
          <small>يوم</small>
        </div>
        <span class="unit-colon">:</span>
        <div class="countdown-unit-box">
          <strong id="heroCountdownHours">14</strong>
          <small>ساعة</small>
        </div>
        <span class="unit-colon">:</span>
        <div class="countdown-unit-box">
          <strong id="heroCountdownMinutes">47</strong>
          <small>دقيقة</small>
        </div>
        <span class="unit-colon">:</span>
        <div class="countdown-unit-box">
          <strong id="heroCountdownSeconds">38</strong>
          <small>ثانية</small>
        </div>
      </div>
    </div>
  ` : '';

  // Mode 3: Video Banner
  if (showcase.mode === 'video') {
    const video = showcase.video || DEFAULT_HERO_SHOWCASE.video;
    const ytId = extractYouTubeId(video.youtubeId) || 'W0jLgUu29uU';
    container.innerHTML = `
      <div class="exclusive-deal-card video-deal-card">
        <div class="exclusive-card-top-bar">
          <div class="exclusive-tag-pills">
            <span class="exclusive-main-pill">
              <span class="pill-sparkle">🎬</span>
              <span>${escapeHtml(badge.text || 'ريفيو واستعراض حصري بالفيديو')}</span>
            </span>
            <span class="exclusive-cat-pill">يوتيوب مباشر 🔴</span>
          </div>
          ${timerHtml}
        </div>

        <div class="exclusive-video-layout">
          <div class="exclusive-yt-player-box" id="heroVideoTrigger" role="button" tabindex="0"
            title="انقر لتشغيل الفيديو" onclick="openYouTubeModal('${ytId}', '${escapeHtml(video.channelName || 'ريفيو واستعراض أجهزة عالم اسما')}')">
            <img src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80"
              alt="مطبخ وأجهزة عالم اسما" class="exclusive-video-bg-img" loading="eager">
            <div class="exclusive-video-overlay-tint"></div>
            <div class="exclusive-play-btn-wrap">
              <div class="play-pulse-ring"></div>
              <div class="play-button-triangle">▶</div>
            </div>
            <div class="exclusive-video-channel-info">
              <div class="yt-avatar-box">
                <span class="yt-avatar-icon">👩‍🍳</span>
              </div>
              <div class="yt-info-text">
                <h4>${escapeHtml(video.channelName || 'عالم اسما - Asma World')}</h4>
                <p>${escapeHtml(video.channelDesc || 'شاهد شرح ومراجعة وتجربة حقيقية للأجهزة على أرض الواقع')}</p>
              </div>
            </div>
            <span class="video-duration-tag">شاهد الفيديو بالكامل 🎬</span>
          </div>

          <div class="exclusive-video-footer-bar">
            <div class="deposit-guarantee-pill">
              <span>💡 نظام عالم اسما: ادفع 20% فقط عربون بالفيزا لتأكيد الحجز، وسدد الـ 80% كاش عند الاستلام بعد الفحص والمعاينة!</span>
            </div>
            <a href="https://www.youtube.com/@asma_world" target="_blank" rel="noopener noreferrer" class="btn-exclusive-yt-channel">
              <span>اشتراك في القناة 🔔</span>
            </a>
          </div>
        </div>
      </div>
    `;
    if (timer && timer.enabled && timer.endDate) {
      startHeroCountdown(timer.endDate);
    }
    return;
  }

  // Mode 2: Bundle Offer
  if (showcase.mode === 'bundle') {
    const bundle = showcase.bundle || DEFAULT_HERO_SHOWCASE.bundle;
    let bundleProds = AppState.products.filter(p => bundle.productIds && bundle.productIds.includes(p.id));
    if (bundleProds.length === 0) {
      bundleProds = AppState.products.slice(0, 3);
    }
    if (bundleProds.length === 0) {
      bundleProds = DEMO_HERO_PRODUCTS;
    }

    if (typeof AppState.heroActiveProductIndex !== 'number' || AppState.heroActiveProductIndex < 0 || AppState.heroActiveProductIndex >= bundleProds.length) {
      AppState.heroActiveProductIndex = 0;
    }

    const currentBundleItem = bundleProds[AppState.heroActiveProductIndex] || bundleProds[0];
    const hasMultipleBundleProds = bundleProds.length > 1;

    const calculatedPrice = (bundle.price && bundle.price > 0) ? bundle.price : (bundleProds.reduce((sum, p) => sum + (Number(p.price) || 0), 0) || 32000);
    const calculatedOldPrice = (bundle.oldPrice && bundle.oldPrice > 0) ? bundle.oldPrice : (bundleProds.reduce((sum, p) => sum + (Number(p.oldPrice) || Number(p.price) || 0), 0) || Math.round(calculatedPrice * 1.25));
    const bundleDeposit = Math.round(calculatedPrice * 0.20);
    const bundleRemaining = Math.max(0, calculatedPrice - bundleDeposit);
    const savings = calculatedOldPrice > calculatedPrice ? calculatedOldPrice - calculatedPrice : 0;
    const bundleIdsJson = JSON.stringify(bundleProds.map(p => p.id)).replace(/"/g, '&quot;');

    container.innerHTML = `
      <div class="exclusive-deal-card bundle-deal-card">
        <!-- Top Luxury Banner -->
        <div class="exclusive-card-top-bar">
          <div class="exclusive-tag-pills">
            <span class="exclusive-main-pill bundle-pill">
              <span class="pill-sparkle">🎁</span>
              <span>${escapeHtml(badge.text || 'باقة عروض التوفير الكبرى')}</span>
            </span>
            <span class="exclusive-cat-pill">باقة أجهزة شاملة (${bundleProds.length} أجهزة)</span>
          </div>
          ${timerHtml}
        </div>

        <div class="exclusive-deal-grid">
          <!-- Visual Column: Bundle Showcase -->
          <div class="exclusive-visual-column">
            <div class="exclusive-spotlight-stage bundle-stage" onclick="openQuickView('${currentBundleItem.id}')" title="انقر لمعاينة الجهاز المحدد" role="button" tabindex="0">
              
              <div class="exclusive-limited-stamp">
                <span class="stamp-glow"></span>
                <span class="stamp-text">Bundle<br>Offer</span>
              </div>

              ${savings > 0 ? `
                <div class="exclusive-discount-ribbon">
                  <span>وفر ${formatMoney(savings)} ج.م</span>
                </div>
              ` : ''}

              ${hasMultipleBundleProds ? `
                <button type="button" class="exclusive-nav-arrow arrow-right" onclick="navigateHeroProduct(1, event)" title="الجهاز التالي في الباقة" aria-label="الجهاز التالي">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
                <button type="button" class="exclusive-nav-arrow arrow-left" onclick="navigateHeroProduct(-1, event)" title="الجهاز السابق في الباقة" aria-label="الجهاز السابق">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
              ` : ''}

              <!-- Main Active Bundle Product View -->
              <div class="exclusive-img-wrapper">
                <div class="exclusive-pedestal-glow"></div>
                <img 
                  src="${currentBundleItem.image}" 
                  alt="${escapeHtml(currentBundleItem.title)}" 
                  class="exclusive-showcase-img"
                  onerror="this.src='https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80'"
                >
              </div>

              ${currentBundleItem.youtubeId ? `
                <button 
                  type="button" 
                  class="exclusive-yt-badge-btn" 
                  onclick="event.stopPropagation(); openYouTubeModal('${currentBundleItem.youtubeId}', '${escapeHtml(currentBundleItem.title)}', '${currentBundleItem.id}')"
                  title="شاهد ريفيو هذا الجهاز بالفيديو"
                >
                  <div class="yt-play-icon">▶</div>
                  <span>شاهد ريفيو الجهاز</span>
                </button>
              ` : ''}

              <!-- Bundle Thumbs Row -->
              <div class="exclusive-bundle-thumbs-tray">
                ${bundleProds.map((bp, idx) => `
                  <div class="bundle-mini-thumb ${idx === AppState.heroActiveProductIndex ? 'active' : ''}" 
                       onclick="event.stopPropagation(); AppState.heroActiveProductIndex = ${idx}; renderHeroShowcase();"
                       title="${escapeHtml(bp.title)}">
                    <img src="${bp.image}" alt="${escapeHtml(bp.title)}">
                    <span>${escapeHtml(bp.title)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Information & Pricing Column -->
          <div class="exclusive-info-column">
            <div class="exclusive-header-content">
              <h3 class="exclusive-product-title">${escapeHtml(bundle.title || 'باقة العروسة والتوفير الكبرى للأجهزة المنزلية')}</h3>
              <p class="exclusive-product-desc">${escapeHtml(bundle.description || 'احصل على مجموعة متكاملة من أحدث الأجهزة المنزلية الأصلية بالضمان المعتمد في صفقة واحدة موفرة جداً.')}</p>
            </div>

            <!-- Price Container -->
            <div class="exclusive-price-container">
              <div class="exclusive-price-main">
                <span class="price-header-label">إجمالي سعر الباقة الحصري:</span>
                <div class="price-figures-row">
                  <span class="price-current-value">${formatMoney(calculatedPrice)} <small>ج.م</small></span>
                  ${calculatedOldPrice > calculatedPrice ? `
                    <span class="price-old-value">${formatMoney(calculatedOldPrice)} ج.م</span>
                  ` : ''}
                </div>
              </div>

              ${savings > 0 ? `
                <div class="exclusive-savings-chip">
                  <span class="chip-fire">🔥</span>
                  <div class="savings-text">
                    <span class="savings-label">وفرت في الباقة</span>
                    <strong class="savings-val">${formatMoney(savings)} ج.م</strong>
                  </div>
                </div>
              ` : ''}
            </div>

            <!-- Financial Deposit Payment Cards -->
            <div class="exclusive-deposit-cards-grid">
              <div class="deposit-card-item visa-deposit">
                <div class="card-item-top">
                  <span class="card-icon">💳</span>
                  <span class="visa-mini-badge">VISA</span>
                </div>
                <div class="card-item-body">
                  <span class="deposit-lbl">العربون المطلوب بالفيزا (20%):</span>
                  <strong class="deposit-amount">${formatMoney(bundleDeposit)} ج.م</strong>
                  <small class="deposit-hint">تأكيد حجز كافة أجهزة الباقة فورياً</small>
                </div>
              </div>

              <div class="deposit-card-item cash-delivery">
                <div class="card-item-top">
                  <span class="card-icon">💵</span>
                  <span class="cash-mini-badge">كاش</span>
                </div>
                <div class="card-item-body">
                  <span class="deposit-lbl">المتبقي عند الاستلام (80%):</span>
                  <strong class="deposit-amount">${formatMoney(bundleRemaining)} ج.م</strong>
                  <small class="deposit-hint">يُسدد بعد معاينة وفحص جميع الأجهزة</small>
                </div>
              </div>
            </div>

            <!-- Included Products Summary List -->
            <div class="exclusive-specs-wrap">
              <span class="specs-title-label">الأجهزة المشمولة في هذه الباقة:</span>
              <div class="exclusive-specs-grid">
                ${bundleProds.map(bp => `
                  <div class="spec-pill-item">
                    <span class="check-icon">✓</span>
                    <span>${escapeHtml(bp.title)}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- CTA Actions Group -->
            <div class="exclusive-actions-group">
              <button type="button" class="btn-exclusive-order" onclick="addBundleToCart(${bundleIdsJson})">
                <span class="btn-cart-icon">🎁</span>
                <div class="btn-order-text">
                  <strong>احجز الباقة المجمعة الآن بالسلة</strong>
                  <small>ادفع 20% عربون لتأكيد حجز الباقة كاملة</small>
                </div>
                <span class="btn-arrow">←</span>
              </button>

              <div class="exclusive-secondary-btns">
                <button type="button" class="btn-exclusive-quickview" onclick="openQuickView('${currentBundleItem.id}')" title="معاينة الجهاز النشط">
                  <span>👁️ معاينة الجهاز المعروض</span>
                </button>
              </div>
            </div>

            <!-- Trust Bar -->
            <div class="exclusive-trust-bar">
              <div class="trust-pill"><span class="trust-icon">🚚</span> شحن آمن لكافة المحافظات</div>
              <div class="trust-pill"><span class="trust-icon">🛡️</span> شهادة ضمان معتمدة لكل جهاز</div>
              <div class="trust-pill"><span class="trust-icon">🔍</span> معاينة وفحص كامل قبل السداد</div>
            </div>
          </div>
        </div>
      </div>
    `;

    if (timer && timer.enabled && timer.endDate) {
      startHeroCountdown(timer.endDate);
    }
    return;
  }

  // Mode 1: Single Product (Default)
  const heroList = (AppState.products && AppState.products.length > 0)
    ? AppState.products
    : DEMO_HERO_PRODUCTS;

  if (typeof AppState.heroActiveProductIndex !== 'number' || AppState.heroActiveProductIndex < 0 || AppState.heroActiveProductIndex >= heroList.length) {
    if (showcase.single && showcase.single.productId) {
      const foundIdx = heroList.findIndex(p => p && p.id === showcase.single.productId);
      AppState.heroActiveProductIndex = foundIdx !== -1 ? foundIdx : 0;
    } else {
      AppState.heroActiveProductIndex = 0;
    }
  }

  let prod = heroList[AppState.heroActiveProductIndex] || heroList[0];

  const isOut = prod.isAvailable === false;
  const deposit = getProductDeposit(prod);
  const remaining = Math.max(0, prod.price - deposit);
  const discountAmount = prod.oldPrice && prod.oldPrice > prod.price ? prod.oldPrice - prod.price : 0;
  const displayTitle = (showcase.single && showcase.single.customTitle && prod.id === showcase.single.productId) ? showcase.single.customTitle : prod.title;
  const hasMultipleProds = heroList.length > 1;

  const rawSpecs = (prod.specs && prod.specs.length > 0) ? prod.specs : ['جودة عالية وضمان الوكيل', 'تحكم ذكي وسهل الاستخدام', 'توفير عالي في استهلاك الطاقة', 'مواصفات قياسية أصلية 100%'];

  container.innerHTML = `
    <div class="exclusive-deal-card single-deal-card ${isOut ? 'out-of-stock' : ''}">
      
      <!-- Top Luxury Card Header Bar -->
      <div class="exclusive-card-top-bar">
        <div class="exclusive-tag-pills">
          <span class="exclusive-main-pill">
            <span class="pill-sparkle">✨</span>
            <span>${escapeHtml(badge.text || 'العرض الحصري المختار اليوم')}</span>
          </span>
          ${prod.category ? `<span class="exclusive-cat-pill">${escapeHtml(prod.category)}</span>` : ''}
          <span class="exclusive-official-pill">🛡️ ضمان الوكيل المعتمد</span>
        </div>
        ${timerHtml}
      </div>

      <!-- 2-Column Luxury Showcase Grid -->
      <div class="exclusive-deal-grid">
        
        <!-- Right Column: Luxury Spotlight Studio Stage -->
        <div class="exclusive-visual-column">
          <div class="exclusive-spotlight-stage" onclick="openQuickView('${prod.id}')" title="انقر للمعاينة السريعة للجهاز" role="button" tabindex="0">
            
            <!-- Floating Stamps & Ribbons -->
            <div class="exclusive-limited-stamp">
              <span class="stamp-glow"></span>
              <span class="stamp-text">Limited<br>Offer</span>
            </div>

            ${discountAmount > 0 ? `
              <div class="exclusive-discount-ribbon">
                <span>خصم ${Math.round((discountAmount / prod.oldPrice) * 100)}%</span>
              </div>
            ` : ''}

            <!-- Multi-Product Navigation Overlay Arrows -->
            ${hasMultipleProds ? `
              <button type="button" class="exclusive-nav-arrow arrow-right" onclick="navigateHeroProduct(1, event)" title="المنتج التالي في العرض" aria-label="المنتج التالي">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
              <button type="button" class="exclusive-nav-arrow arrow-left" onclick="navigateHeroProduct(-1, event)" title="المنتج السابق في العرض" aria-label="المنتج السابق">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
            ` : ''}

            <!-- Spotlight Pedestal Stage & Appliance Image -->
            <div class="exclusive-img-wrapper">
              <div class="exclusive-pedestal-glow"></div>
              <img 
                src="${prod.image}" 
                alt="${escapeHtml(displayTitle)}" 
                class="exclusive-showcase-img"
                onerror="this.src='https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80'"
              >
            </div>

            <!-- YouTube Video Review Quick Trigger Button -->
            ${prod.youtubeId ? `
              <button 
                type="button" 
                class="exclusive-yt-badge-btn" 
                onclick="event.stopPropagation(); openYouTubeModal('${prod.youtubeId}', '${escapeHtml(prod.title)}', '${prod.id}')"
                title="شاهد ريفيو وتجربة هذا الجهاز بالفيديو على يوتيوب"
              >
                <div class="yt-play-icon">▶</div>
                <span>شاهد ريفيو الجهاز بالفيديو</span>
              </button>
            ` : ''}

            <!-- Interactive Product Indicator / Counter -->
            ${hasMultipleProds ? `
              <div class="exclusive-product-counter">
                <span>الجهاز ${AppState.heroActiveProductIndex + 1} من ${heroList.length}</span>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Left Column: Deal Information, Pricing, Financial Value & CTAs -->
        <div class="exclusive-info-column">
          
          <div class="exclusive-header-content">
            <h3 class="exclusive-product-title">${escapeHtml(displayTitle)}</h3>
            <p class="exclusive-product-desc">${escapeHtml(prod.desc || 'أحدث إصدار من الوكيل الرسمي مع ضمان حقيقي وفحص ومعاينة كاملة قبل استكمال باقي السعر.')}</p>
          </div>

          <!-- Pricing Mega Block -->
          <div class="exclusive-price-container">
            <div class="exclusive-price-main">
              <span class="price-header-label">السعر الحصري بالعرض:</span>
              <div class="price-figures-row">
                <span class="price-current-value">${formatMoney(prod.price)} <small>ج.م</small></span>
                ${prod.oldPrice && prod.oldPrice > prod.price ? `
                  <span class="price-old-value">${formatMoney(prod.oldPrice)} ج.م</span>
                ` : ''}
              </div>
            </div>

            ${discountAmount > 0 ? `
              <div class="exclusive-savings-chip">
                <span class="chip-fire">🔥</span>
                <div class="savings-text">
                  <span class="savings-label">وفرت اليوم</span>
                  <strong class="savings-val">${formatMoney(discountAmount)} ج.م</strong>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Financial Deposit Payment Cards (20% Visa / 80% Cash on Delivery) -->
          <div class="exclusive-deposit-cards-grid">
            <div class="deposit-card-item visa-deposit" title="قيمة العربون المطلوب بالفيزا لتأكيد الحجز">
              <div class="card-item-top">
                <span class="card-icon">💳</span>
                <span class="visa-mini-badge">VISA</span>
              </div>
              <div class="card-item-body">
                <span class="deposit-lbl">العربون المطلوب بالفيزا (20%):</span>
                <strong class="deposit-amount">${formatMoney(deposit)} ج.م</strong>
                <small class="deposit-hint">تأكيد فوري لحجز الجهاز وسحبه من المخزن</small>
              </div>
            </div>

            <div class="deposit-card-item cash-delivery" title="المبلغ المتبقي كاش عند الاستلام بعد المعاينة">
              <div class="card-item-top">
                <span class="card-icon">💵</span>
                <span class="cash-mini-badge">كاش</span>
              </div>
              <div class="card-item-body">
                <span class="deposit-lbl">المتبقي عند الاستلام (80%):</span>
                <strong class="deposit-amount">${formatMoney(remaining)} ج.م</strong>
                <small class="deposit-hint">يُدفع بعد فحص الجهاز والمعاينة بالمنزل</small>
              </div>
            </div>
          </div>

          <!-- Key Specs Checklist -->
          <div class="exclusive-specs-wrap">
            <span class="specs-title-label">أهم المميزات والمواصفات:</span>
            <div class="exclusive-specs-grid">
              ${rawSpecs.map(s => `
                <div class="spec-pill-item">
                  <span class="check-icon">✓</span>
                  <span>${escapeHtml(s)}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- CTA Action Buttons -->
          <div class="exclusive-actions-group">
            ${isOut ? `
              <button type="button" class="btn-exclusive-order btn-out-of-stock" disabled>
                <span>🚫 نَفَدت الكمية المخصصة لهذا العرض</span>
              </button>
            ` : `
              <button type="button" class="btn-exclusive-order" onclick="addToCart('${prod.id}')">
                <span class="btn-cart-icon">🛒</span>
                <div class="btn-order-text">
                  <strong>احجز الجهاز الآن بالعرض الحصري</strong>
                  <small>ادفع 20% عربون فقط لتأكيد الحجز</small>
                </div>
                <span class="btn-arrow">←</span>
              </button>
            `}

            <div class="exclusive-secondary-btns">
              <button type="button" class="btn-exclusive-quickview" onclick="openQuickView('${prod.id}')" title="معاينة تفاصيل ومواصفات الجهاز">
                <span>👁️ معاينة سريعة</span>
              </button>

              ${prod.youtubeId ? `
                <button type="button" class="btn-exclusive-video" onclick="openYouTubeModal('${prod.youtubeId}', '${escapeHtml(prod.title)}', '${prod.id}')" title="شاهد ريفيو يوتيوب">
                  <span>📹 ريفيو يوتيوب</span>
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Trust Ribbon Micro -->
          <div class="exclusive-trust-bar">
            <div class="trust-pill"><span class="trust-icon">🚚</span> شحن سريع لجميع المحافظات</div>
            <div class="trust-pill"><span class="trust-icon">🛡️</span> ضمان أصلي معتمد 100%</div>
            <div class="trust-pill"><span class="trust-icon">🔍</span> معاينة وفحص كامل قبل السداد</div>
          </div>

        </div>
      </div>
    </div>
  `;

  if (timer && timer.enabled && timer.endDate) {
    startHeroCountdown(timer.endDate);
  }
}
window.renderHeroShowcase = renderHeroShowcase;

// --------------------------------------------------------------------------
// 6. Products Rendering & Filtering Engine
// --------------------------------------------------------------------------
function getFilteredProducts() {
  let list = [...AppState.products];

  // Category Filter
  if (AppState.currentCategory !== 'all') {
    list = list.filter(p => p && p.category === AppState.currentCategory);
  }

  // Live Search Query Filter
  if (AppState.searchQuery.trim()) {
    const q = AppState.searchQuery.trim().toLowerCase();
    list = list.filter(p => 
      p && (
        p.title.toLowerCase().includes(q) || 
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.specs && p.specs.some(s => s.toLowerCase().includes(q)))
      )
    );
  }

  // Price Slider Filter
  list = list.filter(p => p && p.price <= AppState.maxPrice);

  // Sorting
  switch (AppState.sortBy) {
    case 'price-asc':
      list.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      list.sort((a, b) => b.price - a.price);
      break;
    case 'discount':
      list.sort((a, b) => {
        const discA = a.oldPrice ? (a.oldPrice - a.price) : 0;
        const discB = b.oldPrice ? (b.oldPrice - b.price) : 0;
        return discB - discA;
      });
      break;
    case 'name':
      list.sort((a, b) => a.title.localeCompare(b.title, 'ar'));
      break;
    case 'featured':
    default:
      // In-stock items first, then original order
      list.sort((a, b) => (b.isAvailable !== false ? 1 : 0) - (a.isAvailable !== false ? 1 : 0));
      break;
  }

  return list;
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  const emptyState = document.getElementById('emptyCatalogState');
  const countText = document.getElementById('catalogShowingCountText');
  const activeFiltersRow = document.getElementById('activeFiltersRow');
  const activeTagsList = document.getElementById('activeTagsList');

  const filtered = getFilteredProducts();

  // Update counts
  if (countText) {
    if (AppState.products.length === 0) {
      countText.textContent = 'لا توجد أجهزة في الكتالوج حالياً';
    } else {
      countText.textContent = `عرض ${filtered.length} من أصل ${AppState.products.length} جهاز متاح`;
    }
  }

  // Update Active Filters Chips
  renderActiveFilterChips(activeFiltersRow, activeTagsList);

  if (filtered.length === 0) {
    if (grid) grid.innerHTML = '';
    if (emptyState) {
      emptyState.hidden = false;
      if (AppState.products.length === 0) {
        emptyState.innerHTML = `
          <div class="empty-icon">🛍️</div>
          <h3>المتجر جاهز لإضافة منتجاتك وأجهزتك! ✨</h3>
          <p>لم تقم بإضافة أي أجهزة حتى الآن. يمكنك البدء فوراً في إضافة الأجهزة وتحديد الأسعار والمواصفات والعربون من لوحة الإدارة.</p>
          <button type="button" class="btn-primary-action btn-add-product-cta" id="emptyStateActionBtn" onclick="openAdminPanel('addProductTab')">
            <span>➕ إضافة جهاز جديد الآن</span>
          </button>
        `;
      } else {
        emptyState.innerHTML = `
          <div class="empty-icon">🔍</div>
          <h3>لم نتمكن من العثور على أجهزة مطابقة!</h3>
          <p>جربي البحث بكلمات أخرى أو إزالة الفلاتر المطبقة لعرض كافة المنتجات.</p>
          <button type="button" class="btn-primary-action" id="emptyStateResetBtn" onclick="window.resetAllFilters && window.resetAllFilters()">
            <span>عرض جميع الأجهزة</span>
          </button>
        `;
      }
    }
    return;
  }

  if (emptyState) emptyState.hidden = true;
  if (!grid) return;

  grid.innerHTML = filtered.map(prod => {
    if (!prod) return '';
    const isOut = prod.isAvailable === false;
    const depositAmount = getProductDeposit(prod);
    const shippingAmount = getProductShipping(prod);
    const remainingAmount = Math.max(0, prod.price - depositAmount);

    // Badge styling
    let badgeHtml = '';
    if (isOut) {
      badgeHtml = `<span class="card-badge-tag badge-out-of-stock">🚫 غير متوفر حالياً بالمخزن</span>`;
    } else if (prod.badge) {
      let badgeClass = 'badge-bestseller';
      if (prod.badge === 'خصم حصري' || (prod.oldPrice && prod.oldPrice > prod.price)) badgeClass = 'badge-discount';
      if (prod.badge === 'جديد') badgeClass = 'badge-new';
      if (prod.badge === 'ضمان 10 سنوات') badgeClass = 'badge-warranty';
      badgeHtml = `<span class="card-badge-tag ${badgeClass}">${prod.badge}</span>`;
    }

    const catName = getCategoryName(prod.category);

    return `
      <article class="product-card ${isOut ? 'out-of-stock' : ''}" data-id="${prod.id}">
        
        <div class="product-card-top">
          ${badgeHtml}
          
          <img 
            src="${prod.image}" 
            alt="${prod.title}" 
            class="product-img" 
            loading="lazy"
            onerror="this.src='https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80'"
          >

          ${prod.youtubeId ? `
            <div class="card-quick-actions">
              <button 
                type="button" 
                class="btn-card-icon" 
                onclick="openYouTubeModal('${prod.youtubeId}', '${escapeHtml(prod.title)}', '${prod.id}')" 
                title="شاهد ريفيو الجهاز على يوتيوب"
                aria-label="فيديو ريفيو"
              >
                ▶
              </button>
            </div>
          ` : ''}
        </div>

        <div class="product-card-body">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span class="product-category-lbl">${catName}</span>
            <small style="font-size:11px; color:var(--text-muted);">
              🚚 ${shippingAmount > 0 ? `شحن: ${formatMoney(shippingAmount)} ج.م` : 'شحن مجاني'}
            </small>
          </div>

          <h3 class="product-title" title="${prod.title}">${prod.title}</h3>

          <div class="product-specs-list">
            ${prod.specs ? prod.specs.slice(0, 2).map(s => `<span class="spec-tag">${s}</span>`).join('') : ''}
          </div>

          <div class="product-price-box">
            <div class="price-main-row">
              <span class="price-current">${formatMoney(prod.price)} ج.م</span>
              ${prod.oldPrice ? `<span class="price-old">${formatMoney(prod.oldPrice)} ج.م</span>` : ''}
            </div>
          </div>

          <div class="product-card-actions">
            ${isOut ? `
              <button 
                type="button" 
                class="btn-add-cart btn-out-of-stock" 
                disabled
              >
                <span>🚫 غير متوفر حالياً بالمخزن</span>
              </button>
            ` : `
              <button 
                type="button" 
                class="btn-add-cart" 
                onclick="addToCart('${prod.id}')"
              >
                <span>🛒 أضف للسلة واحجز</span>
              </button>
            `}
            
            <button 
              type="button" 
              class="btn-quick-view-card" 
              onclick="openQuickView('${prod.id}')"
              title="معاينة سريعة لكافة مواصفات وتفاصيل الجهاز"
            >
              <span>👁️ معاينة سريعة للجهاز</span>
            </button>
            
            ${prod.youtubeId ? `
              <button 
                type="button" 
                class="btn-watch-video" 
                onclick="openYouTubeModal('${prod.youtubeId}', '${escapeHtml(prod.title)}', '${prod.id}')"
              >
                <span>🎬 شاهد ريفيو الجهاز</span>
              </button>
            ` : ''}
          </div>
        </div>

      </article>
    `;
  }).join('');
}

// --------------------------------------------------------------------------
// 6.5 Newly Added Products Engine (منتجات تمت إضافتها حديثاً)
// --------------------------------------------------------------------------
function getProductCreationTimestamp(p) {
  if (!p) return 0;
  if (p.createdAt) {
    const t = new Date(p.createdAt).getTime();
    if (!isNaN(t)) return t;
  }
  if (p.created_at) {
    const t = new Date(p.created_at).getTime();
    if (!isNaN(t)) return t;
  }
  if (typeof p.id === 'string' && p.id.startsWith('prod-custom-')) {
    const num = parseInt(p.id.replace('prod-custom-', ''), 10);
    if (!isNaN(num)) return num;
  }
  return 0;
}

function getNewlyAddedProducts(limit = 10) {
  const list = [...AppState.products];
  // Sort by creation date descending (newest first)
  list.sort((a, b) => getProductCreationTimestamp(b) - getProductCreationTimestamp(a));
  return list.slice(0, limit);
}

function scrollNewlyAdded(direction) {
  const track = document.getElementById('newlyAddedTrack');
  if (!track) return;
  const scrollAmount = 300;
  if (direction === 'right') {
    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  } else {
    track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  }
}
window.scrollNewlyAdded = scrollNewlyAdded;

function viewAllNewProducts() {
  AppState.currentCategory = 'all';
  AppState.searchQuery = '';
  AppState.maxPrice = 70000;
  AppState.sortBy = 'featured';

  const catPills = document.querySelectorAll('.category-pill');
  catPills.forEach(p => p.classList.remove('active'));
  const allPill = document.querySelector('.category-pill[data-category="all"]');
  if (allPill) allPill.classList.add('active');

  const priceIndicator = document.getElementById('priceIndicatorText');
  if (priceIndicator) priceIndicator.textContent = 'الكل';
  const priceSlider = document.getElementById('priceRangeSlider');
  if (priceSlider) priceSlider.value = 70000;

  renderCategoryNav();
  renderProducts();

  const catalogEl = document.getElementById('catalogSection');
  if (catalogEl) {
    catalogEl.scrollIntoView({ behavior: 'smooth' });
  }
  showToast('تم نقلك إلى الكتالوج العام لاستعراض كافة الأجهزة 🛒', 'info');
}
window.viewAllNewProducts = viewAllNewProducts;

function renderNewlyAddedProducts() {
  const track = document.getElementById('newlyAddedTrack');
  const section = document.getElementById('newlyAddedSection');
  const scrollNav = document.getElementById('newlyScrollNav');
  if (!track) return;

  const newlyAdded = getNewlyAddedProducts(12);

  if (newlyAdded.length === 0) {
    if (section) section.style.display = 'none';
    return;
  }

  if (section) section.style.display = 'block';

  if (scrollNav) {
    scrollNav.style.display = newlyAdded.length > 1 ? 'flex' : 'none';
  }

  track.innerHTML = newlyAdded.map(prod => {
    if (!prod) return '';
    const isOut = prod.isAvailable === false;
    const shippingAmount = getProductShipping(prod);
    const catName = getCategoryName(prod.category);

    let leftBadgeHtml = '';
    if (isOut) {
      leftBadgeHtml = `<span class="card-badge-tag badge-out-of-stock badge-top-left">🚫 غير متوفر</span>`;
    } else if (prod.badge === 'خصم حصري' || (prod.oldPrice && prod.oldPrice > prod.price)) {
      leftBadgeHtml = `<span class="card-badge-tag badge-discount badge-top-left">🔥 خصم حصري</span>`;
    } else if (prod.badge && prod.badge !== 'جديد') {
      const bClass = prod.badge === 'ضمان 10 سنوات' ? 'badge-warranty' : 'badge-bestseller';
      leftBadgeHtml = `<span class="card-badge-tag ${bClass} badge-top-left">${prod.badge}</span>`;
    }

    return `
      <article class="newly-added-card ${isOut ? 'out-of-stock' : ''}" data-id="${prod.id}">
        
        <div class="product-card-top">
          <!-- Top Right: New Badge -->
          <span class="badge-newly-added">✨ جديد</span>

          <!-- Top Left: Exclusive Discount / Secondary Badge -->
          ${leftBadgeHtml}
          
          <img 
            src="${prod.image}" 
            alt="${escapeHtml(prod.title)}" 
            class="product-img" 
            loading="lazy"
            onerror="this.src='https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80'"
          >

          ${prod.youtubeId ? `
            <div class="card-quick-actions">
              <button 
                type="button" 
                class="btn-card-icon" 
                onclick="openYouTubeModal('${prod.youtubeId}', '${escapeHtml(prod.title)}', '${prod.id}')" 
                title="شاهد ريفيو الجهاز على يوتيوب"
                aria-label="فيديو ريفيو"
              >
                ▶
              </button>
            </div>
          ` : ''}
        </div>

        <div class="product-card-body">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <span class="product-category-lbl">${catName}</span>
            <small style="font-size:11px; color:var(--text-muted);">
              🚚 ${shippingAmount > 0 ? `شحن: ${formatMoney(shippingAmount)} ج.م` : 'شحن مجاني'}
            </small>
          </div>

          <h3 class="product-title" title="${escapeHtml(prod.title)}">${escapeHtml(prod.title)}</h3>

          <div class="product-specs-list">
            ${prod.specs && prod.specs.length > 0 ? prod.specs.slice(0, 2).map(s => `<span class="spec-tag">${escapeHtml(s)}</span>`).join('') : '<span class="spec-tag">ضمان الوكيل المعتمد</span>'}
          </div>

          <div class="product-price-box">
            <div class="price-main-row">
              <span class="price-current">${formatMoney(prod.price)} ج.م</span>
              ${prod.oldPrice && prod.oldPrice > prod.price ? `<span class="price-old">${formatMoney(prod.oldPrice)} ج.م</span>` : ''}
            </div>
            ${prod.oldPrice && prod.oldPrice > prod.price ? `
              <div style="font-size:11px; font-weight:800; color:#10B981; margin-top:2px;">
                وفر ${formatMoney(prod.oldPrice - prod.price)} ج.م (خصم ${Math.round(((prod.oldPrice - prod.price)/prod.oldPrice)*100)}%)
              </div>
            ` : ''}
          </div>

          <div class="product-card-actions">
            ${isOut ? `
              <button 
                type="button" 
                class="btn-add-cart btn-out-of-stock" 
                disabled
              >
                <span>🚫 غير متوفر حالياً بالمخزن</span>
              </button>
            ` : `
              <button 
                type="button" 
                class="btn-add-cart" 
                onclick="addToCart('${prod.id}')"
              >
                <span>🛒 أضف للسلة واحجز</span>
              </button>
            `}
            
            <button 
              type="button" 
              class="btn-quick-view-card" 
              onclick="openQuickView('${prod.id}')"
              title="معاينة سريعة لكافة مواصفات وتفاصيل الجهاز"
            >
              <span>👁️ معاينة سريعة للجهاز</span>
            </button>
          </div>
        </div>

      </article>
    `;
  }).join('');
}
window.renderNewlyAddedProducts = renderNewlyAddedProducts;

function renderActiveFilterChips(container, tagsList) {
  if (!container || !tagsList) return;

  const chips = [];

  if (AppState.currentCategory !== 'all') {
    const catName = getCategoryName(AppState.currentCategory);
    chips.push({
      text: `القسم: ${catName}`,
      onRemove: () => filterByCategory('all')
    });
  }

  if (AppState.searchQuery.trim()) {
    chips.push({
      text: `بحث: "${AppState.searchQuery}"`,
      onRemove: () => {
        const input = document.getElementById('liveSearchInput');
        if (input) input.value = '';
        AppState.searchQuery = '';
        const clearBtn = document.getElementById('clearSearchBtn');
        if (clearBtn) clearBtn.hidden = true;
        renderProducts();
      }
    });
  }

  if (AppState.maxPrice < 70000) {
    chips.push({
      text: `أقصى سعر: ${formatMoney(AppState.maxPrice)} ج.م`,
      onRemove: () => {
        AppState.maxPrice = 70000;
        const priceRangeInput = document.getElementById('priceRangeInput');
        if (priceRangeInput) priceRangeInput.value = 70000;
        const maxPriceValLabel = document.getElementById('maxPriceValLabel');
        if (maxPriceValLabel) maxPriceValLabel.textContent = '70,000 ج.م';
        const indicator = document.getElementById('priceIndicatorText');
        if (indicator) indicator.textContent = 'الكل';
        renderProducts();
      }
    });
  }

  if (chips.length > 0) {
    container.hidden = false;
    tagsList.innerHTML = chips.map((c, i) => `
      <span class="filter-chip-tag">
        <span>${c.text}</span>
        <button type="button" onclick="window.removeFilterChip(${i})">✕</button>
      </span>
    `).join('');
    
    window._chipHandlers = chips.map(c => c.onRemove);
  } else {
    container.hidden = true;
    tagsList.innerHTML = '';
  }
}

window.removeFilterChip = function(index) {
  if (window._chipHandlers && window._chipHandlers[index]) {
    window._chipHandlers[index]();
  }
};



// --------------------------------------------------------------------------
// 8. Interactive Shopping Cart Management (Deposit & 100% Full Payment Modes)
// --------------------------------------------------------------------------
function addToCart(productId) {
  const prod = AppState.products.find(p => p && p.id === productId);
  if (!prod) return;

  if (prod.isAvailable === false) {
    showToast(`عذراً، جهاز "${prod.title.slice(0, 25)}..." غير متوفر حالياً في المخزن! 🚫`, 'warning');
    return;
  }

  const existingIndex = AppState.cart.findIndex(item => item && item.id === productId);

  if (existingIndex > -1) {
    AppState.cart[existingIndex].qty = (Number(AppState.cart[existingIndex].qty) || 1) + 1;
  } else {
    AppState.cart.push({
      id: prod.id,
      title: prod.title,
      price: Number(prod.price) || 0,
      depositAmount: getProductDeposit(prod),
      shippingFee: getProductShipping(prod),
      image: prod.image || '',
      category: prod.category || '',
      qty: 1
    });
  }

  saveCartToStorage();
  updateCartUI();
  toggleCartDrawer(true); // Open drawer automatically so user sees the product in the cart!
  showToast(`تمت إضافة "${prod.title.slice(0, 30)}..." إلى السلة بنجاح! 🛒`, 'success');

  // Trigger quick animation on cart badge
  const badge = document.getElementById('cartCounterBadge');
  if (badge) {
    badge.style.transform = 'scale(1.4)';
    setTimeout(() => badge.style.transform = 'scale(1)', 300);
  }
}
window.addToCart = addToCart;

function updateCartItemQty(productId, delta) {
  const index = AppState.cart.findIndex(item => item && item.id === productId);
  if (index === -1) return;

  AppState.cart[index].qty = (Number(AppState.cart[index].qty) || 1) + delta;

  if (AppState.cart[index].qty <= 0) {
    AppState.cart.splice(index, 1);
    showToast('تم حذف الجهاز من السلة', 'info');
  }

  saveCartToStorage();
  updateCartUI();
}
window.updateCartItemQty = updateCartItemQty;

function removeCartItem(productId) {
  AppState.cart = AppState.cart.filter(item => item && item.id !== productId);
  saveCartToStorage();
  updateCartUI();
  showToast('تمت إزالة الجهاز من السلة', 'info');
}
window.removeCartItem = removeCartItem;

function setPaymentMode(mode) {
  AppState.paymentMode = mode;
  
  // Update Radio Label visual classes in Drawer
  const depLabel = document.getElementById('payModeDepositLabel');
  const fullLabel = document.getElementById('payModeFullLabel');

  if (depLabel) depLabel.classList.toggle('active', mode === 'deposit');
  if (fullLabel) fullLabel.classList.toggle('active', mode === 'full');

  updateCartUI();
}
window.setPaymentMode = setPaymentMode;

function calculateCartTotals() {
  const cart = Array.isArray(AppState.cart) ? AppState.cart : [];
  const subtotal = cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.qty) || 1)), 0);
  const totalShipping = cart.reduce((sum, item) => sum + ((Number(item.shippingFee) || 0) * (Number(item.qty) || 1)), 0);
  const totalDeposit = cart.reduce((sum, item) => {
    const itemDeposit = (item.depositAmount !== undefined && item.depositAmount !== null && !isNaN(item.depositAmount)) 
      ? Number(item.depositAmount) 
      : Math.round((Number(item.price) || 0) * 0.20);
    return sum + (itemDeposit * (Number(item.qty) || 1));
  }, 0);

  const finalTotal = subtotal + totalShipping;
  
  // Dynamic Pay Now amount based on paymentMode
  const isFullPayment = AppState.paymentMode === 'full';
  const payNow = isFullPayment ? finalTotal : totalDeposit;
  const remainingCash = isFullPayment ? 0 : Math.max(0, finalTotal - totalDeposit);

  return {
    subtotal,
    totalShipping,
    totalDeposit,
    finalTotal,
    payNow,
    remainingCash,
    isFullPayment,
    itemsCount: cart.reduce((sum, item) => sum + (Number(item.qty) || 1), 0)
  };
}

function updateCartUI() {
  const totals = calculateCartTotals();

  // Badges & Counters
  const counterBadges = [
    document.getElementById('cartCounterBadge'),
    document.getElementById('mobCartBadge'),
    document.getElementById('cartDrawerCountBadge')
  ];
  counterBadges.forEach(b => {
    if (b) b.textContent = `${totals.itemsCount} عناصر`;
  });

  // Header quick preview
  const headerDepositVal = document.getElementById('cartHeaderDepositVal');
  if (headerDepositVal) {
    if (totals.itemsCount > 0) {
      if (totals.isFullPayment) {
        headerDepositVal.textContent = `${formatMoney(totals.finalTotal)} ج.م (دفع كامل)`;
      } else {
        headerDepositVal.textContent = `${formatMoney(totals.payNow)} ج.م (عربون)`;
      }
    } else {
      headerDepositVal.textContent = '0 ج.م';
    }
  }

  // Cart Drawer List & Empty View
  const cartList = document.getElementById('cartItemsList');
  const emptyView = document.getElementById('cartEmptyView');
  const cartFooter = document.getElementById('cartDrawerFooter');
  const paymentChoiceBox = document.getElementById('cartPaymentChoiceBox');

  if (AppState.cart.length === 0) {
    if (cartList) {
      cartList.innerHTML = '';
      cartList.style.display = 'none';
    }
    if (emptyView) {
      emptyView.hidden = false;
      emptyView.style.display = 'flex';
    }
    if (cartFooter) {
      cartFooter.hidden = true;
      cartFooter.style.display = 'none';
    }
    if (paymentChoiceBox) {
      paymentChoiceBox.hidden = true;
      paymentChoiceBox.style.display = 'none';
    }
    return;
  }

  // If there ARE items in cart:
  if (emptyView) {
    emptyView.hidden = true;
    emptyView.style.display = 'none';
  }
  if (cartList) {
    cartList.style.display = 'block';
  }
  if (cartFooter) {
    cartFooter.hidden = false;
    cartFooter.style.display = 'block';
  }
  if (paymentChoiceBox) {
    paymentChoiceBox.hidden = false;
    paymentChoiceBox.style.display = 'block';
  }

  if (cartList) {
    cartList.innerHTML = AppState.cart.map(item => {
      if (!item) return '';
      const itemDep = (item.depositAmount !== undefined && item.depositAmount !== null && !isNaN(item.depositAmount)) 
        ? item.depositAmount 
        : Math.round((Number(item.price) || 0) * 0.20);
      const itemShip = (item.shippingFee !== undefined && item.shippingFee !== null) ? Number(item.shippingFee) : 0;

      return `
        <div class="cart-item-card">
          <div class="cart-item-img-box">
            <img src="${item.image}" alt="${item.title}" class="cart-item-img" onerror="this.src='https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80'">
          </div>
          
          <div class="cart-item-info">
            <h4 class="cart-item-title" title="${item.title}">${item.title}</h4>
            <div class="cart-item-price">${formatMoney(item.price)} ج.م</div>
            
            <div style="font-size:11px; color:var(--text-muted); margin-bottom:6px; display:flex; gap:10px; flex-wrap:wrap;">
              <span style="color:var(--accent-green-dark); font-weight:700;">💳 عربون: ${formatMoney(itemDep)} ج.م</span>
              <span>🚚 ${itemShip > 0 ? `شحن: ${formatMoney(itemShip)} ج.م` : 'شحن مجاني'}</span>
            </div>
            
            <div class="cart-qty-ctrl">
              <button type="button" class="btn-qty" onclick="updateCartItemQty('${item.id}', -1)">-</button>
              <span class="qty-val">${item.qty}</span>
              <button type="button" class="btn-qty" onclick="updateCartItemQty('${item.id}', 1)">+</button>
            </div>
          </div>

          <button 
            type="button" 
            class="btn-remove-item" 
            onclick="removeCartItem('${item.id}')"
            title="حذف من السلة"
          >
            ✕
          </button>
        </div>
      `;
    }).join('');
  }

  // Financial summary updates
  const subtotalEl = document.getElementById('cartSubtotalVal');
  const shippingEl = document.getElementById('cartShippingVal');
  const totalValEl = document.getElementById('cartTotalOrderVal');
  const depositValEl = document.getElementById('cartDepositVal');
  const remainingValEl = document.getElementById('cartRemainingVal');
  const payNowBadge = document.getElementById('cartPayNowBadge');
  const payNowPercent = document.getElementById('cartPayNowPercent');
  const payNowNote = document.getElementById('cartPayNowNote');
  const proceedCheckoutBtnText = document.getElementById('proceedCheckoutBtnText');

  if (subtotalEl) subtotalEl.textContent = `${formatMoney(totals.subtotal)} ج.م`;
  if (shippingEl) shippingEl.textContent = totals.totalShipping > 0 ? `${formatMoney(totals.totalShipping)} ج.م` : 'مجاناً';
  if (totalValEl) totalValEl.textContent = `${formatMoney(totals.finalTotal)} ج.م`;

  if (totals.isFullPayment) {
    if (payNowBadge) payNowBadge.textContent = '⚡ سداد كامل الفاتورة بالبطاقة';
    if (payNowPercent) payNowPercent.textContent = '100%';
    if (depositValEl) depositValEl.textContent = `${formatMoney(totals.payNow)} ج.م`;
    if (payNowNote) payNowNote.textContent = 'سداد إجمالي الطلب والشحن بالكامل إلكترونياً';
    if (remainingValEl) remainingValEl.textContent = '0 ج.م (لا يوجد متبقي كاش)';
    if (proceedCheckoutBtnText) proceedCheckoutBtnText.textContent = 'متابعة الشراء والدفع الكامل بالفيزا';
  } else {
    if (payNowBadge) payNowBadge.textContent = '💳 يُدفع الآن بالبطاقة';
    if (payNowPercent) payNowPercent.textContent = 'عربون حجز';
    if (depositValEl) depositValEl.textContent = `${formatMoney(totals.payNow)} ج.م`;
    if (payNowNote) payNowNote.textContent = 'عربون تأكيد الحجز بالفيزا';
    if (remainingValEl) remainingValEl.textContent = `${formatMoney(totals.remainingCash)} ج.م`;
    if (proceedCheckoutBtnText) proceedCheckoutBtnText.textContent = 'متابعة الشراء وسداد العربون';
  }

  // Checkout modal summary updates if open
  const checkoutSummaryTotal = document.getElementById('checkoutSummaryTotal');
  const checkoutSummaryDeposit = document.getElementById('checkoutSummaryDeposit');
  const checkoutSummaryDepositLabel = document.getElementById('checkoutSummaryDepositLabel');
  const paymentDepositAmountDisplay = document.getElementById('paymentDepositAmountDisplay');
  const paymentChargeTypeLbl = document.getElementById('paymentChargeTypeLbl');
  const paymentChargeSubtext = document.getElementById('paymentChargeSubtext');
  const submitStep1BtnText = document.getElementById('submitStep1BtnText');
  const payBtnText = document.getElementById('payBtnText');

  if (checkoutSummaryTotal) checkoutSummaryTotal.textContent = `${formatMoney(totals.finalTotal)} ج.م`;
  if (checkoutSummaryDeposit) checkoutSummaryDeposit.textContent = `${formatMoney(totals.payNow)} ج.م`;
  
  if (checkoutSummaryDepositLabel) {
    checkoutSummaryDepositLabel.textContent = totals.isFullPayment ? 'إجمالي المبلغ المطلوب دفعه بالكامل بالفيزا:' : 'العربون المطلوب دفعه الآن بالفيزا:';
  }

  if (paymentDepositAmountDisplay) paymentDepositAmountDisplay.textContent = `${formatMoney(totals.payNow)} ج.م`;

  if (paymentChargeTypeLbl) {
    paymentChargeTypeLbl.textContent = totals.isFullPayment ? 'إجمالي الفاتورة المطلوب سدادها الآن بالكامل:' : 'قيمة العربون المطلوب سداده الآن:';
  }

  if (paymentChargeSubtext) {
    paymentChargeSubtext.textContent = totals.isFullPayment 
      ? '(سداد كامل الفاتورة والشحن 100% إلكترونياً بدون دفع كاش عند الاستلام)' 
      : `(سداد عربون تأكيد الحجز أونلاين والمتبقي ${formatMoney(totals.remainingCash)} ج.م كاش عند الاستلام)`;
  }

  if (submitStep1BtnText) {
    submitStep1BtnText.textContent = totals.isFullPayment ? 'الانتقال لسداد الفاتورة بالكامل بالفيزا' : 'الانتقال لسداد العربون بالفيزا';
  }

  if (payBtnText) {
    payBtnText.textContent = totals.isFullPayment ? `تأكيد وسداد ${formatMoney(totals.payNow)} ج.م بالكامل` : `تأكيد وسداد العربون (${formatMoney(totals.payNow)} ج.م)`;
  }
}

// --------------------------------------------------------------------------
// 9. Checkout & Mock Card Payment Flow
// --------------------------------------------------------------------------
let customerOrderData = {};

function startCheckoutFlow() {
  if (AppState.cart.length === 0) {
    showToast('سلة المشتريات فارغة! تصفحي الأجهزة وأضيفي طلبك أولاً.', 'warning');
    return;
  }

  toggleCartDrawer(false);
  setCheckoutStep(1);
  updateCartUI();
  openModal('checkoutModal');
}
window.startCheckoutFlow = startCheckoutFlow;

function setCheckoutStep(stepNumber) {
  const step1 = document.getElementById('checkoutStep1');
  const step2 = document.getElementById('checkoutStep2');
  const step3 = document.getElementById('checkoutStep3');

  const ind1 = document.getElementById('step1Indicator');
  const ind2 = document.getElementById('step2Indicator');
  const ind3 = document.getElementById('step3Indicator');

  if (step1) step1.hidden = stepNumber !== 1;
  if (step2) step2.hidden = stepNumber !== 2;
  if (step3) step3.hidden = stepNumber !== 3;

  if (ind1) ind1.classList.toggle('active', stepNumber >= 1);
  if (ind2) ind2.classList.toggle('active', stepNumber >= 2);
  if (ind3) ind3.classList.toggle('active', stepNumber >= 3);
}
window.setCheckoutStep = setCheckoutStep;

function handleDeliveryFormSubmit(e) {
  e.preventDefault();

  const nameInput = document.getElementById('custNameInput');
  const phoneInput = document.getElementById('custPhoneInput');
  const govSelect = document.getElementById('custGovSelect');
  const cityInput = document.getElementById('custCityInput');
  const addressInput = document.getElementById('custAddressInput');
  const notesInput = document.getElementById('custNotesInput');

  let isValid = true;

  if (!nameInput.value.trim()) {
    showFieldError('custNameError', 'يرجى إدخال الاسم بالكامل');
    isValid = false;
  } else {
    clearFieldError('custNameError');
  }

  const phoneVal = phoneInput.value.trim();
  if (!phoneVal || phoneVal.length < 10) {
    showFieldError('custPhoneError', 'يرجى إدخال رقم هاتف صحيح (11 رقم)');
    isValid = false;
  } else {
    clearFieldError('custPhoneError');
  }

  if (!govSelect.value) {
    showFieldError('custGovError', 'يرجى اختيار المحافظة');
    isValid = false;
  } else {
    clearFieldError('custGovError');
  }

  if (!cityInput.value.trim()) {
    showFieldError('custCityError', 'يرجى إدخال المدينة أو المنطقة');
    isValid = false;
  } else {
    clearFieldError('custCityError');
  }

  if (!addressInput.value.trim()) {
    showFieldError('custAddressError', 'يرجى إدخال تفاصيل العنوان والشارع');
    isValid = false;
  } else {
    clearFieldError('custAddressError');
  }

  if (!isValid) return;

  customerOrderData = {
    name: nameInput.value.trim(),
    phone: phoneInput.value.trim(),
    governorate: govSelect.value,
    city: cityInput.value.trim(),
    address: addressInput.value.trim(),
    notes: notesInput ? notesInput.value.trim() : ''
  };

  setCheckoutStep(2);
  
  const cardHolderPreview = document.getElementById('cardHolderPreview');
  if (cardHolderPreview && customerOrderData.name) {
    cardHolderPreview.textContent = customerOrderData.name.toUpperCase();
  }
}

function handlePaymentFormSubmit(e) {
  e.preventDefault();

  const cardHolder = document.getElementById('cardHolderInput');
  const cardNum = document.getElementById('cardNumInput');
  const cardExp = document.getElementById('cardExpInput');
  const cardCvv = document.getElementById('cardCvvInput');

  let isValid = true;

  if (!cardHolder.value.trim()) {
    showFieldError('cardHolderError', 'يرجى إدخال الاسم المطبوع على البطاقة');
    isValid = false;
  } else {
    clearFieldError('cardHolderError');
  }

  const cleanNum = cardNum.value.replace(/\s+/g, '');
  if (!cleanNum || cleanNum.length < 12) {
    showFieldError('cardNumError', 'يرجى إدخال رقم بطاقة صحيح');
    isValid = false;
  } else {
    clearFieldError('cardNumError');
  }

  if (!cardExp.value.trim() || !cardExp.value.includes('/')) {
    showFieldError('cardExpError', 'تاريخ الانتهاء غير صحيح (MM/YY)');
    isValid = false;
  } else {
    clearFieldError('cardExpError');
  }

  if (!cardCvv.value.trim() || cardCvv.value.length < 3) {
    showFieldError('cardCvvError', 'رمز CVV غير صحيح');
    isValid = false;
  } else {
    clearFieldError('cardCvvError');
  }

  if (!isValid) return;

  const payBtn = document.getElementById('submitPaymentBtn');
  const spinner = document.getElementById('paymentSpinner');
  const btnText = document.getElementById('payBtnText');

  if (payBtn) payBtn.disabled = true;
  if (spinner) spinner.hidden = false;
  if (btnText) btnText.textContent = 'جاري معالجة الدفع بأمان...';

  setTimeout(() => {
    if (payBtn) payBtn.disabled = false;
    if (spinner) spinner.hidden = true;
    if (btnText) btnText.textContent = 'تأكيد وسداد المبلغ الآن';

    generateCompletedOrder();
  }, 1400);
}

function generateCompletedOrder() {
  const totals = calculateCartTotals();
  const orderId = 'ASM-' + Math.floor(100000 + Math.random() * 900000);
  const now = new Date();
  const dateStr = now.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const newOrder = {
    id: orderId,
    date: dateStr,
    timestamp: now.getTime(),
    customer: { ...customerOrderData },
    items: [...AppState.cart],
    financials: { ...totals },
    paymentMode: AppState.paymentMode,
    status: totals.isFullPayment ? 'تم الدفع بالكامل بالفيزا (100%)' : 'تم تأكيد الحجز ودفع العربون'
  };

  // Add to state and storage
  AppState.orders.unshift(newOrder);
  saveOrdersToStorage();

  // Clear Cart
  AppState.cart = [];
  saveCartToStorage();
  updateCartUI();

  // Render Printable Receipt
  renderPrintableReceipt(newOrder);

  // Move to Step 3
  setCheckoutStep(3);
  showToast(`تم تأكيد طلبك بنجاح! رقم الفاتورة: ${orderId} 🎉`, 'success');

  // Update Admin Panels
  updateAdminOrdersTable();
  updateAdminAnalytics();
}

function renderPrintableReceipt(order) {
  if (!order) return;
  AppState.currentReceiptOrder = order;

  const receiptOrderId = document.getElementById('receiptOrderId');
  const receiptDate = document.getElementById('receiptDate');
  const receiptCustName = document.getElementById('receiptCustName');
  const receiptCustPhone = document.getElementById('receiptCustPhone');
  const receiptCustAddress = document.getElementById('receiptCustAddress');

  if (receiptOrderId) receiptOrderId.textContent = order.id;
  if (receiptDate) receiptDate.textContent = order.date;
  if (receiptCustName) receiptCustName.textContent = order.customer?.name || '-';
  if (receiptCustPhone) receiptCustPhone.textContent = order.customer?.phone || '-';
  if (receiptCustAddress) receiptCustAddress.textContent = `${order.customer?.governorate || ''} - ${order.customer?.city || ''} - ${order.customer?.address || ''}`;

  const tableBody = document.getElementById('receiptItemsTableBody');
  if (tableBody && Array.isArray(order.items)) {
    tableBody.innerHTML = order.items.map((item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${item.title}</strong></td>
        <td>${item.qty}</td>
        <td>${formatMoney(item.price)} ج.م</td>
        <td>${formatMoney(item.price * item.qty)} ج.م</td>
      </tr>
    `).join('');
  }

  const receiptSubtotal = document.getElementById('receiptSubtotal');
  const receiptShipping = document.getElementById('receiptShipping');
  const receiptTotal = document.getElementById('receiptTotal');
  const stampBadge = document.getElementById('receiptStampBadge');
  const paidLbl = document.getElementById('receiptPaidLbl');
  const depositPaidEl = document.getElementById('receiptDepositPaid');
  const remainingCashEl = document.getElementById('receiptRemainingCash');
  const remainingLbl = document.getElementById('receiptRemainingLbl');

  const subtotal = order.financials?.subtotal ?? order.total ?? 0;
  const shipping = order.financials?.totalShipping ?? 0;
  const finalTotal = order.financials?.finalTotal ?? order.total ?? subtotal;
  const payNow = order.financials?.payNow ?? order.deposit ?? 0;
  const remainingCash = order.financials?.remainingCash ?? order.remaining ?? 0;

  if (receiptSubtotal) receiptSubtotal.textContent = `${formatMoney(subtotal)} ج.م`;
  if (receiptShipping) receiptShipping.textContent = (shipping > 0) ? `${formatMoney(shipping)} ج.م` : 'مجاناً';
  if (receiptTotal) receiptTotal.textContent = `${formatMoney(finalTotal)} ج.م`;

  if (order.paymentMode === 'full' || order.financials?.isFullPayment) {
    if (stampBadge) stampBadge.textContent = 'تم السداد بالكامل بالفيزا (100% مدفوع ✅)';
    if (paidLbl) paidLbl.textContent = 'المبلغ المسدد بالكامل بالفيزا (100%):';
    if (depositPaidEl) depositPaidEl.textContent = `${formatMoney(payNow)} ج.م (مدفوع بالكامل ✅)`;
    if (remainingCashEl) remainingCashEl.textContent = '0 ج.م (لا يوجد متبقي كاش)';
    if (remainingLbl) remainingLbl.textContent = 'المبلغ المتبقي كاش عند الاستلام:';
  } else {
    if (stampBadge) stampBadge.textContent = 'تم سداد العربون بالفيزا ✅';
    if (paidLbl) paidLbl.textContent = 'العربون المسدد أونلاين بالفيزا:';
    if (depositPaidEl) depositPaidEl.textContent = `${formatMoney(payNow)} ج.م (مدفوع ✅)`;
    if (remainingCashEl) remainingCashEl.textContent = `${formatMoney(remainingCash)} ج.م (كاش عند الاستلام)`;
    if (remainingLbl) remainingLbl.textContent = 'المبلغ المتبقي للدفع كاش عند الاستلام:';
  }

  // Update WhatsApp link with Order Details and 01032997502
  const waBtn = document.getElementById('whatsappFollowBtn');
  if (waBtn) {
    const payText = (order.paymentMode === 'full' || order.financials?.isFullPayment) 
      ? `تم سداد إجمالي الفاتورة بالكامل وقدره ${formatMoney(payNow)} ج.م`
      : `تم سداد العربون وقدره ${formatMoney(payNow)} ج.م (والمتبقي ${formatMoney(remainingCash)} ج.م كاش عند الاستلام)`;

    const itemsSummary = Array.isArray(order.items) ? order.items.map(i => `• ${i.title} (${i.qty} قطع)`).join('\n') : '';
    const msgText = `مرحباً عالم اسما، أود متابعة طلبي:\n- رقم الطلب: ${order.id}\n- اسم العميل: ${order.customer?.name || ''}\n- الهاتف: ${order.customer?.phone || ''}\n- العنوان: ${order.customer?.governorate || ''} - ${order.customer?.city || ''}\n- الأجهزة المطلوبة:\n${itemsSummary}\n- حالة الدفع: ${payText}\n- إجمالي الفاتورة: ${formatMoney(finalTotal)} ج.م`;

    waBtn.href = `https://wa.me/201032997502?text=${encodeURIComponent(msgText)}`;
  }
}

// --------------------------------------------------------------------------
// 10. YouTube Video Modal Embed System
// --------------------------------------------------------------------------
function openYouTubeModal(videoId, title, productId) {
  const modal = document.getElementById('ytVideoModal');
  const iframe = document.getElementById('ytIframePlayer');
  const titleEl = document.getElementById('ytModalTitle');
  const addBtn = document.getElementById('addFromYtModalBtn');

  if (!modal || !iframe) return;

  AppState.activeVideoId = videoId;
  if (titleEl) titleEl.textContent = title || 'ريفيو وشرح الجهاز على قناة عالم اسما';

  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

  if (addBtn) {
    const prod = productId ? AppState.products.find(p => p && p.id === productId) : null;
    if (prod) {
      if (prod.isAvailable === false) {
        addBtn.hidden = false;
        addBtn.textContent = '🚫 الجهاز غير متوفر حالياً بالمخزن';
        addBtn.disabled = true;
      } else {
        addBtn.hidden = false;
        addBtn.textContent = '🛒 إضافة هذا الجهاز للسلة';
        addBtn.disabled = false;
        addBtn.onclick = () => {
          addToCart(productId);
          closeYouTubeModal();
        };
      }
    } else {
      addBtn.hidden = true;
    }
  }

  openModal('ytVideoModal');
}
window.openYouTubeModal = openYouTubeModal;

function closeYouTubeModal() {
  const iframe = document.getElementById('ytIframePlayer');
  if (iframe) iframe.src = '';
  closeModal('ytVideoModal');
}
window.closeYouTubeModal = closeYouTubeModal;

// --------------------------------------------------------------------------
// 11. Quick View Product Modal
// --------------------------------------------------------------------------
function scrollQvRelated(direction) {
  const track = document.getElementById('qvRelatedTrack');
  if (!track) return;
  const scrollAmount = 320;
  if (direction === 'right') {
    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  } else {
    track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  }
}
window.scrollQvRelated = scrollQvRelated;

window.QvActiveGallery = [];
window.QvCurrentIndex = 0;

function setQvSlide(index) {
  if (!window.QvActiveGallery || window.QvActiveGallery.length === 0) return;
  if (index < 0) index = window.QvActiveGallery.length - 1;
  if (index >= window.QvActiveGallery.length) index = 0;

  window.QvCurrentIndex = index;

  const mainImg = document.getElementById('qvMainGalleryImg');
  if (mainImg) {
    mainImg.style.opacity = '0';
    setTimeout(() => {
      mainImg.src = window.QvActiveGallery[index];
      mainImg.style.opacity = '1';
    }, 150);
  }

  const counter = document.getElementById('qvSlideCounterBadge');
  if (counter) {
    counter.textContent = `📸 ${index + 1} / ${window.QvActiveGallery.length}`;
  }

  const thumbs = document.querySelectorAll('.qv-thumb-item');
  thumbs.forEach((t, idx) => {
    if (idx === index) {
      t.classList.add('active');
      t.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    } else {
      t.classList.remove('active');
    }
  });
}
window.setQvSlide = setQvSlide;

function changeQvSlide(delta) {
  setQvSlide(window.QvCurrentIndex + delta);
}
window.changeQvSlide = changeQvSlide;

function openQuickView(productId) {
  const prod = AppState.products.find(p => p && p.id === productId);
  if (!prod) return;

  const content = document.getElementById('quickViewContent');
  if (!content) return;

  const isOut = prod.isAvailable === false;
  const deposit = getProductDeposit(prod);
  const shipping = getProductShipping(prod);
  const remaining = Math.max(0, prod.price - deposit);
  const catName = getCategoryName(prod.category);

  // Extract gallery images and primary index
  const gallery = (Array.isArray(prod.images) && prod.images.length > 0)
    ? prod.images.filter(Boolean)
    : (prod.image ? [prod.image] : []);
  const primaryIdx = (typeof prod.primaryImageIndex === 'number' && prod.primaryImageIndex >= 0 && prod.primaryImageIndex < gallery.length)
    ? prod.primaryImageIndex
    : 0;

  window.QvActiveGallery = gallery.length > 0 ? gallery : [prod.image || 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80'];
  window.QvCurrentIndex = primaryIdx;

  let badgeHtml = '';
  if (isOut) {
    badgeHtml = `<span class="card-badge-tag badge-out-of-stock">🚫 غير متوفر حالياً بالمخزن</span>`;
  } else if (prod.badge) {
    let badgeClass = 'badge-bestseller';
    if (prod.badge === 'خصم حصري' || (prod.oldPrice && prod.oldPrice > prod.price)) badgeClass = 'badge-discount';
    if (prod.badge === 'جديد') badgeClass = 'badge-new';
    if (prod.badge === 'ضمان 10 سنوات') badgeClass = 'badge-warranty';
    badgeHtml = `<span class="card-badge-tag ${badgeClass}">${prod.badge}</span>`;
  }

  // Calculate discount percentage if old price exists
  const discountAmount = prod.oldPrice && prod.oldPrice > prod.price ? prod.oldPrice - prod.price : 0;
  const discountPercent = prod.oldPrice && prod.oldPrice > prod.price ? Math.round((discountAmount / prod.oldPrice) * 100) : 0;

  // Retrieve Related Products ONLY from the exact same category (excluding the currently viewed product)
  const relatedProducts = AppState.products.filter(p => p && p.id !== prod.id && p.category === prod.category);

  const relatedCardsHtml = relatedProducts.length > 0 ? relatedProducts.map(rel => {
    const relIsOut = rel.isAvailable === false;
    const relDeposit = getProductDeposit(rel);
    const relShipping = getProductShipping(rel);
    const relCatName = getCategoryName(rel.category);
    
    let relBadgeHtml = '';
    if (relIsOut) {
      relBadgeHtml = `<span class="card-badge-tag badge-out-of-stock">🚫 غير متوفر</span>`;
    } else if (rel.badge) {
      let bClass = 'badge-bestseller';
      if (rel.badge === 'خصم حصري' || (rel.oldPrice && rel.oldPrice > rel.price)) bClass = 'badge-discount';
      if (rel.badge === 'جديد') bClass = 'badge-new';
      if (rel.badge === 'ضمان 10 سنوات') bClass = 'badge-warranty';
      relBadgeHtml = `<span class="card-badge-tag ${bClass}">${rel.badge}</span>`;
    }

    return `
      <div class="qv-related-card ${relIsOut ? 'out-of-stock' : ''}">
        <div class="qv-rel-card-top">
          ${relBadgeHtml}
          <img 
            src="${rel.image}" 
            alt="${rel.title}" 
            class="qv-rel-img" 
            loading="lazy"
            onerror="this.src='https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80'"
          >
          ${rel.youtubeId ? `
            <button 
              type="button" 
              class="btn-card-icon qv-rel-yt-btn" 
              onclick="openYouTubeModal('${rel.youtubeId}', '${escapeHtml(rel.title)}', '${rel.id}')"
              title="شاهد ريفيو الجهاز بالفيديو"
              aria-label="فيديو ريفيو"
            >
              ▶
            </button>
          ` : ''}
        </div>
        
        <div class="qv-rel-card-body">
          <div class="qv-rel-meta-row">
            <span class="qv-rel-cat">${relCatName}</span>
            <small class="qv-rel-shipping">
              🚚 ${relShipping > 0 ? `${formatMoney(relShipping)} ج.م` : 'شحن مجاني'}
            </small>
          </div>

          <h4 class="qv-rel-title" title="${rel.title}">${rel.title}</h4>

          <div class="qv-rel-price-box">
            <div class="qv-rel-price-row">
              <span class="qv-rel-price-current">${formatMoney(rel.price)} ج.م</span>
              ${rel.oldPrice ? `<span class="qv-rel-price-old">${formatMoney(rel.oldPrice)} ج.م</span>` : ''}
            </div>
            ${rel.oldPrice && rel.oldPrice > rel.price ? `
              <span class="qv-rel-discount-tag">وفر ${formatMoney(rel.oldPrice - rel.price)} ج.م</span>
            ` : ''}
          </div>

          <div class="qv-rel-deposit-mini">
            <span class="deposit-mini-item online">💳 عربون: <strong>${formatMoney(relDeposit)} ج.م</strong></span>
            <span class="deposit-mini-item cash">💵 كاش: <strong>${formatMoney(Math.max(0, rel.price - relDeposit))} ج.م</strong></span>
          </div>

          <div class="qv-rel-actions">
            <button 
              type="button" 
              class="btn-qv-rel-view" 
              onclick="openQuickView('${rel.id}')"
              title="معاينة تفاصيل هذا الجهاز"
            >
              <span>👁️ معاينة سريعة</span>
            </button>

            ${relIsOut ? `
              <button type="button" class="btn-qv-rel-cart btn-out-of-stock" disabled>
                <span>🚫 غير متوفر</span>
              </button>
            ` : `
              <button 
                type="button" 
                class="btn-qv-rel-cart" 
                onclick="addToCart('${rel.id}')"
                title="إضافة الجهاز إلى سلة الشراء"
              >
                <span>🛒 أضف للسلة</span>
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('') : `
    <div class="qv-related-empty">
      <div style="font-size: 32px; margin-bottom: 8px;">🏷️</div>
      <p style="font-size: 14.5px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">
        لا توجد أجهزة أخرى مضافة في قسم "${catName}" حالياً
      </p>
      <p style="font-size: 12.5px; color: var(--text-muted); margin: 0;">
        يمكنك الرجوع للكتالوج الرئيسي لاستعراض باقي أقسام الأجهزة المنزلية المتاحة.
      </p>
    </div>
  `;

  content.innerHTML = `
    <!-- Top Navigation Bar -->
    <header class="qv-top-bar">
      <button type="button" class="btn-qv-back-home" onclick="closeModal('quickViewModal')" title="الرجوع لصفحة المنتجات الرئيسية">
        <span>← العودة لصفحة الأجهزة الرئيسية</span>
      </button>

      <div class="qv-breadcrumbs">
        <span>الرئيسية</span>
        <span>/</span>
        <span>${catName}</span>
        <span>/</span>
        <span class="crumb-current">${prod.title}</span>
      </div>

      <button type="button" class="btn-qv-close" onclick="closeModal('quickViewModal')" aria-label="إغلاق المعاينة" title="إغلاق">
        ✕
      </button>
    </header>

    <!-- Main Content Container -->
    <main class="qv-main-wrapper">
      <div class="qv-showcase-grid">
        
        <!-- Right Column: Media Showcase & Image Slider -->
        <div class="qv-media-col">
          <div class="qv-img-showcase" id="qvImgShowcase">
            <div class="qv-media-badges">
              ${badgeHtml}
            </div>

            ${gallery.length > 1 ? `
              <div class="qv-slide-counter-badge" id="qvSlideCounterBadge">
                📸 ${primaryIdx + 1} / ${gallery.length}
              </div>

              <!-- Slider Overlaid Arrows -->
              <button type="button" class="qv-slide-nav-btn prev-btn" onclick="changeQvSlide(-1)" aria-label="الصورة السابقة" title="الصورة السابقة">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
              <button type="button" class="qv-slide-nav-btn next-btn" onclick="changeQvSlide(1)" aria-label="الصورة التالية" title="الصورة التالية">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
            ` : ''}

            <div class="qv-slide-viewport">
              <img 
                id="qvMainGalleryImg"
                src="${gallery[primaryIdx] || prod.image}" 
                alt="${escapeHtml(prod.title)}" 
                class="qv-main-img" 
                onerror="this.src='https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80'"
              >
            </div>
          </div>

          <!-- Thumbnails Strip -->
          ${gallery.length > 1 ? `
            <div class="qv-thumbnails-strip" id="qvThumbnailsStrip">
              ${gallery.map((imgSrc, idx) => `
                <button 
                  type="button" 
                  class="qv-thumb-item ${idx === primaryIdx ? 'active' : ''}" 
                  onclick="setQvSlide(${idx})"
                  title="صورة ${idx + 1}"
                >
                  <img src="${imgSrc}" alt="صورة ${idx + 1}" onerror="this.src='https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=200&q=80'">
                  ${idx === primaryIdx ? '<span class="qv-thumb-primary-dot" title="صورة الغلاف الأساسية">👑</span>' : ''}
                </button>
              `).join('')}
            </div>
          ` : ''}

          <div class="qv-media-actions">
            ${prod.youtubeId ? `
              <button 
                type="button" 
                class="btn-qv-yt" 
                onclick="openYouTubeModal('${prod.youtubeId}', '${escapeHtml(prod.title)}', '${prod.id}')"
              >
                <span>🎬 شاهد ريفيو الجهاز بالفيديو على يوتيوب</span>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Left Column: Full Product Details, Pricing, Deposit Breakdown, Specs & Actions -->
        <div class="qv-details-col">
          
          <div class="qv-header-info">
            <div class="qv-meta-tags">
              <span class="qv-cat-badge">🏷️ قسم: ${catName}</span>
            </div>

            <h1 class="qv-product-title">${prod.title}</h1>
          </div>

          <!-- Prominent Total Price Display -->
          <div class="qv-total-price-hero">
            <div class="qv-price-hero-body">
              <div class="qv-price-hero-main">
                <span class="qv-price-number">${formatMoney(prod.price)}</span>
                <span class="qv-price-currency">ج.م</span>
              </div>

              ${prod.oldPrice && prod.oldPrice > prod.price ? `
                <div class="qv-price-hero-discount-group">
                  <div class="qv-price-hero-old">${formatMoney(prod.oldPrice)} ج.م</div>
                  <div class="qv-price-hero-save-badge">
                    <span>🔥 وفرت</span>
                    <strong>${formatMoney(discountAmount)} ج.م</strong>
                    <small>(${discountPercent}% خصم)</small>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Payment Breakdown (العربون والمتبقي كاش) -->
          <div class="qv-deposit-card">
            <div class="qv-deposit-header">
              <h4>💳 تفاصيل نظام الدفع والاستلام الذكي</h4>
              <small>سدد العربون أونلاين لتأكيد الحجز، والمتبقي كاش عند الاستلام</small>
            </div>
            
            <div class="qv-deposit-grid">
              <div class="qv-deposit-pill online">
                <div class="pill-icon">💳</div>
                <div class="pill-text">
                  <small>العربون المطلوب بالفيزا (أونلاين)</small>
                  <strong>${formatMoney(deposit)} ج.م</strong>
                </div>
              </div>

              <div class="qv-deposit-pill cash">
                <div class="pill-icon">💵</div>
                <div class="pill-text">
                  <small>المتبقي كاش عند الاستلام</small>
                  <strong>${formatMoney(remaining)} ج.م</strong>
                </div>
              </div>
            </div>

            <p class="qv-deposit-note">
              💡 يُدفع العربون لتأكيد الحجز، ويُسدد المبلغ المتبقي كاش للمندوب بعد الفحص والمعاينة الكاملة للجهاز قبل الاستلام.
            </p>
          </div>

          <!-- Full Description Box -->
          <div class="qv-section-box">
            <h4>📖 تفاصيل ووصف الجهاز</h4>
            <p class="qv-desc-text">
              ${prod.description || 'جهاز أصلي ومعتمد 100% مع ضمان رسمي من الوكيل المعتمد، مطابق لأعلى مواصفات الجودة وتوفير الطاقة.'}
            </p>
          </div>

          <!-- Key Specs Box -->
          <div class="qv-section-box">
            <h4>⚙️ أبرز المواصفات الفنية والمميزات</h4>
            <div class="qv-specs-grid">
              ${prod.specs && prod.specs.length > 0 ? prod.specs.map(s => `
                <div class="qv-spec-item">
                  <span class="check-icon">✓</span>
                  <span>${s}</span>
                </div>
              `).join('') : `
                <div class="qv-spec-item">
                  <span class="check-icon">✓</span>
                  <span>ضمان الوكيل المعتمد 100%</span>
                </div>
              `}
            </div>
          </div>

          <!-- Action Buttons Row -->
          <div class="qv-actions-box">
            ${isOut ? `
              <button 
                type="button" 
                class="btn-add-cart btn-out-of-stock btn-qv-add-cart" 
                disabled
              >
                <span>🚫 غير متوفر حالياً بالمخزن</span>
              </button>
            ` : `
              <button 
                type="button" 
                class="btn-add-cart btn-qv-add-cart" 
                onclick="addToCart('${prod.id}'); closeModal('quickViewModal');"
              >
                <span>🛒 أضف للسلة واحجز الآن</span>
              </button>
            `}

            <button 
              type="button" 
              class="btn-qv-return" 
              onclick="closeModal('quickViewModal')"
            >
              <span>↩️ العودة لصفحة المتجر ومتابعة التسوق</span>
            </button>
          </div>

          <!-- Trust Badges -->
          <div class="qv-trust-bar">
            <div class="qv-trust-item">🛡️ ضمان الوكيل المعتمد</div>
            <div class="qv-trust-item">🚚 شحن سريع لكافة المحافظات</div>
            <div class="qv-trust-item">🔄 الفحص والمعاينة قبل السداد</div>
          </div>

        </div>

      </div>

      <!-- Related Products Section (الأجهزة المشابهة) -->
      <section class="qv-related-section" id="qvRelatedSection">
        <div class="qv-related-header">
          <div class="qv-related-title-wrap">
            <div class="qv-related-icon-box">✨</div>
            <div>
              <h3 class="qv-related-title">الأجهزة المشابهة والعروض المقترحة</h3>
              <p class="qv-related-subtitle">أجهزة أخرى مميزة من قسم "${catName}" قد تناسب رغبتك واحتياجك</p>
            </div>
          </div>
          
          ${relatedProducts.length > 1 ? `
          <div class="qv-related-nav-controls">
            <button 
              type="button" 
              class="qv-related-scroll-btn" 
              onclick="scrollQvRelated('right')" 
              aria-label="تمرير لليمين" 
              title="السابق"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            <button 
              type="button" 
              class="qv-related-scroll-btn" 
              onclick="scrollQvRelated('left')" 
              aria-label="تمرير لليسار" 
              title="التالي"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          </div>
          ` : ''}
        </div>

        <div class="qv-related-slider-container">
          <div class="qv-related-track" id="qvRelatedTrack">
            ${relatedCardsHtml}
          </div>
        </div>
      </section>

    </main>
  `;

  openModal('quickViewModal');
  const modal = document.getElementById('quickViewModal');
  if (modal) {
    modal.scrollTop = 0;
    modal.style.setProperty('display', 'block', 'important');
    modal.style.setProperty('align-items', 'flex-start', 'important');
    modal.style.setProperty('justify-content', 'flex-start', 'important');
  }
  const container = document.getElementById('quickViewContainer');
  if (container) container.scrollTop = 0;

  // Touch Swipe Support on Showcase
  const showcaseEl = document.getElementById('qvImgShowcase');
  if (showcaseEl && gallery.length > 1) {
    let touchStartX = 0;
    let touchEndX = 0;
    showcaseEl.addEventListener('touchstart', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        touchStartX = e.changedTouches[0].screenX;
      }
    }, { passive: true });

    showcaseEl.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        touchEndX = e.changedTouches[0].screenX;
        const diff = touchStartX - touchEndX;
        if (Math.abs(diff) > 40) {
          if (diff > 0) {
            changeQvSlide(1);
          } else {
            changeQvSlide(-1);
          }
        }
      }
    }, { passive: true });
  }
}
window.openQuickView = openQuickView;

// --------------------------------------------------------------------------
// 12. Admin Management Panel Logic (Orders, Products CRUD, Filters CRUD)
// --------------------------------------------------------------------------

// --- Tab 1: Orders Table ---
function updateAdminOrdersTable() {
  const tbody = document.getElementById('adminOrdersTableBody');
  const emptyState = document.getElementById('adminNoOrdersState');
  const badge = document.getElementById('adminOrdersCount');

  if (badge) badge.textContent = AppState.orders.length;
  if (!tbody) return;

  if (AppState.orders.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.hidden = false;
    return;
  }

  if (emptyState) emptyState.hidden = true;

  const searchInput = document.getElementById('adminOrderSearch');
  const searchQuery = (searchInput ? searchInput.value : '').trim().toLowerCase();

  const filteredOrders = AppState.orders.filter(ord => {
    if (!ord) return false;
    if (!searchQuery) return true;
    const name = ord.customer?.name?.toLowerCase() || '';
    const phone = ord.customer?.phone || '';
    const id = ord.id?.toLowerCase() || '';
    return id.includes(searchQuery) || name.includes(searchQuery) || phone.includes(searchQuery);
  });

  tbody.innerHTML = filteredOrders.map(order => {
    const isFull = order.paymentMode === 'full' || (order.financials && order.financials.isFullPayment);
    const paymentModeLabel = isFull 
      ? '<span class="badge-stock-available" style="background:#E8F5E9; color:#2E7D32;">⚡ دفع كامل (100%)</span>' 
      : '<span class="badge-stock-available">💳 عربون حجز</span>';

    const finalTotal = order.financials?.finalTotal ?? order.total ?? 0;
    const payNow = order.financials?.payNow ?? order.deposit ?? 0;
    const remainingCash = order.financials?.remainingCash ?? order.remaining ?? 0;
    const custName = order.customer?.name || 'عميل';
    const custPhone = order.customer?.phone || '-';
    const custGov = order.customer?.governorate || '-';

    return `
      <tr>
        <td><strong class="text-brand">${order.id}</strong></td>
        <td>
          <div>${custName}</div>
          <small style="color:var(--text-muted);">${custPhone} - ${custGov}</small>
        </td>
        <td>${paymentModeLabel}</td>
        <td><strong>${formatMoney(finalTotal)} ج.م</strong></td>
        <td><span class="text-green font-bold">${formatMoney(payNow)} ج.م</span></td>
        <td><span class="text-pink-deep">${formatMoney(remainingCash)} ج.م</span></td>
        <td>
          <select class="status-select" onchange="changeOrderStatus('${order.id}', this.value)">
            <option value="تم تأكيد الحجز ودفع العربون" ${order.status === 'تم تأكيد الحجز ودفع العربون' ? 'selected' : ''}>تم دفع العربون ✅</option>
            <option value="تم الدفع بالكامل بالفيزا (100%)" ${order.status === 'تم الدفع بالكامل بالفيزا (100%)' ? 'selected' : ''}>تم الدفع 100% ⚡</option>
            <option value="جاري التجهيز والشحن" ${order.status === 'جاري التجهيز والشحن' ? 'selected' : ''}>جاري التجهيز 🚚</option>
            <option value="تم التوصيل بنجاح" ${order.status === 'تم التوصيل بنجاح' ? 'selected' : ''}>تم التوصيل 🎉</option>
            <option value="ملغي" ${order.status === 'ملغي' ? 'selected' : ''}>ملغي ✕</option>
          </select>
        </td>
        <td>
          <button 
            type="button" 
            class="btn-icon-action" 
            onclick="viewAdminReceipt('${order.id}')" 
            title="عرض الفاتورة المعتمدة"
          >
            📄
          </button>
        </td>
      </tr>
    `;
  }).join('');
}
window.updateAdminOrdersTable = updateAdminOrdersTable;

function changeOrderStatus(orderId, newStatus) {
  const ord = AppState.orders.find(o => o && o.id === orderId);
  if (ord) {
    ord.status = newStatus;
    saveOrdersToStorage();
    showToast(`تم تحديث حالة الطلب ${orderId} بنجاح`, 'info');
    updateAdminAnalytics();
  }
}
window.changeOrderStatus = changeOrderStatus;

function viewAdminReceipt(orderId) {
  const ord = AppState.orders.find(o => o && o.id === orderId);
  if (!ord) return;

  closeModal('adminModal');
  renderPrintableReceipt(ord);
  setCheckoutStep(3);
  openModal('checkoutModal');
}
window.viewAdminReceipt = viewAdminReceipt;

// --- Tab 2: Products Management (Edit, Delete, Stock Availability) ---
function updateAdminProductsTable() {
  const tbody = document.getElementById('adminProductsTableBody');
  const emptyState = document.getElementById('adminNoProductsState');
  const badge = document.getElementById('adminProductsCount');

  if (badge) badge.textContent = AppState.products.length;
  if (!tbody) return;

  const searchInput = document.getElementById('adminProductSearch');
  const searchQuery = (searchInput ? searchInput.value : '').trim().toLowerCase();
  const catFilterEl = document.getElementById('adminProductCatFilter');
  const catFilter = catFilterEl ? catFilterEl.value : 'all';

  let list = [...AppState.products];

  if (catFilter !== 'all') {
    list = list.filter(p => p && p.category === catFilter);
  }

  if (searchQuery) {
    list = list.filter(p => p && p.title.toLowerCase().includes(searchQuery));
  }

  if (list.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) {
      emptyState.hidden = false;
      emptyState.style.display = 'block';
      if (AppState.products.length === 0) {
        emptyState.innerHTML = `
          <p style="font-size:15px; font-weight:700; color:var(--text-main); margin-bottom:8px;">📦 لا توجد أجهزة مضافة حتى الآن في المتجر.</p>
          <p style="font-size:13px; color:var(--text-muted); margin-bottom:14px;">ابدأ بإضافة أول جهاز مع تحديد السعر، الصورة، والعربون المطلوب.</p>
          <button type="button" class="btn-save-product" style="width:auto; margin:0 auto; padding:10px 22px; font-size:13.5px;" onclick="switchAdminTab('addProductTab')">
            <span>➕ إضافة جهاز جديد الآن</span>
          </button>
        `;
      } else {
        emptyState.innerHTML = `<p>لا توجد أجهزة مطابقة لخيارات البحث المحددة.</p>`;
      }
    }
    return;
  }

  if (emptyState) {
    emptyState.hidden = true;
    emptyState.style.display = 'none';
  }

  tbody.innerHTML = list.map(prod => {
    if (!prod) return '';
    const isAvailable = prod.isAvailable !== false;
    const catName = getCategoryName(prod.category);
    const deposit = getProductDeposit(prod);
    const shipping = getProductShipping(prod);

    return `
      <tr>
        <td>
          <div class="admin-product-cell">
            <img src="${prod.image}" alt="" class="admin-prod-thumb" onerror="this.src='https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=100&q=80'">
            <div class="admin-prod-title-text" title="${prod.title}">${prod.title}</div>
          </div>
        </td>
        <td>${catName}</td>
        <td><strong>${formatMoney(prod.price)} ج.م</strong></td>
        <td><span class="text-green font-bold">${formatMoney(deposit)} ج.م</span></td>
        <td><span>${shipping > 0 ? `${formatMoney(shipping)} ج.م` : 'مجاناً'}</span></td>
        <td>
          ${isAvailable ? `
            <span class="badge-stock-available">متوفر بالمخزن ✅</span>
          ` : `
            <span class="badge-stock-out">غير متوفر حالياً 🚫</span>
          `}
        </td>
        <td>
          <div class="table-actions-cell">
            <button 
              type="button" 
              class="btn-action-stock" 
              onclick="toggleProductAvailability('${prod.id}')"
              title="${isAvailable ? 'تعيين كغير متوفر حالياً في المخزن' : 'تعيين كمتوفر في المخزن'}"
            >
              ${isAvailable ? '🚫 عدم توفر المنتج' : '✅ تفعيل التوفر'}
            </button>
            <button 
              type="button" 
              class="btn-action-edit" 
              onclick="openEditProductModal('${prod.id}')"
              title="تعديل بيانات الجهاز"
            >
              ✏️ تعديل
            </button>
            <button 
              type="button" 
              class="btn-action-delete" 
              onclick="deleteProduct('${prod.id}')"
              title="حذف الجهاز من المتجر"
            >
              🗑️ مسح
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}
window.updateAdminProductsTable = updateAdminProductsTable;

function toggleProductAvailability(productId) {
  const prod = AppState.products.find(p => p && p.id === productId);
  if (!prod) return;

  prod.isAvailable = !(prod.isAvailable !== false);
  saveProductsToStorage();

  renderProducts();
  renderNewlyAddedProducts();
  updateAdminProductsTable();

  const msg = prod.isAvailable 
    ? `تم تفعيل توفر الجهاز في المخزن ✅` 
    : `تم تعيين الجهاز كـ "غير متوفر حالياً بالمخزن" 🚫`;
  showToast(msg, 'info');
}
window.toggleProductAvailability = toggleProductAvailability;

function deleteProduct(productId) {
  const prod = AppState.products.find(p => p && p.id === productId);
  if (!prod) return;

  if (confirm(`هل أنت متأكد تماماً من حذف "${prod.title.slice(0, 35)}..." من المتجر؟`)) {
    AppState.products = AppState.products.filter(p => p && p.id !== productId);
    AppState.cart = AppState.cart.filter(p => p && p.id !== productId);

    saveProductsToStorage();
    saveCartToStorage();

    renderCategoryNav();
    renderProducts();
    renderNewlyAddedProducts();
    updateCartUI();
    updateAdminProductsTable();
    updateAdminCategoriesTable();

    showToast('تم مسح الجهاز بنجاح من المتجر', 'success');
  }
}
window.deleteProduct = deleteProduct;

// --------------------------------------------------------------------------
// Multi-Image Gallery State & Helper Functions (Admin Panel & Products)
// --------------------------------------------------------------------------
window.AdminGalleryState = {
  new: {
    images: [],
    primaryIndex: 0
  },
  edit: {
    images: [],
    primaryIndex: 0
  }
};

function switchImageTab(prefix, tab) {
  const uploadTab = document.getElementById(`${prefix}ImgTabUpload`);
  const urlTab = document.getElementById(`${prefix}ImgTabUrl`);
  const dropzone = document.getElementById(`${prefix}ProdDropzone`);
  const urlPane = document.getElementById(`${prefix}ProdUrlPane`);

  if (tab === 'upload') {
    if (uploadTab) uploadTab.classList.add('active');
    if (urlTab) urlTab.classList.remove('active');
    if (urlPane) urlPane.style.display = 'none';
    if (dropzone) dropzone.style.display = 'block';
  } else {
    if (uploadTab) uploadTab.classList.remove('active');
    if (urlTab) urlTab.classList.add('active');
    if (dropzone) dropzone.style.display = 'none';
    if (urlPane) urlPane.style.display = 'block';
  }
}
window.switchImageTab = switchImageTab;

function renderAdminGallery(prefix) {
  const state = AdminGalleryState[prefix];
  if (!state) return;

  const grid = document.getElementById(`${prefix}ProdGalleryGrid`);
  const countBadge = document.getElementById(`${prefix}ProdGalleryCountBadge`);
  const hiddenVal = document.getElementById(`${prefix}ProdImgValue`);

  if (countBadge) {
    countBadge.textContent = `🖼️ ألبوم الصور (${state.images.length} صور)`;
  }

  // Ensure primaryIndex is within valid range
  if (state.primaryIndex >= state.images.length) {
    state.primaryIndex = Math.max(0, state.images.length - 1);
  }

  // Sync hidden input with primary image
  const primarySrc = state.images[state.primaryIndex] || state.images[0] || '';
  if (hiddenVal) hiddenVal.value = primarySrc;

  if (!grid) return;

  if (state.images.length === 0) {
    grid.innerHTML = `
      <div class="gallery-empty-msg">
        <span>📷 لم يتم إضافة أي صور للجهاز حتى الآن.</span>
        <br><small style="color:var(--text-muted);">ارفع صور من جهازك أو أضف روابط صور للألبوم.</small>
      </div>
    `;
    return;
  }

  grid.innerHTML = state.images.map((src, idx) => {
    const isPrimary = idx === state.primaryIndex;
    const isFirst = idx === 0;
    const isLast = idx === state.images.length - 1;

    return `
      <div class="admin-gallery-card ${isPrimary ? 'is-primary' : ''}">
        <div class="gallery-card-thumb-wrap">
          <img src="${src}" alt="صورة ${idx + 1}" class="gallery-card-thumb" onerror="this.src='https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=300&q=80'">
          ${isPrimary ? `<span class="gallery-card-primary-tag">👑 الغلاف</span>` : ''}
          <span class="gallery-card-index-tag">#${idx + 1}</span>
        </div>
        
        <div class="gallery-card-actions">
          ${!isPrimary ? `
            <button type="button" class="btn-make-primary" onclick="setGalleryPrimary('${prefix}', ${idx})" title="تعيين هذه الصورة كغلاف رئيسي للجهاز">
              ⭐ تعيين كغلاف
            </button>
          ` : `
            <div style="font-size:10.5px; font-weight:800; color:#D97706; text-align:center; padding:3px 0;">
              👑 الصورة الرئيسية
            </div>
          `}

          <div class="gallery-card-btn-row">
            <button type="button" class="btn-gallery-action" onclick="moveGalleryImage('${prefix}', ${idx}, -1)" ${isFirst ? 'disabled' : ''} title="تحريك للخلف (ترتيب سابق)">
              ➡️
            </button>
            <button type="button" class="btn-gallery-action" onclick="moveGalleryImage('${prefix}', ${idx}, 1)" ${isLast ? 'disabled' : ''} title="تحريك للأمام (ترتيب لاحق)">
              ⬅️
            </button>
            <button type="button" class="btn-gallery-action delete" onclick="deleteGalleryImage('${prefix}', ${idx})" title="حذف هذه الصورة من الألبوم">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}
window.renderAdminGallery = renderAdminGallery;

function setGalleryPrimary(prefix, index) {
  const state = AdminGalleryState[prefix];
  if (!state || index < 0 || index >= state.images.length) return;
  state.primaryIndex = index;
  renderAdminGallery(prefix);
  showToast(`تم تعيين الصورة #${index + 1} كصورة الغلاف الأساسية للجهاز 👑`, 'info');
}
window.setGalleryPrimary = setGalleryPrimary;

function moveGalleryImage(prefix, fromIndex, direction) {
  const state = AdminGalleryState[prefix];
  if (!state) return;
  const toIndex = fromIndex + direction;
  if (toIndex < 0 || toIndex >= state.images.length) return;

  // Swap elements
  const temp = state.images[fromIndex];
  state.images[fromIndex] = state.images[toIndex];
  state.images[toIndex] = temp;

  // Adjust primaryIndex if moved
  if (state.primaryIndex === fromIndex) {
    state.primaryIndex = toIndex;
  } else if (state.primaryIndex === toIndex) {
    state.primaryIndex = fromIndex;
  }

  renderAdminGallery(prefix);
}
window.moveGalleryImage = moveGalleryImage;

function deleteGalleryImage(prefix, index) {
  const state = AdminGalleryState[prefix];
  if (!state || index < 0 || index >= state.images.length) return;

  state.images.splice(index, 1);
  if (state.primaryIndex >= state.images.length) {
    state.primaryIndex = Math.max(0, state.images.length - 1);
  }
  renderAdminGallery(prefix);
  showToast('تمت إزالة الصورة من ألبوم الجهاز 🗑️', 'info');
}
window.deleteGalleryImage = deleteGalleryImage;

function clearAdminGallery(prefix) {
  const state = AdminGalleryState[prefix];
  if (!state || state.images.length === 0) return;
  if (confirm('هل أنت متأكد من مسح جميع الصور من هذا المعرض؟')) {
    state.images = [];
    state.primaryIndex = 0;
    renderAdminGallery(prefix);
    showToast('تم مسح جميع الصور من الألبوم 🗑️', 'info');
  }
}
window.clearAdminGallery = clearAdminGallery;

function addImageUrlToGallery(prefix) {
  const input = document.getElementById(`${prefix}ProdImg`);
  if (!input) return;
  const url = input.value.trim();
  if (!url || (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:'))) {
    showToast('يرجى كتابة رابط صورة مباشر وصحيح!', 'warning');
    return;
  }

  const state = AdminGalleryState[prefix];
  if (!state) return;

  state.images.push(url);
  input.value = '';
  renderAdminGallery(prefix);
  showToast('تمت إضافة الصورة إلى ألبوم الجهاز بنجاح ✅', 'success');
}
window.addImageUrlToGallery = addImageUrlToGallery;

function processMultipleImageFiles(files, prefix = 'new') {
  if (!files || files.length === 0) return;
  const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
  if (validFiles.length === 0) {
    showToast('يرجى اختيار ملفات صور صالحة (JPG, PNG, WEBP)', 'warning');
    return;
  }

  let processedCount = 0;
  validFiles.forEach(file => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const rawDataUrl = e.target.result;
      const img = new Image();
      img.onload = function() {
        const maxWidth = 1000;
        const maxHeight = 1000;
        let width = img.width;
        let height = img.height;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        AdminGalleryState[prefix].images.push(optimizedDataUrl);
        processedCount++;
        if (processedCount === validFiles.length) {
          renderAdminGallery(prefix);
          showToast(`تم تحميل وضغط ${validFiles.length} صور بنجاح إلى المعرض ✅`, 'success');
        }
      };
      img.onerror = function() {
        AdminGalleryState[prefix].images.push(rawDataUrl);
        processedCount++;
        if (processedCount === validFiles.length) {
          renderAdminGallery(prefix);
          showToast(`تمت إضافة ${validFiles.length} صور إلى المعرض ✅`, 'success');
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

function initImageUploadListeners(prefix) {
  const fileInput = document.getElementById(`${prefix}ProdImgFile`);
  const dropzone = document.getElementById(`${prefix}ProdDropzone`);
  const urlInput = document.getElementById(`${prefix}ProdImg`);

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        processMultipleImageFiles(e.target.files, prefix);
        e.target.value = '';
      }
    });
  }

  if (dropzone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      }, false);
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        processMultipleImageFiles(dt.files, prefix);
      }
    }, false);
  }

  if (urlInput) {
    urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addImageUrlToGallery(prefix);
      }
    });
  }
}

function openEditProductModal(productId) {
  const prod = AppState.products.find(p => p && p.id === productId);
  if (!prod) return;

  populateCategorySelects();

  const editProdId = document.getElementById('editProdId');
  const editProdTitle = document.getElementById('editProdTitle');
  const editProdCategory = document.getElementById('editProdCategory');
  const editProdPrice = document.getElementById('editProdPrice');
  const editProdOldPrice = document.getElementById('editProdOldPrice');
  const editProdDeposit = document.getElementById('editProdDeposit');
  const editProdShipping = document.getElementById('editProdShipping');
  const editProdAvailable = document.getElementById('editProdAvailable');
  const editProdBadge = document.getElementById('editProdBadge');
  const editProdYt = document.getElementById('editProdYt');
  const editProdSpecs = document.getElementById('editProdSpecs');

  if (editProdId) editProdId.value = prod.id;
  if (editProdTitle) editProdTitle.value = prod.title;
  if (editProdCategory) editProdCategory.value = prod.category;
  if (editProdPrice) editProdPrice.value = prod.price;
  if (editProdOldPrice) editProdOldPrice.value = prod.oldPrice || '';
  if (editProdDeposit) editProdDeposit.value = prod.depositAmount || '';
  if (editProdShipping) editProdShipping.value = prod.shippingFee !== undefined ? prod.shippingFee : 0;
  if (editProdAvailable) editProdAvailable.value = prod.isAvailable !== false ? 'true' : 'false';
  if (editProdBadge) editProdBadge.value = prod.badge || '';
  if (editProdYt) editProdYt.value = prod.youtubeId || '';
  if (editProdSpecs) editProdSpecs.value = prod.specs ? prod.specs.join(', ') : '';

  // Setup gallery images for existing product
  const existingImages = (Array.isArray(prod.images) && prod.images.length > 0)
    ? [...prod.images]
    : (prod.image ? [prod.image] : []);
  
  AdminGalleryState['edit'].images = existingImages;
  AdminGalleryState['edit'].primaryIndex = (typeof prod.primaryImageIndex === 'number' && prod.primaryImageIndex >= 0 && prod.primaryImageIndex < existingImages.length)
    ? prod.primaryImageIndex
    : 0;

  renderAdminGallery('edit');
  switchImageTab('edit', 'upload');

  openModal('editProductModal');
}
window.openEditProductModal = openEditProductModal;

function handleEditProductSubmit(e) {
  e.preventDefault();

  const id = document.getElementById('editProdId')?.value;
  const prod = AppState.products.find(p => p && p.id === id);
  if (!prod) return;

  const title = document.getElementById('editProdTitle')?.value.trim();
  const category = document.getElementById('editProdCategory')?.value;
  const price = parseFloat(document.getElementById('editProdPrice')?.value);
  const oldPrice = parseFloat(document.getElementById('editProdOldPrice')?.value) || null;
  const depositVal = parseFloat(document.getElementById('editProdDeposit')?.value);
  const shippingVal = parseFloat(document.getElementById('editProdShipping')?.value);
  const isAvailable = document.getElementById('editProdAvailable')?.value === 'true';
  const badge = document.getElementById('editProdBadge')?.value || null;
  const ytInput = document.getElementById('editProdYt')?.value.trim() || '';
  const specsStr = document.getElementById('editProdSpecs')?.value.trim() || '';

  const gallery = AdminGalleryState['edit'].images;
  if (!title || isNaN(price) || gallery.length === 0) {
    showToast('يرجى التأكد من ملء جميع الحقول المطلوبة وإضافة صورة واحدة على الأقل للجهاز!', 'warning');
    return;
  }

  const primaryIdx = (typeof AdminGalleryState['edit'].primaryIndex === 'number' && AdminGalleryState['edit'].primaryIndex >= 0 && AdminGalleryState['edit'].primaryIndex < gallery.length)
    ? AdminGalleryState['edit'].primaryIndex
    : 0;
  const primaryImage = gallery[primaryIdx] || gallery[0];

  let youtubeId = ytInput;
  if (ytInput.includes('v=')) {
    youtubeId = ytInput.split('v=')[1].split('&')[0];
  } else if (ytInput.includes('youtu.be/')) {
    youtubeId = ytInput.split('youtu.be/')[1].split('?')[0];
  }

  const specs = specsStr ? specsStr.split(',').map(s => s.trim()).filter(Boolean) : ['ضمان الوكيل المعتمد'];

  // Update product object
  prod.title = title;
  prod.category = category;
  prod.price = price;
  prod.oldPrice = oldPrice;
  prod.depositAmount = !isNaN(depositVal) && depositVal > 0 ? depositVal : Math.round(price * 0.20);
  prod.shippingFee = !isNaN(shippingVal) && shippingVal >= 0 ? shippingVal : 0;
  prod.isAvailable = isAvailable;
  prod.badge = badge;
  prod.images = gallery;
  prod.primaryImageIndex = primaryIdx;
  prod.image = primaryImage;
  prod.youtubeId = youtubeId || null;
  prod.specs = specs;
  prod.description = title;

  // Also update cart item if product is currently in cart
  const cartItem = AppState.cart.find(item => item && item.id === id);
  if (cartItem) {
    cartItem.title = title;
    cartItem.price = price;
    cartItem.depositAmount = prod.depositAmount;
    cartItem.shippingFee = prod.shippingFee;
    cartItem.image = primaryImage;
    saveCartToStorage();
    updateCartUI();
  }

  saveProductsToStorage();

  renderCategoryNav();
  renderProducts();
  renderNewlyAddedProducts();
  updateAdminProductsTable();
  updateAdminCategoriesTable();

  closeModal('editProductModal');
  showToast(`تم حفظ تعديلات الجهاز "${title.slice(0, 25)}..." بنجاح! ✅`, 'success');
}

function handleAddProductSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('newProdTitle')?.value.trim();
  const category = document.getElementById('newProdCategory')?.value;
  const price = parseFloat(document.getElementById('newProdPrice')?.value);
  const oldPrice = parseFloat(document.getElementById('newProdOldPrice')?.value) || null;
  const depositVal = parseFloat(document.getElementById('newProdDeposit')?.value);
  const shippingVal = parseFloat(document.getElementById('newProdShipping')?.value);
  const isAvailable = document.getElementById('newProdAvailable')?.value === 'true';
  const badge = document.getElementById('newProdBadge')?.value;
  const youtubeInput = document.getElementById('newProdYt')?.value.trim() || '';
  const specsStr = document.getElementById('newProdSpecs')?.value.trim() || '';

  const gallery = AdminGalleryState['new'].images;
  if (!title || isNaN(price) || gallery.length === 0) {
    showToast('يرجى ملء جميع الحقول المطلوبة وإضافة صورة واحدة على الأقل للجهاز في المعرض!', 'warning');
    return;
  }

  const primaryIdx = (typeof AdminGalleryState['new'].primaryIndex === 'number' && AdminGalleryState['new'].primaryIndex >= 0 && AdminGalleryState['new'].primaryIndex < gallery.length)
    ? AdminGalleryState['new'].primaryIndex
    : 0;
  const primaryImage = gallery[primaryIdx] || gallery[0];

  let youtubeId = youtubeInput;
  if (youtubeInput.includes('v=')) {
    youtubeId = youtubeInput.split('v=')[1].split('&')[0];
  } else if (youtubeInput.includes('youtu.be/')) {
    youtubeId = youtubeInput.split('youtu.be/')[1].split('?')[0];
  }

  const specs = specsStr ? specsStr.split(',').map(s => s.trim()).filter(Boolean) : ['ضمان الوكيل المعتمد'];

  const newProd = {
    id: 'prod-custom-' + Date.now(),
    title,
    category,
    price,
    oldPrice,
    depositAmount: !isNaN(depositVal) && depositVal > 0 ? depositVal : Math.round(price * 0.20),
    shippingFee: !isNaN(shippingVal) && shippingVal >= 0 ? shippingVal : 0,
    isAvailable,
    badge: badge || null,
    images: gallery,
    primaryImageIndex: primaryIdx,
    image: primaryImage,
    youtubeId: youtubeId || null,
    specs,
    description: title,
    createdAt: new Date().toISOString()
  };

  AppState.products.unshift(newProd);
  saveProductsToStorage();

  renderCategoryNav();
  renderProducts();
  renderNewlyAddedProducts();
  updateAdminProductsTable();
  updateAdminCategoriesTable();

  showToast(`تمت إضافة "${title.slice(0, 25)}..." إلى كتالوج المتجر بنجاح! 🎉`, 'success');
  e.target.reset();
  AdminGalleryState['new'].images = [];
  AdminGalleryState['new'].primaryIndex = 0;
  renderAdminGallery('new');

  // Switch to products tab
  const productsTabBtn = document.getElementById('tabProductsBtn');
  if (productsTabBtn) productsTabBtn.click();
}

// --- Tab 4: Categories & Filters Management ---
function updateAdminCategoriesTable() {
  const tbody = document.getElementById('adminCategoriesTableBody');
  const badge = document.getElementById('adminCategoriesCount');

  if (badge) badge.textContent = AppState.categories.length;
  if (!tbody) return;

  tbody.innerHTML = AppState.categories.map((cat, index) => {
    if (!cat) return '';
    const count = AppState.products.filter(p => p && p.category === cat.id).length;
    const isFirst = index === 0;
    const isLast = index === AppState.categories.length - 1;

    return `
      <tr>
        <td>
          <div class="order-reorder-cell">
            <button 
              type="button" 
              class="btn-order-move btn-move-up" 
              onclick="moveCategoryUp('${cat.id}')" 
              title="تحريك لأعلى" 
              ${isFirst ? 'disabled' : ''}
            >
              ⬆️
            </button>
            <span class="order-num-badge">${index + 1}</span>
            <button 
              type="button" 
              class="btn-order-move btn-move-down" 
              onclick="moveCategoryDown('${cat.id}')" 
              title="تحريك لأسفل" 
              ${isLast ? 'disabled' : ''}
            >
              ⬇️
            </button>
          </div>
        </td>
        <td style="font-size:20px;">${cat.icon || '🏷️'}</td>
        <td><strong>${cat.name}</strong></td>
        <td><code>${cat.id}</code></td>
        <td><span class="tab-badge">${count} أجهزة</span></td>
        <td>
          <div class="table-actions-cell">
            <button 
              type="button" 
              class="btn-action-edit" 
              onclick="openEditCategoryModal('${cat.id}')"
              title="تعديل القسم والفلتر"
            >
              ✏️ تعديل
            </button>
            <button 
              type="button" 
              class="btn-action-delete" 
              onclick="deleteCategory('${cat.id}')"
              title="حذف القسم والفلتر"
            >
              🗑️ مسح
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}
window.updateAdminCategoriesTable = updateAdminCategoriesTable;

function moveCategoryUp(catId) {
  const idx = AppState.categories.findIndex(c => c && c.id === catId);
  if (idx > 0) {
    const temp = AppState.categories[idx];
    AppState.categories[idx] = AppState.categories[idx - 1];
    AppState.categories[idx - 1] = temp;

    saveCategoriesToStorage();
    renderCategoryNav();
    populateCategorySelects();
    updateAdminCategoriesTable();
    showToast(`تم تحريك قسم "${temp.name}" للأعلى ⬆️`, 'success');
  }
}
window.moveCategoryUp = moveCategoryUp;

function moveCategoryDown(catId) {
  const idx = AppState.categories.findIndex(c => c && c.id === catId);
  if (idx !== -1 && idx < AppState.categories.length - 1) {
    const temp = AppState.categories[idx];
    AppState.categories[idx] = AppState.categories[idx + 1];
    AppState.categories[idx + 1] = temp;

    saveCategoriesToStorage();
    renderCategoryNav();
    populateCategorySelects();
    updateAdminCategoriesTable();
    showToast(`تم تحريك قسم "${temp.name}" للأسفل ⬇️`, 'success');
  }
}
window.moveCategoryDown = moveCategoryDown;

function handleAddCategorySubmit(e) {
  e.preventDefault();

  const name = document.getElementById('newCatName')?.value.trim();
  const icon = document.getElementById('newCatIcon')?.value.trim();
  let slug = document.getElementById('newCatSlug')?.value.trim().toLowerCase().replace(/\s+/g, '-');

  if (!name || !icon || !slug) {
    showToast('يرجى ملء جميع حقول القسم!', 'warning');
    return;
  }

  // Check unique slug
  if (AppState.categories.some(c => c && c.id === slug)) {
    slug = slug + '-' + Date.now().toString().slice(-4);
  }

  AppState.categories.push({
    id: slug,
    name,
    icon
  });

  saveCategoriesToStorage();

  renderCategoryNav();
  populateCategorySelects();
  updateAdminCategoriesTable();

  e.target.reset();
  showToast(`تمت إضافة قسم "${name}" بنجاح! 🎉`, 'success');
}

function openEditCategoryModal(catId) {
  const cat = AppState.categories.find(c => c && c.id === catId);
  if (!cat) return;

  const editCatId = document.getElementById('editCatId');
  const editCatName = document.getElementById('editCatName');
  const editCatIcon = document.getElementById('editCatIcon');

  if (editCatId) editCatId.value = cat.id;
  if (editCatName) editCatName.value = cat.name;
  if (editCatIcon) editCatIcon.value = cat.icon || '🏷️';

  openModal('editCategoryModal');
}
window.openEditCategoryModal = openEditCategoryModal;

function handleEditCategorySubmit(e) {
  e.preventDefault();

  const id = document.getElementById('editCatId')?.value;
  const name = document.getElementById('editCatName')?.value.trim();
  const icon = document.getElementById('editCatIcon')?.value.trim();

  const cat = AppState.categories.find(c => c && c.id === id);
  if (!cat) return;

  cat.name = name;
  cat.icon = icon;

  saveCategoriesToStorage();

  renderCategoryNav();
  populateCategorySelects();
  renderProducts();
  updateAdminCategoriesTable();
  updateAdminProductsTable();

  closeModal('editCategoryModal');
  showToast(`تم تعديل قسم "${name}" بنجاح! ✅`, 'success');
}

function deleteCategory(catId) {
  const cat = AppState.categories.find(c => c && c.id === catId);
  if (!cat) return;

  const count = AppState.products.filter(p => p && p.category === catId).length;
  if (count > 0) {
    if (!confirm(`هذا القسم يحتوي على ${count} أجهزة. هل ترغب في حذفه؟`)) {
      return;
    }
  } else {
    if (!confirm(`هل أنت متأكد من حذف قسم "${cat.name}"؟`)) {
      return;
    }
  }

  AppState.categories = AppState.categories.filter(c => c && c.id !== catId);
  if (AppState.currentCategory === catId) {
    AppState.currentCategory = 'all';
  }

  saveCategoriesToStorage();

  renderCategoryNav();
  populateCategorySelects();
  renderProducts();
  updateAdminCategoriesTable();

  showToast(`تم حذف قسم "${cat.name}" بنجاح`, 'info');
}
window.deleteCategory = deleteCategory;

// --- Tab 5: Analytics Overview ---
function updateAdminAnalytics() {
  const countEl = document.getElementById('analyticsOrdersCount');
  const depositEl = document.getElementById('analyticsDepositsTotal');
  const remainEl = document.getElementById('analyticsRemainingTotal');
  const revEl = document.getElementById('analyticsRevenueTotal');

  const orders = Array.isArray(AppState.orders) ? AppState.orders : [];
  const totalOrders = orders.length;
  const totalPaidOnline = orders.reduce((sum, o) => sum + (o?.financials?.payNow || o?.financials?.deposit || o?.deposit || 0), 0);
  const totalRemaining = orders.reduce((sum, o) => sum + (o?.financials?.remainingCash || o?.remaining || 0), 0);
  const totalRevenue = orders.reduce((sum, o) => sum + (o?.financials?.finalTotal || o?.total || 0), 0);

  if (countEl) countEl.textContent = totalOrders;
  if (depositEl) depositEl.textContent = `${formatMoney(totalPaidOnline)} ج.م`;
  if (remainEl) remainEl.textContent = `${formatMoney(totalRemaining)} ج.م`;
  if (revEl) revEl.textContent = `${formatMoney(totalRevenue)} ج.م`;
}
window.updateAdminAnalytics = updateAdminAnalytics;

// --------------------------------------------------------------------------
// 13. Event Listeners & Interactions Setup
// --------------------------------------------------------------------------
function initEventListeners() {
  
  // Category Navigation Scroll Buttons (Right & Left Arrows)
  const catScrollRightBtn = document.getElementById('catScrollRightBtn');
  const catScrollLeftBtn = document.getElementById('catScrollLeftBtn');
  const catScrollWrapper = document.getElementById('categoryPillsScrollWrapper');

  if (catScrollRightBtn && catScrollWrapper) {
    catScrollRightBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Scroll right (toward start in RTL)
      catScrollWrapper.scrollBy({ left: 240, behavior: 'smooth' });
    });
  }

  if (catScrollLeftBtn && catScrollWrapper) {
    catScrollLeftBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Scroll left (toward end in RTL)
      catScrollWrapper.scrollBy({ left: -240, behavior: 'smooth' });
    });
  }

  // Live Search Input with Instant Update
  const searchInput = document.getElementById('liveSearchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      AppState.searchQuery = e.target.value;
      if (clearSearchBtn) clearSearchBtn.hidden = !AppState.searchQuery;
      renderProducts();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      AppState.searchQuery = '';
      clearSearchBtn.hidden = true;
      renderProducts();
    });
  }

  // Sort By Select
  const sortSelect = document.getElementById('sortBySelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      AppState.sortBy = e.target.value;
      renderProducts();
    });
  }

  // Price Range Popover Toggle & Inputs
  const priceToggleBtn = document.getElementById('priceFilterToggleBtn');
  const pricePopover = document.getElementById('pricePopover');
  const priceRangeInput = document.getElementById('priceRangeInput');
  const maxPriceValLabel = document.getElementById('maxPriceValLabel');
  const applyPriceBtn = document.getElementById('applyPriceBtn');
  const resetPriceBtn = document.getElementById('resetPriceBtn');

  if (priceToggleBtn && pricePopover) {
    priceToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      pricePopover.hidden = !pricePopover.hidden;
    });

    document.addEventListener('click', (e) => {
      if (!pricePopover.contains(e.target) && e.target !== priceToggleBtn) {
        pricePopover.hidden = true;
      }
    });
  }

  if (priceRangeInput && maxPriceValLabel) {
    priceRangeInput.addEventListener('input', (e) => {
      maxPriceValLabel.textContent = `${formatMoney(e.target.value)} ج.م`;
    });
  }

  if (applyPriceBtn && priceRangeInput) {
    applyPriceBtn.addEventListener('click', () => {
      AppState.maxPrice = parseFloat(priceRangeInput.value);
      const indicator = document.getElementById('priceIndicatorText');
      if (indicator) {
        indicator.textContent = AppState.maxPrice < 70000 ? `حتى ${formatMoney(AppState.maxPrice)} ج.م` : 'الكل';
      }
      if (pricePopover) pricePopover.hidden = true;
      renderProducts();
    });
  }

  if (resetPriceBtn && priceRangeInput) {
    resetPriceBtn.addEventListener('click', () => {
      AppState.maxPrice = 70000;
      priceRangeInput.value = 70000;
      if (maxPriceValLabel) maxPriceValLabel.textContent = '70,000 ج.م';
      const indicator = document.getElementById('priceIndicatorText');
      if (indicator) indicator.textContent = 'الكل';
      if (pricePopover) pricePopover.hidden = true;
      renderProducts();
    });
  }

  // Reset All Filters Button
  const resetAllFiltersBtn = document.getElementById('resetAllFiltersBtn');
  const emptyStateResetBtn = document.getElementById('emptyStateResetBtn');
  const resetAllHandler = () => {
    AppState.currentCategory = 'all';
    AppState.searchQuery = '';
    AppState.maxPrice = 70000;
    AppState.sortBy = 'featured';

    if (searchInput) searchInput.value = '';
    if (clearSearchBtn) clearSearchBtn.hidden = true;
    if (sortSelect) sortSelect.value = 'featured';
    if (priceRangeInput) priceRangeInput.value = 70000;
    if (maxPriceValLabel) maxPriceValLabel.textContent = '70,000 ج.م';
    const indicator = document.getElementById('priceIndicatorText');
    if (indicator) indicator.textContent = 'الكل';

    renderCategoryNav();
    renderProducts();
  };
  window.resetAllFilters = resetAllHandler;

  if (resetAllFiltersBtn) resetAllFiltersBtn.addEventListener('click', resetAllHandler);
  if (emptyStateResetBtn) emptyStateResetBtn.addEventListener('click', resetAllHandler);

  // Cart Drawer Triggers
  const openCartBtn = document.getElementById('openCartBtn');
  const closeCartBtn = document.getElementById('closeCartBtn');
  const cartOverlay = document.getElementById('cartOverlay');
  const mobNavCart = document.getElementById('mobNavCart');
  const cartStartShoppingBtn = document.getElementById('cartStartShoppingBtn');

  if (openCartBtn) openCartBtn.addEventListener('click', () => toggleCartDrawer(true));
  if (mobNavCart) mobNavCart.addEventListener('click', () => toggleCartDrawer(true));
  if (closeCartBtn) closeCartBtn.addEventListener('click', () => toggleCartDrawer(false));
  if (cartOverlay) cartOverlay.addEventListener('click', () => toggleCartDrawer(false));
  if (cartStartShoppingBtn) cartStartShoppingBtn.addEventListener('click', () => toggleCartDrawer(false));

  // Checkout Button
  const proceedCheckoutBtn = document.getElementById('proceedCheckoutBtn');
  if (proceedCheckoutBtn) {
    proceedCheckoutBtn.addEventListener('click', startCheckoutFlow);
  }

  // Checkout Modal Steps Form Submissions
  const deliveryForm = document.getElementById('deliveryForm');
  if (deliveryForm) {
    deliveryForm.addEventListener('submit', handleDeliveryFormSubmit);
  }

  const cancelStep1Btn = document.getElementById('cancelStep1Btn');
  if (cancelStep1Btn) {
    cancelStep1Btn.addEventListener('click', () => {
      closeModal('checkoutModal');
      toggleCartDrawer(true);
    });
  }

  const paymentForm = document.getElementById('paymentForm');
  if (paymentForm) {
    paymentForm.addEventListener('submit', handlePaymentFormSubmit);
  }

  const backToStep1Btn = document.getElementById('backToStep1Btn');
  if (backToStep1Btn) {
    backToStep1Btn.addEventListener('click', () => setCheckoutStep(1));
  }

  const closeCheckoutBtn = document.getElementById('closeCheckoutBtn');
  if (closeCheckoutBtn) {
    closeCheckoutBtn.addEventListener('click', () => closeModal('checkoutModal'));
  }

  const finishShoppingBtn = document.getElementById('finishShoppingBtn');
  if (finishShoppingBtn) {
    finishShoppingBtn.addEventListener('click', () => closeModal('checkoutModal'));
  }

  const printReceiptBtn = document.getElementById('printReceiptBtn');
  if (printReceiptBtn) {
    printReceiptBtn.addEventListener('click', () => window.print());
  }

  // Live Card Preview formatting on Card Form
  setupCardInputMasking();

  // YouTube Hero Trigger
  const heroVideoTrigger = document.getElementById('heroVideoTrigger');
  if (heroVideoTrigger) {
    heroVideoTrigger.addEventListener('click', () => {
      openYouTubeModal('W0jLgUu29uU', 'ريفيو واستعراض أجهزة عالم اسما');
    });
  }

  const closeYtModalBtn = document.getElementById('closeYtModalBtn');
  if (closeYtModalBtn) {
    closeYtModalBtn.addEventListener('click', closeYouTubeModal);
  }

  // Quick View Close
  const closeQuickViewBtn = document.getElementById('closeQuickViewBtn');
  if (closeQuickViewBtn) {
    closeQuickViewBtn.addEventListener('click', () => closeModal('quickViewModal'));
  }

  // Admin Modal Triggers
  const openAdminBtn = document.getElementById('openAdminBtn');
  const mobNavAdmin = document.getElementById('mobNavAdmin');
  const closeAdminBtn = document.getElementById('closeAdminBtn');

  if (openAdminBtn) openAdminBtn.addEventListener('click', () => openAdminPanel());
  if (mobNavAdmin) mobNavAdmin.addEventListener('click', () => openAdminPanel());
  if (closeAdminBtn) closeAdminBtn.addEventListener('click', () => closeModal('adminModal'));

  // Admin Tabs Navigation
  const adminTabs = document.querySelectorAll('.admin-tab-btn');
  adminTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const target = tab.getAttribute('data-tab');
      switchAdminTab(target);
    });
  });

  // Delegated click for Add Product CTA in Empty States
  document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('#emptyStateActionBtn') || e.target.closest('.btn-add-product-cta');
    if (addBtn && !addBtn.closest('#adminModal')) {
      e.preventDefault();
      openAdminPanel('addProductTab');
    }
  });

  // Admin Search & Filter Inputs
  const adminOrderSearch = document.getElementById('adminOrderSearch');
  if (adminOrderSearch) {
    adminOrderSearch.addEventListener('input', updateAdminOrdersTable);
  }

  const adminProductSearch = document.getElementById('adminProductSearch');
  if (adminProductSearch) {
    adminProductSearch.addEventListener('input', updateAdminProductsTable);
  }

  const adminProductCatFilter = document.getElementById('adminProductCatFilter');
  if (adminProductCatFilter) {
    adminProductCatFilter.addEventListener('change', updateAdminProductsTable);
  }

  const refreshOrdersBtn = document.getElementById('refreshOrdersBtn');
  if (refreshOrdersBtn) {
    refreshOrdersBtn.addEventListener('click', () => {
      updateAdminOrdersTable();
      updateAdminAnalytics();
      showToast('تم تحديث قائمة الطلبات والمبيعات', 'info');
    });
  }

  // Admin Add Product Form
  const addProductForm = document.getElementById('addProductForm');
  if (addProductForm) {
    addProductForm.addEventListener('submit', handleAddProductSubmit);
  }

  // Admin Edit Product Form
  const editProductForm = document.getElementById('editProductForm');
  if (editProductForm) {
    editProductForm.addEventListener('submit', handleEditProductSubmit);
  }

  // Admin Add Category Form
  const addCategoryForm = document.getElementById('addCategoryForm');
  if (addCategoryForm) {
    addCategoryForm.addEventListener('submit', handleAddCategorySubmit);
  }

  // Admin Edit Category Form
  const editCategoryForm = document.getElementById('editCategoryForm');
  if (editCategoryForm) {
    editCategoryForm.addEventListener('submit', handleEditCategorySubmit);
  }

  // Admin Hero Showcase Settings Form
  const heroShowcaseForm = document.getElementById('heroShowcaseForm');
  if (heroShowcaseForm) {
    heroShowcaseForm.addEventListener('submit', handleSaveHeroShowcase);
  }

  // Image Upload Dropzone Listeners
  initImageUploadListeners('new');
  initImageUploadListeners('edit');

  // Admin Clear & Reset Actions
  const adminClearOrdersBtn = document.getElementById('adminClearOrdersBtn');
  if (adminClearOrdersBtn) {
    adminClearOrdersBtn.addEventListener('click', () => {
      if (confirm('هل أنت متأكد من مسح جميع طلبات العملاء المسجلة؟')) {
        AppState.orders = [];
        saveOrdersToStorage();
        updateAdminOrdersTable();
        updateAdminAnalytics();
        showToast('تم مسح سجل الطلبات بنجاح', 'info');
      }
    });
  }

  const adminResetCatalogBtn = document.getElementById('adminResetCatalogBtn');
  if (adminResetCatalogBtn) {
    adminResetCatalogBtn.addEventListener('click', () => {
      if (confirm('هل ترغب في تفريغ كافة الأجهزة وإعادة ضبط الأقسام إلى الوضع الافتراضي؟')) {
        AppState.products = [];
        AppState.categories = [...INITIAL_CATEGORIES];
        saveProductsToStorage();
        saveCategoriesToStorage();
        
        renderCategoryNav();
        populateCategorySelects();
        renderProducts();
        updateAdminProductsTable();
        updateAdminCategoriesTable();
        showToast('تم تفريغ الأجهزة وإعادة ضبط الأقسام بنجاح', 'info');
      }
    });
  }

  // Back to top floating button
  const backToTopBtn = document.getElementById('backToTopBtn');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        backToTopBtn.hidden = false;
      } else {
        backToTopBtn.hidden = true;
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal('checkoutModal');
      closeModal('ytVideoModal');
      closeModal('quickViewModal');
      closeModal('adminModal');
      closeModal('editProductModal');
      closeModal('editCategoryModal');
      toggleCartDrawer(false);
    }
  });

  const modals = ['checkoutModal', 'ytVideoModal', 'quickViewModal', 'adminModal', 'editProductModal', 'editCategoryModal'];
  modals.forEach(mId => {
    const modalEl = document.getElementById(mId);
    if (modalEl) {
      modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) {
          if (mId === 'ytVideoModal') closeYouTubeModal();
          else closeModal(mId);
        }
      });
    }
  });
}

function filterByCategory(category) {
  AppState.currentCategory = category;

  document.querySelectorAll('.category-pill').forEach(p => {
    const isActive = p.getAttribute('data-category') === category;
    p.classList.toggle('active', isActive);
    if (isActive) {
      try {
        p.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } catch (e) {}
    }
  });

  renderProducts();

  const catalog = document.getElementById('catalogSection');
  if (catalog && window.scrollY < 300) {
    catalog.scrollIntoView({ behavior: 'smooth' });
  }
}
window.filterByCategory = filterByCategory;

function toggleCartDrawer(open) {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');

  if (drawer && overlay) {
    drawer.classList.toggle('active', open);
    overlay.classList.toggle('active', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
}
window.toggleCartDrawer = toggleCartDrawer;

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('opacity', '1', 'important');
    modal.style.setProperty('visibility', 'visible', 'important');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}
window.openModal = openModal;

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    modal.style.setProperty('display', 'none', 'important');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}
window.closeModal = closeModal;

function toggleHeroAdminMode(mode) {
  const singleSec = document.getElementById('heroSingleSection');
  const bundleSec = document.getElementById('heroBundleSection');
  const videoSec = document.getElementById('heroVideoSection');
  const badgeSec = document.getElementById('heroBadgeSection');
  const timerSec = document.getElementById('heroTimerSection');

  if (singleSec) singleSec.style.display = mode === 'single' ? 'block' : 'none';
  if (bundleSec) bundleSec.style.display = mode === 'bundle' ? 'block' : 'none';
  if (videoSec) videoSec.style.display = mode === 'video' ? 'block' : 'none';
  if (badgeSec) badgeSec.style.display = mode === 'video' ? 'none' : 'block';
  if (timerSec) timerSec.style.display = mode === 'video' ? 'none' : 'block';

  // Toggle active class on option cards
  ['single', 'bundle', 'video'].forEach(m => {
    const opt = document.getElementById('modeOpt' + m.charAt(0).toUpperCase() + m.slice(1));
    if (opt) {
      opt.classList.toggle('active', m === mode);
      const radio = opt.querySelector('input[type="radio"]');
      if (radio) radio.checked = (m === mode);
    }
  });
}
window.toggleHeroAdminMode = toggleHeroAdminMode;

function setHeroBadgeColor(bgColor, textColor) {
  const bgInput = document.getElementById('heroBadgeBgColor');
  const textInput = document.getElementById('heroBadgeTextColor');
  if (bgInput) bgInput.value = bgColor;
  if (textInput) textInput.value = textColor;
}
window.setHeroBadgeColor = setHeroBadgeColor;

function toggleHeroTimerInputs(enabled) {
  const fields = document.getElementById('heroTimerFields');
  if (fields) fields.style.opacity = enabled ? '1' : '0.5';
}
window.toggleHeroTimerInputs = toggleHeroTimerInputs;

function populateHeroAdminForm() {
  const showcase = AppState.heroShowcase || DEFAULT_HERO_SHOWCASE;
  const badge = showcase.badge || DEFAULT_HERO_SHOWCASE.badge;
  const single = showcase.single || DEFAULT_HERO_SHOWCASE.single;
  const bundle = showcase.bundle || DEFAULT_HERO_SHOWCASE.bundle;
  const timer = showcase.timer || DEFAULT_HERO_SHOWCASE.timer;
  const video = showcase.video || DEFAULT_HERO_SHOWCASE.video;

  // Set mode
  toggleHeroAdminMode(showcase.mode || 'single');

  // Badge inputs
  const badgeText = document.getElementById('heroBadgeText');
  const badgeIcon = document.getElementById('heroBadgeIcon');
  const badgeBgColor = document.getElementById('heroBadgeBgColor');
  const badgeTextColor = document.getElementById('heroBadgeTextColor');
  if (badgeText) badgeText.value = badge.text || 'الأكثر مبيعاً';
  if (badgeIcon) badgeIcon.value = badge.icon || '🔥';
  if (badgeBgColor) badgeBgColor.value = badge.bgColor || '#FDF062';
  if (badgeTextColor) badgeTextColor.value = badge.textColor || '#111111';

  // Populate heroSingleCatFilter and heroBundleCatFilter
  const catFilter = document.getElementById('heroSingleCatFilter');
  const bundleCatFilter = document.getElementById('heroBundleCatFilter');
  let catOptions = '<option value="all">جميع الأقسام</option>';
  AppState.categories.forEach(c => {
    catOptions += `<option value="${c.id}">${c.icon || '🏷️'} ${c.name}</option>`;
  });

  if (catFilter) {
    catFilter.innerHTML = catOptions;
    catFilter.value = 'all';
  }
  if (bundleCatFilter) {
    bundleCatFilter.innerHTML = catOptions;
    bundleCatFilter.value = 'all';
  }

  const searchInput = document.getElementById('heroSingleSearchInput');
  if (searchInput) searchInput.value = '';

  const sortFilter = document.getElementById('heroSingleSortFilter');
  if (sortFilter) sortFilter.value = 'default';

  // Filter / populate single product select with current selection
  filterHeroSingleProductSelect(single.productId);

  const singleCustomTitle = document.getElementById('heroSingleCustomTitle');
  if (singleCustomTitle) singleCustomTitle.value = single.customTitle || '';

  // Bundle inputs
  const bundleTitle = document.getElementById('heroBundleTitle');
  const bundleDesc = document.getElementById('heroBundleDesc');
  const bundlePrice = document.getElementById('heroBundlePrice');
  const bundleOldPrice = document.getElementById('heroBundleOldPrice');
  if (bundleTitle) bundleTitle.value = bundle.title || '';
  if (bundleDesc) bundleDesc.value = bundle.description || '';
  if (bundlePrice) bundlePrice.value = bundle.price || '';
  if (bundleOldPrice) bundleOldPrice.value = bundle.oldPrice || '';

  // Reset bundle search and render bundle checklist
  const bundleSearchInput = document.getElementById('heroBundleSearchInput');
  if (bundleSearchInput) bundleSearchInput.value = '';
  renderHeroBundleChecklist();

  // Timer inputs
  const timerEnabled = document.getElementById('heroTimerEnabled');
  const timerTitle = document.getElementById('heroTimerTitle');
  const timerEndDate = document.getElementById('heroTimerEndDate');
  if (timerEnabled) timerEnabled.checked = !!timer.enabled;
  if (timerTitle) timerTitle.value = timer.title || 'بقي على العرض';
  if (timerEndDate) timerEndDate.value = timer.endDate || '';
  toggleHeroTimerInputs(!!timer.enabled);

  // Video inputs
  const videoYtId = document.getElementById('heroVideoYtId');
  if (videoYtId) videoYtId.value = video.youtubeId || '';
}
window.populateHeroAdminForm = populateHeroAdminForm;

function clearHeroSingleSearch() {
  const searchInput = document.getElementById('heroSingleSearchInput');
  const clearBtn = document.getElementById('clearHeroSingleSearchBtn');
  if (searchInput) searchInput.value = '';
  if (clearBtn) clearBtn.style.display = 'none';
  filterHeroSingleProductSelect();
}
window.clearHeroSingleSearch = clearHeroSingleSearch;

function filterHeroSingleProductSelect(preferredSelectedId = null) {
  const select = document.getElementById('heroSingleProductId');
  const grid = document.getElementById('heroSinglePickerGrid');
  const countText = document.getElementById('heroPickerCountText');
  const searchInput = document.getElementById('heroSingleSearchInput');
  const clearBtn = document.getElementById('clearHeroSingleSearchBtn');
  const catFilter = document.getElementById('heroSingleCatFilter');
  const sortFilter = document.getElementById('heroSingleSortFilter');

  if (!select) return;

  const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const cat = catFilter ? catFilter.value : 'all';
  const sort = sortFilter ? sortFilter.value : 'default';

  if (clearBtn) {
    clearBtn.style.display = q ? 'inline-flex' : 'none';
  }

  let filtered = [...AppState.products];

  // Category filter
  if (cat !== 'all') {
    filtered = filtered.filter(p => p && p.category === cat);
  }

  // Live search query filter
  if (q) {
    filtered = filtered.filter(p => p && (
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.desc && p.desc.toLowerCase().includes(q)) ||
      (p.specs && p.specs.some(s => s.toLowerCase().includes(q))) ||
      (p.price && String(p.price).includes(q))
    ));
  }

  // Sort options
  if (sort === 'price-asc') {
    filtered.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
  } else if (sort === 'price-desc') {
    filtered.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
  } else if (sort === 'discount') {
    filtered.sort((a, b) => {
      const discA = (a.oldPrice && a.oldPrice > a.price) ? (a.oldPrice - a.price) : 0;
      const discB = (b.oldPrice && b.oldPrice > b.price) ? (b.oldPrice - b.price) : 0;
      return discB - discA;
    });
  } else if (sort === 'name') {
    filtered.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'ar'));
  }

  const currentVal = preferredSelectedId !== null ? preferredSelectedId : select.value;
  let activeId = currentVal;

  if (filtered.length === 0) {
    if (AppState.products.length === 0) {
      select.innerHTML = '<option value="">لا توجد أجهزة مضافة في الكتالوج حتى الآن</option>';
      if (grid) grid.innerHTML = '<div class="hero-picker-empty"><span class="empty-icon">📭</span><p>الكتالوج فارغ حالياً، أضف أجهزة من تبويب "إضافة جهاز" أولاً.</p></div>';
      if (countText) countText.textContent = '0 أجهزة متاحة';
    } else {
      select.innerHTML = '<option value="">لا توجد أجهزة مطابقة للبحث أو الفلتر المحدد</option>';
      if (grid) grid.innerHTML = `<div class="hero-picker-empty"><span class="empty-icon">🔍</span><p>لا توجد نتائج مطابقة لبحثك</p><button type="button" class="btn-reset-picker-filters" onclick="clearHeroSingleSearch()">إعادة ضبط البحث</button></div>`;
      if (countText) countText.textContent = '0 أجهزة مطابقة';
    }
  } else {
    // Populate hidden/synced select
    select.innerHTML = filtered.map(p => {
      const isSelected = p.id === activeId;
      return `<option value="${p.id}" ${isSelected ? 'selected' : ''}>${escapeHtml(p.title)} (${formatMoney(p.price)} ج.م - ${getCategoryName(p.category)})</option>`;
    }).join('');

    if (activeId && filtered.some(p => p.id === activeId)) {
      select.value = activeId;
    } else if (filtered.length > 0) {
      select.value = filtered[0].id;
      activeId = filtered[0].id;
    }

    if (countText) {
      countText.innerHTML = `تم العثور على <strong>${filtered.length}</strong> جهاز مطابق`;
    }

    // Render compact table view
    if (grid) {
      grid.innerHTML = `
        <div class="single-compact-table">
          ${filtered.map(p => {
            const isSelected = p.id === activeId;
            return `
              <label class="single-table-row ${isSelected ? 'active-row' : ''}" onclick="selectHeroSingleProductCard('${p.id}')">
                <input type="radio" name="heroSingleProductRadio" value="${p.id}" ${isSelected ? 'checked' : ''} class="single-row-radio" onclick="event.stopPropagation(); selectHeroSingleProductCard('${p.id}')">
                <span class="single-row-title">${escapeHtml(p.title)}</span>
              </label>
            `;
          }).join('')}
        </div>
      `;
    }
  }

  previewHeroSelectedProduct();
}
window.filterHeroSingleProductSelect = filterHeroSingleProductSelect;

function selectHeroSingleProductCard(productId) {
  const select = document.getElementById('heroSingleProductId');
  if (select) {
    select.value = productId;
  }

  // Update table row active states and radio inputs
  const rows = document.querySelectorAll('.single-table-row');
  rows.forEach(row => {
    const radio = row.querySelector('input[type="radio"]');
    if (radio && radio.value === productId) {
      radio.checked = true;
      row.classList.add('active-row');
    } else {
      if (radio) radio.checked = false;
      row.classList.remove('active-row');
    }
  });

  previewHeroSelectedProduct();
}
window.selectHeroSingleProductCard = selectHeroSingleProductCard;

function previewHeroSelectedProduct() {
  const select = document.getElementById('heroSingleProductId');
  const previewBox = document.getElementById('heroSinglePreviewBox');
  if (!select || !previewBox) return;

  const prodId = select.value;
  const prod = AppState.products.find(p => p && p.id === prodId);

  if (!prod) {
    previewBox.style.display = 'none';
    previewBox.innerHTML = '';
    return;
  }

  const deposit = getProductDeposit(prod);
  const remaining = Math.max(0, prod.price - deposit);

  previewBox.style.display = 'flex';
  previewBox.innerHTML = `
    <div class="hero-preview-badge-card">
      <img src="${prod.image}" alt="${escapeHtml(prod.title)}" class="hero-preview-img" onerror="this.src='https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=100&q=80'">
      <div class="hero-preview-info">
        <strong>${escapeHtml(prod.title)}</strong>
        <div class="hero-preview-chips">
          <span class="preview-price-chip">💰 السعر: ${formatMoney(prod.price)} ج.م</span>
          <span class="preview-deposit-chip">💳 العربون: ${formatMoney(deposit)} ج.م (20%)</span>
          <span class="preview-remain-chip">💵 المتبقي: ${formatMoney(remaining)} ج.م (80%)</span>
          <span class="preview-cat-chip">🏷️ ${getCategoryName(prod.category)}</span>
        </div>
      </div>
    </div>
  `;
}
window.previewHeroSelectedProduct = previewHeroSelectedProduct;

function renderHeroBundleChecklist() {
  const bundleChecklist = document.getElementById('heroBundleChecklist');
  if (!bundleChecklist) return;

  const bundle = AppState.heroShowcase?.bundle || DEFAULT_HERO_SHOWCASE.bundle;
  const searchInput = document.getElementById('heroBundleSearchInput');
  const catFilter = document.getElementById('heroBundleCatFilter');
  const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const cat = catFilter ? catFilter.value : 'all';

  let list = [...AppState.products];

  if (cat !== 'all') {
    list = list.filter(p => p && p.category === cat);
  }

  if (q) {
    list = list.filter(p => p && (
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.price && String(p.price).includes(q))
    ));
  }

  if (AppState.products.length === 0) {
    bundleChecklist.innerHTML = '<p style="font-size:13px; color:var(--text-muted); padding:10px;">أضف أجهزة للكتالوج أولاً لإنشاء باقات مجمعة.</p>';
    updateBundleSelectedCount();
    return;
  }

  if (list.length === 0) {
    bundleChecklist.innerHTML = `<p style="font-size:13px; color:var(--text-muted); padding:10px;">لا توجد أجهزة مطابقة لـ "${escapeHtml(q || 'الفلتر')}".</p>`;
    updateBundleSelectedCount();
    return;
  }

  // Get currently checked IDs in DOM if rendered, otherwise from AppState
  const currentCheckedBoxes = document.querySelectorAll('input[name="bundleProductIds"]:checked');
  const selectedIds = currentCheckedBoxes.length > 0 
    ? Array.from(currentCheckedBoxes).map(cb => cb.value)
    : (bundle.productIds || []);

  bundleChecklist.innerHTML = `
    <div class="bundle-compact-table">
      ${list.map(p => {
        const isChecked = selectedIds.includes(p.id);
        return `
          <label class="bundle-table-row ${isChecked ? 'active-row' : ''}">
            <input type="checkbox" name="bundleProductIds" value="${p.id}" ${isChecked ? 'checked' : ''} onchange="updateBundleSelectedCount(this)" class="bundle-row-checkbox">
            <span class="bundle-row-title">${escapeHtml(p.title)}</span>
          </label>
        `;
      }).join('')}
    </div>
  `;

  updateBundleSelectedCount();
}
window.renderHeroBundleChecklist = renderHeroBundleChecklist;

function updateBundleSelectedCount(checkboxEl) {
  if (checkboxEl) {
    const row = checkboxEl.closest('.bundle-table-row');
    if (row) {
      if (checkboxEl.checked) row.classList.add('active-row');
      else row.classList.remove('active-row');
    }
  }

  const checkedBoxes = document.querySelectorAll('input[name="bundleProductIds"]:checked');
  const countNum = document.getElementById('bundleCountNum');
  if (countNum) {
    countNum.textContent = String(checkedBoxes.length);
  }
}
window.updateBundleSelectedCount = updateBundleSelectedCount;

function filterHeroBundleChecklist() {
  renderHeroBundleChecklist();
}
window.filterHeroBundleChecklist = filterHeroBundleChecklist;

function handleSaveHeroShowcase(e) {
  if (e) e.preventDefault();

  const selectedMode = document.querySelector('input[name="heroMode"]:checked')?.value || 'single';
  const badgeText = document.getElementById('heroBadgeText')?.value.trim() || 'الأكثر مبيعاً';
  const badgeIcon = document.getElementById('heroBadgeIcon')?.value.trim() || '🔥';
  const badgeBgColor = document.getElementById('heroBadgeBgColor')?.value || '#FDF062';
  const badgeTextColor = document.getElementById('heroBadgeTextColor')?.value || '#111111';

  const singleProductId = document.getElementById('heroSingleProductId')?.value || '';
  const singleCustomTitle = document.getElementById('heroSingleCustomTitle')?.value.trim() || '';

  const bundleTitle = document.getElementById('heroBundleTitle')?.value.trim() || 'باقة العروسة الاقتصادية';
  const bundleDesc = document.getElementById('heroBundleDesc')?.value.trim() || '';
  const bundlePrice = parseFloat(document.getElementById('heroBundlePrice')?.value) || 0;
  const bundleOldPrice = parseFloat(document.getElementById('heroBundleOldPrice')?.value) || 0;

  const checkedBundleBoxes = document.querySelectorAll('input[name="bundleProductIds"]:checked');
  const bundleProductIds = Array.from(checkedBundleBoxes).map(cb => cb.value);

  const timerEnabled = document.getElementById('heroTimerEnabled')?.checked || false;
  const timerTitle = document.getElementById('heroTimerTitle')?.value.trim() || 'ينتهي العرض الخاص خلال:';
  const timerEndDate = document.getElementById('heroTimerEndDate')?.value || '';

  const videoYtId = document.getElementById('heroVideoYtId')?.value.trim() || 'W0jLgUu29uU';

  AppState.heroShowcase = {
    mode: selectedMode,
    badge: {
      text: badgeText,
      icon: badgeIcon,
      bgColor: badgeBgColor,
      textColor: badgeTextColor
    },
    single: {
      productId: singleProductId,
      customTitle: singleCustomTitle
    },
    bundle: {
      title: bundleTitle,
      description: bundleDesc,
      productIds: bundleProductIds,
      price: bundlePrice,
      oldPrice: bundleOldPrice
    },
    timer: {
      enabled: timerEnabled,
      title: timerTitle,
      endDate: timerEndDate
    },
    video: {
      youtubeId: videoYtId,
      channelName: 'عالم اسما - Asma World',
      channelDesc: 'القناة الرسمية لريفيوهات وتجارب الأجهزة'
    }
  };

  saveHeroShowcaseToStorage();
  renderHeroShowcase();
  showToast('تم حفظ وتطبيق إعدادات العرض المميز في الهيرو بنجاح! 🎯', 'success');
}
window.handleSaveHeroShowcase = handleSaveHeroShowcase;

function switchAdminTab(targetTabId) {
  const tabs = document.querySelectorAll('.admin-tab-btn');
  tabs.forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-tab') === targetTabId);
  });

  const panes = document.querySelectorAll('.admin-tab-pane');
  panes.forEach(p => {
    const isTarget = p.id === targetTabId;
    p.classList.toggle('active', isTarget);
    if (isTarget) {
      p.removeAttribute('hidden');
      p.style.display = 'block';
    } else {
      p.setAttribute('hidden', '');
      p.style.display = 'none';
    }
  });

  try {
    if (targetTabId === 'addProductTab') {
      populateCategorySelects();
      renderAdminGallery('new');
      const firstInput = document.getElementById('newProdTitle');
      if (firstInput) setTimeout(() => firstInput.focus(), 100);
    }
    if (targetTabId === 'productsTab') updateAdminProductsTable();
    if (targetTabId === 'categoriesTab') updateAdminCategoriesTable();
    if (targetTabId === 'ordersTab') updateAdminOrdersTable();
    if (targetTabId === 'analyticsTab') updateAdminAnalytics();
    if (targetTabId === 'heroShowcaseTab') populateHeroAdminForm();
  } catch (err) {
    console.error('Error switching tab:', err);
  }
}
window.switchAdminTab = switchAdminTab;

function openAdminPanel(defaultTab = 'productsTab') {
  openModal('adminModal');
  try {
    switchAdminTab(defaultTab);
    updateAdminProductsTable();
    updateAdminCategoriesTable();
    updateAdminOrdersTable();
    updateAdminAnalytics();
    if (defaultTab === 'heroShowcaseTab') populateHeroAdminForm();
  } catch (err) {
    console.error('Error refreshing admin tables:', err);
  }
}
window.openAdminPanel = openAdminPanel;

// --------------------------------------------------------------------------
// 14. Helper Utilities & Masking
// --------------------------------------------------------------------------
function formatMoney(num) {
  if (isNaN(num) || num === null || num === undefined) return '0';
  return Number(num).toLocaleString('en-US');
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function showFieldError(errorElId, msg) {
  const el = document.getElementById(errorElId);
  if (el) el.textContent = msg;
}

function clearFieldError(errorElId) {
  const el = document.getElementById(errorElId);
  if (el) el.textContent = '';
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'warning') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function setupCardInputMasking() {
  const numInput = document.getElementById('cardNumInput');
  const numPreview = document.getElementById('cardNumPreview');
  const brandLogo = document.getElementById('cardBrandLogo');
  const holderInput = document.getElementById('cardHolderInput');
  const holderPreview = document.getElementById('cardHolderPreview');
  const expInput = document.getElementById('cardExpInput');
  const expPreview = document.getElementById('cardExpPreview');

  if (numInput && numPreview) {
    numInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').slice(0, 16);
      let formatted = val.replace(/(\d{4})/g, '$1 ').trim();
      e.target.value = formatted;

      numPreview.textContent = formatted || '•••• •••• •••• ••••';

      if (val.startsWith('4')) {
        if (brandLogo) brandLogo.textContent = 'VISA';
      } else if (val.startsWith('5')) {
        if (brandLogo) brandLogo.textContent = 'MASTERCARD';
      } else if (val.startsWith('3')) {
        if (brandLogo) brandLogo.textContent = 'MEEZA';
      } else {
        if (brandLogo) brandLogo.textContent = 'CARD';
      }
    });
  }

  if (holderInput && holderPreview) {
    holderInput.addEventListener('input', (e) => {
      holderPreview.textContent = e.target.value.trim().toUpperCase() || 'NAME ON CARD';
    });
  }

  if (expInput && expPreview) {
    expInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').slice(0, 4);
      if (val.length >= 3) {
        val = val.slice(0, 2) + '/' + val.slice(2);
      }
      e.target.value = val;
      expPreview.textContent = val || 'MM/YY';
    });
  }
}
