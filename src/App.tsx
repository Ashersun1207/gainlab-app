function App() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">GainLab App</h1>
        <p className="text-gray-400">骨架初始化完成 — T1 ✅</p>
        <p className="text-gray-500 text-sm mt-2">
          Worker: {import.meta.env.VITE_WORKER_URL}
        </p>
      </div>
    </div>
  )
}

export default App
