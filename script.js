// Supabase connection
const SUPABASE_URL = "https://emgidrggkrqekztfqrqn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_xiI4drD-EMZKsoQf8HQoPQ_KuO41-6V";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.textContent = isOpen ? "✕" : "☰";
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.textContent = "☰";
    });
  });
}



/* MENU FILTERS + SEARCH — FIXED */
const filterButtons = document.querySelectorAll(".filter-button");
const foodCards = document.querySelectorAll(".menu-grid .food-card");
const searchInput = document.getElementById("menu-search");

let activeFilter = "all";

function filterMenu() {
  const searchTerm = (searchInput?.value || "").trim().toLowerCase();

  foodCards.forEach((card) => {
    const name = (
      card.dataset.name ||
      card.querySelector("h3")?.textContent ||
      ""
    ).toLowerCase();

    const description = (
      card.querySelector(".food-details p")?.textContent ||
      ""
    ).toLowerCase();

    const category = card.dataset.category || "";

    const matchesCategory =
      activeFilter === "all" || category === activeFilter;

    const matchesSearch =
      name.includes(searchTerm) ||
      description.includes(searchTerm);

 if (matchesCategory && matchesSearch) {
  card.style.setProperty("display", "", "important");
} else {
  card.style.setProperty("display", "none", "important");
}
  });
}

filterButtons.forEach((button) => {
  console.log("Filter buttons:", filterButtons.length);
console.log("Food cards:", foodCards.length);

foodCards.forEach((card) => {
  console.log(
    card.querySelector("h3")?.textContent,
    card.dataset.category
  );
});
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter || "all";

    filterButtons.forEach((item) => {
      item.classList.toggle("active", item === button);
    });

    filterMenu();
  });
});

if (searchInput) {
  searchInput.addEventListener("input", filterMenu);
}


const cart = [];

const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");


function renderCart() {

  if (!cartItems || !cartTotal) return;

  const cartCount = document.getElementById("cart-count");

  if (cart.length === 0) {
    cartItems.innerHTML = "<p>Your cart is empty.</p>";
    cartTotal.textContent = "0.00";
    if (cartCount) cartCount.textContent = "0";
    return;
  }

  cartItems.innerHTML = cart.map((item, index) => `
    <div class="cart-item">
      <div class="cart-item-info">
  <span>${item.name} — €${item.price.toFixed(2)}</span>
  ${item.description ? `<small>${item.description}</small>` : ""}
</div>
      <div>
        <button data-action="minus" data-index="${index}">−</button>
        <span>${item.quantity}</span>
        <button data-action="plus" data-index="${index}">+</button>
        <button data-action="remove" data-index="${index}">Remove</button>
      </div>
    </div>
  `).join("");

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  cartTotal.textContent = total.toFixed(2);

  if (cartCount) {
    cartCount.textContent = cart.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  }
}


document.querySelector(".menu-grid")?.addEventListener("click", event => {
  const control = event.target.closest(".product-cart-control");
  if (!control) return;

  const addButton = control.querySelector(".add-to-cart");
  const quantityControl = control.querySelector(".quantity-control");
  const quantityDisplay = control.querySelector(".product-quantity");

  if (!addButton || !quantityControl || !quantityDisplay) return;

  const name = addButton.dataset.name ||
    control.closest(".food-card")?.querySelector("h3")?.textContent.trim();

  const price = Number(
    addButton.dataset.price ||
    control.closest(".food-card")?.querySelector(".food-price")?.dataset.price ||
    control.closest(".food-card")?.querySelector(".food-price")?.textContent.replace(/[^\d.]/g, "")
  );

  if (!name || !Number.isFinite(price)) return;

  let change = 0;

  if (event.target.closest(".add-to-cart")) {
    change = 1;
  } else if (event.target.closest(".quantity-plus")) {
    change = 1;
  } else if (event.target.closest(".quantity-minus")) {
    change = -1;
  } else {
    return;
  }

  const item = cart.find(product => product.name === name && !product.description);

  if (!item && change > 0) {
    cart.push({ name, price, quantity: 1 });
  } else if (item) {
    item.quantity += change;

    if (item.quantity <= 0) {
      cart.splice(cart.indexOf(item), 1);
    }
  }

  const updatedItem = cart.find(product => product.name === name && !product.description);

  if (updatedItem) {
    quantityDisplay.textContent = updatedItem.quantity;
    quantityControl.hidden = false;
    addButton.classList.add("added");
    addButton.textContent = `✓ Added to Cart (${updatedItem.quantity})`;
  } else {
    quantityControl.hidden = true;
    addButton.classList.remove("added");
    addButton.textContent = "Add to Cart +";
  }

  renderCart();
});



