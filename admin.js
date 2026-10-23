

const defaultMenu = [
  { id: 1, name: "Classic Doggy", price: 3.50, category: "Hotdogs", available: true, image: "images/classicdoggy.png" },
  { id: 2, name: "Philly Doggy", price: 4.00, category: "Hotdogs", available: true, image: "images/texasdoggy.png" },
  { id: 3, name: "Chef Avocado Doggy", price: 4.00, category: "Hotdogs", available: true, image: "images/chefdoggy.png" },
  { id: 4, name: "The Crunch", price: 3.00, category: "Hotdogs", available: true, image: "images/corndog.png" },
  { id: 5, name: "Cocktails", price: 4.00, category: "Drinks", available: true, image: "images/cocktails.png" },
  { id: 6, name: "Hot Chocolate", price: 2.00, category: "Drinks", available: true, image: "images/hotchocolate.png" },
  { id: 7, name: "Mulled Wine", price: 3.00, category: "Drinks", available: true, image: "images/wine.png" }
];

let menu = JSON.parse(localStorage.getItem("doggydoggyMenu")) || defaultMenu;

const menuContainer = document.querySelector("#menu-management");

function saveMenu() {
  localStorage.setItem("doggydoggyMenu", JSON.stringify(menu));
}

function renderMenu() {
  if (!menuContainer) {
    console.error('Nuk u gjet elementi me id="menu-management".');
    return;
  }

  menuContainer.innerHTML = `
    <div class="menu-admin-header">
      <div>
        <h2>Menu Management</h2>
        <p>Manage your products, prices and availability.</p>
      </div>
      <button id="add-product-btn" type="button">+ Add Product</button>
    </div>

    <div class="admin-menu-list">
      ${menu.map(product => `
        <article class="admin-product">
          <img
            src="${escapeHTML(product.image)}"
            alt="${escapeHTML(product.name)}"
            onerror="this.style.display='none'"
          >

          <div class="admin-product-info">
            <h3>${escapeHTML(product.name)}</h3>
            <p>${escapeHTML(product.category)} · €${Number(product.price).toFixed(2)}</p>
            <span class="${product.available ? "status-available" : "status-unavailable"}">
              ${product.available ? "Available" : "Unavailable"}
            </span>
          </div>

          <div class="admin-product-actions">
            <button type="button" data-action="edit" data-id="${product.id}">Edit</button>
            <button type="button" data-action="toggle" data-id="${product.id}">
              ${product.available ? "Disable" : "Enable"}
            </button>
            <button type="button" data-action="delete" data-id="${product.id}">Delete</button>
          </div>
        </article>
      `).join("")}
    </div>
  `;

  document.querySelector("#add-product-btn").addEventListener("click", addProduct);
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}




