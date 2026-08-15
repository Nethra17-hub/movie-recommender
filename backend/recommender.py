import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Load movies data
movies = pd.read_csv('ml-latest-small/movies.csv')

# Clean up genres (they're separated by | in this dataset, e.g. "Comedy|Romance")
movies['genres'] = movies['genres'].str.replace('|', ' ', regex=False)

# Convert genres into TF-IDF vectors
tfidf = TfidfVectorizer(stop_words='english')
tfidf_matrix = tfidf.fit_transform(movies['genres'])

# Compute similarity between all movies
cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

# Build a reverse lookup: movie title -> index
indices = pd.Series(movies.index, index=movies['title']).drop_duplicates()

def get_recommendations(title, num_recommendations=5):
    if title not in indices:
        return f"Movie '{title}' not found in dataset."
    
    idx = indices[title]
    sim_scores = list(enumerate(cosine_sim[idx]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    sim_scores = sim_scores[1:num_recommendations+1]  # skip itself
    
    movie_indices = [i[0] for i in sim_scores]
    return movies['title'].iloc[movie_indices].tolist()

# Test it
if __name__ == "__main__":
    test_movie = "Toy Story (1995)"
    print(f"Recommendations for '{test_movie}':")
    print(get_recommendations(test_movie))