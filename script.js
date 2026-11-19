// CONFIGURAÇÃO DO ESTABELECIMENTO
const WHATSAPP_NUMBER = "5532999999999"; // DDI + DDD + Número
const DELIVERY_FEE = 5.00;
const ADMIN_PASSWORD = "1234"; // Altera para a senha do dono da loja

// Produtos iniciais de demonstração
const defaultProducts = [
  { id: 1, name: "Brava Clássico", desc: "Pão brioche, blend 160g, queijo prato, alface, tomate e maionese da casa.", price: 24.90, category: "Lanches", image: "", emoji: "🍔", available: true },
  { id: 2, name: "Cheddar Bacon Melt", desc: "Blend 160g, cheddar cremoso, bacon crocante e cebola caramelizada.", price: 29.90, category: "Lanches", image: "", emoji: "🥓", available: true },
  { id: 3, name: "Combo Duplo + Refri", desc: "2 Smash burgers 120g + batata média + refrigerante lata.", price: 39.90, category: "Combos", image: "", emoji: "🍟", available: true },
  { id: 4, name: "Batata Rústica Suprema", desc: "Porção 400g com cheddar cremoso, bacon picado e páprica.", price: 22.00, category: "Porções", image: "", emoji: "🥔", available: true },
  { id: 5, name: "Refrigerante Lata 350ml", desc: "Coca-Cola, Guaraná Antarctica ou Sprite (gelado).", price: 6.00, category: "Bebidas", image: "", emoji: "🥤", available: true }
];

let products = JSON.parse(localStorage.getItem("menu_products")) || defaultProducts;
let cart = JSON.parse(localStorage.getItem("menu_cart")) || [];
let currentCategory = "Todos";
let selectedProduct = null;
let modalQty = 1;
let isAdminAuthenticated = false;
let currentProductImage = "";

function formatBRL(value) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function saveData() {
  try {
    localStorage.setItem("menu_products", JSON.stringify(products));
    localStorage.setItem("menu_cart", JSON.stringify(cart));
    return true;
  } catch (err) {
    alert("Limite de armazenamento do navegador atingido. Tente usar uma imagem menor ou um link de imagem.");
    return false;
  }
}

function renderThumb(item) {
  if (item.image) {
    return `<img src="${item.image}" alt="${item.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';" /><span style="display:none;width:100%;height:100%;place-items:center;">${item.emoji || "🍽️"}</span>`;
  }
  return item.emoji || "🍽️";
}

// Renderiza o cardápio
function renderMenu() {
  const list = document.getElementById("menuList");
  const searchInput = document.getElementById("searchInput");
  if (!list) return;

  const search = searchInput ? searchInput.value.toLowerCase() : "";

  const filtered = products.filter(p => {
    const matchCat = currentCategory === "Todos" || p.category === currentCategory;
    const matchText = p.name.toLowerCase().includes(search) || p.desc.toLowerCase().includes(search);
    return matchCat && matchText;
  });

  if (filtered.length === 0) {
    list.innerHTML = `<p style="text-align:center;color:#a1a1aa;padding:30px;">Nenhum item encontrado.</p>`;
    return;
  }

  list.innerHTML = filtered.map(item => `
    <div class="menu-card ${item.available ? "" : "unavailable"}" onclick="openItemModal(${item.id})">
      <div class="item-info">
        <h3>${item.name} ${item.available ? "" : "(Esgotado)"}</h3>
        <p>${item.desc}</p>
        <span class="item-price">${formatBRL(item.price)}</span>
      </div>
      <div class="item-thumb">${renderThumb(item)}</div>
    </div>
  `).join("");
}

function selectCategory(btn) {
  document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  currentCategory = btn.dataset.cat;
  renderMenu();
}

// Modal de Produto
function openItemModal(id) {
  selectedProduct = products.find(p => p.id === id);
  if (!selectedProduct) return;

  modalQty = 1;
  document.getElementById("modalTitle").innerText = selectedProduct.name;
  document.getElementById("modalDesc").innerText = selectedProduct.desc;
  document.getElementById("modalBasePrice").innerText = formatBRL(selectedProduct.price);
  document.getElementById("modalQty").innerText = modalQty;
  document.getElementById("itemObs").value = "";

  const showAddons = ["Lanches", "Combos"].includes(selectedProduct.category);
  document.getElementById("addonsContainer").classList.toggle("hidden", !showAddons);
  document.querySelectorAll("#addonsContainer input").forEach(cb => cb.checked = false);

  updateModalPrice();
  document.getElementById("itemModal").classList.remove("hidden");
}

