# 🔔 Sistema de Notificaciones

## Características Implementadas

El sistema de notificaciones incluye:

### ✅ Notificaciones In-App
- Campana de notificaciones en el Header (actualización automática cada 30 segundos)
- Contador de notificaciones no leídas
- Panel desplegable con últimas notificaciones
- Página dedicada `/notificaciones` con historial completo
- Marcar como leídas individual o masivamente
- Eliminar notificaciones
- Links directos a contenido relacionado

### ✅ Tipos de Notificaciones

1. **🎲 Sorteo** - Cuando se completa un sorteo
2. **⏰ Recordatorio** - Recordatorios de eventos próximos
3. **📨 Invitación** - Cuando te inscribes a un evento
4. **ℹ️ Sistema** - Notificaciones del sistema

### ✅ Sistema de Emails (Opcional)

Envío automático de emails cuando:
- Se realiza un sorteo → Todos los participantes
- Se acerca un evento → Recordatorios automáticos
- (Opcional) Usuario se inscribe a evento

## 📋 Base de Datos

La tabla `Notification` almacena:
```prisma
model Notification {
  id        Int      @id @default(autoincrement())
  userId    Int
  type      String   // "sorteo", "recordatorio", "invitacion", "sistema"
  title     String
  message   String
  link      String?  // URL a la que redirige
  isRead    Boolean  @default(false)
  eventId   Int?     // Evento relacionado (opcional)
  createdAt DateTime @default(now())
}
```

## ⚙️ Configuración de Emails

### Variables de Entorno

Agregar al archivo `.env` (opcional, solo si quieres emails):

```env
# SMTP Configuration (Ejemplo con Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
SMTP_FROM="Reyes Magos <noreply@reyesmagos.com>"
```

### Opciones de SMTP

#### 1. Gmail (Recomendado para desarrollo)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=your-app-password  # Contraseña de aplicación (no tu contraseña normal)
```

**Cómo obtener App Password de Gmail:**
1. Ve a tu cuenta de Google → Seguridad
2. Activa "Verificación en 2 pasos"
3. Ve a "Contraseñas de aplicaciones"
4. Genera una contraseña para "Correo"

#### 2. SendGrid (Recomendado para producción)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### 3. Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-smtp-password
```

#### 4. AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

### ⚠️ Sin Configuración SMTP

Si no configuras SMTP:
- ✅ Las notificaciones in-app funcionarán normalmente
- ⏭️ Los emails simplemente no se enviarán (se mostrará un mensaje en logs)
- 🔄 Puedes agregar la configuración en cualquier momento

## 🚀 Uso del Sistema

### Crear Notificación Manual (Admin)

```typescript
import { createNotification } from '@/lib/notifications'

await createNotification({
  userId: 1,
  type: 'sistema',
  title: 'Bienvenido',
  message: 'Tu cuenta ha sido activada',
  link: '/dashboard',
  eventId: null,
  sendEmail: true
})
```

### Notificaciones Automáticas

El sistema ya envía notificaciones automáticamente en:

1. **Sorteo Completado:**
```typescript
// En app/api/eventos/[id]/sorteo/route.ts
await notifySorteoCompleted(eventId)
```

2. **Usuario se Inscribe:**
```typescript
// En app/api/eventos/[id]/join/route.ts
await notifyEventJoined(userId, eventId)
```

3. **Recordatorios de Eventos:**
```typescript
// Para implementar con cron job
await notifyEventReminder(eventId, daysUntil)
```

## 📅 Recordatorios Automáticos (Próximamente)

Para implementar recordatorios automáticos, puedes usar:

### Opción 1: Cron Job con Vercel Cron

Crear `/app/api/cron/reminders/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifyEventReminder } from '@/lib/notifications'

export async function GET(request: Request) {
  // Verificar que es una llamada de cron válida
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Buscar eventos próximos (7 días, 3 días, 1 día)
  const now = new Date()
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

  const events = await prisma.event.findMany({
    where: {
      isActive: true,
      eventDate: {
        gte: now,
        lte: in7Days
      }
    }
  })

  for (const event of events) {
    if (!event.eventDate) continue

    const daysUntil = Math.ceil(
      (event.eventDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    )

    if (daysUntil === 7 || daysUntil === 3 || daysUntil === 1) {
      await notifyEventReminder(event.id, daysUntil)
    }
  }

  return NextResponse.json({ success: true })
}
```

Y configurar en `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/reminders",
    "schedule": "0 9 * * *"
  }]
}
```

### Opción 2: Node-cron (Para desarrollo local)

```bash
npm install node-cron
```

```typescript
// lib/cron.ts
import cron from 'node-cron'
import { notifyEventReminder } from './notifications'

export function startCronJobs() {
  // Ejecutar cada día a las 9 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Ejecutando recordatorios de eventos...')
    // Implementar lógica de recordatorios
  })
}
```

## 📊 Estadísticas

Puedes ver estadísticas de notificaciones:

```typescript
// Notificaciones no leídas por usuario
const unread = await prisma.notification.count({
  where: { userId, isRead: false }
})

// Notificaciones por tipo
const byType = await prisma.notification.groupBy({
  by: ['type'],
  _count: true
})
```

## 🎨 Personalización

### Cambiar Colores de Notificaciones

En `/components/NotificationBell.tsx`:

```typescript
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'sorteo':
      return '🎲'
    case 'recordatorio':
      return '⏰'
    // ... agregar más tipos
  }
}
```

### Templates de Email

Los templates se encuentran en `/lib/notifications.ts` en la función `sendNotificationEmail()`.

Puedes personalizarlos editando el HTML:

```typescript
html: `
  <div style="...">
    <!-- Tu template personalizado -->
  </div>
`
```

## 🔍 Testing

### Probar Notificaciones

1. **In-App:**
   - Realiza un sorteo
   - Inscríbete a un evento
   - Verifica que aparecen en el header

2. **Emails (si está configurado):**
   - Revisa los logs del servidor
   - Verifica tu bandeja de entrada

### Debug

Activa logs en `/lib/notifications.ts`:

```typescript
console.log('📧 Email enviado a', user.email)
console.log('📬 Notificación creada para usuario', userId)
```

## 📝 Notas Importantes

- Las notificaciones in-app funcionan sin configuración adicional
- Los emails son opcionales y requieren configuración SMTP
- El polling de notificaciones es cada 30 segundos (puedes ajustarlo)
- Las notificaciones eliminadas no se pueden recuperar
- El sistema es escalable para miles de notificaciones

## 🚨 Troubleshooting

### Notificaciones no aparecen
1. Verifica que el usuario esté autenticado
2. Revisa la consola del navegador por errores
3. Verifica que Prisma Client esté generado: `npx prisma generate`

### Emails no se envían
1. Verifica que las variables SMTP estén en `.env`
2. Revisa los logs del servidor por errores de SMTP
3. Verifica credenciales de tu proveedor de email
4. Asegúrate que tu email permite "aplicaciones menos seguras" o usa App Password

### Badge no actualiza
1. El polling ocurre cada 30 segundos
2. Recarga la página manualmente
3. Verifica que `/api/notifications` responde correctamente
