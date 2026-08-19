import { useState, useEffect, useRef } from 'react'

const NAV_ITEMS = ['Genre', 'New Releases', 'Trending', 'Top Rated']

function App() {
  const [searchTitle, setSearchTitle] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recommendations, setRecommendations] = useState([])
  const [selectedMovie, setSelectedMovie] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const searchBoxRef = useRef(null)
  const [watchlist, setWatchlist] = useState([])
  const [showWatchlist, setShowWatchlist] = useState(false)

  useEffect(() => {
    if (!searchTitle.trim()) {
      setSuggestions([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `http://127.0.0.1:8000/search?q=${encodeURIComponent(searchTitle)}`
        )
        const data = await response.json()
        setSuggestions(data)
        setShowSuggestions(true)
      } catch (err) {
        setSuggestions([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTitle])
  useEffect(() => {
  fetchWatchlist()
}, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])


  const fetchRecommendations = async (title) => {
    setLoading(true)
    setError('')
    setShowSuggestions(false)
    setSelectedMovie(title)
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/recommend/${encodeURIComponent(title)}?num=10`
      )
      if (!response.ok) throw new Error('Movie not found — try selecting from the dropdown')
      const data = await response.json()
      setRecommendations(data)
    } catch (err) {
      setError(err.message)
      setRecommendations([])
    } finally {
      setLoading(false)
    }
  }
  const fetchWatchlist = async () => {
  try {
    const response = await fetch('http://127.0.0.1:8000/watchlist')
    const data = await response.json()
    setWatchlist(data)
  } catch (err) {
    console.error(err)
  }
}

const toggleWatchlist = async (title) => {
  const isSaved = watchlist.some((m) => m.movie_title === title)
  try {
    if (isSaved) {
      await fetch(`http://127.0.0.1:8000/watchlist/${encodeURIComponent(title)}`, {
        method: 'DELETE',
      })
    } else {
      await fetch(`http://127.0.0.1:8000/watchlist/${encodeURIComponent(title)}`, {
        method: 'POST',
      })
    }
    fetchWatchlist()
  } catch (err) {
    console.error(err)
  }
}