function changeModalQty(delta) {
  modalQty = Math.max(1, modalQty + delta);
  document.getElementById("modalQty").innerText = modalQty;
  updateModalPrice();
}

function updateModalPrice() {
  let addonsTotal = 0;
  document.querySelectorAll("#addonsContainer input:checked").forEach(cb => {
    addonsTotal += parseFloat(cb.value);
  });
  const total = (selectedProduct.price + addonsTotal) * modalQty;
  document.getElementById("modalFinalPrice").innerText = formatBRL(total);
}

function confirmAddToCart() {
  const addons = [];
  let addonsTotal = 0;

  document.querySelectorAll("#addonsContainer input:checked").forEach(cb => {
    addons.push(cb.dataset.name);
    addonsTotal += parseFloat(cb.value);
  });

  const obs = document.getElementById("itemObs").value.trim();
  const unitPrice = selectedProduct.price + addonsTotal;

  cart.push({
    cartId: Date.now(),
    name: selectedProduct.name,
    qty: modalQty,
    unitPrice,
    addons,
    obs
  });

  saveData();
  updateCartBar();
  closeModal("itemModal");
}

// Carrinho
function updateCartBar() {
  const bar = document.getElementById("cartBar");
  if (!bar) return;

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalVal = cart.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);

  if (totalQty === 0) {
    bar.classList.add("hidden");
  } else {
    bar.classList.remove("hidden");
    document.getElementById("cartCount").innerText = totalQty;
    document.getElementById("cartTotalBar").innerText = formatBRL(totalVal);
  }
}

function openCart() {
  renderCartItems();
  document.getElementById("cartModal").classList.remove("hidden");
}

function renderCartItems() {
  const container = document.getElementById("cartItemsList");
  if (cart.length === 0) {
    container.innerHTML = `<p style="color:#a1a1aa;padding:12px 0;">A sacola está vazia.</p>`;
  } else {
    container.innerHTML = cart.map((item, idx) => `
      <div class="cart-item-row">
        <div>
          <strong>${item.qty}x ${item.name}</strong>
          ${item.addons.length ? `<div style="font-size:0.78rem;color:#a1a1aa;">+ ${item.addons.join(", ")}</div>` : ""}
          ${item.obs ? `<div style="font-size:0.78rem;color:#f59e0b;">Obs: ${item.obs}</div>` : ""}
        </div>
        <div>
          <span>${formatBRL(item.unitPrice * item.qty)}</span>
          <button class="remove-item" onclick="removeCartItem(${idx})">Remover</button>
        </div>
      </div>
    `).join("");
  }

  const sub = cart.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
  const isDelivery = document.getElementById("deliveryType").value === "Entrega";
  const fee = (isDelivery && sub > 0) ? DELIVERY_FEE : 0;

  document.getElementById("subTotal").innerText = formatBRL(sub);
  document.getElementById("deliveryFee").innerText = formatBRL(fee);
  document.getElementById("grandTotal").innerText = formatBRL(sub + fee);
}

function removeCartItem(index) {
  cart.splice(index, 1);
  saveData();
  updateCartBar();
  renderCartItems();
}

function toggleAddressField() {
  const isDelivery = document.getElementById("deliveryType").value === "Entrega";
  document.getElementById("custAddress").classList.toggle("hidden", !isDelivery);
  renderCartItems();
}

function toggleChangeField() {
  const isCash = document.getElementById("paymentMethod").value === "Dinheiro";
  document.getElementById("cashChange").classList.toggle("hidden", !isCash);
}

// Envio formatado para WhatsApp
function sendWhatsAppOrder() {
  if (cart.length === 0) return alert("Adicione itens antes de finalizar!");

  const name = document.getElementById("custName").value.trim();
  const type = document.getElementById("deliveryType").value;
  const address = document.getElementById("custAddress").value.trim();
  const payment = document.getElementById("paymentMethod").value;
  const change = document.getElementById("cashChange").value.trim();

  if (!name) return alert("Por favor, informe o nome.");
  if (type === "Entrega" && !address) return alert("Informe o endereço de entrega.");

  const sub = cart.reduce((sum, i) => sum + (i.unitPrice * i.qty), 0);
  const fee = type === "Entrega" ? DELIVERY_FEE : 0;
  const total = sub + fee;

  let msg = `*NOVO PEDIDO - CARDÁPIO ONLINE*\n\n`;
  msg += `*Cliente:* ${name}\n`;
  msg += `*Tipo:* ${type}\n`;
  if (type === "Entrega") msg += `*Endereço:* ${address}\n`;
  msg += `*Pagamento:* ${payment}${payment === "Dinheiro" && change ? ` (Troco p/ ${change})` : ""}\n\n`;
  msg += `*ITENS DO PEDIDO:*\n`;

  cart.forEach(item => {
    msg += `• ${item.qty}x ${item.name} — ${formatBRL(item.unitPrice * item.qty)}\n`;
    if (item.addons.length) msg += `   _Adicionais: ${item.addons.join(", ")}_\n`;
    if (item.obs) msg += `   _Obs: ${item.obs}_\n`;
  });

  msg += `\n*Subtotal:* ${formatBRL(sub)}`;
  if (fee > 0) msg += `\n*Entrega:* ${formatBRL(fee)}`;
  msg += `\n*TOTAL:* ${formatBRL(total)}`;

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
}

