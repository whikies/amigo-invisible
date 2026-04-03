# 👥 ¿Qué Puedo Ver en Cada Página?

## 🏠 Página Principal (/)
**Acceso:** Público (todos)

**Contenido:**
- Explicación del sistema
- Links a todas las secciones
- Si NO estás logueado: Aviso para iniciar sesión
- Si estás logueado: Mensaje de bienvenida personalizado

---

## 🔓 Páginas Públicas (Sin Login Requerido)

### [/login](/login)
- Formulario de inicio de sesión
- Credenciales de prueba
- Link a registro

### [/register](/register)
- Formulario de registro
- Crear nueva cuenta

---

## 🔒 Páginas Protegidas (Login Requerido)

### 👥 [/usuarios](/usuarios)
**Quién puede verla:** Usuarios logueados
**Qué muestra:**
- Lista de todos los usuarios del sistema
- Nombre, email de cada usuario
- Estadísticas: exclusiones, eventos, asignaciones
- Fecha de registro

**Propósito:** Ver quiénes participan en el sistema

---

### 🎄 [/eventos](/eventos)
**Quién puede verla:** Usuarios logueados
**Qué muestra:**
- Todos los sorteos creados (ej: "Reyes Magos 2026")
- Estado: activo/inactivo
- Si ya se realizó el sorteo
- Número de participantes
- Fechas del sorteo y del intercambio

**Propósito:** Ver qué sorteos existen y su estado

---

### 🚫 [/exclusiones](/exclusiones)
**Quién puede verla:** Usuarios logueados
**Qué muestra:**
- Parejas de usuarios que NO pueden salirse en el sorteo
- Motivo de exclusión (pareja, familia, etc.)
- Visualización clara de las restricciones

**Propósito:** Entender las reglas del sorteo

**Ejemplo:**
```
María ←→ Carlos (pareja)
Juan ←→ Pedro (hermanos)
```

---

### 🎁 [/participantes](/participantes)
**Quién puede verla:** Usuarios logueados
**Qué muestra:**
- Por cada evento: lista de todos los inscritos
- Nombre y email de cada participante
- Cuántos usuarios hay en cada sorteo

**Propósito:** Ver quién participa en cada evento

---

### 🔐 [/asignaciones](/asignaciones)
**Quién puede verla:** Usuarios logueados
**Qué muestra:**
- Lista de asignaciones CIFRADAS
- **NO muestra a quién le toca regalar a cada uno** ❌
- Solo muestra los datos cifrados (incomprensibles)
- Componentes del cifrado: encryptedData, IV, salt, authTag
- Explicación técnica del sistema de seguridad

**Propósito:** Demostrar que las asignaciones están protegidas

**Importante:** Esta página muestra que las asignaciones existen, pero nadie puede ver el contenido sin la contraseña del usuario.

---

## 🎯 ¿Qué NO Puedes Ver (Aún)?

Estas funcionalidades están en desarrollo:

### ❌ Tu Asignación Personal
- Ver a quién te toca regalar (descifrando con tu contraseña)
- Página: **/mi-asignacion** (pendiente)

### ❌ Panel de Usuario
- Tus eventos
- Tu historial de sorteos
- Gestionar tus exclusiones
- Página: **/perfil** o **/mis-eventos** (pendiente)

### ❌ Panel de Administración (solo admins)
- Crear nuevos eventos
- Realizar sorteos
- Gestionar exclusiones de otros usuarios
- Ver estadísticas globales
- Página: **/admin** (pendiente)

---

## 🔑 Diferencias por Rol

| Página | Usuario Normal | Administrador |
|--------|---------------|---------------|
| Homepage (/) | ✅ | ✅ |
| /login | ✅ | ✅ |
| /register | ✅ | ✅ |
| /usuarios | ✅ | ✅ |
| /eventos | ✅ | ✅ |
| /exclusiones | ✅ | ✅ |
| /participantes | ✅ | ✅ |
| /asignaciones | ✅ | ✅ |
| /perfil (pending) | ✅ | ✅ |
| /mis-eventos (pending) | ✅ | ✅ |
| /mi-asignacion (pending) | ✅ | ✅ |
| /admin (pending) | ❌ | ✅ |

**Actualmente:** Todas las páginas implementadas son accesibles para cualquier usuario logueado, sin diferencia de rol.

**Próximamente:** El panel /admin estará restringido solo para administradores.

---

## 🚀 Credenciales de Prueba

Para probar el sistema:

**Usuario Administrador:**
```
Email: admin@reyes.com
Password: admin123
```

**Usuarios Normales:**
```
Email: cualquier email del seed
Password: password123
```

Puedes ver los emails en la página [/usuarios](/usuarios) después de hacer login.

---

## 🔮 Próximas Funcionalidades

1. **Mi Asignación** - Ver a quién te toca regalar
2. **Panel de Usuario** - Gestionar tu perfil y eventos
3. **Panel de Admin** - Crear eventos y realizar sorteos
4. **Notificaciones** - Emails cuando se realiza el sorteo

---

## 💡 Resumen Rápido

**SIN LOGIN:**
- Solo puedes ver el homepage
- Links a login y registro

**CON LOGIN:**
- Puedes ver TODA la información del sistema
- Usuarios, eventos, exclusiones, participantes
- Asignaciones cifradas (pero no su contenido)

**PRÓXIMAMENTE:**
- Descifrar TU asignación personal
- Gestionar tu perfil
- Crear sorteos (admins)

---

**¿Quieres probar?** Visita http://localhost:3000 y haz login 🚀
