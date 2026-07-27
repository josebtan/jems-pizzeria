// Datos iniciales tomados de PizzaGrill_Completo.xlsx
// Se usan una sola vez para poblar Firestore si las colecciones están vacías.

const SEED_BASE = [
  { id:"harina",          nombre:"Harina",            presentacion:"1000g", cantidad:1000, unidad:"g",   precio:2500,  estado:"comprado" },
  { id:"levadura",        nombre:"Levadura",          presentacion:"250g",  cantidad:250,  unidad:"g",   precio:7500,  estado:"comprado" },
  { id:"sal",             nombre:"Sal",               presentacion:"500g",  cantidad:500,  unidad:"g",   precio:2000,  estado:"comprado" },
  { id:"azucar",          nombre:"Azúcar",            presentacion:"500g",  cantidad:500,  unidad:"g",   precio:2500,  estado:"comprado" },
  { id:"aceite",          nombre:"Aceite",            presentacion:"3000ml",cantidad:3000, unidad:"ml",  precio:35000, estado:"comprado" },
  { id:"pasta-tomate",    nombre:"Pasta tomate",      presentacion:"200g",  cantidad:200,  unidad:"g",   precio:7500,  estado:"comprado" },
  { id:"queso-mozzarella",nombre:"Queso mozzarella",  presentacion:"500g",  cantidad:500,  unidad:"g",   precio:12000, estado:"comprado" },
  { id:"salami",          nombre:"Salami",            presentacion:"750g",  cantidad:750,  unidad:"g",   precio:19700, estado:"comprado" },
  { id:"jamon-ahumado",   nombre:"Jamón ahumado",     presentacion:"500g",  cantidad:500,  unidad:"g",   precio:10800, estado:"comprado" },
  { id:"tocineta",        nombre:"Tocineta",          presentacion:"1000g", cantidad:1000, unidad:"g",   precio:24500, estado:"comprado" },
  { id:"pollo",           nombre:"Pollo",             presentacion:"1000g", cantidad:1000, unidad:"g",   precio:14800, estado:"comprado" },
  { id:"champinones",     nombre:"Champiñones",       presentacion:"3000g", cantidad:3000, unidad:"g",   precio:42000, estado:"comprado" },
  { id:"cebolla",         nombre:"Cebolla",           presentacion:"454g",  cantidad:454,  unidad:"g",   precio:6000,  estado:"comprado" },
  { id:"chicharron",      nombre:"Chicharrón",        presentacion:"500g",  cantidad:500,  unidad:"g",   precio:8700,  estado:"comprado" },
  { id:"carne-de-res",    nombre:"Carne de res",      presentacion:"600g",  cantidad:600,  unidad:"g",   precio:20400, estado:"comprado" },
  { id:"carne-de-cerdo",  nombre:"Carne de cerdo",    presentacion:"1600g", cantidad:1600, unidad:"g",   precio:37739, estado:"comprado" },
  { id:"salsa-bbq",       nombre:"Salsa BBQ",         presentacion:"1000g", cantidad:1000, unidad:"g",   precio:10500, estado:"comprado" },
  { id:"salsa-de-ajo",    nombre:"Salsa de ajo",      presentacion:"190g",  cantidad:190,  unidad:"g",   precio:7200,  estado:"comprado" },
  { id:"caja",            nombre:"Caja",              presentacion:"und",   cantidad:1,    unidad:"und", precio:1200,  estado:"comprado" },
  { id:"carbon",          nombre:"Carbón",            presentacion:"und",   cantidad:1,    unidad:"und", precio:1000,  estado:"comprado" },
  { id:"caja-de-pizza",   nombre:"Caja de pizza",     presentacion:"und",   cantidad:1,    unidad:"und", precio:1700,  estado:"comprado" },
  { id:"mayonesa",        nombre:"Mayonesa",          presentacion:"1000g", cantidad:1000, unidad:"g",   precio:9500,  estado:"comprado" },
  { id:"jalapenos",       nombre:"Jalapeños",         presentacion:"1500g", cantidad:1500, unidad:"g",   precio:20500, estado:"comprado" },
  { id:"maiz",            nombre:"Maíz",              presentacion:"400g",  cantidad:400,  unidad:"g",   precio:4400,  estado:"comprado" },
  { id:"bandeja-metalica",nombre:"Bandeja metálica",  presentacion:"und",   cantidad:2,    unidad:"und", precio:32000, estado:"comprado" },
  { id:"embudo",          nombre:"Embudo",            presentacion:"und",   cantidad:1,    unidad:"und", precio:6000,  estado:"comprado" },
];

