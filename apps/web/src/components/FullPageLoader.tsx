export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-navy-200 border-t-electric-500" />
        <p className="text-sm font-medium text-navy-400">Loading AplicoCV…</p>
      </div>
    </div>
  )
}
