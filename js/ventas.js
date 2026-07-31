import { db, ready, collection, doc, getDoc, addDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp } from "./firebase-init.js";
import { pizzasSolas, calcularReceta, ingredientesTotales, onRecetasChange, recetasCache, nombreVisible } from "./recetas.js";
import { fmtCOP, descontarStock, reponerStock } from "./insumos.js";
import { DEFAULT_PLANTE } from "./data.js";

export let ventasCache = [];

export async function initVentas(){
  const okAuth = await ready;
  if(!okAuth || !db) return;

  onSnapshot(collection(db, "ventas"), (snap) => {
    ventasCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderVentas();
  });

  onRecetasChange(() => renderVentas());

  document.getElementById("btn-new-venta")?.addEventListener("click", () => openVentaModal());
}

function renderVentas(){
  const pendCont = document.getElementById("lista-pendientes");
  const vendCont = document.getElementById("lista-vendidas");
  if(!pendCont || !vendCont) return;

  const pendientes = ventasCache.filter(v => v.estado === "pendiente");
  const vendidas = ventasCache.filter(v => v.estado === "entregada");

  pendCont.innerHTML = pendientes.length ? pendientes.map(v => rowHTML(v, true)).join("")
    : `<p class="list__empty">No hay pedidos pendientes.</p>`;

  vendCont.innerHTML = vendidas.length ? vendidas.map(v => rowHTML(v, false)).join("")
    : `<p class="list__empty">Aún no hay ventas entregadas.</p>`;

  attachRowEvents();
  renderResumen(vendidas);
}