if (cartItems) {
  cartItems.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    
    const index = Number(button.dataset.index);
    const item = cart[index];

    if (!item) return;

    if (button.dataset.action === "plus") {
      item.quantity++;
    } else if (button.dataset.action === "minus") {
      item.quantity--;
      if (item.quantity <= 0) cart.splice(index, 1);
    } else if (button.dataset.action === "remove") {
      cart.splice(index, 1);
    }

    renderCart();
  });
}

document.getElementById("clear-cart")?.addEventListener("click", () => {
  cart.length = 0;
  renderCart();
});

renderCart();

const openCartButton = document.getElementById("open-cart");
const closeCartButton = document.getElementById("close-cart");
const cartDrawer = document.getElementById("cart-drawer");
const cartOverlay = document.getElementById("cart-overlay");

function openCart() {
  cartDrawer?.classList.add("open");
  cartOverlay?.classList.add("open");
  cartDrawer?.setAttribute("aria-hidden", "false");
  document.body.classList.add("cart-open");
}

function closeCart() {
  cartDrawer?.classList.remove("open");
  cartOverlay?.classList.remove("open");
  cartDrawer?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("cart-open");
}

openCartButton?.addEventListener("click", openCart);
closeCartButton?.addEventListener("click", closeCart);
cartOverlay?.addEventListener("click", closeCart);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeCart();
});


const checkoutBtn = document.getElementById("checkout-btn");
const checkoutModal = document.getElementById("checkout-modal");
const closeCheckout = document.getElementById("close-checkout");
const checkoutTotal = document.getElementById("checkout-total");
const checkoutForm = document.getElementById("checkout-form");

const customerNameInput = document.getElementById("customer-name");
const customerPhoneInput = document.getElementById("customer-phone");
const customerAddressInput = document.getElementById("customer-address");
const customerCityInput = document.getElementById("customer-city");

let savedProfile = null;
let addressEditing = false;

async function loadCustomerProfile() {
  const { data, error } = await supabaseClient.auth.getSession();

  if (error || !data.session) {
    savedProfile = null;
    addressEditing = false;

    customerNameInput.readOnly = false;
    customerPhoneInput.readOnly = false;
    customerAddressInput.readOnly = false;
    customerCityInput.readOnly = false;

    return;
  }

  const user = data.session.user;
  const profile = user.user_metadata || {};

  savedProfile = {
    name: profile.full_name || "",
    phone: profile.phone || "",
    address: profile.address || "",
    city: profile.city || ""
  };

  customerNameInput.value = savedProfile.name;
  customerPhoneInput.value = savedProfile.phone;
  customerAddressInput.value = savedProfile.address;
  customerCityInput.value = savedProfile.city;

  customerNameInput.readOnly = Boolean(savedProfile.name);
  customerPhoneInput.readOnly = Boolean(savedProfile.phone);
  customerAddressInput.readOnly = Boolean(savedProfile.address);
  customerCityInput.readOnly = Boolean(savedProfile.city);

  addressEditing = false;
  updateAddressButton();
}

let changeAddressButton = document.getElementById(
  "change-delivery-address"
);

if (!changeAddressButton && customerAddressInput) {
  changeAddressButton = document.createElement("button");
  changeAddressButton.id = "change-delivery-address";
  changeAddressButton.type = "button";
  changeAddressButton.textContent = "Change delivery address";
  changeAddressButton.style.display = "none";

  customerAddressInput.insertAdjacentElement(
    "afterend",
    changeAddressButton
  );
}

function updateAddressButton() {
  if (!changeAddressButton) return;

  const isLoggedIn = Boolean(savedProfile);

  changeAddressButton.style.display = isLoggedIn
    ? "inline-block"
    : "none";

  changeAddressButton.textContent = addressEditing
    ? "Use saved delivery address"
    : "Change delivery address";
}

