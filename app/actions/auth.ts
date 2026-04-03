'use server'

import { signIn } from '@/auth'
import { AuthError } from 'next-auth'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function handleLogin(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  console.log('🔐 Attempting login for:', email)

  try {
    await signIn('credentials', {
      email,
      password,
      redirect: false
    })

    console.log('✅ Login successful')
    return { success: true }
  } catch (error) {
    console.error('❌ Login error:', error)
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { error: 'Email o contraseña incorrectos' }
        case 'CallbackRouteError':
          return { error: 'Error en la autenticación' }
        default:
          return { error: `Error al iniciar sesión: ${error.type}` }
      }
    }
    // Si no es AuthError, puede ser un error de redirección exitosa
    console.log('Login might be successful, error:', error)
    return { success: true }
  }
}

export async function handleRegister(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string

  try {
    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return { error: 'El email ya está registrado' }
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear usuario
    await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'user',
        isActive: true
      }
    })

    // Login automático después del registro
    await signIn('credentials', {
      email,
      password,
      redirect: false
    })

    return { success: true }
  } catch (error) {
    console.error('Error en registro:', error)
    return { error: 'Error al crear la cuenta' }
  }
}
