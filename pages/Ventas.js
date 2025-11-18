import React, { useEffect, useState } from "react"
import { supabase } from "../supabaseClient"
import { Card } from "primereact/card"
import { Dropdown } from "primereact/dropdown"
import { InputNumber } from "primereact/inputnumber"
import { Button } from "primereact/button"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"

export default function Ventas() {
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [metodos, setMetodos] = useState([])
  const [ventas, setVentas] = useState([])
  const [detalles, setDetalles] = useState([])
  const [nuevaVenta, setNuevaVenta] = useState({
    id_cliente: "",
    id_producto: "",
    cantidad: 1,
    fecha: "",
    id_metodo_pago: ""
  })

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    const [
      { data: cli },
      { data: prod },
      { data: met },
      { data: vts },
      { data: det }
    ] = await Promise.all([
      supabase.from("clientes").select("*"),
      supabase.from("productos").select("*"),
      supabase.from("metodos_pago").select("*"),
      supabase.from("ventas").select("*"),
      supabase.from("detalle_venta").select("*")
    ])

    setClientes(cli || [])
    setProductos(prod || [])
    setMetodos(met || [])
    setVentas(vts || [])
    setDetalles(det || [])
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setNuevaVenta((prev) => ({
      ...prev,
      [name]: name === "cantidad" ? Number(value) : value
    }))
  }

  async function registrarVenta(e) {
    e.preventDefault()
    const { id_cliente, id_producto, cantidad, fecha, id_metodo_pago } =
      nuevaVenta

    if (!fecha || !id_cliente || !id_producto || !id_metodo_pago) {
      alert("Completá fecha, cliente, producto y método de pago")
      return
    }

    const prod = productos.find((p) => p.id_producto === Number(id_producto))
    if (!prod) return alert("Producto inválido.")

    if (prod.stock != null && cantidad > prod.stock) {
      alert("Stock insuficiente para este producto")
      return
    }

    const total = Number(prod.precio_unitario) * cantidad

    // Insertar venta
    const { data: venta, error: errVenta } = await supabase
      .from("ventas")
      .insert([
        {
          fecha,
          id_cliente: Number(id_cliente),
          id_metodo_pago: Number(id_metodo_pago),
          total_venta: total
        }
      ])
      .select()
      .single()

    if (errVenta) return alert("Error al registrar venta.")

    // Insertar detalle
    const { error: errDet } = await supabase.from("detalle_venta").insert([
      {
        id_venta: venta.id_venta,
        id_producto: Number(id_producto),
        cantidad,
        precio_unitario: Number(prod.precio_unitario)
      }
    ])

    if (errDet) return alert("Error al registrar detalle.")

    if (prod.stock != null) {
      const nuevoStock = prod.stock - cantidad
      const { error: errStock } = await supabase
        .from("productos")
        .update({ stock: nuevoStock })
        .eq("id_producto", Number(id_producto))

      if (!errStock) {
        setProductos((prev) =>
          prev.map((p) =>
            p.id_producto === prod.id_producto ? { ...p, stock: nuevoStock } : p
          )
        )
      }
    }

    alert("✅ Venta registrada correctamente.")
    setNuevaVenta({
      id_cliente: "",
      id_producto: "",
      cantidad: 1,
      fecha: "",
      id_metodo_pago: ""
    })
    loadAll()
  }

  async function borrarVenta(id) {
    if (!window.confirm("¿Borrar esta venta?")) return
    const { error } = await supabase.from("ventas").delete().eq("id_venta", id)
    if (error) alert("Error al borrar venta.")
    loadAll()
  }

  const ventasDetalladas = ventas.map((v) => {
    const cliente = clientes.find((c) => c.id_cliente === v.id_cliente)
    const metodo = metodos.find((m) => m.id_metodo_pago === v.id_metodo_pago)
    const det = detalles.filter((d) => d.id_venta === v.id_venta)
    const productosVenta = det
      .map((d) => {
        const p = productos.find((p) => p.id_producto === d.id_producto)
        return `${p?.nombre ?? "Desconocido"} x${d.cantidad}`
      })
      .join(", ")
    return {
      ...v,
      cliente: cliente
        ? `${cliente.nombre} ${cliente.apellido}`
        : "Cliente desconocido",
      metodo: metodo?.nombre ?? "—",
      productosVenta
    }
  })

  const clienteOptions = clientes.map((c) => ({
    label: `${c.nombre} ${c.apellido}`,
    value: c.id_cliente
  }))

  const productoOptions = productos.map((p) => ({
    label:
      p.stock != null
        ? `${p.nombre} (${p.stock} en stock)`
        : p.nombre,
    value: p.id_producto
  }))

  const metodoOptions = metodos.map((m) => ({
    label: m.nombre,
    value: m.id_metodo_pago
  }))

  const totalTemplate = (rowData) => `$${rowData.total_venta}`

  const accionesTemplate = (rowData) => (
    <div className="actions-cell">
      <Button
        icon="pi pi-trash"
        className="p-button-text p-button-sm p-button-danger"
        onClick={() => borrarVenta(rowData.id_venta)}
      />
    </div>
  )

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Ventas</h1>
          <p>Registrar compras y actualizar el stock</p>
        </div>
      </div>

      <div className="section-grid">
        <Card>
          <form onSubmit={registrarVenta}>
            <div className="form-strip">
              <div className="form-grid">
                <div className="form-field">
                  <input
                    type="date"
                    name="fecha"
                    className="plain-input"
                    value={nuevaVenta.fecha}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-field">
                  <Dropdown
                    value={nuevaVenta.id_cliente}
                    options={clienteOptions}
                    onChange={(e) =>
                      setNuevaVenta((prev) => ({
                        ...prev,
                        id_cliente: e.value
                      }))
                    }
                    placeholder="Seleccionar cliente"
                  />
                </div>

                <div className="form-field">
                  <Dropdown
                    value={nuevaVenta.id_producto}
                    options={productoOptions}
                    onChange={(e) =>
                      setNuevaVenta((prev) => ({
                        ...prev,
                        id_producto: e.value
                      }))
                    }
                    placeholder="Seleccionar producto"
                  />
                </div>

                <div className="form-field">
                  <InputNumber
                    value={nuevaVenta.cantidad}
                    onValueChange={(e) =>
                      setNuevaVenta((prev) => ({
                        ...prev,
                        cantidad: e.value || 1
                      }))
                    }
                    min={1}
                    placeholder="Cantidad"
                  />
                </div>

                <div className="form-field">
                  <Dropdown
                    value={nuevaVenta.id_metodo_pago}
                    options={metodoOptions}
                    onChange={(e) =>
                      setNuevaVenta((prev) => ({
                        ...prev,
                        id_metodo_pago: e.value
                      }))
                    }
                    placeholder="Método de pago"
                  />
                </div>

                <div className="form-actions">
                  <Button
                    type="submit"
                    label="Guardar venta"
                    icon="pi pi-check"
                    className="p-button-primary"
                  />
                </div>
              </div>
            </div>
          </form>
        </Card>
      </div>

      <div className="section-grid" style={{ marginTop: "1rem" }}>
        <Card>
          <DataTable
            value={ventasDetalladas}
            stripedRows
            showGridlines
            size="small"
            responsiveLayout="scroll"
          >
            <Column field="id_venta" header="ID" style={{ width: "60px" }} />
            <Column
              field="fecha"
              header="Fecha"
              body={(rowData) => rowData.fecha.substring(0, 10)}
            />
            <Column field="cliente" header="Cliente" />
            <Column field="productosVenta" header="Productos" />
            <Column field="metodo" header="Método" />
            <Column
              field="total_venta"
              header="Total"
              body={totalTemplate}
              style={{ width: "120px" }}
            />
            <Column
              header="Acciones"
              body={accionesTemplate}
              style={{ width: "120px" }}
            />
          </DataTable>
        </Card>
      </div>
    </>
  )
}
