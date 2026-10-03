import { Dashboard } from '@/components/dashboard'
import { SiteHeader } from '@/components/site-header'

export default function Page() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <Dashboard />
      </main>
      <footer className="mx-auto max-w-7xl px-4 pb-6 text-xs text-muted-foreground md:px-6">
        Mock data for demonstration only. Not an official warning system — follow guidance from local disaster
        authorities.
      </footer>
    </div>
  )
}