changeAddressButton?.addEventListener("click", () => {
  if (!savedProfile) return;

  addressEditing = !addressEditing;

  customerAddressInput.readOnly =
    !addressEditing && Boolean(savedProfile.address);

  customerCityInput.readOnly =
    !addressEditing && Boolean(savedProfile.city);

  if (!addressEditing) {
    customerAddressInput.value = savedProfile.address;
    customerCityInput.value = savedProfile.city;
  }

  updateAddressButton();
});



const orderType = document.getElementById("order-type");
const deliveryFields = document.getElementById("delivery-fields");
const deliveryFeeRow = document.getElementById("delivery-fee-row");
const subtotalDisplay = document.getElementById("checkout-subtotal");
const deliveryFeeDisplay = document.getElementById("checkout-delivery-fee");
const cardPaymentNote = document.getElementById("card-payment-note");

const DELIVERY_FEE = 1.00;

function updateCheckoutSummary() {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const isDelivery = orderType.value === "delivery";
  const deliveryFee = isDelivery ? DELIVERY_FEE : 0;

  subtotalDisplay.textContent = subtotal.toFixed(2);
  deliveryFeeDisplay.textContent = deliveryFee.toFixed(2);
  checkoutTotal.textContent = (subtotal + deliveryFee).toFixed(2);

  deliveryFields.hidden = !isDelivery;
  deliveryFeeRow.hidden = !isDelivery;

  document.getElementById("customer-address").required = isDelivery;
  document.getElementById("customer-city").required = isDelivery;
}

orderType.addEventListener("change", updateCheckoutSummary);

checkoutForm.querySelectorAll('input[name="payment_method"]').forEach(input => {
  input.addEventListener("change", () => {
    cardPaymentNote.hidden =
      checkoutForm.querySelector('input[name="payment_method"]:checked').value !== "card";
  });
});


checkoutBtn.addEventListener("click", async () => {
  if (cart.length === 0) {
    alert("Your cart is empty. Please add items first!");
    return;
  }

  await loadCustomerProfile();
  updateCheckoutSummary();

  checkoutModal.style.display = "flex";
});

closeCheckout.addEventListener("click", () => {
  checkoutModal.style.display = "none";
});

checkoutModal.addEventListener("click", (event) => {
  if (event.target === checkoutModal) {
    checkoutModal.style.display = "none";
  }
});


checkoutForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }

  const customerName = document
    .getElementById("customer-name")
    .value.trim();


  const phoneInput = document.getElementById("customer-phone");
  const addressInput = document.getElementById("customer-address");
  const cityInput = document.getElementById("customer-city");
  const notesInput = document.getElementById("customer-notes");
  const orderTypeInput = document.getElementById("order-type");
  const paymentInput = checkoutForm.querySelector(
    'input[name="payment_method"]:checked'
  );

  const phone = phoneInput?.value.trim() || "";
  const address = addressInput?.value.trim() || "";
  const city = cityInput?.value.trim() || "";
  const notes = notesInput?.value.trim() || "";
  const orderType = orderTypeInput?.value || "delivery";
  const paymentMethod = paymentInput?.value || "cash";

  if (!customerName || !phone) {
    alert("Please enter your full name and phone number.");
    return;
  }

  if (
    orderType === "delivery" &&
    (!address || !city)
  ) {
    alert("Please enter your delivery address and city.");
    return;
  }


  const productIds = {
    "classic doggy": 3,
    "philly doggy": 4,
    "chef avocado doggy": 5,
    "the crunch": 6,
    "cocktails": 7,
    "hot chocolate": 8,
    "mulled wine": 9
  };

