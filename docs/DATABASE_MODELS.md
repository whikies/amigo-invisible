# Modelos de la Base de Datos - Amigo Invisible Reyes Magos

## 📊 Estructura de Modelos

### 1. **User** - Usuarios del sistema
Almacena la información de los usuarios registrados.

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  password  String   // Hash bcrypt de la contraseña
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Campos:**
- `password`: Hash bcrypt de la contraseña (nunca se almacena en texto plano)
- `name`: Nombre completo del usuario (requerido)

---

### 2. **UserExclusion** - Exclusiones entre usuarios
Define qué usuarios NO pueden ser asignados entre sí (parejas, familiares, etc.)

```prisma
model UserExclusion {
  id             Int      @id
  userId         Int
  excludedUserId Int
  reason         String?  // "pareja", "familia", "hermanos"
}
```

**Características:**
- **Bidireccional**: Si A excluye a B, debe existir también una exclusión de B a A
- `reason`: Campo opcional para documentar el motivo de la exclusión
- Unique constraint: No puede haber exclusiones duplicadas

**Ejemplo:**
```typescript
// María y Carlos son pareja, no pueden salirse entre ellos
await prisma.userExclusion.create({
  data: { userId: mariaId, excludedUserId: carlosId, reason: 'pareja' }
})
await prisma.userExclusion.create({
  data: { userId: carlosId, excludedUserId: mariaId, reason: 'pareja' }
})
```

---

### 3. **Event** - Eventos de sorteo
Representa un evento/sorteo de amigo invisible (puede haber múltiples por año)

```prisma
model Event {
  id          Int       @id
  name        String
  description String?
  year        Int
  drawDate    DateTime?  // Cuándo se realiza el sorteo
  eventDate   DateTime?  // Cuándo es el intercambio
  isActive    Boolean    @default(true)
  isDrawn     Boolean    @default(false)
}
```

**Estados:**
- `isActive`: Si el evento está activo para inscripciones
- `isDrawn`: Si ya se realizó el sorteo

---

### 4. **EventParticipant** - Participantes en un evento
Vincula usuarios con eventos específicos

```prisma
model EventParticipant {
  id      Int @id
  eventId Int
  userId  Int
}
```

**Regla:** Un usuario solo puede participar una vez por evento (unique constraint)

---

### 5. **Assignment** - Asignaciones cifradas ⭐
**¡El corazón del sistema de privacidad!**

```prisma
model Assignment {
  id                  Int      @id
  eventId             Int
  userId              Int      // Quién regala
  encryptedAssignedTo String   // A quién regala (CIFRADO)
  iv                  String   // Vector de inicialización
  salt                String   // Salt para derivar la clave
  authTag             String   // Tag de autenticación GCM
}
```

## 🔐 Sistema de Cifrado

### ¿Por qué cifrar?
El objetivo es que **nadie**, ni siquiera los administradores de la base de datos, puedan ver quién le tocó a quién sin la contraseña del usuario.

### Cómo funciona

1. **Cifrado (durante el sorteo):**
   ```typescript
   import { encryptAssignment } from '@/lib/encryption'

   const encrypted = encryptAssignment(
     assignedUserId: 42,        // A quién le toca regalar
     userPassword: 'miPassword' // Contraseña del usuario
   )

   // encrypted = {
   //   encryptedData: 'a3f5...',
   //   iv: 'b2c4...',
   //   salt: '9e1d...',
   //   authTag: '7f3a...'
   // }
   ```

2. **Almacenamiento:**
   ```typescript
   await prisma.assignment.create({
     data: {
       eventId: 1,
       userId: 10,
       encryptedAssignedTo: encrypted.encryptedData,
       iv: encrypted.iv,
       salt: encrypted.salt,
       authTag: encrypted.authTag
     }
   })
   ```

3. **Descifrado (cuando el usuario inicia sesión):**
   ```typescript
   import { decryptAssignment } from '@/lib/encryption'

   const assignment = await prisma.assignment.findUnique({
     where: { eventId_userId: { eventId: 1, userId: 10 } }
   })

   const assignedUserId = decryptAssignment(
     assignment.encryptedAssignedTo,
     assignment.iv,
     assignment.salt,
     assignment.authTag,
     'miPassword' // Contraseña ingresada por el usuario
   )
   // assignedUserId = 42
   ```

### Seguridad

**Algoritmo:** AES-256-GCM
- **AES-256**: Cifrado simétrico de grado militar
- **GCM**: Modo de operación autenticado (detecta manipulaciones)

**Derivación de clave:** PBKDF2
- 100,000 iteraciones
- SHA-256
- Salt único por asignación

**Propiedades:**
✅ Confidencialidad: Solo el usuario con la contraseña correcta puede descifrar
✅ Integridad: El authTag detecta cualquier modificación de los datos
✅ Forward secrecy: Cada asignación tiene su propio salt e IV
❌ Sin backdoors: No hay forma de recuperar la asignación sin la contraseña

## 🎯 Flujo del Sorteo

1. **Preparación:**
   - Los usuarios se registran
   - Se definen exclusiones (parejas, familia)
   - Se crea un evento

2. **Sorteo:**
   - Algoritmo genera asignaciones válidas (respetando exclusiones)
   - Cada asignación se cifra con la contraseña del usuario
   - Se almacenan en la BD cifradas

3. **Revelación:**
   - Usuario inicia sesión con su contraseña
   - Sistema descifra su asignación específica
   - Usuario ve a quién debe regalar

## 📝 Reglas del Sorteo

- ✅ Cada persona debe regalar a exactamente una persona
- ✅ Cada persona debe recibir de exactamente una persona
- ✅ No puedes regalarte a ti mismo
- ✅ No puedes regalar a alguien en tu lista de exclusiones
- ✅ Debe formar un ciclo completo (grafos dirigidos)

## Estado Actual

✅ Modelos creados y migrados
✅ Sistema de cifrado implementado
✅ Seed con datos de prueba:
  - 20 usuarios
  - 3 parejas con exclusiones
  - 1 evento activo

## Próximos Pasos

⏭️ Algoritmo de sorteo con validación de exclusiones
⏭️ API para crear/consultar eventos
⏭️ Autenticación de usuarios
⏭️ UI para ver asignaciones
⏭️ Sistema de administración
