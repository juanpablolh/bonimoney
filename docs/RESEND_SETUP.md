# Guía de Configuración: Resend para BoniMoney

## Paso 1: Crear Cuenta en Resend

1. Ve a https://resend.com/signup
2. Regístrate con tu email
3. Verifica tu email

## Paso 2: Obtener API Key

1. Una vez logueado, ve a **API Keys** en el menú lateral
2. Click en **Create API Key**
3. Nombre: `BoniMoney Production` (o `BoniMoney Dev`)
4. Permisos: **Sending access** (default)
5. Click **Add**
6. **COPIA LA API KEY** (solo se muestra una vez)
   - Formato: `re_xxxxxxxxxxxxxxxxxxxxxxxxxx`

## Paso 3: Configurar Dominio (Opcional pero Recomendado)

### Opción A: Usar dominio de Resend (Más Rápido)
- Emails se enviarán desde: `onboarding@resend.dev`
- **Ventaja**: Funciona inmediatamente, sin configuración DNS
- **Desventaja**: Menos profesional

### Opción B: Usar tu propio dominio (Profesional)
1. Ve a **Domains** en Resend
2. Click **Add Domain**
3. Ingresa tu dominio: `bonimoney.app` (o el que tengas)
4. Resend te dará registros DNS para agregar:
   ```
   Type: TXT
   Name: resend._domainkey
   Value: [valor que te da Resend]
   
   Type: MX
   Name: @
   Value: feedback-smtp.us-east-1.amazonses.com
   Priority: 10
   ```
5. Agrega estos registros en tu proveedor de DNS (Vercel, Cloudflare, etc.)
6. Espera verificación (puede tomar hasta 48h, pero usualmente 5-10 min)
7. Una vez verificado, emails se enviarán desde: `invites@bonimoney.app`

## Paso 4: Agregar Variables de Entorno

Abre tu archivo `.env` y agrega:

```bash
# Resend Configuration
VITE_RESEND_API_KEY=re_tu_api_key_aqui
VITE_RESEND_FROM_EMAIL=onboarding@resend.dev
# O si configuraste dominio:
# VITE_RESEND_FROM_EMAIL=invites@bonimoney.app
```

## Paso 5: Verificar Configuración

Voy a crear un script de prueba para verificar que Resend funciona:

```typescript
// test-resend.ts
import { Resend } from 'resend';

const resend = new Resend(import.meta.env.VITE_RESEND_API_KEY);

async function testResend() {
  try {
    const { data, error } = await resend.emails.send({
      from: import.meta.env.VITE_RESEND_FROM_EMAIL,
      to: 'tu-email@ejemplo.com', // Cambia esto a tu email
      subject: '🎉 Resend configurado correctamente!',
      html: '<h1>¡Funciona!</h1><p>Resend está configurado correctamente en BoniMoney.</p>'
    });

    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ Email enviado:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testResend();
```

## Límites del Plan Gratuito

- **3,000 emails/mes** gratis
- Suficiente para:
  - ~100 usuarios nuevos/mes (30 emails c/u)
  - ~300 invitaciones/mes
  - Emails de autenticación ilimitados (magic links)

## Próximos Pasos

Una vez tengas la API key:
1. Agrégala al archivo `.env`
2. Reinicia el servidor de desarrollo (`npm run dev`)
3. Yo crearé los templates de email
4. Probaremos el envío de magic links

---

## Troubleshooting

### Error: "API key is invalid"
- Verifica que copiaste la key completa
- Debe empezar con `re_`
- No debe tener espacios

### Error: "Domain not verified"
- Si usas tu dominio, espera la verificación DNS
- Mientras tanto, usa `onboarding@resend.dev`

### Emails no llegan
- Revisa spam/junk
- Verifica el email "from" en Resend dashboard
- Usa el dominio verificado de Resend primero

---

**¿Ya tienes la API key?** Pégala en el `.env` y te ayudo con el siguiente paso.