const items = cart.map((item) => {
  const name = item.name.trim().toLowerCase();

  if (item.isCustom) {
    return {
      product_id: null,
      quantity: Number(item.quantity),
      is_custom: true,
      custom_ingredients: item.customIngredients
    };
  }

  return {
    product_id: productIds[name],
    quantity: Number(item.quantity)
  };
});
if (
  items.some(
    (item) =>
      (!item.is_custom && !item.product_id) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1
  )
) {
  alert(
    "A product in your cart could not be identified. Please check your cart."
  );
  return;
}

  const submitButton = checkoutForm.querySelector(
    'button[type="submit"], input[type="submit"]'
  );

  if (submitButton) submitButton.disabled = true;

  try {
    const { data: sessionData, error: sessionError } =
  await supabaseClient.auth.getSession();

if (sessionError) {
  throw sessionError;
}

const session = sessionData.session;
    const response = await fetch("https://doggy-doggy-api.onrender.com/orders",{
      method: "POST",
     headers: {
  "Content-Type": "application/json",
  ...(session
    ? { Authorization: `Bearer ${session.access_token}` }
    : {})
},

  body: JSON.stringify({
  customer_name: customerName,
  phone,
  address,
  city,
  notes,
  order_type: orderType,
  payment_method: paymentMethod,
  items
})

    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.detail || "Could not place your order.");
    }

    alert(
      `Thank you, ${customerName}! Your order #${result.id} has been placed successfully. Total: €${Number(result.total).toFixed(2)}`
    );

    cart.length = 0;
    renderCart();
    checkoutForm.reset();
    checkoutModal.style.display = "none";
  } catch (error) {
    console.error("Order submission failed:", error);
    alert(`Your order could not be placed: ${error.message}`);
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});



/* Build Your Own Doggy */
const buildButton = document.querySelector(".build-doggy-btn");
const buildModal = document.getElementById("build-modal");
const closeBuildModal = document.getElementById("close-build-modal");
const buildTotal = document.getElementById("build-total");
const addCustomDoggy = document.getElementById("add-custom-doggy");

const ingredientCheckboxes = document.querySelectorAll(
  "#build-modal .ingredient-list input[type='checkbox']"
);

const BASE_DOGGY_PRICE = 3.50;
const EXTRA_INGREDIENT_PRICE = 0.50;

const buildQuantityControl = document.querySelector(
  ".build-quantity-control"
);
const buildQuantityDisplay = document.querySelector(
  ".build-product-quantity"
);
const buildQuantityPlus = document.querySelector(
  ".build-quantity-plus"
);
const buildQuantityMinus = document.querySelector(
  ".build-quantity-minus"
);

function syncBuildCardUI() {
  const customItems = cart.filter(
    item => item.isCustom && item.name === "Create Your Own Doggy"
  );

  const totalQuantity = customItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  if (!buildButton || !buildQuantityControl || !buildQuantityDisplay) return;

  buildQuantityDisplay.textContent = totalQuantity;
  buildQuantityControl.hidden = totalQuantity === 0;

  buildButton.classList.toggle("added", totalQuantity > 0);
  buildButton.textContent = totalQuantity > 0
    ? `✓ Added to Cart (${totalQuantity})`
    : "Build Yours →";
}

buildQuantityPlus?.addEventListener("click", () => {
  const customItems = cart.filter(
    item => item.isCustom && item.name === "Create Your Own Doggy"
  );
  const lastItem = customItems[customItems.length - 1];

  if (!lastItem) return;

  lastItem.quantity++;
  renderCart();
  syncBuildCardUI();
});

buildQuantityMinus?.addEventListener("click", () => {
  const index = cart.findLastIndex(
    item => item.isCustom && item.name === "Create Your Own Doggy"
  );

  if (index === -1) return;

  cart[index].quantity--;

  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }

  renderCart();
  syncBuildCardUI();
});

function updateBuildTotal() {
  const selectedCount = [...ingredientCheckboxes].filter(
    checkbox => checkbox.checked
  ).length;

  const total = BASE_DOGGY_PRICE +
    selectedCount * EXTRA_INGREDIENT_PRICE;

  buildTotal.textContent = total.toFixed(2);
}

buildButton.addEventListener("click", () => {
  ingredientCheckboxes.forEach(checkbox => {
    checkbox.checked = false;
  });

  updateBuildTotal();
  buildModal.style.display = "flex";
});

closeBuildModal.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  buildModal.style.display = "none";
});

buildModal.addEventListener("click", event => {
  if (event.target === buildModal) {
    buildModal.style.display = "none";
  }
});

ingredientCheckboxes.forEach(checkbox => {
  checkbox.addEventListener("change", updateBuildTotal);
});

addCustomDoggy.addEventListener("click", () => {
  const selectedIngredients = [...ingredientCheckboxes]
    .filter(checkbox => checkbox.checked)
    .map(checkbox => checkbox.value);

  const price = BASE_DOGGY_PRICE +
    selectedIngredients.length * EXTRA_INGREDIENT_PRICE;

  const ingredientDescription = selectedIngredients.length
    ? selectedIngredients.join(", ")
    : "No extra ingredients";

cart.push({
  name: "Create Your Own Doggy",
  description: ingredientDescription,
  price: price,
  quantity: 1,
  isCustom: true,
  customIngredients: selectedIngredients
});
  renderCart();
buildModal.style.display = "none";

buildButton.classList.remove("added");
void buildButton.offsetWidth;
syncBuildCardUI();
buildButton.classList.add("added");
});


