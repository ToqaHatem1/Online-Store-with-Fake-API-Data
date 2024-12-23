document.addEventListener('DOMContentLoaded', function () {
    let productsContainer = document.querySelector('.products');
    let searchInput = document.getElementById('searchInput');
    let categoryDropdown = document.getElementById('categoryDropdown');
    let sortDropdown = document.getElementById('sortDropdown');
    let minPriceInput = document.getElementById('minPrice');
    let maxPriceInput = document.getElementById('maxPrice');
    let applyFilterButton = document.getElementById('applyFilter');
    let resetFiltersButton = document.getElementById('resetFilters');

    const cartItemsContainer = document.getElementById('cartItems');
    const totalQuantityElement = document.getElementById('totalQuantity');
    const totalPriceElement = document.getElementById('totalPrice');

    let modal = document.getElementById("productModal");
    let closeModal = document.querySelector(".close");
    let imageModal = document.getElementById("imageModal");
    let closeImageModal = document.querySelector(".close-image");
    let modalTitle = document.getElementById("modalTitle");
    let modalDescription = document.getElementById("modalDescription");
    let imageModalContent = document.getElementById("imageModalContent");

    let paginationContainer = document.getElementById('pagination'); // Pagination container

    let products = []; // Array to store fetched products
    let originalProducts = [] //Array to store original products


    let currentPage = 1; 
    const productsPerPage = 6; 

    let cart = {
        items: [], // Array to store cart items
        totalQuantity: 0,
        totalPrice: 0,
    };

    // Fetch and display products
    async function fetchProducts() {
        try {
            const data = await fetch("https://fakestoreapi.com/products");
            const response = await data.json();
            products = response;
            originalProducts = [...response]; // keep a copy of the original products
            populateCategories(originalProducts);
            currentPage = 1; 
            displayProductsWithPagination();
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    }

    // Populate categories dropdown
    function populateCategories(products) {
        // Clear existing options (except the default 'All' option)
        categoryDropdown.innerHTML = '<option value="all">All Categories</option>';
        const categories = [...new Set(products.map(product => product.category))];
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryDropdown.appendChild(option);
        });
    }

     // Calculate pagination indices
     function calculatePaginationIndices() {
        const startIndex = (currentPage - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        return { startIndex, endIndex };
    }

    // Display products with pagination
    function displayProductsWithPagination() {
        const { startIndex, endIndex } = calculatePaginationIndices();
        const productsToDisplay = products.slice(startIndex, endIndex);
        displayProducts(productsToDisplay);
        renderPaginationControls();
    }

    // Generates pagination buttons
    function renderPaginationControls() {
        const totalPages = Math.ceil(products.length / productsPerPage);
        paginationContainer.innerHTML = '';

        if (totalPages > 1) { // Only show pagination if multiple pages exist
            for (let i = 1; i <= totalPages; i++) {
                const pageButton = document.createElement('button');
                pageButton.textContent = i;
                pageButton.classList.add('page-button');
                if (i === currentPage) {
                    pageButton.classList.add('active');
                }
                pageButton.addEventListener('click', () => {
                    currentPage = i;
                    displayProductsWithPagination();
                });
                paginationContainer.appendChild(pageButton);
            }
        }
    }

    // Display products
    function displayProducts(productsToDisplay) {
        productsContainer.innerHTML = '';

        if (productsToDisplay.length === 0) {
            productsContainer.innerHTML = '<p>No products available.</p>';
            return;
        }
        productsToDisplay.forEach(product => {
            productsContainer.innerHTML += `
                <div class="product">
                    <img src="${product.image}" alt="${product.category}" class="product-img">
                    <div class="product-content">
                        <h2 class="product-title">
                            ${product.title.length > 56
                ? product.title.substring(0, 56).concat('<span class="view-more" data-fulltitle="' + product.title + '">...more</span>')
                : product.title}
                        </h2>
                        <h4 class="product-category">${product.category}</h4>
                        <p class="product-description" style="display:none">${product.description}</p> <!-- Hidden Description -->
                        <div class="product-price-container">
                            <h3 class="product-price">$${product.price}</h3>
                            <a href="#!" data-productId="${product.id}" class="add-to-cart"><ion-icon name="cart-outline"></ion-icon></a>
                            <a href="#!" data-productId="${product.id}" class="view-details"><ion-icon name="eye-outline"></ion-icon></a>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    // Add to cart
    function addToCart(product) {
        const existingProduct = cart.items.find(item => item.id === product.id); //Checks if the product already exists in the cart.
        if (existingProduct) {
            existingProduct.quantity++;
        } else {
            cart.items.push({
                id: product.id,
                title: product.title,
                price: product.price,
                quantity: 1,
            });
        }
        calculateCartTotals();
        updateCartDisplay();
    }

    // Calculate total quantity and price
    function calculateCartTotals() {
        cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    // Update cart display
    function updateCartDisplay() {

        // Clear current items
        cartItemsContainer.innerHTML = '';

        // Add each item in the cart to the cart display
        cart.items.forEach(item => {
            cartItemsContainer.innerHTML += `
                <div class="cart-item" data-productId="${item.id}">
                    <p class="cart-item-title">
                        ${item.title} (x${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}
                    </p>
                    <button class="remove-item" data-productId="${item.id}">Remove</button> <!-- Remove button -->
                </div>
            `;
        });

        // Update total quantity and price
        totalQuantityElement.textContent = cart.totalQuantity;
        totalPriceElement.textContent = cart.totalPrice.toFixed(2);
    }

    // Remove item from cart
    function removeFromCart(productId) {
        const productIndex = cart.items.findIndex(item => item.id === productId);
        if (productIndex > -1) {
            cart.items[productIndex].quantity--;
            if (cart.items[productIndex].quantity==0) {
                cart.items.splice(productIndex, 1);
            } 
            calculateCartTotals();
            updateCartDisplay();
        }
    }

    // Filter and sort products
    function applyFilters() {
        let filteredProducts = [...originalProducts];

        // Search by title
        const searchQuery = searchInput.value.toLowerCase();
        if (searchQuery) {
            filteredProducts = filteredProducts.filter(product =>
                product.title.toLowerCase().includes(searchQuery)
            );
        }

        // Filter by category
        const selectedCategory = categoryDropdown.value;
        if (selectedCategory !== 'all') {
            filteredProducts = filteredProducts.filter(product =>
                product.category === selectedCategory
            );
        }

        // Filter by price range
        const minPrice = parseFloat(minPriceInput.value);
        const maxPrice = parseFloat(maxPriceInput.value);
        if (!isNaN(minPrice)) {
            filteredProducts = filteredProducts.filter(product =>
                product.price >= minPrice
            );
        }
        if (!isNaN(maxPrice)) {
            filteredProducts = filteredProducts.filter(product =>
                product.price <= maxPrice
            );
        }

        // Sort products
        const sortOption = sortDropdown.value;
        if (sortOption === 'price-asc') {
            filteredProducts.sort((a, b) => a.price - b.price);
        } else if (sortOption === 'price-desc') {
            filteredProducts.sort((a, b) => b.price - a.price);
        } else if (sortOption === 'product-desc') {
            filteredProducts.sort((a, b) => b.rating.rate - a.rating.rate);
        }

        products = filteredProducts;
        currentPage = 1; // Reset to first page
        displayProductsWithPagination();
    }

    // Reset filters
    function resetFilters() {
        searchInput.value = '';
        categoryDropdown.value = 'all';
        sortDropdown.value = 'default';
        minPriceInput.value = '';
        maxPriceInput.value = '';
        products = [...originalProducts]; // Restore original products
        currentPage = 1; // Reset to first page
        fetchProducts(); // Refetch original products
       
    }

    // Event listeners
    applyFilterButton.addEventListener('click', applyFilters);
    resetFiltersButton.addEventListener('click', resetFilters);

    // Event listener for remove button
    document.getElementById('cartItems').addEventListener('click', function(event) {
        if (event.target.classList.contains('remove-item')) {
            const productId = event.target.getAttribute('data-productId');
            removeFromCart(Number(productId));
        }
    });

    // Add product to cart
    productsContainer.addEventListener('click', function (event) {
        if (event.target.closest('.add-to-cart')) {
            const productId = event.target.closest('.add-to-cart').getAttribute('data-productId');
            const product = products.find(p => p.id == productId);

            if (product) {
                addToCart(product);
            }
        }

        // View Details Modal
        if (event.target.closest('.view-details')) {
            const productElement = event.target.closest('.product');
            const title = productElement.querySelector('.product-title').innerHTML;
            const description = productElement.querySelector('.product-description').textContent;

            modalTitle.innerHTML = title;
            modalDescription.textContent = description;

            modal.style.display = "block";
        }

        // Image Modal
        if (event.target.classList.contains('product-img')) {
            const imageSrc = event.target.src;
            imageModalContent.src = imageSrc;
            imageModal.style.display = "block";
        }

        if (event.target.classList.contains('view-more')) {
            const fullTitle = event.target.getAttribute('data-fulltitle');
            const titleElement = event.target.closest('.product-title');
            titleElement.innerHTML = fullTitle;
        }
    });

    closeModal.addEventListener('click', function () {
        modal.style.display = "none";
    });

    closeImageModal.addEventListener('click', function () {
        imageModal.style.display = "none";
    });
    modalTitle.addEventListener('click', function(event) {
        if (event.target.classList.contains('view-more')) {
            const fullTitle = event.target.getAttribute('data-fulltitle');
            modalTitle.innerHTML = fullTitle;
        }
    });

    // Initialize
    fetchProducts();
});
