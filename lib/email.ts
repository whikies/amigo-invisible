import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

function createTransporter() {
  const host = process.env.EMAIL_HOST || 'localhost'
  const port = Number.parseInt(process.env.EMAIL_PORT || '1025', 10)
  const secure = process.env.EMAIL_SECURE === 'true'
  const user = process.env.EMAIL_USER
  const pass = process.env.EMAIL_PASSWORD

  return nodemailer.createTransport({
    host,
    port,
    secure,
    ...(user && pass
      ? {
          auth: {
            user,
            pass,
          },
        }
      : {}),
  })
}

/**
 * Envía un email
 * @param options - Opciones del email (destinatario, asunto, HTML)
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const from = process.env.EMAIL_FROM

    if (!from) {
      throw new Error('EMAIL_FROM no esta configurado')
    }

    const transporter = createTransporter()

    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html
    })

    console.log(`✅ Email enviado a ${options.to}`)
  } catch (error) {
    console.error('❌ Error al enviar email:', error)
    throw new Error('Error al enviar email')
  }
}

/**
 * Verifica la configuración del servicio de email
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    const transporter = createTransporter()

    await transporter.verify()
    console.log('✅ Configuración de email verificada')
    return true
  } catch (error) {
    console.error('❌ Error en configuración de email:', error)
    return false
  }
}
