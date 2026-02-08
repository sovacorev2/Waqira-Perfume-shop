// waqira-scripts.js

// Use global supabase client (loaded via <script> tag in HTML)
const supabase = Supabase.createClient(
  'https://jwgtckpitgxeotylyxtg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3Z3Rja3BpdGd4ZW90eWx5eHRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NDMzNDcsImV4cCI6MjA4NjAxOTM0N30.U3jZKNjzgqfG7BpTNz4NDp7iW59bmByRkej4o6835OU'
);

const STORAGE_BUCKET = 'uploads'; // change if your bucket name is different

document.addEventListener('DOMContentLoaded', () => {
  // Shared notification function
  const showNotification = (message, type = 'success') => {
    let el = document.getElementById('waqira-notification');
    if (!el) {
      el = document.createElement('div');
      el.id = 'waqira-notification';
      el.className = 'fixed top-5 right-5 z-50 p-4 rounded-lg shadow-lg text-white transform transition-all duration-300 ease-out opacity-0 translate-x-full';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.className = `fixed top-5 right-5 z-50 p-4 rounded-lg shadow-lg text-white transform transition-all duration-300 ease-out opacity-100 translate-x-0 ${
      type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-gray-700'
    }`;
    clearTimeout(el.timeoutId);
    el.timeoutId = setTimeout(() => {
      el.className = el.className.replace('opacity-100 translate-x-0', 'opacity-0 translate-x-full');
    }, 3200);
  };

  // Interactive Image Tilt (unchanged)
  document.querySelectorAll('.home-images img, .gallery-item img:not([data-product-id])').forEach(el => {
    el.style.cursor = 'pointer';
    el.addEventListener('mousemove', e => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateY = ((x - centerX) / centerX) * 12;
      const rotateX = ((y - centerY) / centerY) * -12;
      el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.08)`;
      el.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4), 0 0 30px rgba(212,175,55,0.15)';
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
      el.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';
    });
  });

  // Mobile Menu Toggle
  const toggleBtn = document.querySelector('.menu-toggle');
  const navUl = document.querySelector('#main-nav ul');
  if (toggleBtn && navUl) {
    toggleBtn.addEventListener('click', () => {
      navUl.classList.toggle('active');
      // Change icon based on state
      toggleBtn.textContent = navUl.classList.contains('active') ? '\u2716' : '\u2630'; // X or Hamburger
    });
    // Close menu when a link is clicked
    navUl.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        setTimeout(() => {
          navUl.classList.remove('active');
          toggleBtn.textContent = '\u2630'; // Reset to hamburger icon
        }, 150);
      });
    });
  }

  // Scroll to Top (unchanged)
  const scrollBtn = document.getElementById('scrollTopBtn');
  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      scrollBtn.style.display = window.scrollY > 300 ? 'block' : 'none';
    });
    scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // =============================================
  // CART LOGIC – IMPROVED VERSION
  // =============================================

  const getCart = () => JSON.parse(localStorage.getItem('waqiraCart') || '[]');
  const saveCart = (cart) => localStorage.setItem('waqiraCart', JSON.stringify(cart));

  // Calculate price for the selected size (per unit)
  const calculateItemPrice = (item) => {
    const pricePerMl = item.price / item.default_ml;
    return pricePerMl * item.selected_ml; // price for 1 unit at chosen ml
  };

  const getCartTotal = () => {
    return getCart().reduce((sum, item) => {
      return sum + (calculateItemPrice(item) * item.quantity);
    }, 0);
  };

  // Add product to cart
  const addToCart = (product) => {
    let cart = getCart();

    // Merge if same product + same ml already exists
    const existingIndex = cart.findIndex(
      i => i.id === product.id && i.selected_ml === product.selected_ml
    );

    if (existingIndex > -1) {
      cart[existingIndex].quantity += product.quantity;
    } else {
      cart.push(product);
    }

    saveCart(cart);
    showNotification(`${product.name} (${product.selected_ml}ml) added to cart!`, 'success');

    renderCart(); // refresh display
  };

  // Render cart table and total
  const renderCart = () => {
    const container = document.getElementById('cart-items');
    if (!container) return;

    const cart = getCart();
    container.innerHTML = '';
    let grandTotal = 0;

    if (cart.length === 0) {
      container.innerHTML = '<tr><td colspan="6" class="text-center py-4">Your cart is empty.</td></tr>';
      document.getElementById('cart-total')?.textContent = '0.00';
      document.querySelector('.checkout-btn')?.disabled = true;
      document.querySelector('.checkout-btn')?.classList.add('opacity-50', 'cursor-not-allowed');
      return;
    }

    // Enable checkout
    document.querySelector('.checkout-btn')?.disabled = false;
    document.querySelector('.checkout-btn')?.classList.remove('opacity-50', 'cursor-not-allowed');

    cart.forEach((item, index) => {
      const itemPrice = calculateItemPrice(item); // price for 1 unit
      const subtotal = itemPrice * item.quantity;
      grandTotal += subtotal;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="py-2">
          <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded mr-2 inline-block">
          <span class="font-semibold">${item.name}</span>
        </td>
        <td>
          <select class="ml-select p-2 border rounded" data-index="${index}">
            ${item.available_ml.map(ml => `
              <option value="${ml}" ${item.selected_ml === ml ? 'selected' : ''}>${ml}ml</option>
            `).join('')}
          </select>
        </td>
        <td>
          <input type="number" min="1" value="${item.quantity}" class="quantity-input p-2 border rounded w-16 text-center" data-index="${index}">
        </td>
        <td>Ksh ${itemPrice.toFixed(2)}</td>
        <td>Ksh ${subtotal.toFixed(2)}</td>
        <td>
          <button class="remove-item-btn bg-red-500 hover:bg-red-700 text-white py-1 px-3 rounded text-sm" data-index="${index}">Remove</button>
        </td>
      `;
      container.appendChild(tr);
    });

    document.getElementById('cart-total')?.textContent = grandTotal.toFixed(2);
  };

  // Update cart item (quantity or ml change)
  const updateCartItem = (index, newQty = null, newMl = null) => {
    let cart = getCart();
    if (index < 0 || index >= cart.length) return;

    if (newQty !== null) {
      cart[index].quantity = Math.max(1, parseInt(newQty));
    }

    if (newMl !== null) {
      const newMlValue = parseInt(newMl);
      if (newMlValue !== cart[index].selected_ml) {
        const existingIndex = cart.findIndex(
          (i, idx) => idx !== index && i.id === cart[index].id && i.selected_ml === newMlValue
        );

        if (existingIndex > -1) {
          cart[existingIndex].quantity += cart[index].quantity;
          cart.splice(index, 1);
        } else {
          cart[index].selected_ml = newMlValue;
        }
      }
    }

    cart = cart.filter(i => i.quantity > 0);
    saveCart(cart);
    renderCart();
  };

  // Remove item
  const removeFromCart = (index) => {
    let cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    renderCart();
  };

  // =============================================
  // AUTO-ADD TO CART ON PRODUCT IMAGE CLICK
  // =============================================
  document.querySelectorAll('.gallery-item img[data-product-id]').forEach(img => {
    img.addEventListener('click', () => {
      const product = {
        id: img.dataset.productId,
        name: img.dataset.productName,
        image: img.src,
        price: parseFloat(img.dataset.productPrice),
        default_ml: parseInt(img.dataset.defaultMl),
        available_ml: img.dataset.availableMl.split(',').map(Number),
        selected_ml: parseInt(img.dataset.defaultMl),
        quantity: 1
      };

      addToCart(product);
    });
  });

  // =============================================
  // CART EVENT LISTENERS (delegation)
  // =============================================
  document.addEventListener('change', (e) => {
    const target = e.target;
    const index = parseInt(target.dataset.index);

    if (!isNaN(index)) {
      if (target.classList.contains('quantity-input')) {
        updateCartItem(index, target.value);
      }
      if (target.classList.contains('ml-select')) {
        updateCartItem(index, null, target.value);
      }
    }
  });

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-item-btn')) {
      const index = parseInt(e.target.dataset.index);
      if (!isNaN(index)) removeFromCart(index);
    }
  });

  // Initial render on cart page
  if (document.getElementById('cart-items')) {
    renderCart();
  }

  // =============================================
  // Payment Modal & Order Page (unchanged)
  // =============================================
  const PAYBILL = '522522';
  const ACCOUNT = '1347898832';
  const WHATSAPP = '254714165394';

  let paymentModal = null;

  const createPaymentModal = () => {
    if (paymentModal) return;
    paymentModal = document.createElement('div');
    paymentModal.id = 'mpesa-payment-modal';
    paymentModal.className = 'fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-[1001] hidden';
    paymentModal.innerHTML = `
      <div class="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto relative">
        <button id="close-payment-modal" class="absolute top-3 right-3 text-2xl font-bold text-gray-600 hover:text-black">×</button>
        <h3 class="text-2xl font-bold mb-4 text-center">Complete Payment</h3>
        <p class="mb-6">Use M-PESA Paybill:</p>
        <div class="mb-4 p-4 bg-gray-100 rounded">
          <div class="flex justify-between items-center">
            <strong>Paybill:</strong> <span>${PAYBILL}</span>
            <button class="copy-btn bg-blue-600 text-white px-3 py-1 rounded text-sm" data-copy="${PAYBILL}">Copy</button>
          </div>
        </div>
        <div class="mb-6 p-4 bg-gray-100 rounded">
          <div class="flex justify-between items-center">
            <strong>Account:</strong> <span>${ACCOUNT}</span>
            <button class="copy-btn bg-blue-600 text-white px-3 py-1 rounded text-sm" data-copy="${ACCOUNT}">Copy</button>
          </div>
        </div>
        <button id="follow-order-btn" class="w-full bg-indigo-600 text-white py-3 rounded font-bold">Follow Order on WhatsApp</button>
      </div>
    `;
    document.body.appendChild(paymentModal);

    paymentModal.querySelector('#close-payment-modal').onclick = () => {
      paymentModal.classList.add('hidden');
      document.body.style.overflow = '';
    };

    paymentModal.querySelectorAll('.copy-btn').forEach(btn => {
      btn.onclick = () => {
        navigator.clipboard.writeText(btn.dataset.copy).then(() => showNotification('Copied!', 'success'));
      };
    });

    paymentModal.querySelector('#follow-order-btn').onclick = () => {
      const cart = getCart();
      const total = getCartTotal().toFixed(2);
      const summary = cart.map(i => `${i.name} (${i.selected_ml}ml) × ${i.quantity}`).join(', ') || 'No items';
      const msg = encodeURIComponent(`Hello Waqira, I paid Ksh ${total} for: ${summary}. When will it be delivered?`);
      window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, '_blank');
      paymentModal.classList.add('hidden');
      document.body.style.overflow = '';
      localStorage.removeItem('waqiraCart');
      showNotification('Order follow-up sent!', 'success');
      renderCart();
    };
  };

  const showPaymentModal = () => {
    createPaymentModal();
    paymentModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };

  // Order page form
  const orderForm = document.getElementById('order-form');
  if (orderForm) {
    document.querySelectorAll('input[name="delivery-option"]').forEach(r => {
      r.addEventListener('change', () => {
        const isDelivery = document.querySelector('input[name="delivery-option"]:checked')?.value === 'delivery';
        document.getElementById('delivery-details').classList.toggle('hidden', !isDelivery);
        document.getElementById('pickup-details').classList.toggle('hidden', isDelivery);
      });
    });

    orderForm.addEventListener('submit', e => {
      e.preventDefault();
      if (getCartTotal() <= 0) return showNotification('Cart is empty', 'error');
      showPaymentModal();
    });
  }

  // =============================================
  // Admin Panel Logic – from previous working version
  // =============================================
  if (document.body.classList.contains('admin-page')) {
    const modal           = document.getElementById('admin-login-modal');
    const form            = document.getElementById('admin-login-form');
    const emailInput      = document.getElementById('admin-email');
    const passwordInput   = document.getElementById('admin-password');
    const errorMsg        = document.getElementById('login-error-message');
    const content         = document.getElementById('admin-content');
    const logoutBtn       = document.getElementById('admin-logout-btn');

    const AUTH_KEY = 'waqira_admin_logged_in';  // consistent key

    const isLoggedIn = () => localStorage.getItem(AUTH_KEY) === 'true';

    const showDashboard = () => {
      if (modal)    modal.classList.add('hidden');
      if (content)  content.classList.remove('hidden');
      document.body.style.overflow = ''; // restore scroll

      showNotification('Welcome to Waqira Admin Panel', 'success');

      // Load data only after successful login
      // These functions should be defined globally or in scope here if needed
      if (typeof loadProducts === 'function') loadProducts();
      if (typeof renderUploadedImages === 'function') renderUploadedImages();
    };

    const showLoginModal = () => {
      if (modal)    modal.classList.remove('hidden');
      if (content)  content.classList.add('hidden');
      document.body.style.overflow = 'hidden'; // lock scroll behind modal

      // Reset form & error state
      if (errorMsg) {
        errorMsg.classList.add('hidden');
        errorMsg.textContent = '';
      }
      if (emailInput)    emailInput.value = '';
      if (passwordInput) passwordInput.value = '';
    };

    // Initial state on page load
    if (isLoggedIn()) {
      showDashboard();
    } else {
      showLoginModal();
    }

    // Logout handler
    logoutBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem(AUTH_KEY);
      showNotification('Logged out successfully', 'info');
      showLoginModal();
    });

    // Login form handler
    form?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = emailInput?.value.trim();
      const password = passwordInput?.value;

      if (!email || !password) {
        errorMsg.textContent = 'Please enter both email and password';
        errorMsg.classList.remove('hidden');
        showNotification('Login failed: Missing fields', 'error');
        return;
      }

      errorMsg.classList.add('hidden');
      errorMsg.textContent = '';

      // Disable button & show loading
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
      }

      try {
        const { data, error } = await supabase
          .from('admin')
          .select('admin_email, admin_password')
          .eq('admin_email', email)
          .maybeSingle();

        if (error) {
          console.error('Supabase login query error:', error);
          throw new Error('Database connection issue. Please try again.');
        }

        if (!data) {
          throw new Error('No account found with that email');
        }

        if (data.admin_password !== password) {
          throw new Error('Incorrect password');
        }

        // Success!
        localStorage.setItem(AUTH_KEY, 'true');
        showNotification('Login successful!', 'success');
        showDashboard();

      } catch (err) {
        console.error('Login attempt failed:', err);
        const msg = err.message.includes('connection')
          ? 'Cannot reach Supabase – check your internet'
          : err.message || 'Invalid email or password';
        errorMsg.textContent = msg;
        errorMsg.classList.remove('hidden');
        showNotification(msg, 'error');
      } finally {
        // Restore button
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Login';
          submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
      }
    });
  }

  // ── Product CRUD (placeholder, functions need to be defined elsewhere if used)
  const loadProducts = async () => {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;

    const { data, error } = await supabase.from('products').select('*');
    if (error) return showNotification('Failed to load products', 'error');

    tbody.innerHTML = data.length === 0 ? '<tr><td colspan="6" class="text-center py-4">No products found.</td></tr>' : '';

    data.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="py-3 px-6"><img src="${p.image_url || '/placeholder.jpg'}" class="w-16 h-16 object-cover rounded"></td>
        <td class="py-3 px-6 font-medium">${p.name}</td>
        <td class="py-3 px-6">Ksh ${p.price.toFixed(2)}</td>
        <td class="py-3 px-6">${p.category || '—'}</td>
        <td class="py-3 px-6">${p.available_ml} (def: ${p.default_ml})</td>
        <td class="py-3 px-6 text-center">
          <button class="edit-btn bg-blue-600 text-white px-3 py-1 rounded text-xs mr-2" data-id="${p.id}" data-name="${p.name}" data-price="${p.price}" data-category="${p.category||''}" data-default-ml="${p.default_ml}" data-available-ml="${p.available_ml}" data-image="${p.image_url||''}">Edit</button>
          <button class="delete-btn bg-red-600 text-white px-3 py-1 rounded text-xs" data-id="${p.id}" data-image="${p.image_url||''}">Delete</button>
        </td>`;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.edit-btn').forEach(b => b.onclick = () => showEditModal(b.dataset));
    document.querySelectorAll('.delete-btn').forEach(b => b.onclick = () => handleDelete(b.dataset.id, b.dataset.image));
  };

  // Initial load of products on admin page if logged in
  if (document.body.classList.contains('admin-page') && isLoggedIn()) {
    loadProducts();
  }

  // Placeholder for renderUploadedImages and showEditModal, handleDelete if needed globally
  // const renderUploadedImages = () => { /* ... */ };
  // const showEditModal = (dataset) => { /* ... */ };
  // const handleDelete = (id, imageUrl) => { /* ... */ };

});