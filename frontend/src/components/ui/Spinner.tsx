import clsx from 'clsx'

interface Props { className?: string; size?: 'sm' | 'md' | 'lg' }

export function Spinner({ className, size = 'md' }: Props) {
  const sizeClass = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size]
  return (
    <div
      className={clsx(
        'rounded-full border-2 border-surface-600 border-t-brand-400 animate-spin',
        sizeClass,
        className
      )}
    />
  )
}
