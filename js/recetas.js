import { db, ready, collection, doc, getDocs, setDoc, deleteDoc, onSnapshot } from "./firebase-init.js";
import { SEED_RECETAS } from "./data.js";
import { insumosCache, getInsumo, fmtCOP, onInsumosChange } from "./insumos.js";

export let recetasCache = [];
const listeners = [];
export function onRecetasChange(fn){ listeners.push(fn); }
function notify(){ listeners.forEach(fn => fn(recetasCache)); }

async function seedIfEmpty(){
  const snap = await getDocs(collection(db, "recetas"));
  if(!snap.empty) return;
  for(const item of SEED_RECETAS){
    await setDoc(doc(db, "recetas", item.id), item);
  }
}

function showFirestoreError(err){
  console.error("[Firestore/recetas]", err);
  const grid = document.getElementById("grid-recetas");
  const msg = err.code === "unavailable" || err.code === "not-found"
    ? "No se pudo leer la base de datos. Revisa en Firebase Console que creaste Firestore Database."
    : err.code === "permission-denied"
    ? "Firestore rechazó el acceso (permission-denied). Revisa las reglas de Firestore."
    : "Error de Firestore: " + err.message;
  if(grid) grid.innerHTML = `<p class="list__empty">${msg}</p>`;
}

export async function initRecetas(){
  const okAuth = await ready;
  if(!okAuth || !db) return;
  try{
    await seedIfEmpty();
  }catch(err){ showFirestoreError(err); return; }

  onSnapshot(collection(db, "recetas"), (snap) => {
    recetasCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderRecetas();
    notify();
  }, (err) => showFirestoreError(err));

  onInsumosChange(() => { renderRecetas(); notify(); });
}

function getBaseMasa(){
  return recetasCache.find(r => r.tipo === "base");
}

// Devuelve el costo total de una lista de ingredientes [{insumoId, cantidad}]
function costoIngredientes(lista){
  return (lista || []).reduce((sum, ing) => {
    const insumo = getInsumo(ing.insumoId);
    if(!insumo) return sum;
    return sum + (ing.cantidad * insumo.costoUnidad);
  }, 0);
}

export function calcularReceta(receta){
  const costoIng = costoIngredientes(receta.ingredientes);
  let costoMasa = 0;
  if(receta.usaMasa){
    const masa = getBaseMasa();
    if(masa) costoMasa = costoIngredientes(masa.ingredientes);
  }
  const costoTotal = costoIng + costoMasa;
  const margen = receta.margen || 0;
  const venta = costoTotal * (1 + margen);
  const ganancia = venta - costoTotal;
  return { costoIngredientes: costoIng, costoMasa, costoTotal, venta, ganancia, margen };
}

export function getReceta(id){ return recetasCache.find(r => r.id === id); }
export function pizzasSolas(){ return recetasCache.filter(r => r.tipo === "pizza"); }

function renderRecetas(){
  const grid = document.getElementById("grid-recetas");
  if(!grid) return;
  if(insumosCache.length === 0 || recetasCache.length === 0){
    grid.innerHTML = `<p class="list__empty">Cargando recetas…</p>`;
    return;
  }

  grid.innerHTML = recetasCache.map(r => {
    const calc = calcularReceta(r);
    const ingredientesHTML = (r.ingredientes || []).map(ing => {
      const insumo = getInsumo(ing.insumoId);
      const nombre = insumo ? insumo.nombre : "(insumo eliminado)";
      const costo = insumo ? ing.cantidad * insumo.costoUnidad : 0;
      return `<div><span>${nombre} · ${ing.cantidad}${insumo ? insumo.unidad : ""}</span><span class="mono">${fmtCOP(costo)}</span></div>`;
    }).join("");

    return `
    <div class="receta-card" data-id="${r.id}">
      <div class="receta-card__head">
        <div>
          <h3 class="receta-card__name">${r.nombre}</h3>
          <span class="receta-card__tag">${r.tipo === "base" ? "Base · usada en otras recetas" : "Pizza"}</span>
        </div>
      </div>
      <div class="receta-card__ingredientes">
        ${ingredientesHTML}
        ${r.usaMasa ? `<div><span>Masa</span><span class="mono">${fmtCOP(calc.costoMasa)}</span></div>` : ""}
      </div>
      <div class="receta-card__totals">
        <div><span class="lbl">Costo total</span><span class="val">${fmtCOP(calc.costoTotal)}</span></div>
        ${r.tipo === "pizza" ? `
        <div><span class="lbl">Margen</span><span class="val">${Math.round(calc.margen*100)}%</span></div>
        <div><span class="lbl">Ganancia</span><span class="val">${fmtCOP(calc.ganancia)}</span></div>
        <div><span class="lbl">Precio de venta</span><span class="receta-card__venta">${fmtCOP(calc.venta)}</span></div>
        ` : ""}
      </div>
      <div class="receta-card__actions">
        <button class="btn btn--ghost btn--small" data-action="edit">Editar</button>
        <button class="btn btn--ghost btn--small btn--danger" data-action="delete">Eliminar</button>
      </div>
    </div>`;
  }).join("");

  grid.querySelectorAll(".receta-card").forEach(card => {
    const id = card.dataset.id;
    card.querySelector('[data-action="edit"]').addEventListener("click", () => openRecetaModal(id));
    card.querySelector('[data-action="delete"]').addEventListener("click", () => removeReceta(id));
  });
}