/* Interactive Food Gallery */
const foodGalleryModal = document.getElementById("food-gallery-modal");
const closeFoodGallery = document.getElementById("close-food-gallery");
const galleryImage = document.getElementById("gallery-product-image");
const galleryName = document.getElementById("gallery-product-name");
const galleryDescription = document.getElementById("gallery-product-description");
const galleryPrice = document.getElementById("gallery-product-price");
const galleryAddButton = document.getElementById("gallery-add-to-cart");

const galleryQuantityControls = document.getElementById("gallery-quantity-controls");
const galleryQuantity = document.getElementById("gallery-quantity");
const galleryMinus = document.getElementById("gallery-minus");
const galleryPlus = document.getElementById("gallery-plus");
const galleryAddedMessage = document.getElementById("gallery-added-message");

let selectedGalleryProduct = null;

const productIngredients = {
  "CLASSIC DOGGY": "Ingredients: Sausage, soft hot dog bun, ketchup and mustard.",
  "PHILLY DOGGY": "Ingredients: Sausage, soft bun, melted cheese and savory toppings.",
  "CHEF AVOCADO DOGGY": "Ingredients: Sausage, soft bun, avocado and fresh toppings.",
  "THE CRUNCH": "Ingredients: Crispy corn dog batter and sausage.",
  "COCKTAILS": "Ingredients: Please check the ingredients with our staff.",
  "HOT CHOCOLATE": "Ingredients: Milk, chocolate and sugar.",
  "MULLED WINE": "Ingredients: Wine, warming spices and citrus."
};

function updateGalleryCartUI() {
  if (!selectedGalleryProduct) return;

  const item = cart.find(
    item => item.name === selectedGalleryProduct.name && !item.description
  );

  const quantity = item ? item.quantity : 0;

  galleryAddButton.style.display = quantity > 0 ? "none" : "inline-block";
  galleryQuantityControls.style.display = quantity > 0 ? "flex" : "none";
  galleryAddedMessage.style.display = quantity > 0 ? "block" : "none";
  galleryQuantity.textContent = quantity;
}

document.querySelectorAll(".food-card:not(.build-your-own-card)").forEach(card => {
  const image = card.querySelector(".food-image");
  if (!image) return;

  image.addEventListener("click", () => {
    const title = card.querySelector("h3");
    const description = card.querySelector(".food-info p");
    const priceElement = card.querySelector(".food-price");
    const addButton = card.querySelector(".add-to-cart");

    const priceText = addButton?.dataset.price ||
      priceElement?.dataset.price ||
      priceElement?.textContent.replace(/[^\d.]/g, "");

    selectedGalleryProduct = {
      name: title?.textContent.trim() || "Menu Item",
      description: description?.textContent.trim() || "",
      price: Number(priceText),
      image: getComputedStyle(image).backgroundImage
    };

    galleryName.textContent = selectedGalleryProduct.name;
    galleryDescription.textContent =
      productIngredients[selectedGalleryProduct.name] ||
      selectedGalleryProduct.description;

    galleryPrice.textContent = `€${selectedGalleryProduct.price.toFixed(2)}`;
    galleryImage.style.backgroundImage = selectedGalleryProduct.image;

    updateGalleryCartUI();
    foodGalleryModal.style.display = "flex";
  });
});

closeFoodGallery.addEventListener("click", () => {
  foodGalleryModal.style.display = "none";
});

foodGalleryModal.addEventListener("click", event => {
  if (event.target === foodGalleryModal) {
    foodGalleryModal.style.display = "none";
  }
});

