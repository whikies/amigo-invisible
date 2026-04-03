import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

// Configurar el transportador de nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true para puerto 465, false para otros
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})

/**
 * Envía un email
 * @param options - Opciones del email (destinatario, asunto, HTML)
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Amigo Invisible" <noreply@amigosinvisible.com>',
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
    await transporter.verify()
    console.log('✅ Configuración de email verificada')
    return true
  } catch (error) {
    console.error('❌ Error en configuración de email:', error)
    return false
  }
}
