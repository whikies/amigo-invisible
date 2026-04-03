import { redirect } from 'next/navigation'

import { ResetPasswordForm } from '@/components/ResetPasswordForm'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    redirect('/login')
  }

  return <ResetPasswordForm token={token} />
}