galleryAddButton.addEventListener("click", () => {
  if (!selectedGalleryProduct ||
      !Number.isFinite(selectedGalleryProduct.price) ||
      selectedGalleryProduct.price <= 0) return;

  const existingItem = cart.find(
    item => item.name === selectedGalleryProduct.name && !item.description
  );

  if (existingItem) {
    existingItem.quantity++;
  } else {
    cart.push({
      name: selectedGalleryProduct.name,
      price: selectedGalleryProduct.price,
      quantity: 1
    });
  }

  renderCart();
  syncMenuCartButtons();
  updateGalleryCartUI();

  galleryAddButton.classList.add("added");
  galleryAddedMessage.style.animation = "none";
  void galleryAddedMessage.offsetWidth;
  galleryAddedMessage.style.animation = "addedPop 0.35s ease";
});

galleryPlus.addEventListener("click", () => {
  if (!selectedGalleryProduct) return;

  const item = cart.find(
    item => item.name === selectedGalleryProduct.name && !item.description
  );

  if (item) item.quantity++;

  renderCart();
  syncMenuCartButtons();
  updateGalleryCartUI();
});

galleryMinus.addEventListener("click", () => {
  if (!selectedGalleryProduct) return;

  const index = cart.findIndex(
    item => item.name === selectedGalleryProduct.name && !item.description
  );

  if (index === -1) return;

  cart[index].quantity--;

  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }

  renderCart();
  syncMenuCartButtons();
  updateGalleryCartUI();
});
function syncMenuCartButtons() {
  document.querySelectorAll(".food-card:not(.build-your-own-card)").forEach(card => {
    const title = card.querySelector("h3");
    const button = card.querySelector(".add-to-cart");

    if (!title || !button) return;

    const productName = title.textContent.trim();
    const item = cart.find(
      item => item.name === productName && !item.description
    );

    if (item && item.quantity > 0) {
      button.textContent = `✓ Added to Cart (${item.quantity})`;
      button.classList.add("added");
    } else {
      button.textContent = "Add to Cart +";
      button.classList.remove("added");
    }
  });
}



