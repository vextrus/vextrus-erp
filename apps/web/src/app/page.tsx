export default function Home() {
  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between text-center space-y-8">
        <h1 className="text-5xl font-bold tracking-tight">
          Welcome to{' '}
          <span className="bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
            Vextrus ERP
          </span>
        </h1>

        <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
          World-class Enterprise Resource Planning system for Bangladesh Construction & Real Estate
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="glass-light rounded-xl p-6 hover:glass-medium transition-all duration-200 cursor-pointer">
            <h2 className="text-xl font-semibold mb-2">🏗️ Construction Management</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Complete project lifecycle management from planning to execution
            </p>
          </div>

          <div className="glass-light rounded-xl p-6 hover:glass-medium transition-all duration-200 cursor-pointer">
            <h2 className="text-xl font-semibold mb-2">💰 Financial Control</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Advanced accounting with NBR compliance and real-time reporting
            </p>
          </div>

          <div className="glass-light rounded-xl p-6 hover:glass-medium transition-all duration-200 cursor-pointer">
            <h2 className="text-xl font-semibold mb-2">📊 Analytics & Insights</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Data-driven decision making with comprehensive business intelligence
            </p>
          </div>
        </div>

        <div className="mt-12 flex gap-4 justify-center">
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors"
          >
            Go to Dashboard
          </a>
          <a
            href="/docs"
            className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium glass-light hover:glass-medium transition-all"
          >
            Documentation
          </a>
        </div>
      </div>

      {/* Background gradient */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-white dark:bg-neutral-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary-400 opacity-20 blur-[100px]" />
      </div>
    </main>
  )
}