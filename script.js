// script.js - Complete Updated Version
class EyeStyleStore {
    constructor() {
        this.API_BASE = 'api.php';
        this.cart = [];
        this.init();
    }

    init() {
        this.loadCart();
        this.attachEventListeners();
        this.loadPageSpecificContent();
        this.updateCartBadge();
    }

    // API Calls
    async apiCall(endpoint, data = null) {
        try {
            const options = {
                method: data ? 'POST' : 'GET',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            };

            if (data) {
                const formData = new URLSearchParams();
                for (const key in data) {
                    formData.append(key, data[key]);
                }
                options.body = formData;
            }

            const response = await fetch(`${this.API_BASE}?action=${endpoint}`, options);
            const result = await response.json();
            
            if (result.error) {
                throw new Error(result.error);
            }
            
            return result;
        } catch (error) {
            console.error('API call failed:', error);
            this.showToast('Network error. Please try again.');
            return { success: false, message: 'Network error' };
        }
    }

    // Authentication
    async login(username, password) {
        const result = await this.apiCall('login', { username, password });
        if (result.success) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username);
            this.showToast('Login successful!');
            setTimeout(() => window.location.href = 'index.html', 1000);
        } else {
            this.showToast(result.message);
        }
        return result;
    }

    async register(userData) {
        const result = await this.apiCall('register', userData);
        this.showToast(result.message);
        if (result.success) {
            setTimeout(() => window.location.href = 'Login.html', 1500);
        }
        return result;
    }

    logout() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        this.showToast('Logged out successfully');
        setTimeout(() => window.location.href = 'index.html', 1000);
    }

    // Product Management
    async loadProducts(category = null) {
        const endpoint = category ? `products&category=${category}` : 'products';
        const products = await this.apiCall(endpoint);
        
        if (Array.isArray(products)) {
            this.renderProducts(products);
        } else {
            this.showToast('Error loading products');
        }
    }

    renderProducts(products) {
        const container = document.querySelector('.products-grid');
        if (!container) return;

        container.innerHTML = products.map(product => `
            <div class="product-card" data-product-id="${product.id}">
                ${product.stock_quantity < 10 ? '<span class="product-badge">Low Stock</span>' : ''}
                <img src="${product.image_url || 'images/placeholder.jpg'}" 
                     alt="${product.name}" 
                     class="product-image"
                     onerror="this.src='images/placeholder.jpg'">
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description || 'Premium quality eyewear'}</p>
                    <div class="product-price">₹${product.price}</div>
                    <div class="product-actions">
                        <button class="btn btn-primary btn-small add-to-cart" 
                                onclick="store.addToCart(${product.id})">
                            Add to Cart
                        </button>
                        <button class="btn btn-secondary btn-small" 
                                onclick="store.addToWishlist(${product.id})">
                            ♡ Wishlist
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Cart Management
    async addToCart(productId, quantity = 1) {
        if (!this.isLoggedIn()) {
            this.showToast('Please login to add items to cart');
            return;
        }

        const result = await this.apiCall('add_to_cart', { 
            product_id: productId, 
            quantity: quantity 
        });
        
        this.showToast(result.message);
        if (result.success) {
            this.loadCart();
        }
    }

    async loadCart() {
        if (!this.isLoggedIn()) {
            this.cart = [];
            this.renderCart();
            return;
        }

        const cart = await this.apiCall('get_cart');
        if (Array.isArray(cart)) {
            this.cart = cart;
            this.renderCart();
        }
    }

    renderCart() {
        const container = document.querySelector('.cart-items');
        const totalContainer = document.querySelector('.cart-total');
        
        if (!container) return;

        if (this.cart.length === 0) {
            container.innerHTML = `
                <div class="empty-cart">
                    <p>Your cart is empty</p>
                    <a href="product.html" class="btn btn-primary">Continue Shopping</a>
                </div>
            `;
            if (totalContainer) {
                totalContainer.textContent = 'Total: ₹0';
            }
            return;
        }

        container.innerHTML = this.cart.map((item, index) => `
            <div class="cart-item">
                <img src="${item.image_url || 'images/placeholder.jpg'}" 
                     alt="${item.name}" 
                     class="cart-item-image"
                     onerror="this.src='images/placeholder.jpg'">
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.name}</h4>
                    <div class="cart-item-price">₹${item.price}</div>
                </div>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="store.updateQuantity(${index}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" onclick="store.updateQuantity(${index}, 1)">+</button>
                </div>
                <div class="cart-item-total">₹${item.total_price}</div>
                <button class="remove-btn" onclick="store.removeFromCart(${index})">Remove</button>
            </div>
        `).join('');

        const total = this.cart.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
        if (totalContainer) {
            totalContainer.textContent = `Total: ₹${total.toFixed(2)}`;
        }

        this.updateCartBadge();
    }

    async updateQuantity(index, change) {
        const newQuantity = this.cart[index].quantity + change;
        
        if (newQuantity <= 0) {
            this.removeFromCart(index);
            return;
        }

        const result = await this.apiCall('update_cart', {
            cart_id: this.cart[index].id,
            quantity: newQuantity
        });

        if (result.success) {
            this.loadCart();
        }
    }

    async removeFromCart(index) {
        const result = await this.apiCall('remove_from_cart', {
            cart_id: this.cart[index].id
        });

        if (result.success) {
            this.loadCart();
            this.showToast('Item removed from cart');
        }
    }

    async checkout() {
        if (this.cart.length === 0) {
            this.showToast('Your cart is empty');
            return;
        }

        const shippingAddress = prompt('Please enter your shipping address:');
        if (!shippingAddress) return;

        const result = await this.apiCall('create_order', {
            shipping_address: shippingAddress,
            payment_method: 'card'
        });

        if (result.success) {
            this.showToast('Order placed successfully!');
            this.cart = [];
            this.renderCart();
            this.updateCartBadge();
        }
    }

    // Wishlist
    async addToWishlist(productId) {
        if (!this.isLoggedIn()) {
            this.showToast('Please login to add items to wishlist');
            return;
        }
        this.showToast('Added to wishlist!');
    }

    // Search
    setupSearch() {
        const searchInput = document.querySelector('.search-bar input');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const products = document.querySelectorAll('.product-card, .category-card');
            
            products.forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(searchTerm) ? 'block' : 'none';
            });
        });
    }

    // Utility Methods
    isLoggedIn() {
        return localStorage.getItem('isLoggedIn') === 'true';
    }

    updateCartBadge() {
        const badge = document.querySelector('.cart-badge');
        if (badge) {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            badge.textContent = totalItems;
            badge.style.display = totalItems > 0 ? 'block' : 'none';
        }
    }

    showToast(message, type = 'info') {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Event Listeners
    attachEventListeners() {
        // Login form
        const loginForm = document.querySelector('#loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(loginForm);
                this.login(formData.get('username'), formData.get('password'));
            });
        }

        // Register form
        const registerForm = document.querySelector('#registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(registerForm);
                const userData = Object.fromEntries(formData);
                this.register(userData);
            });
        }

        // Contact form
        const contactForm = document.querySelector('#contactForm');
        if (contactForm) {
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(contactForm);
                await this.submitContactForm(formData);
            });
        }

        // Checkout button
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.checkout());
        }

        // Logout buttons
        const logoutBtns = document.querySelectorAll('.logout-btn');
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        });

        // Search functionality
        this.setupSearch();

        // Update login/logout display
        this.updateAuthDisplay();
    }

    async submitContactForm(formData) {
        try {
            const response = await fetch('contact_handler.php', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            this.showToast(result.message);
            if (result.success) {
                document.querySelector('#contactForm').reset();
            }
        } catch (error) {
            this.showToast('Error submitting form');
        }
    }

    updateAuthDisplay() {
        const loginLinks = document.querySelectorAll('.login-link');
        const logoutLinks = document.querySelectorAll('.logout-btn');
        const userDisplay = document.querySelector('.user-display');

        if (this.isLoggedIn()) {
            const username = localStorage.getItem('username');
            loginLinks.forEach(link => link.style.display = 'none');
            logoutLinks.forEach(link => link.style.display = 'block');
            if (userDisplay) {
                userDisplay.textContent = `Welcome, ${username}`;
                userDisplay.style.display = 'block';
            }
        } else {
            loginLinks.forEach(link => link.style.display = 'block');
            logoutLinks.forEach(link => link.style.display = 'none');
            if (userDisplay) {
                userDisplay.style.display = 'none';
            }
        }
    }

    loadPageSpecificContent() {
        const path = window.location.pathname;
        
        if (path.includes('Glasses.html')) {
            this.loadProducts('glasses');
        } else if (path.includes('Sunglasses.html')) {
            this.loadProducts('sunglasses');
        } else if (path.includes('Contact Lenses.html')) {
            this.loadProducts('contact_lenses');
        } else if (path.includes('Kidsglasses.html')) {
            this.loadProducts('kids_glasses');
        } else if (path.includes('product.html')) {
            this.loadProducts();
        }
        
        // Load cart on cart page
        if (path.includes('cart.html')) {
            this.loadCart();
        }
    }
}

// Initialize the store
const store = new EyeStyleStore();

// Utility functions for HTML onclick attributes
function addToCart(productId) {
    store.addToCart(productId);
}

function updateQuantity(index, change) {
    store.updateQuantity(index, change);
}

function removeFromCart(index) {
    store.removeFromCart(index);
}

function addToWishlist(productId) {
    store.addToWishlist(productId);
}

function checkout() {
    store.checkout();
}