/* Sync website menu with Supabase */
(async function syncAdminMenuWithWebsite() {
  const API_URL = "https://doggy-doggy-api.onrender.com";

  const menuGrid = document.querySelector(".menu-grid");
  if (!menuGrid) return;

  try {
    const response = await fetch(`${API_URL}/products`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const products = await response.json();
    const buildCard = menuGrid.querySelector(".build-your-own-card");

 const existingCards = [
  ...menuGrid.querySelectorAll(".food-card:not(.build-your-own-card)")
];

// Match the original static cards by their original names once.
const originalNameToId = {
  "classic doggy": 3,
  "philly doggy": 4,
  "chef avocado doggy": 5,
  "the crunch": 6,
  "cocktails": 7,
  "hot chocolate": 8,
  "mulled wine": 9
};

existingCards.forEach(card => {
  if (card.dataset.adminProductId) return;

  const title = card.querySelector("h3")?.textContent.trim().toLowerCase();
  const id = originalNameToId[title];

  if (id) {
    card.dataset.adminProductId = String(id);
  }
});

    // Remove cards whose products no longer exist in the database.
    existingCards.forEach(card => {
      const id = card.dataset.adminProductId;
      if (id && !products.some(product => String(product.id) === id)) {
        card.remove();
      }
    });

    products.forEach(product => {
      const name = String(product.name || "").trim();
      const price = Number(product.price);

      if (!name || !Number.isFinite(price)) return;

    let card = [...menuGrid.querySelectorAll(
  ".food-card:not(.build-your-own-card)"
)].find(item =>
  item.dataset.adminProductId === String(product.id)
);

if (!card) {
  card = [...menuGrid.querySelectorAll(
    ".food-card:not(.build-your-own-card)"
  )].find(item =>
    !item.dataset.adminProductId &&
    item.querySelector("h3")?.textContent.trim().toLowerCase() ===
      name.toLowerCase()
  );
}

      if (!product.is_available) {
        if (card) card.hidden = true;
        return;
      }

      if (!card) {
        card = document.createElement("article");
        card.className = "food-card";
        card.innerHTML = `
          <div class="food-image"></div>
          <div class="food-info">
            <div>
              <h3></h3>
              <p class="product-description"></p>
              <span class="food-price"></span>
              <div class="product-cart-control">
                <button class="add-to-cart" type="button">Add to Cart +</button>
                <div class="quantity-control" hidden>
                  <button class="quantity-minus" type="button">−</button>
                  <span class="product-quantity">1</span>
                  <button class="quantity-plus" type="button">+</button>
                </div>
              </div>
            </div>
          </div>
        `;

        if (buildCard) {
          buildCard.insertAdjacentElement("afterend", card);
        } else {
          menuGrid.appendChild(card);
        }
      }

 card.dataset.adminProductId = String(product.id);

card.dataset.adminProductId = String(product.id);

// Keep the category already assigned in index.html
if (!card.dataset.category) {
  const category = String(product.category || "")
    .trim()
    .toLowerCase();

  if (
    category.includes("drink") ||
    category.includes("side") ||
    category.includes("extra")
  ) {
    card.dataset.category = "sides";
  } else if (category.includes("corn")) {
    card.dataset.category = "corn";
  } else {
    card.dataset.category = "hotdog";
  }
}

card.hidden = !product.is_available;

      
card.querySelector("h3").textContent = name;

let description = card.querySelector(".product-description");

if (!description) {
  description = document.createElement("p");
  description.className = "product-description";

  const title = card.querySelector("h3");
  if (title) {
    title.insertAdjacentElement("afterend", description);
  }
}

description.textContent = product.description || "";
description.hidden = !product.description;

let priceElement = card.querySelector(".food-price");

if (!priceElement) {
  priceElement = document.createElement("span");
  priceElement.className = "food-price";

  const info = card.querySelector(".food-info");
  if (info) {
    info.appendChild(priceElement);
  } else {
    card.appendChild(priceElement);
  }
}

priceElement.textContent = `€${price.toFixed(2)}`;


      const button = card.querySelector(".add-to-cart");
      button.dataset.name = name;
      button.dataset.price = price.toFixed(2);

      const image = card.querySelector(".food-image");
      if (product.image_url) {
        image.style.backgroundImage = `url("${product.image_url}")`;
        image.style.backgroundSize = "cover";
        image.style.backgroundPosition = "center";
      } else {
        image.style.backgroundImage = "";
      }
    });
    // Keep website products in the same order as Admin
const orderedCards = products
  .filter(product => product.is_available)
  .map(product =>
    [...menuGrid.querySelectorAll(
      ".food-card:not(.build-your-own-card)"
    )].find(card =>
      card.dataset.adminProductId === String(product.id)
    )
  )
  .filter(Boolean);

orderedCards.forEach(card => menuGrid.appendChild(card));

// Keep "Build Your Own Doggy" at the beginning
if (buildCard) {
  menuGrid.insertBefore(buildCard, menuGrid.firstElementChild);
}
  } catch (error) {
    console.error("Could not load menu from Supabase:", error);
  }
})();

console.log("Supabase client initialized:", !!supabaseClient);

/* CUSTOMER ACCOUNT DRAWER */
const accountLink = document.querySelector(".account-link");
const accountDrawer = document.getElementById("account-drawer");
const accountOverlay = document.getElementById("account-overlay");
const closeAccountButton = document.getElementById("close-account");
const accountSignOutButton = document.getElementById("account-sign-out");

const accountGreeting = document.getElementById("account-greeting");
const profileEmail = document.getElementById("profile-email");
const profilePhone = document.getElementById("profile-phone");
const profileAddress = document.getElementById("profile-address");
const profileCity = document.getElementById("profile-city");

const ordersMessage = document.getElementById("orders-message");
const customerOrders = document.getElementById("customer-orders");

const CUSTOMER_API_URL = "https://doggy-doggy-api.onrender.com";

function openAccountDrawer() {
  accountDrawer?.classList.add("open");
  accountOverlay?.classList.add("open");
  accountDrawer?.setAttribute("aria-hidden", "false");
  document.body.classList.add("account-open");

  loadAccountPanel();
}

function closeAccountDrawer() {
  accountDrawer?.classList.remove("open");
  accountOverlay?.classList.remove("open");
  accountDrawer?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("account-open");
}

async function loadAccountPanel() {
  if (!window.supabase || !accountGreeting) return;

  const { data, error } = await supabaseClient.auth.getUser();

  if (error || !data.user) {
    window.location.href = "account.html";
    return;
  }

  const user = data.user;
  const profile = user.user_metadata || {};

  accountGreeting.textContent =
    `Hello, ${profile.full_name || "there"}!`;

  if (profileEmail) {
    profileEmail.textContent = user.email || "";
  }

  if (profilePhone) {
    profilePhone.textContent = `Phone: ${profile.phone || "Not provided"}`;
  }

  if (profileAddress) {
    profileAddress.textContent =
      `Address: ${profile.address || "Not provided"}`;
  }

  if (profileCity) {
    profileCity.textContent =
      `City: ${profile.city || "Not provided"}`;
  }

  await loadCustomerOrders();
}

async function loadCustomerOrders() {
  if (!customerOrders || !ordersMessage) return;

  ordersMessage.textContent = "Loading your orders...";
  customerOrders.replaceChildren();

  const { data, error } = await supabaseClient.auth.getSession();
  const session = data?.session;

  if (error || !session) {
    ordersMessage.textContent = "Please log in to see your orders.";
    return;
  }

  try {
    const response = await fetch(`${CUSTOMER_API_URL}/customer/orders`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.detail || "Could not load your orders."
      );
    }

    if (!result.length) {
      ordersMessage.textContent = "You haven't placed any orders yet.";
      return;
    }

    ordersMessage.textContent = "";

    result.forEach((order) => {
      const card = document.createElement("article");
      card.className = "customer-order-card";

      const title = document.createElement("h4");
      title.textContent = `Order #${order.id}`;

      const status = document.createElement("p");
status.className = "order-status-row";

const statusLabel = document.createElement("span");
statusLabel.textContent = "Status:";

const statusBadge = document.createElement("span");
statusBadge.className = "order-status";
statusBadge.textContent = String(order.status || "pending")
  .replaceAll("_", " ");

status.append(statusLabel, statusBadge);

      const total = document.createElement("p");
      total.textContent =
        `Total: €${Number(order.total).toFixed(2)}`;

      const date = document.createElement("p");
      date.textContent = order.created_at
        ? `Date: ${new Date(order.created_at).toLocaleString()}`
        : "";

      card.append(title, status, total, date);
      customerOrders.appendChild(card);
    });
  } catch (error) {
    console.error("Could not load customer orders:", error);
    ordersMessage.textContent =
      "Order history is not connected yet. Please try again later.";
  }
}


