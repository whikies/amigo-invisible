interface QuickActionProps {
  title: string
  description: string
  icon: string
  href: string
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'pink'
}

const colorClasses = {
  blue: 'from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700',
  green: 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
  purple: 'from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
  yellow: 'from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700',
  red: 'from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700',
  pink: 'from-pink-600 to-fuchsia-600 hover:from-pink-700 hover:to-fuchsia-700'
}

export function QuickAction({ title, description, icon, href, color }: QuickActionProps) {
  return (
    <a
      href={href}
      className={`block bg-linear-to-r ${colorClasses[color]} text-white rounded-xl shadow-lg p-6 transition-all hover:scale-105 hover:shadow-xl`}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-sm opacity-90">
        {description}
      </p>
    </a>
  )
}
