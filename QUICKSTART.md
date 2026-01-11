# Guía de Inicio Rápido

## Instalación y Ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Abrir en el navegador
# La aplicación estará en http://localhost:5173
```

## Uso Básico

### 1. Agregar Miembros
- Ve a la pestaña "Miembros"
- Ingresa el nombre y haz clic en "Agregar"

### 2. Registrar Gastos
- Ve a la pestaña "Gastos"
- Completa el formulario:
  - Descripción (ej: "Cena en restaurante")
  - Monto (ej: 120.50)
  - Quién pagó (selecciona un miembro)
  - División: todos o seleccionar miembros específicos
- Haz clic en "Agregar Gasto"

### 3. Ver Balances
- Ve a la pestaña "Balances"
- Verás quién debe y a quién
- Las transacciones están optimizadas para minimizar pagos
- Puedes hacer clic en "Saldar" para registrar un pago

### 4. Dashboard
- Vista general con resumen de todo
- Estadísticas rápidas
- Gastos recientes
- Transacciones pendientes

## Características

✅ **Persistencia Automática**: Todos los datos se guardan en tu navegador
✅ **Cálculo Automático**: Los balances se calculan automáticamente
✅ **Optimización**: Minimiza el número de transacciones necesarias
✅ **Exportar**: Descarga un resumen en texto
✅ **Resetear**: Limpia todos los datos cuando lo necesites

## Ejemplo de Uso

1. Agrega 3 miembros: "Juan", "María", "Pedro"
2. Registra un gasto:
   - Descripción: "Cena"
   - Monto: 90€
   - Pagado por: Juan
   - Dividir entre: Todos
3. Ve a "Balances":
   - Juan: +60€ (le deben)
   - María: -30€ (debe)
   - Pedro: -30€ (debe)
4. Transacciones optimizadas:
   - María debe pagar 30€ a Juan
   - Pedro debe pagar 30€ a Juan

¡Listo! La aplicación está lista para usar.
