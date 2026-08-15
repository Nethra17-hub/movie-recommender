import { useState } from 'react'

function App() {
  const [movies, setMovies] = useState([])
  const [searchTitle, setSearchTitle] = useState('')
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!searchTitle.trim()) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/recommend/${encodeURIComponent(searchTitle)}`
      )
      if (!response.ok) {
        throw new Error('Movie not found')
      }
      const data = await response.json()
      setRecommendations(data)
    } catch (err) {
      setError(err.message)
      setRecommendations([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white px-8 py-10">
      <h1 className="text-4xl font-bold mb-8 text-red-600">
        🎬 Movie Recommender
      </h1>

      <div className="flex gap-3 mb-10 max-w-xl">
        <input
          type="text"
          value={searchTitle}
          onChange={(e) => setSearchTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Enter a movie title (e.g. Toy Story (1995))"
          className="flex-1 px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-red-600"
        />
        <button
          onClick={handleSearch}
          className="px-6 py-3 bg-red-600 rounded-lg font-semibold hover:bg-red-700 transition"
        >
          Search
        </button>
      </div>

      {loading && <p className="text-gray-400">Loading recommendations...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {recommendations.length > 0 && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Recommended for you</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {recommendations.map((movie, idx) => (
              <div
                key={idx}
                className="bg-gray-900 rounded-lg p-4 hover:scale-105 transition cursor-pointer border border-gray-800"
              >
                <div className="w-full h-40 bg-gray-700 rounded mb-3 flex items-center justify-center text-gray-500 text-sm">
                  No poster yet
                </div>
                <h3 className="font-medium text-sm">{movie.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{movie.genres}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App