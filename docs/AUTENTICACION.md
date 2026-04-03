# 🔐 Sistema de Autenticación Implementado

## ✅ Completado

Se ha implementado un sistema completo de autenticación usando **NextAuth.js v5 (Auth.js)** con las siguientes funcionalidades:

---

## 📦 Componentes Implementados

### 1. **Configuración Base**

#### Dependencias Instaladas
```bash
- next-auth@beta (Auth.js v5)
- bcryptjs (hasheo de contraseñas)
- @types/bcryptjs (tipos TypeScript)
```

#### Variables de Entorno
```env
AUTH_SECRET="OZtImi3agycbOe42sjVuAWS3rHk3WYUmdLZu9FNKYz4="
AUTH_URL="http://localhost:3000"
DATABASE_URL="postgresql://db:db@db:5432/db"
```

---

### 2. **Modelo de Datos Actualizado**

#### Campos Agregados al User:
```prisma
model User {
  role          String    @default("user")  // "user" o "admin"
  emailVerified DateTime?                    // Para verificaciones futuras
  isActive      Boolean   @default(true)     // Desactivar usuarios
}
```

#### Usuarios de Prueba Creados:
- **Admin**: `admin@reyes.com` / `admin123`
- **20 Usuarios normales**: cualquier email del seed / `password123`

---

### 3. **Archivos de Configuración**

| Archivo | Propósito |
|---------|-----------|
| [auth.ts](auth.ts) | Configuración principal de NextAuth con provider de Credentials |
| [types/next-auth.d.ts](types/next-auth.d.ts) | Tipos TypeScript extendidos para sesión |
| [app/api/auth/[...nextauth]/route.ts](app/api/auth/[...nextauth]/route.ts) | Route handler de NextAuth |
| [middleware.ts](middleware.ts) | Middleware para proteger rutas |

---

### 4. **Páginas Creadas**

#### [/login](app/login/page.tsx) - Página de Inicio de Sesión
- Formulario de email y contraseña
- Validación de credenciales
- Mensajes de error informativos
- Credenciales de prueba visibles
- Redirección automática después del login

#### [/register](app/register/page.tsx) - Página de Registro
- Formulario de registro (nombre, email, contraseña)
- Validación de contraseñas (mínimo 6 caracteres)
- Confirmación de contraseña
- Hash bcrypt automático
- Login automático después del registro

---

### 5. **Componentes UI**

#### [Header](components/Header.tsx) - Cabecera Global
- Logo y navegación
- Botones de login/registro (si no hay sesión)
- UserMenu (si hay sesión activa)

#### [UserMenu](components/UserMenu.tsx) - Menú de Usuario
- Dropdown con información del usuario
- Avatar con inicial
- Rol del usuario (admin/user)
- Enlaces a:
  - 📝 Mi Perfil
  - 🎁 Mis Eventos
  - 👑 Panel Admin (solo admins)
- Botón de cerrar sesión

---

### 6. **Server Actions**

#### [app/actions/auth.ts](app/actions/auth.ts)

**`handleLogin(formData)`**
- Validación de credenciales con bcrypt
- Creación de sesión JWT
- Manejo de errores específicos

**`handleRegister(formData)`**
- Verificación de email único
- Hash de contraseña con bcrypt
- Creación de usuario
- Login automático

---

## 🔒 Sistema de Seguridad

### Características de Seguridad Implementadas:

1. **Contraseñas Hasheadas**
   - Bcrypt con 10 rondas de salt
   - Nunca se almacenan en texto plano
   - Verificación segura con bcrypt.compare()

2. **Sesiones JWT**
   - Token firmado con AUTH_SECRET
   - Duración: 30 días
   - Incluye: id, email, name, role

3. **Middleware de Protección**
   - Rutas públicas: `/`, `/login`, `/register`
   - Rutas protegidas: resto del sitio (requiere login)
   - Rutas admin: `/admin/*` (solo role="admin")

4. **Validaciones**
   - Usuario activo (isActive=true)
   - Contraseña mínimo 6 caracteres
   - Email único en el sistema
   - Confirmación de contraseña en registro

---

## 🎯 Flujos de Usuario

### Flujo de Login:
```
1. Usuario visita /login
2. Ingresa email y contraseña
3. handleLogin() valida credenciales
4. Si es válido → crea sesión JWT
5. Redirección a /
6. Header muestra UserMenu
```

### Flujo de Registro:
```
1. Usuario visita /register
2. Ingresa nombre, email, contraseña
3. handleRegister() valida datos
4. Si es válido → crea usuario con password hasheado
5. Login automático
6. Redirección a /
```

### Flujo de Logout:
```
1. Usuario hace click en "Cerrar Sesión"
2. signOut() elimina la sesión
3. Redirección a /login
```

---

## 🚀 Cómo Probar

### 1. Ejecutar el servidor
```bash
ddev npm run dev
```

### 2. Probar Login
Visita: http://localhost:3000/login

**Credenciales Admin:**
- Email: `admin@reyes.com`
- Password: `admin123`

**Credenciales Usuario Normal:**
- Email: Cualquier email del seed (ver consola)
- Password: `password123`

### 3. Probar Registro
Visita: http://localhost:3000/register

Crea una cuenta nueva con cualquier email válido.

### 4. Verificar Protección de Rutas
- Sin login → intenta visitar `/usuarios` → redirige a `/login`
- Con login de user → intenta visitar `/admin` → redirige a `/`
- Con login de admin → puede acceder a `/admin`

---

## 📋 Diferencias entre Roles

| Funcionalidad | User | Admin |
|--------------|------|-------|
| Login/Logout | ✅ | ✅ |
| Ver eventos | ✅ | ✅ |
| Participar en sorteos | ✅ | ✅ |
| Ver asignaciones personales | ✅ | ✅ |
| Panel Admin | ❌ | ✅ |
| Crear eventos | ❌ | ✅ |
| Realizar sorteos | ❌ | ✅ |
| Gestionar exclusiones | ❌ | ✅ |

---

## 🔜 Próximos Pasos

Ahora que tenemos autenticación, podemos implementar:

1. **🎲 Algoritmo de Sorteo**
   - Asignar regaladores respetando exclusiones
   - Cifrar asignaciones con contraseña del usuario

2. **📱 Panel de Usuario**
   - Ver mi asignación (descifrada con mi contraseña)
   - Historial de eventos
   - Gestionar mis exclusiones

3. **👨‍💼 Panel de Administración**
   - Crear/editar eventos
   - Gestionar usuarios
   - Realizar sorteos
   - Ver estadísticas

4. **🔔 Notificaciones**
   - Email cuando se realiza el sorteo
   - Recordatorios de fechas

---

## 🎉 Estado Actual

✅ **Sistema de autenticación 100% funcional**
- Login y registro implementados
- Protección de rutas activa
- Roles diferenciados (user/admin)
- Sesiones persistentes
- UI completa con Header y UserMenu

**Listo para continuar con el siguiente paso del proyecto.** 🚀
