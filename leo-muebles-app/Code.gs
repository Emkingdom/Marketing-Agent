/**
 * Finanzas Leo Muebles — servidor (Google Apps Script).
 * Guarda todo en la hoja de cálculo donde está instalado este script:
 *   - "Movimientos": un ingreso, gasto o depósito por fila.
 *   - "Facturas": facturas de suplidores (los pagos van en la columna "pagos").
 *   - "Config": nombres de sucursales, moneda, presupuestos y cuentas.
 * No borres ni cambies el orden de las columnas de esas pestañas.
 */

const MOV_COLS = ['id', 'tipo', 'fecha', 'mes', 'monto', 'suc', 'cat', 'desc', 'prov', 'metodo', 'comp', 'cxp', 'ts', 'nota', 'veh', 'emp'];
const FAC_COLS = ['id', 'suplidor', 'num', 'monto', 'fecha', 'vence', 'plazo', 'aviso', 'suc', 'cat', 'nota', 'pagos', 'ts'];

function doGet() {
  setup_();
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Finanzas Leo Muebles')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/* ---------- hoja ---------- */
function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function sheet_(name, cols, montoCol) {
  const ss = ss_();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.getRange(2, 1, sh.getMaxRows() - 1, cols.length).setNumberFormat('@');
    if (montoCol) sh.getRange(2, montoCol, sh.getMaxRows() - 1, 1).setNumberFormat('#,##0.00');
  }
  return sh;
}

function setup_() {
  const mov = sheet_('Movimientos', MOV_COLS, 5);
  // Agrega encabezados de columnas nuevas (por ejemplo "nota") a hojas creadas con una versión anterior
  if (mov.getLastColumn() < MOV_COLS.length) mov.getRange(1, 1, 1, MOV_COLS.length).setValues([MOV_COLS]).setFontWeight('bold');
  sheet_('Facturas', FAC_COLS, 4);
  const cfg = sheet_('Config', ['clave', 'valor']);
  // Carga los datos iniciales una sola vez, si la hoja está vacía y existe Datos.gs
  if (mov.getLastRow() < 2 && cfg.getLastRow() < 2 && typeof DATOS_INICIALES !== 'undefined') {
    importAll(DATOS_INICIALES);
  }
}

function str_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, ss_().getSpreadsheetTimeZone(), 'yyyy-MM-dd');
  return v == null ? '' : String(v);
}

function rows_(sh, n) {
  const last = sh.getLastRow();
  return last < 2 ? [] : sh.getRange(2, 1, last - 1, n).getValues();
}

function movToRow_(g) {
  return MOV_COLS.map(c => {
    if (c === 'monto') return Number(g.monto) || 0;
    if (c === 'comp') return g.comp ? 'Sí' : 'No';
    if (c === 'mes') return String(g.fecha || '').slice(0, 7);
    return g[c] == null ? '' : String(g[c]);
  });
}

function rowToMov_(r) {
  const g = {};
  MOV_COLS.forEach((c, i) => { g[c] = r[i]; });
  g.id = str_(g.id); g.fecha = str_(g.fecha); g.mes = g.fecha.slice(0, 7);
  g.monto = Number(g.monto) || 0;
  g.comp = g.comp === true || g.comp === 'Sí' || g.comp === 'TRUE';
  ['tipo', 'suc', 'cat', 'desc', 'prov', 'metodo', 'ts', 'cxp', 'nota'].forEach(c => { g[c] = str_(g[c]); });
  if (!g.cxp) delete g.cxp;
  return g;
}

function facToRow_(f) {
  return FAC_COLS.map(c => {
    if (c === 'monto') return Number(f.monto) || 0;
    if (c === 'pagos') return JSON.stringify(f.pagos || {});
    return f[c] == null ? '' : String(f[c]);
  });
}

function rowToFac_(r) {
  const f = {};
  FAC_COLS.forEach((c, i) => { f[c] = r[i]; });
  ['id', 'suplidor', 'num', 'suc', 'cat', 'nota', 'ts'].forEach(c => { f[c] = str_(f[c]); });
  f.fecha = str_(f.fecha); f.vence = str_(f.vence);
  f.monto = Number(f.monto) || 0;
  f.plazo = Number(f.plazo) || 0; f.aviso = f.aviso === '' ? 5 : Number(f.aviso);
  try { f.pagos = JSON.parse(f.pagos || '{}'); } catch (e) { f.pagos = {}; }
  return f;
}

