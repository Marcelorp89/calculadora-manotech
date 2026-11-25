"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { TbBrandWhatsapp, TbCalculator } from "react-icons/tb"
import { CFG, LIMITES, SUELDOS_REF, TAREAS_EJEMPLO, aNumero, calcular } from "./calculo1"

const clp = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 })
const dec = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 })

const INICIAL = {
  tarea: "",
  minutos: "30",
  veces: "5",
  personas: "1",
  sueldo: "680000", // mediana INE 2025
  porcentaje: "70",
  inversion: "",
  mantencion: "",
  costoEmpleador: true,
  horasExtra: false,
}

const inputClase =
  "w-full min-h-[46px] bg-[#000312] border border-white/10 rounded-xl px-4 py-3 text-base text-white placeholder-white/30 focus:outline-none focus-visible:border-[#0F73F4] transition-colors"

function Campo({ id, label, children }) {
  return (
    <div>
      <label htmlFor={id} className="text-xs text-white/50 mb-2 block">{label}</label>
      {children}
    </div>
  )
}

/** @param {{ origen?: "web" | "ebook" }} props  — úsalo para saber de dónde vienen los leads */
export default function Calculadora({ origen = "web" }) {
  const [form, setForm] = useState(INICIAL)
  const set = (campo) => (e) =>
    setForm((f) => ({ ...f, [campo]: e.target.type === "checkbox" ? e.target.checked : e.target.value }))

  // Un solo objeto de datos ya validado → un solo cálculo memorizado
  const r = useMemo(() => {
    const datos = Object.fromEntries(
      Object.entries(LIMITES).map(([k, rango]) => [k, aNumero(form[k], rango)])
    )
    return calcular({ ...datos, personas: Math.round(datos.personas), costoEmpleador: form.costoEmpleador, horasExtra: form.horasExtra })
  }, [form])

  const pct = aNumero(form.porcentaje, LIMITES.porcentaje)
  const conCosto = Number(form.inversion) > 0 || Number(form.mantencion) > 0

  const aviso = r.superaJornada
    ? `Ojo: ${dec.format(r.horasSemanaPersona)} h semanales por persona superan la jornada legal de ${CFG.JORNADA_SEMANAL} h.`
    : r.superaHorasExtra
      ? "La ley permite máximo 2 horas extra al día. Si la tarea pasa de eso, es un tema de dotación."
      : r.ahorroBajo
        ? "Con estos datos el ahorro sería pequeño. Vale la pena revisar si hay otra tarea que consuma más tiempo."
        : null

  const mensajeWsp = encodeURIComponent(
    `Hola Marcelo, usé la calculadora de ManoTech (${origen}). ${form.tarea.trim() || "Una tarea repetitiva"} nos toma ${Math.round(r.horasMes)} horas al mes (≈ ${clp.format(r.costoMesHoy)}). Automatizando el ${pct} % podríamos recuperar ${Math.round(r.horasAhorradas)} h al mes. Quiero conversar.`
  )

  return (
    <section id="calculadora" className="py-24 bg-[#000312]">
      <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col items-center text-center mb-16">
            <span className="text-xs text-[#37CBC2] tracking-widest uppercase mb-3">Calculadora</span>
             <div className="flex flex-col items-center text-center mb-16">
                            <Image
                                src="/images/logotipo-1.png"
                                alt="ManoTech"
                                width={140}
                                height={30}
                                className="h-9 w-auto"
                          />
                        </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">¿Cuánto te cuesta no automatizar?</h2>
            <p className="text-base text-white/50 max-w-xl leading-relaxed">
              Ingresa una tarea repetitiva y mira cuántas horas y pesos se van cada mes.
            </p>
          </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Inputs */}
          <form onSubmit={(e) => e.preventDefault()} className="bg-[#050a1e] border border-white/10 rounded-2xl p-6 flex flex-col gap-5">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Ejemplos de tareas">
              {TAREAS_EJEMPLO.map((t) => (
                <button key={t.nombre} type="button" aria-pressed={form.tarea === t.nombre}
                  onClick={() => setForm((f) => ({ ...f, tarea: t.nombre, minutos: String(t.minutos), veces: String(t.veces) }))}
                  className="text-sm px-4 py-2 min-h-[40px] rounded-full border border-white/10 text-white hover:border-white/30 aria-pressed:bg-[#0F73F4] aria-pressed:border-[#0F73F4] transition-colors">
                  {t.nombre}
                </button>
              ))}
            </div>

            <Campo id="tarea" label="¿Qué tarea quieres automatizar? (opcional)">
              <input id="tarea" type="text" maxLength={80} placeholder="Ej: armar el reporte semanal de ventas" value={form.tarea} onChange={set("tarea")} className={inputClase} />
            </Campo>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Campo id="minutos" label="Minutos cada vez">
                <input id="minutos" type="number" inputMode="numeric" min={1} max={480} value={form.minutos} onChange={set("minutos")} className={inputClase} />
              </Campo>
              <Campo id="veces" label="Veces por semana">
                <input id="veces" type="number" inputMode="numeric" min={1} max={100} value={form.veces} onChange={set("veces")} className={inputClase} />
              </Campo>
              <Campo id="personas" label="Personas que la hacen">
                <input id="personas" type="number" inputMode="numeric" min={1} max={200} value={form.personas} onChange={set("personas")} className={inputClase} />
              </Campo>
              <Campo id="sueldo" label="Sueldo bruto mensual (CLP)">
                <input id="sueldo" type="number" inputMode="numeric" min={0} step={1000} value={form.sueldo} onChange={set("sueldo")} className={inputClase} />
              </Campo>
            </div>

            <div className="flex flex-wrap gap-2" role="group" aria-label="Sueldo de referencia">
              {SUELDOS_REF.map((s) => (
                <button key={s.nombre} type="button" aria-pressed={Number(form.sueldo) === s.monto}
                  onClick={() => setForm((f) => ({ ...f, sueldo: String(s.monto) }))}
                  className="text-xs px-3 py-2 rounded-full border border-white/10 text-white/70 aria-pressed:bg-[#0F73F4] aria-pressed:text-white">
                  {s.nombre}
                </button>
              ))}
            </div>
            <p className="text-xs text-white/40 -mt-2">
              Valor hora: {clp.format(r.valorHora)} (sueldo ÷ 30 × 7 ÷ {CFG.JORNADA_SEMANAL} h, criterio Dirección del Trabajo)
            </p>

            <label className="flex gap-3 text-xs text-white/60">
              <input type="checkbox" checked={form.costoEmpleador} onChange={set("costoEmpleador")} className="accent-[#0F73F4] w-4 h-4" />
              Sumar cotizaciones del empleador (≈ 6,8 %)
            </label>
            <label className="flex gap-3 text-xs text-white/60">
              <input type="checkbox" checked={form.horasExtra} onChange={set("horasExtra")} className="accent-[#0F73F4] w-4 h-4" />
              Se hace en horas extra (recargo legal 50 %)
            </label>

            <div>
              <label htmlFor="porcentaje" className="text-xs text-white/50 mb-2 flex justify-between">
                <span>% de la tarea que se puede automatizar</span>
                <span className="text-[#37CBC2] font-semibold">{pct}%</span>
              </label>
              <input id="porcentaje" type="range" min={30} max={90} step={5} value={form.porcentaje} onChange={set("porcentaje")} className="w-full accent-[#0F73F4]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Campo id="inversion" label="Inversión inicial (opcional)">
                <input id="inversion" type="number" inputMode="numeric" min={0} value={form.inversion} onChange={set("inversion")} className={inputClase} />
              </Campo>
              <Campo id="mantencion" label="Mantención mensual (opcional)">
                <input id="mantencion" type="number" inputMode="numeric" min={0} value={form.mantencion} onChange={set("mantencion")} className={inputClase} />
              </Campo>
            </div>
          </form>

          {/* Resultados */}
          <div className="bg-gradient-to-br from-[#062EC3]/30 to-[#37CBC2]/10 border border-white/10 rounded-2xl p-6 flex flex-col gap-6 lg:sticky lg:top-24">
            <div className="flex items-center gap-2 text-[#37CBC2]">
              <TbCalculator size={18} aria-hidden />
              <span className="text-xs tracking-widest uppercase">Tu estimación</span>
            </div>

            <div aria-live="polite">
              <p className="text-xs text-white/50">Hoy te cuesta hacerlo a mano, al año</p>
              <p className="text-4xl font-bold text-[#80FCB1]">{clp.format(r.costoAnioHoy)}</p>
              <p className="text-xs text-white/50 mt-1">{clp.format(r.costoMesHoy)} al mes · {dec.format(r.horasMes)} h</p>
            </div>

            <div className="flex flex-col gap-4">
              <Barra label="Hoy" valor={`${dec.format(r.horasMes)} h/mes`} ancho={100} color="bg-[#FE6F51]" />
              <Barra label="Con automatización" valor={`${dec.format(r.horasConAutomatizacion)} h/mes`} ancho={100 - pct} color="bg-[#37CBC2]" />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
              <Kpi valor={`${dec.format(r.horasAhorradas)} h`} label="recuperadas al mes" />
              <Kpi valor={clp.format(r.ahorroMes)} label="ahorro bruto al mes" />
              <div className="col-span-2">
                <p className="text-lg font-semibold text-[#80FCB1]">
                  {conCosto ? `${clp.format(r.netoAnio)} neto el primer año` : `${clp.format(r.ahorroMes * 12)} al año`}
                </p>
                {r.mesesRecuperacion && (
                  <p className="text-xs text-white/50">Se paga en {dec.format(r.mesesRecuperacion)} meses</p>
                )}
              </div>
            </div>

            {aviso && (
              <p className="text-xs text-[#F9B26A] bg-[#F9B26A]/10 border border-[#F9B26A]/20 rounded-xl p-3 leading-relaxed">{aviso}</p>
            )}

            <p className="text-xs text-white/30 leading-relaxed">
              Estimación referencial: {CFG.SEMANAS_EFECTIVAS_MES} semanas efectivas al mes (descuenta vacaciones y feriados). No incluye gratificación. El diagnóstico real se hace en una llamada.
            </p>

            <a href={`https://wa.me/${CFG.WHATSAPP}?text=${mensajeWsp}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 min-h-[50px] bg-[#25D366] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#20b858] transition-colors">
              <TbBrandWhatsapp size={20} aria-hidden />
              Conversemos sobre mi caso
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function Barra({ label, valor, ancho, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-white/50 mb-1"><span>{label}</span><span>{valor}</span></div>
      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-300 motion-reduce:transition-none`} style={{ width: `${ancho}%` }} />
      </div>
    </div>
  )
}

function Kpi({ valor, label }) {
  return (
    <div>
      <p className="text-2xl font-bold text-white whitespace-nowrap">{valor}</p>
      <p className="text-xs text-white/40 mt-1">{label}</p>
    </div>
  )
}