// Cada insumo arranca con su stock, comprado y gastado en base a su compra inicial
// (la que se refleja en cantidad/precio). Las compras siguientes se registran
// desde la pestaña Stock y solo suman a estos tres campos.
export const SEED_INSUMOS = SEED_BASE.map(i => ({
  ...i,
  stock: i.cantidad,
  totalComprado: i.cantidad,
  totalGastado: i.precio,
}));

// tipo: "base" (la masa, se usa dentro de otras recetas) | "pizza"
export const SEED_RECETAS = [
  {
    id:"masa",
    nombre:"Masa",
    tipo:"base",
    usaMasa:false,
    margen:0,
    ingredientes:[
      { insumoId:"harina",   cantidad:160 },
      { insumoId:"levadura", cantidad:2 },
      { insumoId:"sal",      cantidad:2.5 },
      { insumoId:"azucar",   cantidad:2 },
      { insumoId:"aceite",   cantidad:12 },
    ],
  },
  {
    id:"carnes-frias",
    nombre:"01 · Pizza Carnes Frías",
    tipo:"pizza",
    usaMasa:true,
    margen:0.8801,
    ingredientes:[
      { insumoId:"pasta-tomate",     cantidad:100 },
      { insumoId:"queso-mozzarella", cantidad:160 },
      { insumoId:"salami",           cantidad:30 },
      { insumoId:"jamon-ahumado",    cantidad:40 },
      { insumoId:"tocineta",         cantidad:30 },
      { insumoId:"caja-de-pizza",    cantidad:1 },
      { insumoId:"carbon",           cantidad:1 },
    ],
  },
  {
    id:"pollo-grill",
    nombre:"02 · Pizza Pollo",
    tipo:"pizza",
    usaMasa:true,
    margen:1.0,
    ingredientes:[
      { insumoId:"pasta-tomate",     cantidad:100 },
      { insumoId:"salsa-de-ajo",     cantidad:25 },
      { insumoId:"queso-mozzarella", cantidad:160 },
      { insumoId:"pollo",            cantidad:90 },
      { insumoId:"champinones",      cantidad:45 },
      { insumoId:"cebolla",          cantidad:20 },
      { insumoId:"caja",             cantidad:1 },
      { insumoId:"carbon",           cantidad:0.3 },
    ],
  },
  {
    id:"parrillera-grill",
    nombre:"03 · Pizza Parrillera",
    tipo:"pizza",
    usaMasa:true,
    margen:1.0,
    ingredientes:[
      { insumoId:"pasta-tomate",     cantidad:100 },
      { insumoId:"queso-mozzarella", cantidad:160 },
      { insumoId:"carne-de-res",     cantidad:50 },
      { insumoId:"carne-de-cerdo",   cantidad:50 },
      { insumoId:"cebolla",          cantidad:25 },
      { insumoId:"salsa-bbq",        cantidad:15 },
      { insumoId:"caja",             cantidad:1 },
      { insumoId:"carbon",           cantidad:0.3 },
    ],
  },
  {
    id:"chicharron-grill",
    nombre:"04 · Pizza Chicharrón",
    tipo:"pizza",
    usaMasa:true,
    margen:0.85,
    ingredientes:[
      { insumoId:"pasta-tomate",     cantidad:100 },
      { insumoId:"queso-mozzarella", cantidad:160 },
      { insumoId:"chicharron",       cantidad:80 },
      { insumoId:"cebolla",          cantidad:20 },
      { insumoId:"maiz",             cantidad:40 },
      { insumoId:"jamon-ahumado",    cantidad:40 },
      { insumoId:"caja",             cantidad:1 },
      { insumoId:"carbon",           cantidad:1 },
    ],
  },
];

export const DEFAULT_PLANTE = 5000; // ganancia fija de la pizzería por pizza vendida
