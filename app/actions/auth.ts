'use server'

import { auth, signIn } from '@/auth'
import { AuthError } from 'next-auth'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { generateRandomHex } from '@/lib/webCrypto'
import { sendEmail } from '@/lib/email'
import type { ActionResult } from '@/lib/action-result'
import {
  checkTwoFactorSchema,
  forgotPasswordSchema,
  registerSchema,
  resetPasswordSchema,
  type CheckTwoFactorInput,
  type ForgotPasswordInput,
  type RegisterInput,
  type ResetPasswordInput,
} from '@/lib/validation/auth'

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

export async function requestPasswordResetAction(
  values: ForgotPasswordInput
): Promise<ActionResult> {
  const validatedFields = forgotPasswordSchema.safeParse(values)

  if (!validatedFields.success) {
    return {
      success: false,
      error: 'Revisa los datos del formulario',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email } = validatedFields.data

  try {
    const normalizedEmail = email.toLowerCase()

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user || !user.isActive) {
      return {
        success: true,
        message: 'Si el email existe, recibiras un enlace de recuperacion',
      }
    }

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    })

    const token = generateRandomHex(32)

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    })

    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`

    await sendEmail({
      to: user.email,
      subject: 'Recuperacion de Contrasena - Amigo Invisible',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Recuperacion de Contrasena</h2>
          <p>Hola ${user.name},</p>
          <p>Recibimos una solicitud para restablecer tu contrasena. Haz clic en el siguiente enlace para crear una nueva contrasena:</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}"
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Restablecer Contrasena
            </a>
          </div>
          <p>Este enlace expirara en 1 hora por seguridad.</p>
          <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            Este es un mensaje automatico, por favor no respondas a este email.
          </p>
        </div>
      `,
    })

    return {
      success: true,
      message: 'Si el email existe, recibiras un enlace de recuperacion',
    }
  } catch (error) {
    console.error('Error en forgot-password:', error)
    return {
      success: false,
      error: 'Error al procesar la solicitud',
    }
  }
}

export async function resetPasswordAction(
  values: ResetPasswordInput
): Promise<ActionResult> {
  const validatedFields = resetPasswordSchema.safeParse(values)

  if (!validatedFields.success) {
    return {
      success: false,
      error: 'Revisa los datos del formulario',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { token, password } = validatedFields.data

  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetToken || resetToken.used || new Date() > resetToken.expiresAt) {
      return {
        success: false,
        error: 'El token es invalido o ha expirado. Solicita uno nuevo.',
      }
    }

    if (!resetToken.user.isActive) {
      return {
        success: false,
        error: 'Usuario inactivo',
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ])

    return {
      success: true,
      message: 'Contrasena actualizada exitosamente',
    }
  } catch (error) {
    console.error('Error en reset-password:', error)
    return {
      success: false,
      error: 'Error al restablecer la contrasena',
    }
  }
}

export async function registerUserAction(
  values: RegisterInput
): Promise<ActionResult<{ email: string }>> {
  const validatedFields = registerSchema.safeParse(values)

  if (!validatedFields.success) {
    return {
      success: false,
      error: 'Revisa los datos del formulario',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email, password, name, invitationCode } = validatedFields.data

  try {
    const normalizedEmail = email.toLowerCase()

    const invitation = await prisma.invitation.findFirst({
      where: {
        code: invitationCode,
        email: normalizedEmail,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    if (!invitation) {
      return {
        success: false,
        error: 'Codigo de invitacion invalido, expirado o ya usado',
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return {
        success: false,
        error: 'El email ya esta registrado',
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.$transaction(async (transaction) => {
      await transaction.user.create({
        data: {
          email: normalizedEmail,
          name,
          password: hashedPassword,
          role: 'user',
          isActive: true,
        },
      })

      await transaction.invitation.update({
        where: { id: invitation.id },
        data: { used: true },
      })
    })

    return {
      success: true,
      message: 'Cuenta creada exitosamente',
      data: {
        email: normalizedEmail,
      },
    }
  } catch (error) {
    console.error('Error en registro:', error)
    return {
      success: false,
      error: 'Error al crear la cuenta',
    }
  }
}

export async function sendVerificationEmailAction(): Promise<ActionResult> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'No autenticado',
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
    })

    if (!user) {
      return {
        success: false,
        error: 'Usuario no encontrado',
      }
    }

    if (user.emailVerified) {
      return {
        success: false,
        error: 'El email ya esta verificado',
      }
    }

    await prisma.verificationToken.deleteMany({
      where: { userId: user.id },
    })

    const token = generateRandomHex(32)

    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`

    await sendEmail({
      to: user.email,
      subject: 'Verifica tu Email - Amigo Invisible',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Verifica tu Email</h2>
          <p>Hola ${user.name},</p>
          <p>Gracias por registrarte. Para completar tu registro y acceder a todas las funcionalidades, verifica tu email haciendo clic en el siguiente enlace:</p>
          <div style="margin: 30px 0;">
            <a href="${verificationUrl}"
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verificar Email
            </a>
          </div>
          <p>Este enlace expirara en 24 horas.</p>
          <p>Si no te registraste en nuestra plataforma, puedes ignorar este email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            Este es un mensaje automatico, por favor no respondas a este email.
          </p>
        </div>
      `,
    })

    return {
      success: true,
      message: 'Email de verificacion enviado',
    }
  } catch (error) {
    console.error('Error en send-verification:', error)
    return {
      success: false,
      error: 'Error al enviar email de verificacion',
    }
  }
}

export async function checkTwoFactorRequirementAction(
  values: CheckTwoFactorInput
): Promise<ActionResult<{ requires2FA: boolean; email: string }>> {
  const parsed = checkTwoFactorSchema.safeParse(values)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Revisa los datos del formulario',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const normalizedEmail = parsed.data.email.toLowerCase()

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user || !user.isActive) {
      return {
        success: false,
        error: 'Credenciales invalidas',
      }
    }

    const isPasswordValid = await bcrypt.compare(parsed.data.password, user.password)

    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Credenciales invalidas',
      }
    }

    return {
      success: true,
      data: {
        requires2FA: user.twoFactorEnabled || false,
        email: user.email,
      },
    }
  } catch (error) {
    console.error('Error en check-2fa action:', error)
    return {
      success: false,
      error: 'Error al procesar solicitud',
    }
  }
}
