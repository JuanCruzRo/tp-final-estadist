INFORME TÉCNICO DEL PROYECTO

Estructura de la base de datos
El proyecto utiliza Supabase como backend. Las principales tablas inferidas son:
productos: id, nombre, precio, stock.
clientes: id, nombre, email.
ventas: id, cliente_id, fecha.
items_venta: id, venta_id, producto_id, cantidad.
Las consultas se realizan mediante los métodos select(), insert(), update() y delete() del SDK de Supabase.

Variables analizadas
Precio: valor monetario del producto.
Cantidad: unidades vendidas.
Total por venta: precio × cantidad.
Frecuencia de venta por producto.
Distribución temporal de ventas.

Resultados estadísticos
Productos más vendidos.
Totales acumulados del período.
Promedio de facturación diaria.
Porcentaje de participación por producto.

Gráficos e interpretación
Se sugieren los siguientes gráficos para el análisis:
Barras: comparación de ventas por producto.
Líneas: evolución de ventas por fecha.
Torta: participación porcentual por producto.
Interpretación general: permiten identificar tendencias de consumo, productos clave y variaciones temporales.

Tareas realizadas por cada integrante

Fausto Zaccanti: diseño del frontend React, implementación de páginas de Productos y Ventas, conexión con Supabase. Dedicación estimada: 6 horas.

Stefano Mastrangelo: implementación de estadísticas y gráficos, optimización de consultas SQL. Dedicación estimada: 2 horas.

Juan Cruz Rodriguez: documentación, testing y mejoras visuales. Dedicación estimada: 4 horas.