const isInWatchlist = (title) => watchlist.some((m) => m.movie_title === title)

  const handleSelectSuggestion = (title) => {
    setSearchTitle(title)
    fetchRecommendations(title)
  }

  const handleSearch = () => {
    if (searchTitle.trim()) fetchRecommendations(searchTitle)
  }

  return (
    <div className="min-h-screen bg-[#0a1420] text-white">
      {/* Top bar */}
      <div className="border-b border-[#1c2a3a] px-6 md:px-10">
        <div className="flex items-center justify-between gap-6 py-4">
          {/* Left: logo + nav */}
          <div className="flex items-center gap-8">
            <button
  onClick={() => setShowWatchlist(false)}
  className="text-lg md:text-xl font-bold tracking-tight"
>
  <span className="bg-gradient-to-b from-[#FF4D5E] via-[#E60026] to-[#FF4D5E] bg-clip-text text-transparent">
    Net
  </span>
  <span className="bg-gradient-to-b from-[#F4D078] via-[#B8860B] to-[#F4D078] bg-clip-text text-transparent">
    Com
  </span>
</button>
            <nav className="hidden md:flex items-center gap-6">
  {NAV_ITEMS.map((item) => (
    <button
      key={item}
      className="text-xs font-medium text-[#7d94ab] hover:text-[#3fd4f0] transition-colors"
    >
      {item}
    </button>
  ))}
  <button
    onClick={() => setShowWatchlist(!showWatchlist)}
    className={`text-xs font-medium transition-colors ${
      showWatchlist ? 'text-[#3fd4f0]' : 'text-[#7d94ab] hover:text-[#3fd4f0]'
    }`}
  >
    My List ({watchlist.length})
  </button>
</nav>
          </div>

          {/* Center: search bar */}
          <div ref={searchBoxRef} className="relative w-full max-w-sm">
            <div className="relative">
              <input
                type="text"
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                onFocus={() => searchTitle && setShowSuggestions(true)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search a movie..."
                className="w-full pl-3 pr-10 py-2 rounded-md bg-[#101d2c] border border-[#1c2a3a] text-xs focus:outline-none focus:border-[#3fd4f0] transition-colors placeholder:text-[#4a5c70]"
              />
              <button
                onClick={handleSearch}
                aria-label="Search"
                className="absolute right-0 top-0 h-full px-3 flex items-center text-[#7d94ab] hover:text-[#3fd4f0] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#101d2c] border border-[#1c2a3a] rounded-md overflow-hidden z-20 shadow-2xl">
                {suggestions.map((movie, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSuggestion(movie.title)}
                    className="px-3 py-2.5 hover:bg-[#16283b] cursor-pointer border-b border-[#1c2a3a] last:border-0 transition-colors"
                  >
                    <p className="text-xs font-medium">{movie.title}</p>
                    <p className="text-[11px] text-[#7d94ab] mt-0.5">{movie.genres}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: spacer for balance (future: profile/account) */}
          <div className="w-8" />
        </div>
      </div>

      {/* Reserved trailer banner space (to be filled later) */}
      <div className="mx-6 md:mx-10 mt-6 h-56 md:h-72 rounded-lg bg-[#0d1927] border border-[#1c2a3a] flex items-center justify-center">
        <p className="text-[#3a5068] text-xs">Trailer loop coming soon</p>
      </div>

      {/* Results */}
      <div className="px-6 md:px-10 py-10">
        {loading && (
          <div className="flex items-center gap-3 text-[#7d94ab] text-sm">
            <div className="w-4 h-4 border-2 border-[#3fd4f0] border-t-transparent rounded-full animate-spin" />
            Finding recommendations...
          </div>
        )}

        {error && (
          <p className="text-[#ff5468] text-sm bg-[#E60026]/10 border border-[#E60026]/30 rounded-md px-4 py-3 max-w-xl">
            {error}
          </p>
        )}
       {showWatchlist && (
  <div>
    <div className="flex items-center justify-between mb-1">
      <h2 className="text-lg md:text-xl font-semibold">My List</h2>
      <button
        onClick={() => setShowWatchlist(false)}
        className="text-xs font-medium text-[#7d94ab] hover:text-[#3fd4f0] transition-colors flex items-center gap-1"
      >
        ← Home
      </button>
    </div>
    <p className="text-[#7d94ab] text-xs mb-6">Movies you've saved</p>

    {watchlist.length === 0 ? (
      <p className="text-[#3a5068] text-sm py-10 text-center">
        Your list is empty — click the heart icon on any movie to save it here.
      </p>
    ) : (
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-[#1c2a3a] scrollbar-track-transparent">
        {watchlist.map((movie, idx) => (
          <div key={idx} className="flex-shrink-0 w-40 md:w-48 group cursor-pointer">
            <div className="relative w-full h-56 md:h-64 bg-[#101d2c] rounded-lg overflow-hidden border border-[#1c2a3a] group-hover:border-[#3fd4f0] group-hover:scale-105 transition-all duration-200">
              <div className="w-full h-full flex items-center justify-center text-[#3a5068] text-xs px-2 text-center">
                {movie.movie_title}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleWatchlist(movie.movie_title)
                }}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#E60026" stroke="#E60026" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>
            <p className="text-xs font-medium mt-2 line-clamp-1">{movie.movie_title}</p>
            <p className="text-[11px] text-[#7d94ab] line-clamp-1">{movie.movie_genres}</p>
          </div>
        ))}
      </div>
    )}
  </div>
)}
        {!showWatchlist && !loading && !error && recommendations.length > 0 && (
          <div>
            <h2 className="text-lg md:text-xl font-semibold mb-1">
              Because you liked{' '}
              <span className="bg-gradient-to-b from-[#F4D078] via-[#B8860B] to-[#F4D078] bg-clip-text text-transparent font-semibold">
                {selectedMovie}
              </span>
            </h2>
            <p className="text-[#7d94ab] text-xs mb-6">Similar movies you might enjoy</p>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-[#1c2a3a] scrollbar-track-transparent">
              {recommendations.map((movie, idx) => (
               <div key={idx} className="flex-shrink-0 w-40 md:w-48 group cursor-pointer">
  <div className="relative w-full h-56 md:h-64 bg-[#101d2c] rounded-lg overflow-hidden border border-[#1c2a3a] group-hover:border-[#3fd4f0] group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-[#3fd4f0]/10 transition-all duration-200">
    {movie.poster ? (
      <img
        src={movie.poster}
        alt={movie.title}
        className="w-full h-full object-cover"
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center text-[#3a5068] text-xs px-2 text-center">
        {movie.title}
      </div>
    )}
    <button
      onClick={(e) => {
        e.stopPropagation()
        toggleWatchlist(movie.title)
      }}
      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill={isInWatchlist(movie.title) ? '#E60026' : 'none'}
        stroke={isInWatchlist(movie.title) ? '#E60026' : '#ffffff'}
        strokeWidth="2"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  </div>
  <p className="text-xs font-medium mt-2 line-clamp-1">{movie.title}</p>
  <p className="text-[11px] text-[#7d94ab] line-clamp-1">{movie.genres}</p>
</div>
              ))}
            </div>
          </div>
        )}

        {!showWatchlist && !loading && !error && recommendations.length === 0 && (
          <div className="text-center py-20 text-[#3a5068]">
            <p className="text-base">Search for a movie above to get started</p>
            <p className="text-xs mt-1">Try "Toy Story", "Inception", or "The Matrix"</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App