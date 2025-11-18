import React, { useEffect, useState } from "react"
import { supabase } from "../supabaseClient"
import { Card } from "primereact/card"
import { InputText } from "primereact/inputtext"
import { InputNumber } from "primereact/inputnumber"
import { Button } from "primereact/button"
import { DataTable } from "primereact/datatable"
import { Column } from "primereact/column"
import { Dialog } from "primereact/dialog"

export default function Clientes() {
  const [clientes, setClientes] = useState([])
  const [nuevo, setNuevo] = useState({
    nombre: "",
    apellido: "",
    correo_electronico: "",
    edad: ""
  })
  const [editando, setEditando] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [dialogVisible, setDialogVisible] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const { data } = await supabase.from("clientes").select("*").order("id_cliente")
    setClientes(data || [])
  }

  async function agregar(e) {
    e.preventDefault()
    if (
      !nuevo.nombre ||
      !nuevo.apellido ||
      !nuevo.correo_electronico ||
      !nuevo.edad
    ) {
      alert("Completá nombre, apellido, correo y edad")
      return
    }
    const { data, error } = await supabase.from("clientes").insert([nuevo]).select()
    if (error) return alert("Error al agregar")
    setClientes([...clientes, data[0]])
    setNuevo({ nombre: "", apellido: "", correo_electronico: "", edad: "" })
  }

  async function guardar(e) {
    e.preventDefault()
    if (
      !editForm.nombre ||
      !editForm.apellido ||
      !editForm.correo_electronico ||
      !editForm.edad
    ) {
      alert("Completá nombre, apellido, correo y edad")
      return
    }
    const { error } = await supabase
      .from("clientes")
      .update(editForm)
      .eq("id_cliente", editForm.id_cliente)
    if (error) return alert("Error al guardar")
    setEditando(null)
    setEditForm(null)
    setDialogVisible(false)
    load()
  }

  async function borrar(id) {
    if (!window.confirm("¿Borrar cliente?")) return
    await supabase.from("clientes").delete().eq("id_cliente", id)
    load()
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Clientes</h1>
          <p>ABM de clientes de la tienda</p>
        </div>
      </div>

      <div className="section-grid">
        <Card>
          <form onSubmit={agregar}>
            <div className="form-strip">
              <div className="form-grid">
                <div className="form-field">
                  <InputText
                    value={nuevo.nombre}
                    onChange={(e) =>
                      setNuevo({ ...nuevo, nombre: e.target.value })
                    }
                    placeholder="Nombre"
                  />
                </div>

                <div className="form-field">
                  <InputText
                    value={nuevo.apellido}
                    onChange={(e) =>
                      setNuevo({ ...nuevo, apellido: e.target.value })
                    }
                    placeholder="Apellido"
                  />
                </div>

                <div className="form-field">
                  <InputText
                    value={nuevo.correo_electronico}
                    onChange={(e) =>
                      setNuevo({
                        ...nuevo,
                        correo_electronico: e.target.value
                      })
                    }
                    placeholder="Correo electrónico"
                  />
                </div>

              <div className="form-field">
                <InputNumber
                  value={
                    nuevo.edad === "" || nuevo.edad == null
                      ? null
                      : Number(nuevo.edad)
                  }
                  onValueChange={(e) =>
                    setNuevo({
                      ...nuevo,
                      edad: e.value != null ? String(e.value) : ""
                    })
                  }
                  placeholder="Edad"
                  min={0}
                />
                </div>

                <div className="form-actions">
                  <Button
                    type="submit"
                    label="Guardar cliente"
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
            value={clientes}
            stripedRows
            showGridlines
            size="small"
            responsiveLayout="scroll"
          >
            <Column field="id_cliente" header="ID" style={{ width: "60px" }} />
            <Column field="nombre" header="Nombre" />
            <Column field="apellido" header="Apellido" />
            <Column field="correo_electronico" header="Correo" />
            <Column field="edad" header="Edad" style={{ width: "80px" }} />
            <Column
              header="Acciones"
              style={{ width: "140px" }}
              body={(rowData) => (
                <div className="actions-cell">
                  <Button
                    icon="pi pi-pencil"
                    className="p-button-text p-button-sm"
                    onClick={() => {
                      setEditando(rowData)
                      setEditForm({ ...rowData })
                      setDialogVisible(true)
                    }}
                  />
                  <Button
                    icon="pi pi-trash"
                    className="p-button-text p-button-sm p-button-danger"
                    onClick={() => borrar(rowData.id_cliente)}
                  />
                </div>
              )}
            />
          </DataTable>
        </Card>
      </div>

      <Dialog
        header={`Editar cliente${editando ? `: ${editando.nombre}` : ""}`}
        visible={dialogVisible}
        style={{ width: "420px" }}
        modal
        onHide={() => {
          setDialogVisible(false)
          setEditando(null)
          setEditForm(null)
        }}
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <Button
              label="Cancelar"
              className="p-button-secondary p-button-sm"
              onClick={() => {
                setDialogVisible(false)
                setEditando(null)
                setEditForm(null)
              }}
            />
            <Button
              label="Guardar cambios"
              className="p-button-primary p-button-sm"
              onClick={guardar}
            />
          </div>
        }
      >
        {editForm && (
          <div className="dialog-grid">
            <InputText
              value={editForm.nombre}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, nombre: e.target.value }))
              }
              placeholder="Nombre"
            />

            <InputText
              value={editForm.apellido}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, apellido: e.target.value }))
              }
              placeholder="Apellido"
            />

            <InputText
              value={editForm.correo_electronico}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  correo_electronico: e.target.value
                }))
              }
              placeholder="Correo electrónico"
            />

            <InputNumber
              value={
                editForm.edad === "" || editForm.edad == null
                  ? null
                  : Number(editForm.edad)
              }
              onValueChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  edad: e.value != null ? String(e.value) : ""
                }))
              }
              placeholder="Edad"
              min={0}
            />
          </div>
        )}
      </Dialog>
    </>
  )
}
