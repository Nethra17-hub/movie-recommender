from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import requests
import os
from dotenv import load_dotenv
import sqlite3

from database import get_connection, init_db

init_db()  # creates the table if it doesn't exist yet


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load and prep data once when server starts
movies = pd.read_csv('ml-latest-small/movies.csv')
movies['genres'] = movies['genres'].str.replace('|', ' ', regex=False)

tfidf = TfidfVectorizer(stop_words='english')
tfidf_matrix = tfidf.fit_transform(movies['genres'])
cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

indices = pd.Series(movies.index, index=movies['title']).drop_duplicates()

# Simple in-memory cache so we don't re-call OMDb for the same movie repeatedly
poster_cache = {}

def clean_title_for_search(title):
    """MovieLens titles look like 'Toy Story (1995)' - extract just the name + year"""
    return title.strip()

load_dotenv()
TMDB_API_KEY = os.getenv("TMDB_API_KEY")

def get_poster(title):
    if title in poster_cache:
        return poster_cache[title]

    if not TMDB_API_KEY:
        print("DEBUG: TMDB_API_KEY is missing or empty! Value:", TMDB_API_KEY)
        return None

    import re
    clean_title = re.sub(r'\s*\(\d{4}\)\s*$', '', title).strip()

    try:
        response = requests.get(
            "https://api.themoviedb.org/3/search/movie",
            params={"api_key": TMDB_API_KEY, "query": clean_title},
            timeout=5
        )
        data = response.json()
        print("DEBUG:", title, "->", data)
        results = data.get("results", [])
        if results and results[0].get("poster_path"):
            poster_url = "https://image.tmdb.org/t/p/w500" + results[0]["poster_path"]
            poster_cache[title] = poster_url
            return poster_url
    except Exception as e:
        print("DEBUG ERROR:", e)

    poster_cache[title] = None
    return None

@app.get("/")
def home():
    return {"message": "Movie Recommender API is running"}

@app.get("/movies")
def get_all_movies():
    return movies[['title', 'genres']].to_dict(orient='records')

@app.get("/search")
def search_movies(q: str, limit: int = 8):
    if not q or len(q) < 1:
        return []
    matches = movies[movies['title'].str.contains(q, case=False, na=False, regex=False)]
    return matches[['title', 'genres']].head(limit).to_dict(orient='records')
@app.get("/watchlist")
def get_watchlist():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM watchlist ORDER BY added_at DESC").fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.post("/watchlist/{title}")
def add_to_watchlist(title: str):
    if title not in indices:
        raise HTTPException(status_code=404, detail="Movie not found")
    genres = movies.loc[indices[title], 'genres']
    conn = get_connection()
    try:
        conn.execute(
            "INSERT INTO watchlist (movie_title, movie_genres) VALUES (?, ?)",
            (title, genres)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        pass  # already in watchlist, ignore
    conn.close()
    return {"message": f"'{title}' added to watchlist"}

@app.delete("/watchlist/{title}")
def remove_from_watchlist(title: str):
    conn = get_connection()
    conn.execute("DELETE FROM watchlist WHERE movie_title = ?", (title,))
    conn.commit()
    conn.close()
    return {"message": f"'{title}' removed from watchlist"}

@app.get("/recommend/{title}")
def recommend(title: str, num: int = 5):
    if title not in indices:
        raise HTTPException(status_code=404, detail=f"Movie '{title}' not found")

    idx = indices[title]
    sim_scores = list(enumerate(cosine_sim[idx]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    sim_scores = sim_scores[1:num+1]

    movie_indices = [i[0] for i in sim_scores]
    results = movies[['title', 'genres']].iloc[movie_indices].to_dict(orient='records')

    # Add poster for each recommendation
    for movie in results:
        movie['poster'] = get_poster(movie['title'])

    return results