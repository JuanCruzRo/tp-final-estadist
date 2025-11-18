import React, { useEffect, useState } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { supabase } from "../supabaseClient";

const FORMATOS = [
  { label: "Físico", value: "Físico" },
  { label: "Digital", value: "Digital" },
];

export default function Productos() {
  const [productos, setProductos] = useState([]);

  const [form, setForm] = useState({
    nombre: "",
    precio: null,
    stock: null,
    formato: "Físico",
  });

  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [dialogVisible, setDialogVisible] = useState(false);

  useEffect(() => {
    loadProductos()
  }, [])

  async function loadProductos() {
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .order("id_producto")
    if (!error) {
      setProductos(data || [])
    }
  }

  const limpiarForm = () =>
    setForm({ nombre: "", precio: null, stock: null, formato: "Físico" });

  const handleAgregar = async () => {
    if (!form.nombre || form.precio == null || form.stock == null) {
      alert("Completá nombre, precio y stock del juego")
      return
    }

    const nuevoRegistro = {
      nombre: form.nombre,
      precio_unitario: Number(form.precio),
      stock: Number(form.stock),
      formato: form.formato
    }

    const { data, error } = await supabase
      .from("productos")
      .insert([nuevoRegistro])
      .select()
      .single()

    if (error) {
      alert("Error al guardar juego")
      return
    }

    setProductos((prev) => [...prev, data])
    limpiarForm()
  };

  const handleEliminar = async (rowData) => {
    const { error } = await supabase
      .from("productos")
      .delete()
      .eq("id_producto", rowData.id_producto)

    if (error) {
      alert("Error al eliminar juego")
      return
    }

    setProductos((prev) =>
      prev.filter((p) => p.id_producto !== rowData.id_producto)
    );
  };

  const abrirEdicion = (rowData) => {
    setEditando(rowData);
    setEditForm({
      id_producto: rowData.id_producto,
      nombre: rowData.nombre,
      precio: rowData.precio_unitario,
      stock: rowData.stock,
      formato: rowData.formato
    });
    setDialogVisible(true);
  };

  const confirmarEdicion = async () => {
    if (
      !editForm.nombre ||
      editForm.precio == null ||
      editForm.stock == null
    ) {
      alert("Completá nombre, precio y stock antes de guardar")
      return
    }

    const { data, error } = await supabase
      .from("productos")
      .update({
        nombre: editForm.nombre,
        precio_unitario: Number(editForm.precio),
        stock: Number(editForm.stock),
        formato: editForm.formato
      })
      .eq("id_producto", editForm.id_producto)
      .select()
      .single()

    if (error) {
      alert("Error al guardar cambios")
      return
    }

    setProductos((prev) =>
      prev.map((p) =>
        p.id_producto === data.id_producto ? data : p
      )
    );
    setDialogVisible(false);
    setEditando(null);
    setEditForm(null);
  };

  const precioTemplate = (rowData) => `$${rowData.precio_unitario}`;
  const accionesTemplate = (rowData) => (
    <div className="actions-cell">
      <Button
        icon="pi pi-pencil"
        className="p-button-text p-button-sm"
        onClick={() => abrirEdicion(rowData)}
        tooltip="Editar"
      />
      <Button
        icon="pi pi-trash"
        className="p-button-text p-button-sm p-button-danger"
        onClick={() => handleEliminar(rowData)}
        tooltip="Eliminar"
      />
    </div>
  );

  const dialogFooter = (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
      <Button
        label="Cancelar"
        className="p-button-secondary p-button-sm"
        onClick={() => {
          setDialogVisible(false);
          setEditando(null);
          setEditForm(null);
        }}
      />
      <Button
        label="Guardar cambios"
        className="p-button-primary p-button-sm"
        onClick={confirmarEdicion}
      />
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div className="page-header-left">
          <h1>Juegos / Productos</h1>
          <p>Administrá el catálogo, stock y formato de cada juego.</p>
        </div>
      </div>

      {/* FORMULARIO */}
      <Card className="mb-3">
        <div className="form-strip">
          <div className="form-grid">
            <div className="form-field">
              <InputText
                value={form.nombre}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nombre: e.target.value }))
                }
                placeholder="Nombre"
              />
            </div>

            <div className="form-field">
              <InputNumber
                value={form.precio}
                onValueChange={(e) =>
                  setForm((f) => ({ ...f, precio: e.value ?? null }))
                }
                min={0}
                mode="decimal"
                minFractionDigits={0}
                maxFractionDigits={2}
                placeholder="Precio"
                inputId="precio-input"
              />
            </div>

            <div className="form-field">
              <InputNumber
                value={form.stock}
                onValueChange={(e) =>
                  setForm((f) => ({ ...f, stock: e.value ?? null }))
                }
                min={0}
                placeholder="Stock"
                inputId="stock-input"
              />
            </div>

            <div className="form-field">
              <Dropdown
                value={form.formato}
                options={FORMATOS}
                onChange={(e) =>
                  setForm((f) => ({ ...f, formato: e.value }))
                }
                placeholder="Formato"
              />
            </div>

            <div className="form-actions">
              <Button
                label="Guardar juego"
                icon="pi pi-check"
                className="p-button-primary"
                onClick={handleAgregar}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* TABLA */}
      <div className="section-grid" style={{ marginTop: "1rem" }}>
        <Card>
          <DataTable
            value={productos}
            stripedRows
            showGridlines
            size="small"
            responsiveLayout="scroll"
            className="productos-table"
          >
            <Column field="id_producto" header="ID" style={{ width: "60px" }}></Column>
            <Column field="nombre" header="Nombre"></Column>
            <Column field="precio_unitario" header="Precio" body={precioTemplate}></Column>
            <Column field="stock" header="Stock"></Column>
            <Column field="formato" header="Formato"></Column>
            <Column
              header="Acciones"
              body={accionesTemplate}
              style={{ width: "140px" }}
            ></Column>
          </DataTable>
        </Card>
      </div>

      {/* DIALOGO EDICIÓN */}
      <Dialog
        header={`Editar producto${editando ? `: ${editando.nombre}` : ""}`}
        visible={dialogVisible}
        style={{ width: "420px" }}
        modal
        onHide={() => {
          setDialogVisible(false);
          setEditando(null);
          setEditForm(null);
        }}
        footer={dialogFooter}
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

            <InputNumber
              value={editForm.precio}
              onValueChange={(e) =>
                setEditForm((f) => ({ ...f, precio: e.value ?? null }))
              }
              min={0}
              mode="decimal"
              minFractionDigits={0}
              maxFractionDigits={2}
              placeholder="Precio"
            />

            <InputNumber
              value={editForm.stock}
              onValueChange={(e) =>
                setEditForm((f) => ({ ...f, stock: e.value ?? null }))
              }
              min={0}
              placeholder="Stock"
            />

            <Dropdown
              value={editForm.formato}
              options={FORMATOS}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, formato: e.value }))
              }
              placeholder="Formato"
            />
          </div>
        )}
      </Dialog>
    </>
  );
}
