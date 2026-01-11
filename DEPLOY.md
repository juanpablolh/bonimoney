# Guía de Publicación - Boniwise

## ✅ Build Completado

El proyecto ha sido compilado exitosamente. Los archivos de producción están en la carpeta `dist/`.

## 🚀 Opciones de Publicación

### Opción 1: Vercel (Recomendado - Más Fácil)

1. **Instalar Vercel CLI** (si no lo tienes):
   ```bash
   npm i -g vercel
   ```

2. **Publicar**:
   ```bash
   cd /Users/juanpablo/split
   vercel
   ```
   
   - Te pedirá iniciar sesión (puedes usar GitHub)
   - Sigue las instrucciones en pantalla
   - ¡Listo! Tu app estará online en segundos

3. **Configuración automática**:
   - Vercel detectará automáticamente que es un proyecto Vite
   - El build command es: `npm run build`
   - El output directory es: `dist`

### Opción 2: Netlify

1. **Instalar Netlify CLI**:
   ```bash
   npm i -g netlify-cli
   ```

2. **Publicar**:
   ```bash
   cd /Users/juanpablo/split
   netlify deploy --prod --dir=dist
   ```
   
   - Te pedirá iniciar sesión
   - Sigue las instrucciones

3. **O usar la interfaz web**:
   - Ve a [netlify.com](https://netlify.com)
   - Arrastra la carpeta `dist` a la página
   - ¡Listo!

### Opción 3: GitHub Pages

1. **Crear un repositorio en GitHub** (si no lo tienes):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <tu-repo-url>
   git push -u origin main
   ```

2. **Instalar gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

3. **Agregar script al package.json**:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d dist"
   }
   ```

4. **Publicar**:
   ```bash
   npm run deploy
   ```

5. **Habilitar GitHub Pages**:
   - Ve a Settings > Pages en tu repositorio
   - Selecciona la rama `gh-pages` como source

### Opción 4: Cloudflare Pages

1. **Instalar Wrangler CLI**:
   ```bash
   npm i -g wrangler
   ```

2. **Publicar**:
   ```bash
   cd /Users/juanpablo/split
   wrangler pages deploy dist
   ```

## 📋 Checklist Pre-Publicación

- ✅ Build completado sin errores
- ✅ Cambios de texto aplicados ("Miembros" → "Mi Grupo")
- ✅ Sistema de cookies implementado
- ✅ Banner de cookies configurado
- ✅ Estilos Material Design 3 aplicados

## 🔧 Configuración Post-Publicación

Una vez publicado, verifica:

1. **El banner de cookies aparece** (solo cuando está online, no en localhost)
2. **Los datos se guardan en cookies** cuando el usuario acepta
3. **La aplicación funciona correctamente** en el dominio publicado

## 📝 Notas Importantes

- El sistema detecta automáticamente si está online vs localhost
- En localhost: usa localStorage
- Online: usa cookies (si el usuario acepta)
- Si el usuario rechaza cookies, los datos solo se guardan en localStorage (temporal)

## 🆘 Solución de Problemas

Si encuentras problemas:

1. **Verifica que el build esté completo**: `npm run build`
2. **Revisa la consola del navegador** para errores
3. **Asegúrate de que el dominio no sea localhost** (el banner de cookies solo aparece online)
