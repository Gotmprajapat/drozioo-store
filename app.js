// ================= IMPORT =================
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ================= INIT =================
const db = getFirestore(window.app);

// ================= LOGIN =================
document.getElementById("loginSubmitBtn")?.addEventListener("click", async () => {
  const pass = document.getElementById("loginPasswordInput").value;

  const snap = await getDocs(collection(db, "passwords"));
  let ok = false;

  snap.forEach(d => {
    const data = d.data();
    if (pass === data.adminPassword || pass === data.sellerPassword) {
      ok = true;
    }
  });

  if (ok) {
    alert("Login Success ✅");
  } else {
    alert("Wrong Password ❌");
  }
});

// ================= ADD PRODUCT =================
document.getElementById("sellerPublishProductBtn")?.addEventListener("click", async () => {

  const name = document.getElementById("sellerProductName").value;
  const price = document.getElementById("sellerSellingPrice").value;
  const mrp = document.getElementById("sellerMrpPrice").value;
  const whatsapp = document.getElementById("sellerWhatsappNumber").value;

  if (!name || !price) {
    alert("Fill all fields");
    return;
  }

  await addDoc(collection(db, "products"), {
    name,
    price,
    mrp,
    whatsapp,
    createdAt: Date.now()
  });

  alert("Product Added 🔥");
  loadProducts();
});

// ================= LOAD PRODUCTS =================
async function loadProducts() {
  const container = document.getElementById("productsGridContainer");
  if (!container) return;

  container.innerHTML = "";

  const snap = await getDocs(collection(db, "products"));

  snap.forEach(docu => {
    const d = docu.data();

    const div = document.createElement("div");
    div.innerHTML = `
      <h4>${d.name}</h4>
      <p>₹${d.price}</p>
      <button onclick="orderNow('${d.whatsapp}','${d.name}')">Order</button>
    `;

    container.appendChild(div);
  });
}

loadProducts();

// ================= WHATSAPP =================
window.orderNow = (num, name) => {
  const msg = `I want to buy ${name}`;
  window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`);
};

// ================= DELETE =================
window.deleteProduct = async (id) => {
  await deleteDoc(doc(db, "products", id));
  loadProducts();
};
