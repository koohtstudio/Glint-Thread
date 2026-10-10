import { MotionProvider } from '@/components/ui/motion'

export default function DevLayout({ children }: LayoutProps<'/dev'>) {
  return <MotionProvider>{children}</MotionProvider>
}
