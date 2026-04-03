'use server'

import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

import { auth } from '@/auth'
import type { ActionResult } from '@/lib/action-result'
import { prisma } from '@/lib/prisma'
import {
  changePasswordSchema,
  updateProfileSchema,
  type ChangePasswordInput,
  type UpdateProfileInput,
} from '@/lib/validation/profile'

async function requireUser() {
  const session = await auth()

  if (!session?.user) {
    return { error: 'No autorizado' }
  }

  return { session }
}

export async function updateProfileAction(
  values: UpdateProfileInput
): Promise<ActionResult> {
  const parsed = updateProfileSchema.safeParse(values)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Revisa los datos del formulario',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const authState = await requireUser()
  if ('error' in authState) {
    return {
      success: false,
      error: authState.error,
    }
  }

  const userId = Number(authState.session.user.id)
  const { email, name } = parsed.data

  try {
    if (email !== authState.session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser && existingUser.id !== userId) {
        return {
          success: false,
          error: 'Este email ya esta en uso',
        }
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name?.trim() && { name: name.trim() }),
        email,
      },
    })

    revalidatePath('/perfil')
    revalidatePath('/dashboard')

    return {
      success: true,
      message: 'Perfil actualizado exitosamente',
    }
  } catch (error) {
    console.error('Error al actualizar perfil:', error)
    return {
      success: false,
      error: 'Error al actualizar perfil',
    }
  }
}

export async function changePasswordAction(
  values: ChangePasswordInput
): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(values)

  if (!parsed.success) {
    return {
      success: false,
      error: 'Revisa los datos del formulario',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const authState = await requireUser()
  if ('error' in authState) {
    return {
      success: false,
      error: authState.error,
    }
  }

  const userId = Number(authState.session.user.id)

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return {
        success: false,
        error: 'Usuario no encontrado',
      }
    }

    const isValidPassword = await bcrypt.compare(parsed.data.currentPassword, user.password)

    if (!isValidPassword) {
      return {
        success: false,
        error: 'La contrasena actual es incorrecta',
      }
    }

    const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 10)

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    })

    return {
      success: true,
      message: 'Contrasena actualizada exitosamente',
    }
  } catch (error) {
    console.error('Error al cambiar contrasena:', error)
    return {
      success: false,
      error: 'Error al cambiar contrasena',
    }
  }
}
