import clsx from 'clsx'
import { Users } from 'lucide-react'
import type { CrowdLevel } from '../../types'

interface Props {
  level: CrowdLevel
  count: number
  className?: string
}

const labels: Record<CrowdLevel, string> = {
  LOW: 'Low crowd',
  MODERATE: 'Moderate crowd',
  HIGH: 'High crowd',
}

export function CrowdBadge({ level, count, className }: Props) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
        level === 'LOW' && 'crowd-low',
        level === 'MODERATE' && 'crowd-moderate',
        level === 'HIGH' && 'crowd-high',
        className
      )}
    >
      <Users className="w-3 h-3" />
      {count} · {labels[level]}
    </span>
  )
}