export async function removeReceta(id){
  if(!confirm("¿Eliminar esta receta?")) return;
  await deleteDoc(doc(db, "recetas", id));
}

let lineCount = 0;
export function openRecetaModal(editId = null){
  const existing = editId ? getReceta(editId) : null;
  const root = document.getElementById("modal-root");
  lineCount = 0;

  const opciones = insumosCache.map(i => `<option value="${i.id}">${i.nombre} (${i.unidad})</option>`).join("");

  root.innerHTML = `
    <div class="modal-overlay" id="ov">
      <div class="modal">
        <h2>${existing ? "Editar receta" : "Nueva receta"}</h2>
        <div class="field"><label>Nombre</label><input id="f-nombre" value="${existing?.nombre || ""}" placeholder="Ej: 05 · Pizza Hawaiana"></div>
        <div class="field-row">
          <div class="field"><label>Tipo</label>
            <select id="f-tipo">
              <option value="pizza" ${existing?.tipo==="pizza"?"selected":""}>Pizza (se vende)</option>
              <option value="base" ${existing?.tipo==="base"?"selected":""}>Base (ej: Masa)</option>
            </select>
          </div>
          <div class="field"><label>Margen (ej: 0.85 = 85%)</label><input id="f-margen" type="number" step="any" value="${existing?.margen ?? 1}"></div>
        </div>
        <div class="field">
          <label><input type="checkbox" id="f-usa-masa" ${existing?.usaMasa ? "checked" : ""}> Incluye una masa (costo de la receta base)</label>
        </div>

        <div class="field">
          <label>Ingredientes</label>
          <div id="lineas"></div>
          <button class="btn btn--small" id="btn-add-line" type="button">+ Agregar ingrediente</button>
        </div>

        <div class="modal__actions">
          <button class="btn" id="btn-cancel">Cancelar</button>
          <button class="btn btn--primary" id="btn-save">Guardar</button>
        </div>
      </div>
    </div>
  `;

  const lineasDiv = document.getElementById("lineas");
  function addLine(insumoId = "", cantidad = ""){
    const lid = "l" + (lineCount++);
    const wrap = document.createElement("div");
    wrap.className = "ingredient-line";
    wrap.dataset.lid = lid;
    wrap.innerHTML = `
      <select class="l-insumo">${opciones}</select>
      <input class="l-cantidad" type="number" step="any" placeholder="cant." value="${cantidad}">
      <button class="remove-x" type="button">×</button>
    `;
    if(insumoId) wrap.querySelector(".l-insumo").value = insumoId;
    wrap.querySelector(".remove-x").onclick = () => wrap.remove();
    lineasDiv.appendChild(wrap);
  }
  (existing?.ingredientes || []).forEach(ing => addLine(ing.insumoId, ing.cantidad));
  if(!existing) addLine();

  document.getElementById("btn-add-line").onclick = () => addLine();
  document.getElementById("btn-cancel").onclick = () => root.innerHTML = "";
  document.getElementById("ov").addEventListener("click", (e) => { if(e.target.id === "ov") root.innerHTML = ""; });

  document.getElementById("btn-save").onclick = async () => {
    const nombre = document.getElementById("f-nombre").value.trim();
    if(!nombre){ alert("Ponle un nombre a la receta."); return; }
    const ingredientes = [...lineasDiv.querySelectorAll(".ingredient-line")].map(l => ({
      insumoId: l.querySelector(".l-insumo").value,
      cantidad: parseFloat(l.querySelector(".l-cantidad").value) || 0,
    })).filter(i => i.insumoId && i.cantidad > 0);

    const data = {
      nombre,
      tipo: document.getElementById("f-tipo").value,
      margen: parseFloat(document.getElementById("f-margen").value) || 0,
      usaMasa: document.getElementById("f-usa-masa").checked,
      ingredientes,
    };
    const id = editId || nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"") + "-" + Date.now().toString(36);
    await setDoc(doc(db, "recetas", id), data, { merge: true });
    root.innerHTML = "";
  };
}
