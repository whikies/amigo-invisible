import { RegisterForm } from '@/components/RegisterForm'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; email?: string }>
}) {
  const params = await searchParams

  return (
    <RegisterForm
      defaultEmail={params.email ?? ''}
      defaultInvitationCode={params.code?.toUpperCase() ?? ''}
    />
  )
}
