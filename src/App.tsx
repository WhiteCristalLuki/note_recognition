import { Header } from './components/layout/Header'
import { HomeScreen } from './components/setup/HomeScreen'
import { GameScreen } from './components/game/GameScreen'
import { ResultsScreen } from './components/results/ResultsScreen'
import { useGameStore } from './stores/gameStore'
import { useTheme } from './hooks/useTheme'

export default function App() {
  useTheme()
  const screen = useGameStore((s) => s.screen)

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header />
      <main className="flex flex-1 flex-col">
        {screen === 'home' && <HomeScreen />}
        {screen === 'game' && <GameScreen />}
        {screen === 'results' && <ResultsScreen />}
      </main>
    </div>
  )
}