/* ---------- lectura ---------- */
function getAll() {
  setup_();
  const ss = ss_();
  const months = {};
  rows_(ss.getSheetByName('Movimientos'), MOV_COLS.length).forEach(r => {
    if (!r[0]) return;
    const g = rowToMov_(r);
    const m = (months[g.mes] = months[g.mes] || { items: {} });
    m.items[g.id] = g;
  });
  const cxp = {};
  rows_(ss.getSheetByName('Facturas'), FAC_COLS.length).forEach(r => {
    if (!r[0]) return;
    const f = rowToFac_(r); cxp[f.id] = f;
  });
  let cfg = null;
  rows_(ss.getSheetByName('Config'), 2).forEach(r => {
    if (r[0] === 'general') { try { cfg = JSON.parse(r[1]); } catch (e) { cfg = null; } }
  });
  return { months: months, cxp: cxp, cfg: cfg };
}

/* ---------- escritura ---------- */
function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

function idIndex_(sh) {
  const last = sh.getLastRow(), idx = {};
  if (last >= 2) sh.getRange(2, 1, last - 1, 1).getValues().forEach((r, i) => { if (r[0]) idx[String(r[0])] = i + 2; });
  return idx;
}

function changeItems(put, del) {
  return withLock_(() => {
    const sh = sheet_('Movimientos', MOV_COLS, 5);
    let idx = idIndex_(sh);
    const nuevos = [];
    (put || []).forEach(g => {
      const row = movToRow_(g);
      if (idx[g.id]) sh.getRange(idx[g.id], 1, 1, row.length).setValues([row]);
      else nuevos.push(row);
    });
    if (nuevos.length) sh.getRange(sh.getLastRow() + 1, 1, nuevos.length, MOV_COLS.length).setValues(nuevos);
    if (del && del.length) {
      idx = idIndex_(sh);
      del.map(id => idx[id]).filter(Boolean).sort((a, b) => b - a).forEach(r => sh.deleteRow(r));
    }
    return true;
  });
}

function putCxp(f) {
  return withLock_(() => {
    const sh = sheet_('Facturas', FAC_COLS, 4), idx = idIndex_(sh), row = facToRow_(f);
    if (idx[f.id]) sh.getRange(idx[f.id], 1, 1, row.length).setValues([row]);
    else sh.getRange(sh.getLastRow() + 1, 1, 1, row.length).setValues([row]);
    return true;
  });
}

function deleteCxp(id) {
  return withLock_(() => {
    const sh = sheet_('Facturas', FAC_COLS, 4), idx = idIndex_(sh);
    if (idx[id]) sh.deleteRow(idx[id]);
    return true;
  });
}

function putCfg(cfg) {
  return withLock_(() => {
    const sh = sheet_('Config', ['clave', 'valor']), last = sh.getLastRow();
    const keys = last >= 2 ? sh.getRange(2, 1, last - 1, 1).getValues().map(r => r[0]) : [];
    const i = keys.indexOf('general'), val = JSON.stringify(cfg);
    if (i >= 0) sh.getRange(i + 2, 2).setValue(val);
    else sh.getRange(sh.getLastRow() + 1, 1, 1, 2).setValues([['general', val]]);
    return true;
  });
}

/** Reemplaza TODOS los datos por los de una copia de seguridad. */
function importAll(data) {
  return withLock_(() => {
    const ss = ss_();
    const mov = sheet_('Movimientos', MOV_COLS, 5), fac = sheet_('Facturas', FAC_COLS, 4), cfg = sheet_('Config', ['clave', 'valor']);
    [mov, fac, cfg].forEach(sh => { if (sh.getLastRow() >= 2) sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).clearContent(); });
    const rows = [];
    Object.keys(data.months || {}).forEach(m => {
      const items = (data.months[m] || {}).items || {};
      Object.keys(items).forEach(k => { if (items[k]) rows.push(movToRow_(items[k])); });
    });
    rows.sort((a, b) => String(a[2]).localeCompare(String(b[2])));
    if (rows.length) mov.getRange(2, 1, rows.length, MOV_COLS.length).setValues(rows);
    const frows = Object.keys(data.cxp || {}).map(k => facToRow_(data.cxp[k]));
    if (frows.length) fac.getRange(2, 1, frows.length, FAC_COLS.length).setValues(frows);
    if (data.cfg) cfg.getRange(2, 1, 1, 2).setValues([['general', JSON.stringify(data.cfg)]]);
    SpreadsheetApp.flush();
    return { movimientos: rows.length, facturas: frows.length };
  });
}
