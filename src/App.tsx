import { useAppStore } from '@/stores/app'

export default function App() {
  const { count, increment, decrement } = useAppStore()

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Gradient background */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black" />
      
      <main className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center gap-8">
          {/* Logo */}
          <div className="relative">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 opacity-75 blur" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-zinc-900">
              <span className="text-3xl">⚡</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-center text-5xl font-bold tracking-tight text-transparent">
            Vibe Starter
          </h1>
          
          <p className="max-w-md text-center text-zinc-400">
            React + Vite + TypeScript + Tailwind + Supabase + Zustand
          </p>

          {/* Counter demo */}
          <div className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur">
            <button
              onClick={decrement}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800 text-xl font-medium text-white transition-colors hover:bg-zinc-700"
            >
              −
            </button>
            
            <span className="w-16 text-center text-3xl font-bold tabular-nums text-white">
              {count}
            </span>
            
            <button
              onClick={increment}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 text-xl font-medium text-white transition-colors hover:bg-violet-500"
            >
              +
            </button>
          </div>

          {/* Stack badges */}
          <div className="flex flex-wrap justify-center gap-2">
            {['React 18', 'Vite', 'TypeScript', 'Tailwind', 'Supabase', 'Zustand'].map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-sm text-zinc-400"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

