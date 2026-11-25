// Lógica pura de la calculadora: sin React, fácil de testear y de reutilizar.
// Revisa estos valores cuando cambie la ley (sueldo mínimo, jornada, cotizaciones).

export const CFG = {
  WHATSAPP: "56942208570",
  JORNADA_SEMANAL: 42, // Ley 21.561: 42 h desde 26-04-2026, 40 h desde 26-04-2028
  SEMANAS_EFECTIVAS_MES: 3.85, // (52 − 3 sem. vacaciones − ~2,8 sem. feriados) / 12
  COSTO_EMPLEADOR: 0.068, // cesantía 2,4 % + mutual 0,93 % + reforma pensiones 3,5 %
  RECARGO_EXTRA: 0.5, // art. 32 Código del Trabajo
  UMBRAL_HORAS_MES: 10,
}

export const SUELDOS_REF = [
  { nombre: "Sueldo mínimo", monto: 553553 }, // Ley 21.830, desde 01-05-2026
  { nombre: "Mediana Chile", monto: 680000 }, // INE, ESI 2025
  { nombre: "Promedio Chile", monto: 962945 }, // INE, ESI 2025
]

export const TAREAS_EJEMPLO = [
  { nombre: "Reporte semanal", minutos: 90, veces: 1 },
  { nombre: "Ingreso de facturas", minutos: 5, veces: 40 },
  { nombre: "Responder consultas repetidas", minutos: 4, veces: 60 },
  { nombre: "Conciliación bancaria", minutos: 45, veces: 2 },
  { nombre: "Cotizaciones a clientes", minutos: 20, veces: 10 },
]

export const LIMITES = {
  minutos: [0, 480],
  veces: [0, 100],
  personas: [1, 200],
  sueldo: [0, 50_000_000],
  porcentaje: [30, 90],
  inversion: [0, 1e10],
  mantencion: [0, 1e9],
}

/** Convierte un string de input a número dentro de un rango. Nunca devuelve NaN. */
export function aNumero(valor, [min, max]) {
  const n = parseFloat(valor)
  if (!Number.isFinite(n)) return min
  return Math.min(Math.max(n, min), max)
}

/** Valor hora según la Dirección del Trabajo: sueldo / 30 × 7 / jornada semanal. */
export function valorHora(sueldo, { costoEmpleador = true, horasExtra = false } = {}) {
  let v = (sueldo / 30) * 7 / CFG.JORNADA_SEMANAL
  if (costoEmpleador) v *= 1 + CFG.COSTO_EMPLEADOR
  if (horasExtra) v *= 1 + CFG.RECARGO_EXTRA
  return v
}

export function calcular({ minutos, veces, personas, sueldo, porcentaje, inversion = 0, mantencion = 0, costoEmpleador = true, horasExtra = false }) {
  const horasSemanaPersona = (minutos * veces) / 60
  const horasMes = horasSemanaPersona * personas * CFG.SEMANAS_EFECTIVAS_MES
  const vHora = valorHora(sueldo, { costoEmpleador, horasExtra })
  const horasAhorradas = horasMes * (porcentaje / 100)
  const ahorroMes = horasAhorradas * vHora
  const netoMes = ahorroMes - mantencion

  return {
    horasSemanaPersona,
    horasMes,
    horasConAutomatizacion: horasMes - horasAhorradas,
    horasAhorradas,
    valorHora: vHora,
    costoMesHoy: horasMes * vHora,
    costoAnioHoy: horasMes * vHora * 12,
    ahorroMes,
    netoAnio: netoMes * 12 - inversion,
    mesesRecuperacion: inversion > 0 && netoMes > 0 ? inversion / netoMes : null,
    superaJornada: horasSemanaPersona > CFG.JORNADA_SEMANAL,
    superaHorasExtra: horasExtra && horasSemanaPersona > 10, // máx. 2 h extra diarias (art. 31)
    ahorroBajo: horasAhorradas < CFG.UMBRAL_HORAS_MES,
  }
}
