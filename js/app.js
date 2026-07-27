import { isConfigured } from "./firebase-config.js";
import { initInsumos, openInsumoModal } from "./insumos.js";
import { initRecetas, openRecetaModal } from "./recetas.js";
import { initVentas } from "./ventas.js";

function showApp(){
  document.getElementById("boot-screen").classList.add("hidden");
  if(!isConfigured){
    document.getElementById("config-warning").classList.remove("hidden");
    return;
  }
  document.getElementById("app").classList.remove("hidden");
}

function setupNav(){
  document.querySelectorAll(".nav__item").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav__item").forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const view = btn.dataset.view;
      document.querySelectorAll(".view").forEach(v => v.classList.remove("is-active"));
      document.getElementById("view-" + view).classList.add("is-active");
    });
  });
}

async function main(){
  setupNav();
  document.getElementById("btn-new-insumo")?.addEventListener("click", () => openInsumoModal());
  document.getElementById("btn-new-receta")?.addEventListener("click", () => openRecetaModal());

  showApp();
  if(!isConfigured) return;

  await initInsumos();
  await initRecetas();
  await initVentas();
}

main();