const accountButton = document.getElementById("open-account");


accountButton?.addEventListener("click", async (event) => {
  event.preventDefault();
  console.log("1. Account icon clicked");

  try {
    const { data, error } = await supabaseClient.auth.getSession();

    console.log("2. Session check:", {
      hasSession: !!data?.session,
      error: error?.message
    });

    if (error || !data?.session) {
      console.log("3. No session — opening account.html");
      window.location.href = "account.html";
      return;
    }

    console.log("3. Session found — opening drawer");

    if (!accountDrawer || !accountOverlay) {
      console.error("Account drawer or overlay is missing", {
        accountDrawer,
        accountOverlay
      });
      return;
    }

    openAccountDrawer();
    console.log("4. Drawer opened");
  } catch (error) {
    console.error("Account icon error:", error);
  }
});


closeAccountButton?.addEventListener("click", closeAccountDrawer);
accountOverlay?.addEventListener("click", closeAccountDrawer);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAccountDrawer();
  }
});

accountSignOutButton?.addEventListener("click", async () => {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    alert("Could not sign out. Please try again.");
    return;
  }

  closeAccountDrawer();
  window.location.href = "index.html";
});

/* BUILD YOUR OWN DOGGY — QUANTITY CONTROLS */
document.querySelectorAll(".build-your-own-card").forEach((card) => {
  const buildButton = card.querySelector(".build-doggy-btn");
  const quantityControl = card.querySelector(".build-quantity-control");
  const minusButton = card.querySelector(".build-quantity-minus");
  const plusButton = card.querySelector(".build-quantity-plus");
  const quantityDisplay = card.querySelector(".build-product-quantity");

  if (!buildButton || !quantityControl || !minusButton || !plusButton || !quantityDisplay) {
    return;
  }

  let quantity = 0;

  buildButton.addEventListener("click", () => {
    quantity = Math.max(1, quantity);
    quantityControl.hidden = false;
    buildButton.hidden = true;
    quantityDisplay.textContent = quantity;
  });

  plusButton.addEventListener("click", () => {
    quantity++;
    quantityDisplay.textContent = quantity;
  });

  minusButton.addEventListener("click", () => {
    quantity--;

    if (quantity <= 0) {
      quantity = 0;
      quantityControl.hidden = true;
      buildButton.hidden = false;
    }

    quantityDisplay.textContent = quantity;
  });
});



