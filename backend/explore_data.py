import pandas as pd

# Load the datasets
movies = pd.read_csv('ml-latest-small/movies.csv')
ratings = pd.read_csv('ml-latest-small/ratings.csv')

# Take a look at the data
print("=== Movies ===")
print(movies.head())
print(f"\nTotal movies: {len(movies)}")

print("\n=== Ratings ===")
print(ratings.head())
print(f"\nTotal ratings: {len(ratings)}")

print("\n=== Movie columns ===")
print(movies.columns.tolist())