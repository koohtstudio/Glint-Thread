/**
 * The only icon set (PRD 4.6): Lucide at 1.5px stroke, 20px. UI affordances only, never decoration.
 */
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  User,
  X,
  type LucideProps,
} from 'lucide-react'

const base = { size: 20, strokeWidth: 1.5, 'aria-hidden': true, focusable: false } as const

type IconProps = Omit<LucideProps, 'ref'>

export const SearchIcon = (p: IconProps) => <Search {...base} {...p} />
export const UserIcon = (p: IconProps) => <User {...base} {...p} />
export const BagIcon = (p: IconProps) => <ShoppingBag {...base} {...p} />
export const CloseIcon = (p: IconProps) => <X {...base} {...p} />
export const PlusIcon = (p: IconProps) => <Plus {...base} {...p} />
export const MinusIcon = (p: IconProps) => <Minus {...base} {...p} />
export const MenuIcon = (p: IconProps) => <Menu {...base} {...p} />
export const ChevronDownIcon = (p: IconProps) => <ChevronDown {...base} {...p} />
export const ChevronLeftIcon = (p: IconProps) => <ChevronLeft {...base} {...p} />
export const ChevronRightIcon = (p: IconProps) => <ChevronRight {...base} {...p} />
