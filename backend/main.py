from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import requests
import os
from dotenv import load_dotenv

load_dotenv()
OMDB_API_KEY = os.getenv("OMDB_API_KEY")

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

def get_poster(title):
    if title in poster_cache:
        return poster_cache[title]

    if not OMDB_API_KEY:
        return None

    try:
        response = requests.get(
            "http://www.omdbapi.com/",
            params={"t": title, "apikey": OMDB_API_KEY},
            timeout=5
        )
        data = response.json()
        poster_url = data.get("Poster") if data.get("Poster") != "N/A" else None
        poster_cache[title] = poster_url
        return poster_url
    except Exception:
        return None

@app.get("/")
def home():
    return {"message": "Movie Recommender API is running"}

@app.get("/movies")
def get_all_movies():
    return movies[['title', 'genres']].to_dict(orient='records')

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