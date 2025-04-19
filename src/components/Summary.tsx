interface Props {
  score: number
  onRestart: () => void
}
export default function Summary({ score, onRestart }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold">Браво! 🎉</h1>
      <p className="text-xl">Събра {score} точки</p>
      <button onClick={onRestart} className="bg-purple-600 text-white px-6 py-3 rounded">
        Играй пак
      </button>
    </div>
  )
}