async function addProduct() {
  const modal = document.createElement("div");
  modal.className = "edit-product-overlay";

  modal.innerHTML = `
    <form class="edit-product-modal">
      <h2>Add New Product</h2>
      <p>Add a new item to your restaurant menu.</p>

      <label for="new-name">Product Name</label>
      <input id="new-name" name="name" type="text"
        placeholder="e.g. Texas Doggy" required>

      <label for="new-price">Price (€)</label>
      <input id="new-price" name="price" type="number"
        min="0" step="0.01" placeholder="e.g. 4.50" required>

      <label for="new-category">Category</label>
      <select id="new-category" name="category" required>
        <option value="Hotdogs">Hotdogs</option>
        <option value="Drinks">Drinks</option>
      </select>

      <label for="new-image">Image Path</label>
      <input id="new-image" name="image" type="text"
        placeholder="images/texasdoggy.png" required>

      <label for="new-description">Description</label>
      <textarea id="new-description" name="description"
        placeholder="Describe your product..." rows="3"></textarea>

      <div class="edit-product-buttons">
        <button type="button" class="cancel-edit">Cancel</button>
        <button type="submit" class="save-edit">Add Product</button>
      </div>
    </form>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".cancel-edit").addEventListener("click", () => {
    modal.remove();
  });

  modal.addEventListener("click", event => {
    if (event.target === modal) modal.remove();
  });

  modal.querySelector("form").addEventListener("submit", async event => {
    event.preventDefault();

    const form = event.currentTarget;
    const submitButton = form.querySelector('[type="submit"]');

    const name = modal.querySelector("#new-name").value.trim();
    const price = Number(modal.querySelector("#new-price").value);
    const category = modal.querySelector("#new-category").value;
    const image = modal.querySelector("#new-image").value.trim();
    const description = modal.querySelector("#new-description").value.trim();

    if (!name || !Number.isFinite(price) || price < 0 || !image) {
      alert("Please enter valid product details.");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Saving...";

    try {
      await addProductToDatabase({
        name,
        price,
        category,
        image_url: image,
        description,
        is_available: true
      });

      await refreshMenuFromDatabase();
      modal.remove();
      alert("Product saved successfully!");
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Product could not be saved: " + error.message);
      submitButton.disabled = false;
      submitButton.textContent = "Add Product";
    }
  });
}



function editProduct(id) {
  const product = menu.find(item => item.id === id);
  if (!product) return;

  const modal = document.createElement("div");
  modal.className = "edit-product-overlay";

  modal.innerHTML = `
    <form class="edit-product-modal">
      <h2>Edit Product</h2>
      <p>Update your product details.</p>

      <label for="edit-name">Product Name</label>
      <input id="edit-name" type="text"
        value="${escapeHTML(product.name)}" required>

      <label for="edit-price">Price (€)</label>
      <input id="edit-price" type="number" min="0" step="0.01"
        value="${product.price}" required>

      <label for="edit-category">Category</label>
      <select id="edit-category" required>
        <option value="Hotdogs" ${product.category === "Hotdogs" ? "selected" : ""}>Hotdogs</option>
        <option value="Drinks" ${product.category === "Drinks" ? "selected" : ""}>Drinks</option>
      </select>

      <label for="edit-image">Image Path</label>
      <input id="edit-image" type="text"
        value="${escapeHTML(product.image || "")}" required>

      <label for="edit-description">Description</label>
      <textarea id="edit-description" rows="3">${escapeHTML(product.description || "")}</textarea>

      <div class="edit-product-buttons">
        <button type="button" class="cancel-edit">Cancel</button>
        <button type="submit" class="save-edit">Save Changes</button>
      </div>
    </form>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".cancel-edit").addEventListener("click", () => {
    modal.remove();
  });

  modal.addEventListener("click", event => {
    if (event.target === modal) modal.remove();
  });

  modal.querySelector("form").addEventListener("submit", async event => {
    event.preventDefault();

    const submitButton = modal.querySelector(".save-edit");
    const name = modal.querySelector("#edit-name").value.trim();
    const price = Number(modal.querySelector("#edit-price").value);
    const category = modal.querySelector("#edit-category").value;
    const image = modal.querySelector("#edit-image").value.trim();
    const description = modal.querySelector("#edit-description").value.trim();

    if (!name || !Number.isFinite(price) || price < 0 || !image) {
      alert("Please enter valid product details.");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Saving...";

    try {
      await updateProductInDatabase(id, {
        name,
        price,
        category,
        image_url: image,
        description,
        is_available: product.available
      });

      await refreshMenuFromDatabase();
      modal.remove();
      alert("Product updated successfully!");
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Product could not be updated: " + error.message);
      submitButton.disabled = false;
      submitButton.textContent = "Save Changes";
    }
  });
}




async function handleMenuAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = Number(button.dataset.id);
  const action = button.dataset.action;
  const product = menu.find(item => item.id === id);

  if (!product) return;

  if (action === "edit") {
    editProduct(id);
    return;
  }

  if (action === "toggle") {
    button.disabled = true;

    try {
      await toggleProductInDatabase(id);
      await refreshMenuFromDatabase();
    } catch (error) {
      console.error("Could not change availability:", error);
      alert("Could not update product: " + error.message);
    } finally {
      button.disabled = false;
    }

    return;
  }

  if (action === "delete") {
    if (!confirm(`Delete "${product.name}" permanently?`)) return;

    button.disabled = true;

    try {
      await deleteProductFromDatabase(id);
      await refreshMenuFromDatabase();
      alert("Product deleted successfully!");
    } catch (error) {
      console.error("Could not delete product:", error);
      alert("Product could not be deleted: " + error.message);
      button.disabled = false;
    }
  }
}


if (menuContainer) {
  menuContainer.addEventListener("click", handleMenuAction);
  renderMenu();
}

const DOGGY_API = "https://doggy-doggy-api.onrender.com";

async function doggyApiRequest(path, options = {}) {
  const token = sessionStorage.getItem("doggyAdminToken");

  const response = await fetch(`${DOGGY_API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (response.status === 401) {
    sessionStorage.removeItem("doggyAdminToken");
    window.location.href = "login.html";
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Request failed: ${response.status}`);
  }

  if (response.status === 204) return null;

  return response.json();
}

