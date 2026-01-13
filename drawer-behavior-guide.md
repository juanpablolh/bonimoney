# Plan de Comportamiento: Drawers Responsivos "Lemoni Style"

Este documento contiene la lógica de comportamiento (behavior) de los drawers de la aplicación. Está diseñado para ser compartido con otros LLMs para asegurar que la experiencia en móvil (iOS/Android) sea idéntica.

## 1. El Core del Comportamiento: El "Switch" Responsivo

El comportamiento principal no es solo un CSS, sino un componente que decide qué primitiva de Radix UI usar según el tamaño de pantalla. Esto evita que en móvil se sienta como un modal de escritorio y viceversa.

### Lógica Condicional:
*   **Desktop (>= 768px)**: Renderiza un `Dialog` (Modal centrado). Provee estabilidad visual.
*   **Mobile (< 768px)**: Renderiza un `Sheet` (Panel deslizante).
    *   **Main Drawer**: Desliza desde `bottom` (inferior).
    *   **Sub-Drawer (Nested)**: Si se abre desde otro drawer, desliza desde `right` (derecha) para indicar jerarquía.

---

## 2. Implementación de Referencia

A continuación, el código limpio que implementa este comportamiento:

```tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';

export function ResponsiveDrawer({ isOpen, onClose, children, isNested = false }) {
  const [isDesktop, setIsDesktop] = useState(false);

  // 1. Detección de Viewport (Comportamiento Adaptativo)
  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // 2. Gestión de Foco (CRÍTICO para Mobile)
  // Evitamos el auto-focus para que el teclado no salte solo al abrir el drawer
  const onOpenAutoFocus = (e) => e.preventDefault();

  const content = (
    <div className="flex flex-col h-full overflow-hidden bg-[#F3F5F0]">
      {/* El contenido debe tener su propio scroll independiente */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {children}
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
           className="max-w-[500px] p-0 overflow-hidden" 
           onOpenAutoFocus={onOpenAutoFocus}
        >
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        // 3. Comportamiento de Dirección Dinámica
        side={isNested ? "right" : "bottom"}
        className={`p-0 border-0 ${
          isNested 
            ? "h-[90vh] w-full rounded-tl-2xl" // Sub-drawer desde la derecha
            : "h-[90vh] max-h-[96%] rounded-t-2xl" // Drawer principal desde abajo
        }`}
      >
        {content}
      </SheetContent>
    </Sheet>
  );
}
```

---

## 3. Claves del "Feeling" Nativo (Checklist de Comportamiento)

Cuando le pidas al otro LLM que implemente esto, asegúrate de que cumpla estos puntos:

1.  **Escape de Teclado**: El drawer debe cerrarse al presionar `Escape`.
2.  **Prevención de Scroll en Fondo**: Al estar abierto, el contenido de la página principal (detrás) no debe ser scrolleable. (Radix lo maneja por defecto, pero debe verificarse).
3.  **Altura Dinámica en Mobile**: El drawer debe ocupar aproximadamente el `90%` de la pantalla (`90vh`). Esto permite que el usuario vea "donde estaba" y pueda deslizarlo hacia abajo para cerrar.
4.  **No-Scrollbar UI**: Usar clases como `no-scrollbar` para que la barra de scroll nativa no ensucie el diseño minimalista, pero permitiendo el scroll táctil fluido.
5.  **Interrupción de Cierre por Datos**: Si hay un formulario, el evento `onClose` debe ser interceptado por una función que verifique si hay cambios pendientes antes de permitir el cierre (`confirmDiscardChanges`).
6.  **Z-Index Hierarchy**: Los modales de alerta (ej. "¿Deseas eliminar?") deben tener un `z-index` superior al del drawer para que aparezcan por encima correctamente.
