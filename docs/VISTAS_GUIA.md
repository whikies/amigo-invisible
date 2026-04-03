# 🎄 Vistas del Sistema - Amigo Invisible Reyes Magos

## 📖 Guía de Navegación

He creado **5 vistas principales** que te ayudarán a entender completamente el modelo de datos:

### 🏠 [Página Principal](/)
Dashboard con acceso a todas las secciones y explicación del flujo del sistema.

---

## 📊 Vistas Creadas

### 1. 👥 [/usuarios](/usuarios)
**Modelo: `User`**

Muestra todos los usuarios registrados con:
- **Información básica**: nombre, email, ID
- **Estadísticas**: número de exclusiones, eventos participados, asignaciones
- **Fechas**: cuándo se registró

**Qué entenderás:**
- Quiénes son los participantes del sistema
- Cuán activo es cada usuario (exclusiones, eventos)

---

### 2. 🎄 [/eventos](/eventos)
**Modelo: `Event`**

Muestra los sorteos creados con:
- **Información**: nombre, descripción, año
- **Estado**: activo/inactivo, si ya se sorteó
- **Estadísticas**: participantes inscritos, asignaciones creadas
- **Fechas**: cuándo es el sorteo, cuándo es el intercambio

**Qué entenderás:**
- Qué sorteos existen (ej: Reyes 2026, Navidad 2025)
- Estado de cada sorteo (pendiente o ya realizado)
- Cuánta gente participa en cada uno

---

### 3. 🚫 [/exclusiones](/exclusiones)
**Modelo: `UserExclusion`**

Muestra las relaciones de exclusión con:
- **Visualización**: quién no puede salir con quién
- **Motivo**: pareja, familia, hermanos, etc.
- **Bidireccionalidad**: se muestran sin duplicados

**Qué entenderás:**
- Por qué algunas personas no pueden salirse en el sorteo
- Cómo el sistema respeta estas restricciones
- Ejemplo: María y Carlos son pareja → no pueden regalarse mutuamente

---

### 4. 🎁 [/participantes](/participantes)
**Modelo: `EventParticipant`**

Muestra quién está inscrito en cada evento con:
- **Por evento**: lista de todos los participantes
- **Información**: nombre, email de cada participante
- **Estadísticas**: total de inscritos vs asignaciones creadas

**Qué entenderás:**
- Quién participa en qué sorteo
- Si un evento tiene suficientes participantes para sortear
- Relación entre usuarios y eventos específicos

---

### 5. 🔐 [/asignaciones](/asignaciones)
**Modelo: `Assignment`** - ⭐ **La joya del sistema**

Muestra las asignaciones CIFRADAS con:
- **Datos cifrados**: encrypted data, IV, salt, authTag (ilegibles)
- **Quién tiene asignación**: pero NO a quién le toca regalar
- **Explicación técnica**: cómo funciona el cifrado AES-256-GCM

**Qué entenderás:**
- Cómo se almacenan las asignaciones de forma segura
- Por qué nadie (ni admin) puede ver las asignaciones
- Los componentes del cifrado (IV, salt, authTag)
- Que solo el usuario con su contraseña puede descifrar

---

## 🎯 Flujo Completo del Sistema

```
1. USUARIOS         → Se registran personas (User)
        ↓
2. EXCLUSIONES      → Definen parejas/familia (UserExclusion)
        ↓
3. EVENTO           → Se crea sorteo "Reyes 2026" (Event)
        ↓
4. PARTICIPANTES    → Usuarios se inscriben (EventParticipant)
        ↓
5. SORTEO           → Algoritmo asigna regaladores
        ↓
6. ASIGNACIONES     → Se cifra cada asignación (Assignment)
        ↓
7. REVELACIÓN       → Usuario descifra con su contraseña
```

---

## 🔐 Lo Más Importante: El Cifrado

### ¿Por qué cifrar?
Para que **nadie pueda hacer trampa** ni ver las asignaciones antes de tiempo.

### ¿Cómo funciona?

1. **Sorteo**: El sistema decide que María debe regalar a Juan (ID: 42)

2. **Cifrado**:
   ```typescript
   const encrypted = encryptAssignment(
     42,              // ID de Juan
     "password_maria" // Contraseña de María
   )
   ```

3. **Almacenamiento**: En la BD se guarda:
   - `encryptedAssignedTo`: "f4e3d2c1..." (incomprensible)
   - `iv`: "a1b2c3d4..." (necesario para descifrar)
   - `salt`: "9e8f7d6c..." (único para esta asignación)
   - `authTag`: "5f4e3d2c..." (detecta manipulaciones)

4. **Revelación**: Cuando María inicia sesión:
   ```typescript
   const assignedUserId = decryptAssignment(
     encrypted.data,
     encrypted.iv,
     encrypted.salt,
     encrypted.authTag,
     "password_maria"  // Contraseña correcta
   )
   // assignedUserId = 42 (Juan)
   ```

### Seguridad Garantizada

✅ **Confidencialidad**: Sin contraseña = datos ilegibles
✅ **Integridad**: authTag detecta si alguien modificó los datos
✅ **Sin backdoors**: No hay forma de recuperar sin contraseña
✅ **Forward secrecy**: Cada asignación con su propio salt e IV

---

## 🚀 Cómo Probar

1. **Ver los datos**:
   ```bash
   ddev npm run dev
   # Visita http://localhost:3000
   ```

2. **Regenerar datos de prueba**:
   ```bash
   ddev npm run seed
   ```

3. **Ver datos en Prisma Studio**:
   ```bash
   ddev npx prisma studio
   ```

---

## 📝 Resumen de Modelos

| Modelo | Descripción | Relaciones |
|--------|-------------|------------|
| **User** | Usuarios registrados | Puede tener exclusiones, participar en eventos, tener asignaciones |
| **UserExclusion** | Parejas/familia que no pueden salirse | Bidireccional entre 2 usuarios |
| **Event** | Sorteo específico (ej: Reyes 2026) | Tiene participantes y asignaciones |
| **EventParticipant** | Usuario inscrito en un evento | Usuario + Evento |
| **Assignment** | Asignación cifrada de quién regala a quién | Usuario + Evento + datos cifrados |

---

## 🎨 Tecnologías Usadas en las Vistas

- **Next.js 15** (App Router) - Server Components
- **Prisma** - Client con relaciones incluidas
- **Tailwind CSS** - Estilos responsive
- **TypeScript** - Type safety

Todas las vistas son **Server Components** que consultan directamente la base de datos.

---

## ❓ Próximos Pasos

Una vez entiendas el modelo, podemos implementar:

1. 🔐 **Autenticación** (NextAuth.js)
2. 🎲 **Algoritmo de sorteo** (con validación de exclusiones)
3. 📱 **UI para usuarios** (ver su asignación)
4. 👨‍💼 **Panel de administración** (crear eventos, gestionar exclusiones)
5. 🔔 **Notificaciones** (email cuando se realiza el sorteo)

¡Navega por las vistas y verás cómo todo encaja! 🎄⭐
