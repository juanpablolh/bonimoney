# Split - Aplicación de División de Gastos

Aplicación web moderna para dividir gastos entre un grupo de personas, similar a Splitwise pero simplificada. Construida con React, TypeScript y Carbon Design System.

## 🚀 Características

- **Gestión de Miembros**: Agregar, listar y eliminar miembros del grupo
- **Registro de Gastos**: Registrar gastos con descripción, monto, quien pagó y división equitativa o personalizada
- **Cálculo de Balances**: Cálculo automático de balances individuales (cuánto pagó vs. cuánto debe cada persona)
- **Optimización de Transacciones**: Algoritmo que minimiza el número de pagos necesarios para saldar todas las cuentas
- **Dashboard**: Vista general con resumen de gastos, balances y transacciones pendientes
- **Persistencia Local**: Todos los datos se guardan automáticamente en el navegador (localStorage)
- **Exportar Resumen**: Exportar un resumen completo en formato de texto
- **Diseño Responsive**: Funciona perfectamente en móvil y desktop
- **Interfaz Moderna**: Diseño limpio y minimalista basado en Material Design 3

## 🛠️ Stack Tecnológico

- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Carbon Design System** - Sistema de diseño IBM
- **Sass** - Preprocesador CSS
- **Vite** - Build tool y dev server
- **localStorage** - Persistencia de datos

## 📦 Instalación

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```

3. **Abrir en el navegador:**
   La aplicación estará disponible en `http://localhost:5173` (o el puerto que Vite asigne)

## 🏗️ Build para Producción

```bash
npm run build
```

Los archivos optimizados se generarán en la carpeta `dist/`.

## 📁 Estructura del Proyecto

```
split/
├── src/
│   ├── components/          # Componentes React
│   │   ├── Dashboard.tsx   # Vista principal con resumen
│   │   ├── MembersSection.tsx  # Gestión de miembros
│   │   ├── ExpensesSection.tsx # Gestión de gastos
│   │   ├── BalancesSection.tsx # Balances y transacciones
│   │   └── CookieBanner.tsx    # Banner de cookies
│   ├── utils/              # Funciones utilitarias
│   │   ├── storage.ts      # Manejo de localStorage
│   │   ├── calculations.ts # Cálculos de balances y optimización
│   │   ├── export.ts       # Exportación de resúmenes
│   │   ├── avatarColors.ts # Colores para avatares
│   │   └── expenseIcons.tsx # Iconos de gastos
│   ├── types.ts            # Definiciones TypeScript
│   ├── App.tsx             # Componente principal
│   ├── main.tsx            # Punto de entrada
│   └── index.scss          # Estilos globales (Carbon)
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── vercel.json
├── README.md
├── QUICKSTART.md
└── DEPLOY.md
```

## 🎯 Uso

### Agregar Miembros

1. Ve a la pestaña "Miembros"
2. Ingresa el nombre del miembro
3. Haz clic en "Agregar"

### Registrar Gastos

1. Ve a la pestaña "Gastos"
2. Completa el formulario:
   - Descripción del gasto
   - Monto total
   - Quién pagó
   - División: todos los miembros o seleccionar específicos
3. Haz clic en "Agregar Gasto"

### Ver Balances

1. Ve a la pestaña "Balances"
2. Verás:
   - Balance individual de cada persona (verde = le deben, rojo = debe)
   - Transacciones optimizadas para saldar cuentas
3. Puedes hacer clic en "Saldar" para registrar un pago entre dos personas

### Dashboard

La pestaña "Dashboard" muestra:
- Resumen de estadísticas (miembros, gastos totales, transacciones pendientes)
- Balances rápidos
- Gastos recientes
- Transacciones pendientes

## 💡 Algoritmo de Optimización

La aplicación utiliza un algoritmo greedy para minimizar el número de transacciones necesarias:

1. Separa a las personas en dos grupos: quienes deben dinero (deudores) y quienes deben recibir dinero (acreedores)
2. Ordena ambos grupos por monto (mayor a menor)
3. Empareja el mayor deudor con el mayor acreedor
4. Crea una transacción por el monto menor entre ambos
5. Repite hasta que todas las deudas estén saldadas

Este algoritmo garantiza el número mínimo de transacciones necesarias.

## 🎨 Diseño

La aplicación utiliza Carbon Design System de IBM, con:
- Componentes accesibles y consistentes
- Sistema de diseño basado en principios de IBM
- Estilos inline para personalización específica
- Colores semánticos (verde para créditos, rojo para deudas)

## 📱 Responsive

La aplicación es completamente responsive y se adapta a:
- Móviles (320px+)
- Tablets (768px+)
- Desktop (1024px+)

## 🔒 Privacidad

Todos los datos se almacenan localmente en tu navegador. No se envía ninguna información a servidores externos.

## 🚧 Funcionalidades Futuras

Posibles mejoras:
- [ ] Editar gastos y miembros
- [ ] Múltiples grupos de gastos
- [ ] Historial de transacciones
- [ ] Gráficos y visualizaciones
- [ ] Exportar a PDF
- [ ] Modo oscuro
- [ ] Notificaciones
- [ ] Compartir grupos con otros usuarios

## 📝 Licencia

Este proyecto es de código abierto y está disponible para uso personal y comercial.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

**Split** - Simplificando la división de gastos entre amigos y grupos 🎉
