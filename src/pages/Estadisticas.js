import React, { useEffect, useState } from "react"
import { supabase } from "../supabaseClient"
import { Card } from "primereact/card"
import { Chart } from "primereact/chart"

// FUNCIONES 

function promedio(arr) {
  if (!arr || arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function desvioEstandar(arr) {
  if (!arr || arr.length <= 1) return 0
  const prom = promedio(arr)
  const varianza =
    arr.reduce((acc, x) => acc + (x - prom) ** 2, 0) / arr.length
  return Math.sqrt(varianza)
}

function correlacionPearson(xs, ys) {
  if (
    !xs ||
    !ys ||
    xs.length === 0 ||
    ys.length === 0 ||
    xs.length !== ys.length
  )
    return 0

  const n = xs.length
  const promX = promedio(xs)
  const promY = promedio(ys)

  let num = 0
  let sumX = 0
  let sumY = 0

  for (let i = 0; i < n; i++) {
    const dx = xs[i] - promX
    const dy = ys[i] - promY
    num += dx * dy
    sumX += dx * dx
    sumY += dy * dy
  }

  const denom = Math.sqrt(sumX * sumY)
  if (denom === 0) return 0
  return num / denom
}

//sumar total
function agruparSuma(ventas, selectorClave) {
  const map = {}
  ventas.forEach((v) => {
    const key = selectorClave(v)
    if (!key) return
    map[key] = (map[key] || 0) + (v.total || 0)
  })
  return map
}

function agruparPromedio(ventas, selectorClave, selectorValor) {
  const suma = {}
  const conteo = {}
  ventas.forEach((v) => {
    const key = selectorClave(v)
    if (!key) return
    const val = selectorValor(v)
    suma[key] = (suma[key] || 0) + val
    conteo[key] = (conteo[key] || 0) + 1
  })
  const res = {}
  Object.keys(suma).forEach((k) => {
    res[k] = suma[k] / conteo[k]
  })
  return res
}

// ================== COMPONENTE PRINCIPAL ==================

const METODO_CODE = {
  Efectivo: 0,
  Credito: 1,
  Debito: 2,
  Transferencia: 3,
};

export default function Estadisticas() {
  const [baseData, setBaseData] = useState(null)
  const [sinDatos, setSinDatos] = useState(false)

  const [ventasPorMetodo, setVentasPorMetodo] = useState(null)
  const [montoPorMes, setMontoPorMes] = useState(null)
  const [topJuegos, setTopJuegos] = useState(null)

  const [graficoPorDia, setGraficoPorDia] = useState(null)
  const [graficoPorProducto, setGraficoPorProducto] = useState(null)
  const [graficoPorCliente, setGraficoPorCliente] = useState(null)
  const [graficoScatterPrecio, setGraficoScatterPrecio] = useState(null)

  const [statsResumen, setStatsResumen] = useState(null)

  // 1) Traer datos desde Supabase y armar "compras" en memoria
  useEffect(() => {
    const fetchCompras = async () => {
      try {
        const [
          { data: ventas, error: errVentas },
          { data: detalles, error: errDetalles },
          { data: productos, error: errProductos },
          { data: clientes, error: errClientes },
          { data: metodos, error: errMetodos }
        ] = await Promise.all([
          supabase.from("ventas").select("*"),
          supabase.from("detalle_venta").select("*"),
          supabase.from("productos").select("*"),
          supabase.from("clientes").select("*"),
          supabase.from("metodos_pago").select("*")
        ])

        if (errVentas || errDetalles || errProductos || errClientes || errMetodos) {
          console.error("Error cargando datos para estadísticas", {
            errVentas,
            errDetalles,
            errProductos,
            errClientes,
            errMetodos
          })
          setBaseData([])
          setSinDatos(true)
          return
        }

        if (
          !ventas ||
          ventas.length === 0 ||
          !detalles ||
          detalles.length === 0
        ) {
          setBaseData([])
          setSinDatos(true)
        } else {
          const comprasEnMemoria = detalles.map((d) => {
            const venta = ventas.find((v) => v.id_venta === d.id_venta) || {}
            const producto =
              productos.find((p) => p.id_producto === d.id_producto) || {}
            const cliente =
              clientes.find((c) => c.id_cliente === venta.id_cliente) || {}
            const metodo =
              metodos.find((m) => m.id_metodo_pago === venta.id_metodo_pago) ||
              {}

            const totalDetalle =
              (Number(d.cantidad) || 0) * (Number(d.precio_unitario) || 0)

            return {
              id: d.id_detalle || d.id || `${venta.id_venta}-${d.id_producto}`,
              fecha: venta.fecha,
              total: totalDetalle || venta.total_venta || 0,
              metodo_pago: metodo.nombre || "",
              juego_nombre: producto.nombre || "",
              cliente_nombre: `${cliente.nombre || ""} ${
                cliente.apellido || ""
              }`.trim(),
              cantidad: d.cantidad,
              precio: d.precio_unitario
            }
          })

          setBaseData(comprasEnMemoria)
          setSinDatos(false)
        }
      } catch (e) {
        console.error("Error inesperado:", e)
        setBaseData([])
        setSinDatos(true)
      }
    }

    fetchCompras()
  }, [])

  // 2) Armar estadísticas y gráficos
  useEffect(() => {
    if (!baseData) return

    const filtradas = baseData

    if (filtradas.length === 0) {
      setVentasPorMetodo(null)
      setMontoPorMes(null)
      setTopJuegos(null)
      setGraficoPorDia(null)
      setGraficoPorProducto(null)
      setGraficoPorCliente(null)
      setGraficoScatterPrecio(null)
      setStatsResumen(null)
      return
    }

    // ---------- Totales, cantidades, precios ----------
    const totales = filtradas.map((v) => Number(v.total) || 0)
    const cantidades = filtradas.map((v) => Number(v.cantidad) || 0)
    const precios = filtradas.map((v) => {
      if (v.precio != null) return Number(v.precio) || 0
      const cant = Number(v.cantidad) || 0
      return cant > 0 ? (Number(v.total) || 0) / cant : 0
    })

    // Día de la semana (0=Domingo..6=Sabado)
    const diasSemana = filtradas.map((v) => {
      if (!v.fecha) return 0
      const d = new Date(v.fecha)
      return d.getDay()
    })

    // Método de pago como número
    const metodoCodes = filtradas.map((v) => {
      const key = v.metodo_pago || ""
      return METODO_CODE[key] ?? 4; // 4 = "otro"
    })

    // ---------- Promedios agrupados ----------
    const porDiaTotal = agruparSuma(filtradas, (v) => {
      if (!v.fecha) return null;
      return v.fecha.toString().split("T")[0];
    });

    const porProductoTotal = agruparSuma(
      filtradas,
      (v) => v.juego_nombre || "Sin juego"
    );

    const porClienteTotal = agruparSuma(
      filtradas,
      (v) => v.cliente_nombre || "Sin cliente"
    );

    const porDiaPromedio = agruparPromedio(
      filtradas,
      (v) => {
        if (!v.fecha) return null
        return v.fecha.toString().split("T")[0]
      },
      (v) => Number(v.total) || 0
    )

    const porProductoPromedio = agruparPromedio(
      filtradas,
      (v) => v.juego_nombre || "Sin juego",
      (v) => Number(v.total) || 0
    )

    const porClientePromedio = agruparPromedio(
      filtradas,
      (v) => v.cliente_nombre || "Sin cliente",
      (v) => Number(v.total) || 0
    )

    // ---------- Estadísticos numéricos ----------
    const promedioTotal = promedio(totales)
    const desvioTotal = desvioEstandar(totales)

    const valoresPorDia = Object.values(porDiaTotal)
    const desvioDiario =
      valoresPorDia.length > 1 ? desvioEstandar(valoresPorDia) : 0

    const semanaMap = {}
    filtradas.forEach((v) => {
      if (!v.fecha) return
      const d = new Date(v.fecha)
      const year = d.getFullYear()
      const firstJan = new Date(year, 0, 1)
      const diff = d - firstJan
      const dayOfYear = Math.floor(diff / 86400000) + 1
      const week = Math.ceil(dayOfYear / 7)
      const key = `${year}-W${week}`
      semanaMap[key] = (semanaMap[key] || 0) + (v.total || 0)
    })

    const valoresPorSemana = Object.values(semanaMap)
    const desvioSemanal =
      valoresPorSemana.length > 1 ? desvioEstandar(valoresPorSemana) : 0

    const corrPrecioCantidad = correlacionPearson(precios, cantidades)
    const corrCantidadDia = correlacionPearson(cantidades, diasSemana)
    const corrTotalMetodo = correlacionPearson(totales, metodoCodes)

    setStatsResumen({
      promedioTotal,
      desvioTotal,
      desvioDiario,
      desvioSemanal,
      corrPrecioCantidad,
      corrCantidadDia,
      corrTotalMetodo,
      totales,
    })

    // ---------- Gráficos básicos (ya los tenías) ----------
    // Ventas por método
    const metodoMap = agruparSuma(
      filtradas,
      (v) => v.metodo_pago || "Sin datos"
    )
    setVentasPorMetodo({
      labels: Object.keys(metodoMap),
      datasets: [
        {
          label: "Total vendido",
          data: Object.values(metodoMap),
        },
      ],
    })

    // Monto por mes
    const mesMap = {}
    filtradas.forEach((c) => {
      if (!c.fecha) return
      const d = new Date(c.fecha)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`
      mesMap[key] = (mesMap[key] || 0) + (c.total || 0)
    })
    const mesesOrdenados = Object.keys(mesMap).sort()
    const mesesValores = mesesOrdenados.map((m) => mesMap[m])
    setMontoPorMes({
      labels: mesesOrdenados,
      datasets: [
        {
          label: "Ingresos por mes",
          data: mesesValores,
        },
      ],
    })

    // top juegos
    const juegoMap = agruparSuma(
      filtradas,
      (v) => v.juego_nombre || "Sin juego"
    )
    let juegosOrdenados = Object.entries(juegoMap).sort(
      (a, b) => b[1] - a[1]
    )
    juegosOrdenados = juegosOrdenados.slice(0, 5)
    setTopJuegos({
      labels: juegosOrdenados.map(([nombre]) => nombre),
      datasets: [
        {
          label: "Total vendido",
          data: juegosOrdenados.map(([, total]) => total),
        },
      ],
    })

    // ---------- Gráficos de promedios ----------
    setGraficoPorDia({
      labels: Object.keys(porDiaPromedio),
      datasets: [
        {
          label: "Promedio de ventas por día",
          data: Object.values(porDiaPromedio),
        },
      ],
    });

    setGraficoPorProducto({
      labels: Object.keys(porProductoPromedio),
      datasets: [
        {
          label: "Promedio de ventas por producto",
          data: Object.values(porProductoPromedio),
        },
      ],
    });

    setGraficoPorCliente({
      labels: Object.keys(porClientePromedio),
      datasets: [
        {
          label: "Promedio de ventas por cliente",
          data: Object.values(porClientePromedio),
        },
      ],
    });

    // ---------- Scatter precio vs cantidad ----------
    setGraficoScatterPrecio({
      datasets: [
        {
          label: "Precio vs cantidad",
          data: filtradas.map((v) => ({
            x:
              v.precio != null
                ? Number(v.precio) || 0
                : (Number(v.total) || 0) /
                  (Number(v.cantidad) || 1),
            y: Number(v.cantidad) || 0,
          })),
        },
      ],
    })
  }, [baseData]);

  const commonOptions = {
    plugins: {
      legend: {
        labels: {
          color: "#e5e7eb",
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#9ca3af" },
        grid: { color: "rgba(55, 65, 81, 0.4)" },
      },
      y: {
        ticks: { color: "#9ca3af" },
        grid: { color: "rgba(55, 65, 81, 0.4)" },
      },
    },
  };

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Estadísticas</h1>
          <p>
            Análisis de ventas, métodos de pago, variabilidad y relaciones entre
            variables.
          </p>
        </div>
        <div className="page-header-right">
          {sinDatos && (
            <span className="app-navbar-badge">
              No hay ventas cargadas en la base de datos
            </span>
          )}
        </div>
      </div>

      {/* Graficos */}
      <div className="section-grid section-grid--2">
        <Card>
          <div className="chart-wrapper">
            <div className="chart-title">Ventas por método de pago</div>
            <div className="chart-subtitle">
              Distribución del total vendido por cada forma de pago.
            </div>
            {ventasPorMetodo ? (
              <Chart type="doughnut" data={ventasPorMetodo} />
            ) : (
              <div className="chart-subtitle">
                No hay datos de ventas para mostrar
              </div>
            )}
          </div>
        </Card>

        <Card>
          <div className="chart-wrapper">
            <div className="chart-title">Ingresos mensuales</div>
            <div className="chart-subtitle">
              Evolución de los ingresos totales mes a mes.
            </div>
            {montoPorMes ? (
              <Chart type="bar" data={montoPorMes} options={commonOptions} />
            ) : (
              <div className="chart-subtitle">
                No hay datos de ingresos mensuales
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="section-grid" style={{ marginTop: "1rem" }}>
        <Card>
          <div className="chart-wrapper">
            <div className="chart-title">Top 5 juegos más vendidos</div>
            <div className="chart-subtitle">
              Juegos con mayor facturación total.
            </div>
            {topJuegos ? (
              <Chart type="bar" data={topJuegos} options={commonOptions} />
            ) : (
              <div className="chart-subtitle">
                No hay datos de juegos vendidos
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* RESUMEN ESTADÍSTICO */}
      {statsResumen ? (
        <div className="section-grid" style={{ marginTop: "1.5rem" }}>
            <Card>
              <h3 style={{ marginBottom: "0.75rem" }}>Análisis estadístico</h3>
              <p>
                <strong>Promedio total de ventas:</strong>{" "}
                ${statsResumen.promedioTotal.toFixed(2)}
              </p>
              <p>
                <strong>Desvío estándar del total:</strong>{" "}
                ${statsResumen.desvioTotal.toFixed(2)}
              </p>
              <p>
                <strong>Desvío estándar por día:</strong>{" "}
                ${statsResumen.desvioDiario.toFixed(2)}
              </p>
              <p>
                <strong>Desvío estándar por semana:</strong>{" "}
                ${statsResumen.desvioSemanal.toFixed(2)}
              </p>
              <p>
                <strong>Correlación precio ↔ cantidad vendida:</strong>{" "}
                {statsResumen.corrPrecioCantidad.toFixed(3)}
              </p>
              <p>
                <strong>Correlación cantidad ↔ día de la semana:</strong>{" "}
                {statsResumen.corrCantidadDia.toFixed(3)}
              </p>
              <p>
                <strong>Correlación monto total ↔ método de pago:</strong>{" "}
                {statsResumen.corrTotalMetodo.toFixed(3)}
              </p>
            </Card>
          </div>
        ) : (
          sinDatos && (
            <div className="section-grid" style={{ marginTop: "1.5rem" }}>
              <Card>
                <h3 style={{ marginBottom: "0.75rem" }}>Análisis estadístico</h3>
                <p>No hay datos de ventas en la base de datos para calcular estadísticas</p>
              </Card>
            </div>
          )
        )}

      {/* GRÁFICOS AVANZADOS */}
      <div
        className="section-grid section-grid--2"
        style={{ marginTop: "1rem" }}
      >
        <Card>
            <div className="chart-wrapper">
              <div className="chart-title">Ventas por día</div>
            {graficoPorDia ? (
                <Chart type="line" data={graficoPorDia} options={commonOptions} />
              ) : (
                <div className="chart-subtitle">
                  No hay datos diarios de ventas
                </div>
              )}
          </div>
        </Card>

        <Card>
            <div className="chart-wrapper">
              <div className="chart-title">Ventas por producto</div>
            {graficoPorProducto ? (
                <Chart
                  type="bar"
                  data={graficoPorProducto}
                  options={commonOptions}
                />
              ) : (
                <div className="chart-subtitle">
                  No hay ventas por producto registradas
                </div>
              )}
          </div>
        </Card>

        <Card>
            <div className="chart-wrapper">
              <div className="chart-title">Ventas por cliente</div>
            {graficoPorCliente ? (
                <Chart
                  type="bar"
                  data={graficoPorCliente}
                  options={commonOptions}
                />
              ) : (
                <div className="chart-subtitle">
                  No hay ventas asociadas a clientes
                </div>
              )}
          </div>
        </Card>

        <Card>
            <div className="chart-wrapper">
              <div className="chart-title">
                Relación precio vs cantidad vendida
              </div>
            {graficoScatterPrecio ? (
                <Chart type="scatter" data={graficoScatterPrecio} />
              ) : (
                <div className="chart-subtitle">
                  No hay datos suficientes para la correlación precio vs cantidad
                </div>
              )}
          </div>
        </Card>
      </div>
    </>
  );
}
