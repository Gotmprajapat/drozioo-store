// ================= FIREBASE =================
const firebaseConfig = {
  apiKey: "AIzaSyCiG9rMuPURjLhJDE3HorL0QrL7qE86h5c",
  authDomain: "drozioostore.firebaseapp.com",
  projectId: "drozioostore"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ================= GLOBAL =================
let allProducts = [];
let selectedProduct = null;
let editId = null;

// ================= MODAL =================
function openModal(id){
  document.getElementById("modalBackground").style.display="block";
  document.getElementById(id).classList.add("modal-active");
}
function closeModal(){
  document.getElementById("modalBackground").style.display="none";
  document.querySelectorAll(".modal-card").forEach(m=>m.classList.remove("modal-active"));
}

// ================= DRAWER =================
const drawer = document.getElementById("drawerMenu");
const overlay = document.getElementById("drawerOverlay");

document.getElementById("homeMenuBtn").onclick = ()=>{
  drawer.classList.add("drawer-open");
  overlay.classList.add("overlay-visible");
};
document.getElementById("drawerCloseBtn").onclick = closeDrawer;
overlay.onclick = closeDrawer;

function closeDrawer(){
  drawer.classList.remove("drawer-open");
  overlay.classList.remove("overlay-visible");
}

// ================= LOGIN =================
let loginType = "";

document.getElementById("drawerSellerLoginBtn").onclick = ()=>{
  loginType="seller";
  document.getElementById("loginModalTitle").innerText="Seller Login";
  openModal("loginModal");
};
document.getElementById("drawerAdminLoginBtn").onclick = ()=>{
  loginType="admin";
  document.getElementById("loginModalTitle").innerText="Admin Login";
  openModal("loginModal");
};

document.getElementById("loginSubmitBtn").onclick = async ()=>{
  const pass = document.getElementById("loginPasswordInput").value;

  const doc = await db.collection("passwords").doc("master").get();

  if(!doc.exists){
    if(loginType==="seller"){
      await db.collection("passwords").doc("master").set({sellerPassword:pass});
    } else {
      await db.collection("passwords").doc("master").set({adminPassword:pass});
    }
    alert("Password saved!");
    successLogin();
    return;
  }

  const data = doc.data();

  if(loginType==="seller" && pass===data.sellerPassword){
    successLogin();
  }
  else if(loginType==="admin" && pass===data.adminPassword){
    successLogin();
  }
  else{
    document.getElementById("loginErrorMessage").innerText="Wrong password!";
  }
};

function successLogin(){
  closeModal();
  if(loginType==="seller") openModal("sellerPanelModal");
  else openModal("adminPanelModal"), loadAdmin();
}

// ================= ADD PRODUCT =================
document.getElementById("sellerPublishProductBtn").onclick = async ()=>{
  const name = sellerProductName.value;
  const price = sellerSellingPrice.value;
  const mrp = sellerMrpPrice.value;
  const desc = sellerDescription.value;
  const cat = sellerNewCategoryInput.value || sellerExistingCategorySelect.value;
  const wp = sellerWhatsappNumber.value;

  await db.collection("products").add({
    name, price, originalPrice: mrp,
    description: desc, category: cat,
    whatsapp: wp,
    images: [],
    createdAt: new Date()
  });

  alert("Product Added!");
  closeModal();
  loadProducts();
};

// ================= LOAD PRODUCTS =================
async function loadProducts(){
  const snap = await db.collection("products").orderBy("createdAt","desc").get();
  allProducts = snap.docs.map(d=>({id:d.id,...d.data()}));
  renderProducts();
}

function renderProducts(){
  const container = document.getElementById("productsGridContainer");
  container.innerHTML = "";

  allProducts.forEach(p=>{
    const discount = p.originalPrice ? 
      Math.round((1 - p.price/p.originalPrice)*100) : 0;

    container.innerHTML += `
    <div class="product-card" onclick="openDetail('${p.id}')">
      <img class="product-img" src="https://picsum.photos/300">
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="price-row">
          <span class="selling-price">₹${p.price}</span>
          <span class="mrp-price">₹${p.originalPrice||""}</span>
          ${discount?`<span class="discount-badge">${discount}% off</span>`:""}
        </div>
      </div>
    </div>`;
  });
}

// ================= PRODUCT DETAIL =================
async function openDetail(id){
  selectedProduct = allProducts.find(p=>p.id===id);

  document.getElementById("productDetailContent").innerHTML = `
    <h3>${selectedProduct.name}</h3>
    <p>₹${selectedProduct.price}</p>
    <button class="btn btn-whatsapp" onclick="orderNow()">Order on WhatsApp</button>
  `;

  loadReviews(id);
  openModal("productDetailModal");
}

function orderNow(){
  const p = selectedProduct;
  const msg = `Order:\n${p.name}\n₹${p.price}`;
  window.open(`https://wa.me/${p.whatsapp}?text=${encodeURIComponent(msg)}`);
}

// ================= REVIEWS =================
document.getElementById("detailPostReviewBtn").onclick = async ()=>{
  const text = detailReviewTextarea.value;

  await db.collection("reviews").add({
    productId: selectedProduct.id,
    text,
    createdAt: new Date()
  });

  detailReviewTextarea.value="";
  loadReviews(selectedProduct.id);
};

async function loadReviews(id){
  const snap = await db.collection("reviews").where("productId","==",id).get();

  let html="";
  snap.forEach(d=>{
    html += `<div class="review-box">${d.data().text}</div>`;
  });

  document.getElementById("detailReviewsListContainer").innerHTML = html;
}

// ================= ADMIN =================
async function loadAdmin(){
  const snap = await db.collection("products").get();

  let html="";
  snap.forEach(d=>{
    const p=d.data();

    html+=`
    <div class="admin-product-row">
      <div>${p.name}<br>₹${p.price}</div>
      <div>
        <button onclick="editProduct('${d.id}')">✏️</button>
        <button onclick="deleteProduct('${d.id}')">🗑️</button>
      </div>
    </div>`;
  });

  document.getElementById("adminProductsListContainer").innerHTML = html;
}

function editProduct(id){
  editId=id;
  openModal("editProductModal");
}

document.getElementById("editSaveBtn").onclick = async ()=>{
  await db.collection("products").doc(editId).update({
    name: editProductName.value,
    price: editProductPrice.value
  });
  closeModal();
  loadProducts();
};

function deleteProduct(id){
  db.collection("products").doc(id).delete();
  loadAdmin();
}

// ================= INIT =================
loadProducts();
