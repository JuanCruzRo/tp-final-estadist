Informe Técnico del Proyecto

Estructura de la Base de Datos

El proyecto utiliza Supabase como backend.
Las principales tablas inferidas son:

productos: id, nombre, precio, stock
clientes: id, nombre, email
ventas: id, cliente_id, fecha
items_venta: id, venta_id, producto_id, cantidad

Las consultas se realizan mediante los métodos select(), insert(), update() y delete() del SDK de Supabase.

Variables Analizadas

Precio: valor monetario del producto
Cantidad: unidades vendidas
Total por venta: precio × cantidad
Frecuencia de venta por producto
Distribución temporal de ventas

Resultados Estadísticos

El módulo Estadisticas.js permite analizar:
Productos más vendidos
Totales acumulados del período
Promedio de facturación diaria
Porcentaje de participación por producto

Gráficos e Interpretación

Gráficos sugeridos para el análisis:
Barras: comparación de ventas por producto
Líneas: evolución de ventas según fecha
Torta: participación porcentual por producto

Interpretación general: los gráficos permiten identificar tendencias de consumo, productos clave y variaciones temporales en los niveles de venta.

Tareas Realizadas por Cada Integrante

Fausto Zaccanti: diseño del frontend en React, implementación de páginas de Productos y Ventas, conexión con Supabase. Dedicación estimada: 6 horas.

Stefano Mastrangelo: implementación de estadísticas y gráficos, optimización de consultas SQL. Dedicación estimada: 4 horas.

Juan Cruz Rodriguez: documentación, testing y mejoras visuales. Dedicación estimada: 3 horas.
