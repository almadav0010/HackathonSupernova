import { 
  FiBook, 
  FiUsers, 
  FiMessageCircle, 
  FiUpload, 
  FiLogIn, 
  FiLogOut, 
  FiUser,
  FiHome,
  FiSettings,
  FiLoader,
  FiCheck,
  FiX,
  FiEye,
  FiEyeOff,
  FiEdit,
  FiTrash,
  FiPlus,
  FiChevronRight,
  FiChevronLeft,
  FiSend
} from 'react-icons/fi'

const icons = {
  book: FiBook,
  users: FiUsers,
  message: FiMessageCircle,
  upload: FiUpload,
  login: FiLogIn,
  logout: FiLogOut,
  user: FiUser,
  home: FiHome,
  settings: FiSettings,
  loader: FiLoader,
  check: FiCheck,
  x: FiX,
  eye: FiEye,
  'eye-off': FiEyeOff,
  edit: FiEdit,
  trash: FiTrash,
  plus: FiPlus,
  'chevron-right': FiChevronRight,
  'chevron-left': FiChevronLeft,
  send: FiSend,
}

export type IconName = keyof typeof icons

interface IconProps {
  name: IconName
  size?: number
  className?: string
}

export function Icon({ name, size = 24, className = '' }: IconProps) {
  const IconComponent = icons[name]
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`)
    return null
  }

  return <IconComponent size={size} className={className} />
}