// Painel Admin com Senha
function openAdmin() {
  document.getElementById("adminModal").classList.remove("hidden");
  syncAdminView();
}

function syncAdminView() {
  const loginBox = document.getElementById("adminLoginBox");
  const panelBox = document.getElementById("adminPanelContent");
  const passInput = document.getElementById("adminPasswordInput");

  if (isAdminAuthenticated) {
    loginBox.classList.add("hidden");
    panelBox.classList.remove("hidden");
    renderAdminList();
  } else {
    loginBox.classList.remove("hidden");
    panelBox.classList.add("hidden");
    if (passInput) passInput.value = "";
  }
}

function verifyAdminPassword(e) {
  e.preventDefault();
  const input = document.getElementById("adminPasswordInput");
  if (input.value === ADMIN_PASSWORD) {
    isAdminAuthenticated = true;
    input.value = "";
    syncAdminView();
  } else {
    alert("Senha incorreta.");
    input.value = "";
    input.focus();
  }
}

function lockAdmin() {
  isAdminAuthenticated = false;
  syncAdminView();
}

// Upload / Link de Imagem
function updateImagePreview(src) {
  const box = document.getElementById("imagePreviewBox");
  const img = document.getElementById("prodImagePreview");
  if (src) {
    currentProductImage = src;
    img.src = src;
    box.classList.remove("hidden");
  } else {
    currentProductImage = "";
    img.src = "";
    box.classList.add("hidden");
  }
}

function handleImageFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(ev) {
    document.getElementById("prodImageUrl").value = "";
    updateImagePreview(ev.target.result);
  };
  reader.readAsDataURL(file);
}

function handleImageUrl(e) {
  const url = e.target.value.trim();
  if (url) {
    document.getElementById("prodImageFile").value = "";
    updateImagePreview(url);
  } else if (!document.getElementById("prodImageFile").files.length) {
    updateImagePreview("");
  }
}

function clearProductImage() {
  document.getElementById("prodImageFile").value = "";
  document.getElementById("prodImageUrl").value = "";
  updateImagePreview("");
}

function addNewProduct(e) {
  e.preventDefault();
  if (!isAdminAuthenticated) return;

  const newProd = {
    id: Date.now(),
    name: document.getElementById("prodName").value.trim(),
    desc: document.getElementById("prodDesc").value.trim(),
    category: document.getElementById("prodCat").value,
    price: parseFloat(document.getElementById("prodPrice").value),
    image: currentProductImage,
    emoji: "🍔",
    available: true
  };

  products.push(newProd);
  if (!saveData()) {
    products.pop();
    return;
  }

  renderMenu();
  renderAdminList();
  e.target.reset();
  clearProductImage();
}

function toggleAvailability(id) {
  if (!isAdminAuthenticated) return;
  const item = products.find(p => p.id === id);
  if (item) {
    item.available = !item.available;
    saveData();
    renderMenu();
    renderAdminList();
  }
}

function deleteProduct(id) {
  if (!isAdminAuthenticated) return;
  products = products.filter(p => p.id !== id);
  saveData();
  renderMenu();
  renderAdminList();
}

function renderAdminList() {
  const list = document.getElementById("adminProductList");
  list.innerHTML = products.map(p => `
    <div class="admin-row">
      <div class="admin-item-left">
        ${p.image ? `<img src="${p.image}" alt="${p.name}" class="admin-thumb-mini" />` : `<span>${p.emoji || "🍽️"}</span>`}
        <span><strong>${p.name}</strong> (${formatBRL(p.price)})</span>
      </div>
      <div>
        <button onclick="toggleAvailability(${p.id})" style="margin-right:6px;padding:3px 6px;cursor:pointer;">
          ${p.available ? "Pausar" : "Ativar"}
        </button>
        <button onclick="deleteProduct(${p.id})" style="color:#ef4444;background:none;border:none;cursor:pointer;">Excluir</button>
      </div>
    </div>
  `).join("");
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  renderMenu();
  updateCartBar();
});