function rowHTML(v, pendiente){
  const total = (v.precioVentaUnit || 0) * v.cantidad;
  return `
    <div class="venta-row" data-id="${v.id}">
      <div class="venta-row__main">
        <span class="venta-row__name">${nombreVisible(v.nombreReceta)} × ${v.cantidad}</span>
        <span class="venta-row__meta">${v.fecha || ""}${v.cliente ? " · " + v.cliente : ""}</span>
        ${v.descripcion ? `<span class="venta-row__desc">${escapeHTML(v.descripcion)}</span>` : ""}
      </div>
      <span class="venta-row__price">${fmtCOP(total)}</span>
      <div class="venta-row__actions">
        ${pendiente ? `<button class="btn btn--ghost btn--small" data-action="entregar">Marcar entregada</button>` : ""}
        <button class="btn btn--ghost btn--small btn--danger" data-action="eliminar">✕</button>
      </div>
    </div>
  `;
}
function escapeHTML(str){
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function attachRowEvents(){
  document.querySelectorAll(".venta-row").forEach(row => {
    const id = row.dataset.id;
    row.querySelector('[data-action="entregar"]')?.addEventListener("click", () => marcarEntregada(id));
    row.querySelector('[data-action="eliminar"]')?.addEventListener("click", () => eliminarVenta(id));
  });
}

function renderResumen(vendidas){
  const cantidad = vendidas.reduce((s,v) => s + v.cantidad, 0);
  const total = vendidas.reduce((s,v) => s + (v.precioVentaUnit || 0) * v.cantidad, 0);
  const costoTotal = vendidas.reduce((s,v) => s + (v.costoUnit || 0) * v.cantidad, 0);
  const ganancia = total - costoTotal;
  const plante = vendidas.reduce((s,v) => s + (v.planteUnit ?? DEFAULT_PLANTE) * v.cantidad, 0);
  const gananciaReal = ganancia - plante;

  setText("r-cantidad", cantidad);
  setText("r-total", fmtCOP(total));
  setText("r-ganancia", fmtCOP(ganancia));
  setText("r-plante", fmtCOP(plante));
  setText("r-real", fmtCOP(gananciaReal));
}
function setText(id, val){ const el = document.getElementById(id); if(el) el.textContent = val; }

export async function marcarEntregada(id){
  await updateDoc(doc(db, "ventas", id), { estado: "entregada", fechaEntrega: new Date().toISOString().slice(0,10) });
}
export async function eliminarVenta(id){
  if(!confirm("¿Eliminar este registro de venta? Los ingredientes descontados se devuelven al stock.")) return;
  try{
    const snap = await getDoc(doc(db, "ventas", id));
    if(snap.exists()) await reponerStock(snap.data().ingredientesDescontados);
  }catch(err){ console.error("[Ventas] No se pudo reponer el stock:", err); }
  await deleteDoc(doc(db, "ventas", id));
}

export function openVentaModal(){
  const root = document.getElementById("modal-root");
  const pizzas = [...pizzasSolas()].sort((a, b) => {
    const na = parseInt((a.nombre||"").match(/^\s*(\d+)/)?.[1] || "999", 10);
    const nb = parseInt((b.nombre||"").match(/^\s*(\d+)/)?.[1] || "999", 10);
    return na - nb;
  });
  if(pizzas.length === 0){
    alert("Primero crea al menos una receta de tipo pizza en la sección Recetas.");
    return;
  }
  const opciones = pizzas.map(p => `<option value="${p.id}">${nombreVisible(p.nombre)}</option>`).join("");

  root.innerHTML = `
    <div class="modal-overlay" id="ov">
      <div class="modal">
        <h2>Registrar venta</h2>
        <div class="field"><label>Pizza</label><select id="f-pizza">${opciones}</select></div>
        <div class="field">
          <label><input type="checkbox" id="f-mitad"> Media y media (dos sabores)</label>
        </div>
        <div class="field-row hidden" id="f-mitad-row">
          <div class="field"><label>Mitad 1</label><select id="f-pizza-a">${opciones}</select></div>
          <div class="field"><label>Mitad 2</label><select id="f-pizza-b">${opciones}</select></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Cantidad</label><input id="f-cantidad" type="number" min="1" value="1"></div>
          <div class="field"><label>Estado</label>
            <select id="f-estado">
              <option value="pendiente">Pendiente por entregar</option>
              <option value="entregada">Entregada / vendida</option>
            </select>
          </div>
        </div>
        <div class="field"><label>Cliente (opcional)</label><input id="f-cliente" placeholder="Nombre del cliente"></div>
        <div class="field"><label>Descripción (opcional)</label><textarea id="f-descripcion" rows="2" placeholder="Dirección, hora de entrega, notas del pedido…"></textarea></div>
        <div class="field"><label>Plante por pizza</label><input id="f-plante" type="number" value="${DEFAULT_PLANTE}"></div>
        <div class="modal__actions">
          <button class="btn" id="btn-cancel">Cancelar</button>
          <button class="btn btn--primary" id="btn-save">Guardar</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById("btn-cancel").onclick = () => root.innerHTML = "";
  document.getElementById("ov").addEventListener("click", (e) => { if(e.target.id === "ov") root.innerHTML = ""; });

  const fPizza = document.getElementById("f-pizza");
  const fMitad = document.getElementById("f-mitad");
  const fMitadRow = document.getElementById("f-mitad-row");
  const fPizzaA = document.getElementById("f-pizza-a");
  const fPizzaB = document.getElementById("f-pizza-b");
  if(pizzas.length > 1) fPizzaB.value = pizzas[1].id;

  fMitad.addEventListener("change", () => {
    const activo = fMitad.checked;
    fMitadRow.classList.toggle("hidden", !activo);
    fPizza.closest(".field").classList.toggle("hidden", activo);
  });

  document.getElementById("btn-save").onclick = async () => {
    const cantidad = parseInt(document.getElementById("f-cantidad").value) || 1;
    const esMitad = fMitad.checked;

    let recetaId, nombreReceta, calc, ingredientesDescontadosUnit;

    if(esMitad){
      const recetaA = pizzas.find(p => p.id === fPizzaA.value);
      const recetaB = pizzas.find(p => p.id === fPizzaB.value);
      if(!recetaA || !recetaB) { alert("Elige las dos mitades."); return; }
      const calcA = calcularReceta(recetaA);
      const calcB = calcularReceta(recetaB);
      calc = {
        costoTotal: (calcA.costoTotal + calcB.costoTotal) / 2,
        venta: (calcA.venta + calcB.venta) / 2,
      };
      recetaId = `${recetaA.id}+${recetaB.id}`;
      nombreReceta = `${nombreVisible(recetaA.nombre)} / ${nombreVisible(recetaB.nombre)} (mitad y mitad)`;
      ingredientesDescontadosUnit = [
        ...ingredientesTotales(recetaA).map(ing => ({ insumoId: ing.insumoId, cantidad: ing.cantidad * 0.5 })),
        ...ingredientesTotales(recetaB).map(ing => ({ insumoId: ing.insumoId, cantidad: ing.cantidad * 0.5 })),
      ];
    } else {
      const receta = pizzas.find(p => p.id === fPizza.value);
      calc = calcularReceta(receta);
      recetaId = receta.id;
      nombreReceta = receta.nombre;
      ingredientesDescontadosUnit = ingredientesTotales(receta);
    }

    // ingredientes que se van a descontar del stock (× cantidad vendida)
    const ingredientesDescontados = ingredientesDescontadosUnit.map(ing => ({
      insumoId: ing.insumoId,
      cantidad: ing.cantidad * cantidad,
    }));

    const data = {
      recetaId,
      nombreReceta,
      esMitad,
      cantidad,
      estado: document.getElementById("f-estado").value,
      cliente: document.getElementById("f-cliente").value.trim(),
      descripcion: document.getElementById("f-descripcion").value.trim(),
      precioVentaUnit: calc.venta,
      costoUnit: calc.costoTotal,
      planteUnit: parseFloat(document.getElementById("f-plante").value) || DEFAULT_PLANTE,
      fecha: new Date().toISOString().slice(0,10),
      creado: serverTimestamp(),
      ingredientesDescontados,
    };
    await addDoc(collection(db, "ventas"), data);
    try{ await descontarStock(ingredientesDescontados); }
    catch(err){ console.error("[Ventas] No se pudo descontar el stock:", err); }
    root.innerHTML = "";
  };
}