async function loadProductsFromDatabase() {
  return doggyApiRequest("/products");
}

async function addProductToDatabase(product) {
  return doggyApiRequest("/products", {
    method: "POST",
    body: JSON.stringify(product)
  });
}

async function updateProductInDatabase(id, product) {
  return doggyApiRequest(`/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(product)
  });
}

async function deleteProductFromDatabase(id) {
  return doggyApiRequest(`/products/${id}`, {
    method: "DELETE"
  });
}

async function toggleProductInDatabase(id) {
  return doggyApiRequest(`/products/${id}/availability`, {
    method: "PATCH"
  });
}
async function refreshMenuFromDatabase() {
  const products = await loadProductsFromDatabase();

  menu = products.map(product => ({
    id: product.id,
    name: product.name,
    description: product.description || "",
    price: Number(product.price),
    image: product.image_url || "",
    category: product.category || "",
    available: product.is_available
  }));

  renderMenu();
}
refreshMenuFromDatabase().catch(error => {
  console.error("Could not load products:", error);
  alert("Could not load products from the database: " + error.message);
});




let allAdminOrders = [];
let analyticsData = null;
let charts = {};
let showAllOrders = false;
const money = value => new Intl.NumberFormat('en-IE',{style:'currency',currency:'EUR'}).format(Number(value)||0);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statusLabels = {pending:'Pending',confirmed:'Confirmed',preparing:'Preparing',out_for_delivery:'Out for delivery',completed:'Completed',cancelled:'Cancelled'};
const paymentLabels = {unpaid:'Unpaid',paid:'Paid',refunded:'Refunded',failed:'Failed'};
function safeChart(id, config){ if(!window.Chart) { console.error('Chart.js did not load'); return; } const el=document.getElementById(id); if(!el)return; if(charts[id]) charts[id].destroy(); charts[id]=new Chart(el,config); }
const commonChartOptions={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:'#171717',padding:12,cornerRadius:8}},scales:{x:{grid:{display:false},ticks:{color:'#7b7b7b'}},y:{beginAtZero:true,grid:{color:'#eeeeea'},ticks:{precision:0,color:'#7b7b7b'}}}};
async function loadAdminOrders(){const body=document.getElementById('recentOrdersList');if(!body)return;try{allAdminOrders=await doggyApiRequest('/admin/orders');renderAdminOrders();}catch(e){console.error(e);body.innerHTML=`<tr><td colspan="11" class="table-message error">Could not load orders: ${esc(e.message)}</td></tr>`;}}
function renderAdminOrders(){const body=document.getElementById('recentOrdersList');if(!body)return;const search=(document.getElementById('orderSearch')?.value||'').trim().toLowerCase();const sf=document.getElementById('orderStatusFilter')?.value||'all';const tf=document.getElementById('orderTypeFilter')?.value||'all';const pf=document.getElementById('paymentMethodFilter')?.value||'all';let orders=allAdminOrders.filter(o=>(sf==='all'||o.status===sf)&&(tf==='all'||o.order_type===tf)&&(pf==='all'||o.payment_method===pf)&&(!search||String(o.id).includes(search)||String(o.customer_name||'').toLowerCase().includes(search)||String(o.phone||'').toLowerCase().includes(search)));if(!showAllOrders)orders=orders.slice(0,8);if(!orders.length){body.innerHTML='<tr><td colspan="11" class="table-message">No matching orders.</td></tr>';return;}body.innerHTML=orders.map(o=>{const items=(o.items||[]).map(i=>`${esc(i.name)} × ${Number(i.quantity)}`).join('<br>')||'—';const subtotal=Number(o.subtotal ?? (Number(o.total)-Number(o.delivery_fee||0)));return `<tr><td><strong>#${esc(o.id)}</strong></td><td><div class="customer-cell"><strong>${esc(o.customer_name)}</strong><small>${esc(o.phone||'')}</small></div></td><td><span class="type-pill ${o.order_type==='pickup'?'pickup':'delivery'}">${o.order_type==='pickup'?'Pickup':'Delivery'}</span></td><td>${esc((o.payment_method||'—').toUpperCase())}</td><td><select class="payment-status-select" data-order-id="${esc(o.id)}" aria-label="Payment status for order ${esc(o.id)}">${Object.entries(paymentLabels).map(([v,l])=>`<option value="${v}" ${(o.payment_status||'unpaid')===v?'selected':''}>${l}</option>`).join('')}</select></td><td><select class="order-status-select" data-order-id="${esc(o.id)}" aria-label="Order status for order ${esc(o.id)}">${Object.entries(statusLabels).map(([v,l])=>`<option value="${v}" ${o.status===v?'selected':''}>${l}</option>`).join('')}</select></td><td class="items-cell">${items}</td><td>${money(subtotal)}</td><td>${money(o.delivery_fee)}</td><td><strong>${money(o.total)}</strong></td><td class="time-cell">${esc(new Date(o.created_at).toLocaleString())}</td></tr>`}).join('');}
async function loadAdminStats(){try{const s=await doggyApiRequest('/admin/stats');const put=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v};put('stat-revenue',money(s.today_revenue));put('stat-total-orders',s.today_orders);put('stat-pending-orders',s.pending_orders);put('stat-out-for-delivery',s.out_for_delivery_orders);put('stat-completed-orders',s.completed_orders);put('stat-active-products',s.active_products);}catch(e){console.error('Stats:',e);}}
function renderAnalytics(data){analyticsData=data;const cash=document.getElementById('cashRevenue'),card=document.getElementById('cardRevenue'),fees=document.getElementById('deliveryFees'),avg=document.getElementById('averageOrderValue');if(cash)cash.textContent=money(data.summary.cash_revenue);if(card)card.textContent=money(data.summary.card_revenue);if(fees)fees.textContent=money(data.summary.delivery_fees);if(avg)avg.textContent=money(data.summary.average_order_value);
const trend=data.revenue_trend||[];safeChart('revenueTrendChart',{type:'line',data:{labels:trend.map(x=>new Date(x.date+'T12:00:00').toLocaleDateString(undefined,{day:'2-digit',month:'short'})),datasets:[{label:'Revenue',data:trend.map(x=>x.revenue),borderColor:'#f47a38',backgroundColor:'rgba(244,122,56,.13)',fill:true,tension:.35,pointRadius:2,pointHoverRadius:5}]},options:{...commonChartOptions,scales:{...commonChartOptions.scales,y:{...commonChartOptions.scales.y,ticks:{callback:v=>'€'+v}}}}});
function donut(id,legendId,items){const colors=['#f47a38','#252525','#f4c542','#7b8fa1','#9b8bd1','#66a88a'];safeChart(id,{type:'doughnut',data:{labels:items.map(x=>x.label),datasets:[{data:items.map(x=>x.count),backgroundColor:colors,borderWidth:3,borderColor:'#fff',hoverOffset:5}]},options:{responsive:true,maintainAspectRatio:false,cutout:'66%',plugins:{legend:{display:false},tooltip:commonChartOptions.plugins.tooltip}}});const l=document.getElementById(legendId);if(l)l.innerHTML=items.map((x,i)=>`<div><span><i style="background:${colors[i%colors.length]}"></i>${esc(x.label)}</span><strong>${x.count}</strong></div>`).join('')||'<p>No data yet</p>';}
donut('paymentMethodChart','paymentMethodLegend',data.payment_methods||[]);donut('orderTypeChart','orderTypeLegend',data.order_types||[]);
const status=data.order_statuses||[];safeChart('orderStatusChart',{type:'bar',data:{labels:status.map(x=>x.label),datasets:[{label:'Orders',data:status.map(x=>x.count),backgroundColor:'#f4a16f',borderRadius:6,maxBarThickness:34}]},options:commonChartOptions});
const peak=data.peak_hours||[];safeChart('peakHoursChart',{type:'bar',data:{labels:peak.map(x=>x.label),datasets:[{label:'Orders',data:peak.map(x=>x.count),backgroundColor:'#272727',borderRadius:5,maxBarThickness:24}]},options:commonChartOptions});
const top=document.getElementById('topSellingProducts');if(top){const products=data.top_products||[];top.innerHTML=products.length?products.map((p,i)=>`<div class="top-product-row"><span class="product-rank">${String(i+1).padStart(2,'0')}</span><div class="product-name"><strong>${esc(p.name)}</strong><small>${p.orders} order line${p.orders===1?'':'s'}</small></div><div class="product-bar"><i style="width:${Math.max(4,Number(p.quantity)/(Math.max(1,...products.map(x=>Number(x.quantity)))*1)*100)}%"></i></div><strong>${p.quantity} sold</strong><b>${money(p.revenue)}</b></div>`).join(''):'<p class="empty-state">No product sales yet.</p>';}
const tbody=document.getElementById('dailyAnalyticsRows');if(tbody)tbody.innerHTML=[...trend].reverse().map(d=>`<tr><td>${new Date(d.date+'T12:00:00').toLocaleDateString()}</td><td>${d.orders}</td><td>${money(d.revenue)}</td></tr>`).join('')||'<tr><td colspan="3">No data yet.</td></tr>';const summary=document.getElementById('analyticsSummary');if(summary)summary.innerHTML=`<div><small>Net revenue (30 days)</small><strong>${money(trend.reduce((n,d)=>n+Number(d.revenue),0))}</strong></div><div><small>Orders (30 days)</small><strong>${trend.reduce((n,d)=>n+Number(d.orders),0)}</strong></div>`;
const ac=document.getElementById('analyticsRevenueChart');if(ac)safeChart('analyticsRevenueChart',{type:'line',data:{labels:trend.map(x=>x.date),datasets:[{label:'Revenue',data:trend.map(x=>x.revenue),borderColor:'#f47a38',backgroundColor:'rgba(244,122,56,.12)',fill:true,tension:.3}]},options:commonChartOptions});}
async function loadAnalytics(){try{const d=await doggyApiRequest('/admin/analytics/overview?days=30');renderAnalytics(d);}catch(e){console.error('Analytics:',e);const top=document.getElementById('topSellingProducts');if(top)top.innerHTML=`<p class="error">Analytics could not load: ${esc(e.message)}. Run the SQL migration and restart the backend.</p>`;}}
async function loadDashboard(){await Promise.allSettled([loadAdminStats(),loadAdminOrders(),loadAnalytics()]);}
document.getElementById('refreshDashboard')?.addEventListener('click',loadDashboard);
for(const id of ['orderSearch','orderStatusFilter','orderTypeFilter','paymentMethodFilter'])document.getElementById(id)?.addEventListener(id==='orderSearch'?'input':'change',renderAdminOrders);
document.getElementById('viewAllOrders')?.addEventListener('click',()=>{showAllOrders=!showAllOrders;document.getElementById('viewAllOrders').textContent=showAllOrders?'Show fewer':'View all orders';renderAdminOrders();});
document.getElementById('recentOrdersList')?.addEventListener('change',async ev=>{const sel=ev.target.closest('.order-status-select,.payment-status-select');if(!sel)return;const id=sel.dataset.orderId;const oldValue=sel.dataset.previousValue;sel.disabled=true;try{if(sel.classList.contains('order-status-select'))await doggyApiRequest(`/admin/orders/${id}/status`,{method:'PATCH',body:JSON.stringify({status:sel.value})});else await doggyApiRequest(`/admin/orders/${id}/payment-status`,{method:'PATCH',body:JSON.stringify({payment_status:sel.value})});await loadDashboard();}catch(e){alert('Could not save change: '+e.message);await loadAdminOrders();}finally{sel.disabled=false;}});
function setAdminView(view){const intro=document.getElementById('dashboardIntro'),stats=document.getElementById('statsGrid'),revenue=document.getElementById('revenueCards'),trend=document.getElementById('revenueTrendPanel'),chartsGrid=document.querySelector('.chart-grid'),top=document.getElementById('topSellingProducts')?.closest('.dashboard-panel'),orders=document.getElementById('orders'),menu=document.getElementById('menu'),analytics=document.getElementById('analytics');const dashboard=view==='dashboard';if(intro)intro.hidden=!dashboard;if(stats)stats.hidden=!dashboard;if(revenue)revenue.hidden=!dashboard;if(trend)trend.hidden=!dashboard;if(chartsGrid)chartsGrid.hidden=!dashboard;if(top)top.hidden=!dashboard;if(orders)orders.hidden=!(view==='orders'||dashboard);if(menu)menu.hidden=view!=='menu';if(analytics)analytics.hidden=view!=='analytics';document.querySelectorAll('.admin-sidebar nav a[data-view]').forEach(a=>a.classList.toggle('active',a.dataset.view===view));const h=document.querySelector('.admin-header h1');if(h)h.textContent={dashboard:'Dashboard',orders:'Orders',menu:'Menu management',analytics:'Analytics'}[view]||'Dashboard';if(view==='analytics'&&analyticsData){const ac=document.getElementById('analyticsRevenueChart');if(ac&&charts.analyticsRevenueChart)charts.analyticsRevenueChart.resize();}}
document.querySelectorAll('.admin-sidebar nav a[data-view]').forEach(a=>a.addEventListener('click',ev=>{ev.preventDefault();setAdminView(a.dataset.view);}));
const dateEl=document.getElementById('dashboard-date');if(dateEl)dateEl.textContent=new Date().toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'});
loadDashboard();setInterval(loadDashboard,10000);