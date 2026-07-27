import { db, ready, collection, doc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot } from "./firebase-init.js";
import { SEED_INSUMOS } from "./data.js";

export let insumosCache = []; // [{id, nombre, presentacion, cantidad, unidad, precio, estado, costoUnidad}]
let currentFilter = "todos";
const listeners = [];

export function onInsumosChange(fn){ listeners.push(fn); }
function notify(){ listeners.forEach(fn => fn(insumosCache)); }

export function costoUnidad(insumo){
  if(!insumo.cantidad) return 0;
  return insumo.precio / insumo.cantidad;
}

export function getInsumo(id){
  return insumosCache.find(i => i.id === id);
}

export function fmtCOP(n){
  return "$" + Math.round(n).toLocaleString("es-CO");
}

async function seedIfEmpty(){
  const snap = await getDocs(collection(db, "insumos"));
  if(!snap.empty) return;
  for(const item of SEED_INSUMOS){
    await setDoc(doc(db, "insumos", item.id), item);
  }
}

function showFirestoreError(err){
  console.error("[Firestore/insumos]", err);
  const tbody = document.getElementById("tbody-insumos");
  const msg = err.code === "unavailable" || err.code === "not-found"
    ? "No se pudo leer la base de datos. Revisa en Firebase Console que creaste Firestore Database (Build → Firestore Database → Crear base de datos)."
    : err.code === "permission-denied"
    ? "Firestore rechazó el acceso (permission-denied). Revisa que publicaste las reglas indicadas en el README."
    : "Error de Firestore: " + err.message;
  if(tbody) tbody.innerHTML = `<tr><td colspan="8" class="list__empty">${msg}</td></tr>`;
}

export async function initInsumos(){
  const okAuth = await ready;
  if(!okAuth || !db) return;
  try{
    await seedIfEmpty();
  }catch(err){ showFirestoreError(err); return; }

  onSnapshot(collection(db, "insumos"), (snap) => {
    insumosCache = snap.docs.map(d => {
      const data = d.data();
      return { id: d.id, ...data, costoUnidad: costoUnidad(data) };
    }).sort((a,b) => a.nombre.localeCompare(b.nombre));
    renderInsumos();
    notify();
  }, (err) => showFirestoreError(err));

  document.querySelectorAll(".tab-mini").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-mini").forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      currentFilter = btn.dataset.filter;
      renderInsumos();
    });
  });
}

function renderInsumos(){
  const tbody = document.getElementById("tbody-insumos");
  if(!tbody) return;
  let rows = insumosCache;
  if(currentFilter === "comprado") rows = rows.filter(i => i.estado === "comprado");
  if(currentFilter === "pendiente") rows = rows.filter(i => i.estado === "pendiente");

  if(rows.length === 0){
    tbody.innerHTML = `<tr><td colspan="8" class="list__empty">No hay insumos en esta vista.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(i => `
    <tr data-id="${i.id}">
      <td>${i.nombre}</td>
      <td class="mono">${i.presentacion || "-"}</td>
      <td class="mono">${i.cantidad}</td>
      <td class="mono">${i.unidad}</td>
      <td class="mono">${fmtCOP(i.precio)}</td>
      <td class="mono">${fmtCOP(i.costoUnidad)} / ${i.unidad}</td>
      <td>
        <span class="pill ${i.estado === "comprado" ? "pill--ok" : "pill--pend"}">
          ${i.estado === "comprado" ? "Comprado" : "Por comprar"}
        </span>
      </td>
      <td>
        <button class="btn btn--ghost btn--small" data-action="edit">Editar</button>
        <button class="btn btn--ghost btn--small btn--danger" data-action="delete">Eliminar</button>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll("tr").forEach(tr => {
    const id = tr.dataset.id;
    tr.querySelector('[data-action="edit"]').addEventListener("click", () => openInsumoModal(id));
    tr.querySelector('[data-action="delete"]').addEventListener("click", () => removeInsumo(id));
  });
}

export async function saveInsumo(idOrNull, data){
  const id = idOrNull || data.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"") + "-" + Date.now().toString(36);
  await setDoc(doc(db, "insumos", id), data, { merge: true });
}

export async function removeInsumo(id){
  if(!confirm("¿Eliminar este insumo? Las recetas que lo usan quedarán con costo 0 para ese ítem.")) return;
  await deleteDoc(doc(db, "insumos", id));
}

// ---- Modal ----
export function openInsumoModal(editId = null){
  const existing = editId ? getInsumo(editId) : null;
  const root = document.getElementById("modal-root");
  root.innerHTML = `
    <div class="modal-overlay" id="ov">
      <div class="modal">
        <h2>${existing ? "Editar insumo" : "Nuevo insumo"}</h2>
        <div class="field"><label>Nombre</label><input id="f-nombre" value="${existing?.nombre || ""}" placeholder="Ej: Queso mozzarella"></div>
        <div class="field"><label>Presentación (texto libre)</label><input id="f-presentacion" value="${existing?.presentacion || ""}" placeholder="Ej: 500g"></div>
        <div class="field-row">
          <div class="field"><label>Cantidad</label><input id="f-cantidad" type="number" step="any" value="${existing?.cantidad ?? ""}"></div>
          <div class="field"><label>Unidad</label>
            <select id="f-unidad">
              <option value="g" ${existing?.unidad==="g"?"selected":""}>g</option>
              <option value="ml" ${existing?.unidad==="ml"?"selected":""}>ml</option>
              <option value="und" ${existing?.unidad==="und"?"selected":""}>und</option>
              <option value="kg" ${existing?.unidad==="kg"?"selected":""}>kg</option>
              <option value="l" ${existing?.unidad==="l"?"selected":""}>l</option>
            </select>
          </div>
        </div>
        <div class="field-row">
          <div class="field"><label>Precio de compra</label><input id="f-precio" type="number" step="any" value="${existing?.precio ?? ""}"></div>
          <div class="field"><label>Estado</label>
            <select id="f-estado">
              <option value="comprado" ${existing?.estado==="comprado"?"selected":""}>Comprado</option>
              <option value="pendiente" ${existing?.estado==="pendiente"?"selected":""}>Por comprar</option>
            </select>
          </div>
        </div>
        <div class="modal__actions">
          <button class="btn" id="btn-cancel">Cancelar</button>
          <button class="btn btn--primary" id="btn-save">Guardar</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById("btn-cancel").onclick = () => root.innerHTML = "";
  document.getElementById("ov").addEventListener("click", (e) => { if(e.target.id === "ov") root.innerHTML = ""; });
  document.getElementById("btn-save").onclick = async () => {
    const data = {
      nombre: document.getElementById("f-nombre").value.trim(),
      presentacion: document.getElementById("f-presentacion").value.trim(),
      cantidad: parseFloat(document.getElementById("f-cantidad").value) || 0,
      unidad: document.getElementById("f-unidad").value,
      precio: parseFloat(document.getElementById("f-precio").value) || 0,
      estado: document.getElementById("f-estado").value,
    };
    if(!data.nombre){ alert("Ponle un nombre al insumo."); return; }
    await saveInsumo(editId, data);
    root.innerHTML = "";
  };
}
