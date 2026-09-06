"""
Lab 4 — Cleaning Web Data for Visualization
Uses the user's dataset (tweets.csv) with columns:
Tweet ID, Text, User, Created At, Likes, Retweets, Sentiment
"""

import re
import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings("ignore")

from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer

# ========== 0. OPTION: USE ROBERTA ==========
USE_ROBERTA = True   # Set to False to use lexicon fallback (faster)

# ========== 1. LOAD DATA ==========
df = pd.read_csv("../data/lab4_dirty_tweets.csv")

print("=== Raw Data ===")
print(f"Shape: {df.shape}")
print(df.head())
print("\nMissing values:\n", df.isna().sum())
print("Duplicates (full row):", df.duplicated().sum())

# ========== 2. RENAME COLUMNS ==========
column_map = {
    "Tweet ID": "tweet_id",
    "Text": "tweet_text",
    "User": "username",
    "Created At": "created_at",
    "Likes": "likes",
    "Retweets": "retweets",
    "Sentiment": "sentiment_raw"
}
df = df.rename(columns=column_map)

# Add missing columns (platform, country) with default values
df["platform"] = "Twitter"
df["country"] = "Unknown"

# ========== 3. MISSING VALUES ==========
df = df.dropna(subset=["tweet_text"])
df["retweets"] = df["retweets"].fillna(0)

# ========== 4. DUPLICATES ==========
df = df.drop_duplicates()
df = df.drop_duplicates(subset=["tweet_id"], keep="first")
print(f"\nAfter dedup shape: {df.shape}")

# ========== 5. INCORRECT TYPES ==========
df["likes"] = df["likes"].astype(str).str.replace(",", "", regex=False)
df["likes"] = pd.to_numeric(df["likes"], errors="coerce")
df["retweets"] = df["retweets"].astype(str).str.replace(",", "", regex=False)
df["retweets"] = pd.to_numeric(df["retweets"], errors="coerce")
df.loc[df["likes"] < 0, "likes"] = pd.NA
df.loc[df["retweets"] < 0, "retweets"] = pd.NA
df["likes"] = df["likes"].fillna(df["likes"].median())
df["retweets"] = df["retweets"].fillna(0)

# ========== 6. PARSE DATES ==========
df["created_at"] = pd.to_datetime(df["created_at"], errors="coerce", format="mixed")
df = df.dropna(subset=["created_at"])
df["date"] = df["created_at"].dt.date
df["hour"] = df["created_at"].dt.hour
df["weekday"] = df["created_at"].dt.day_name()

# ========== 7. STANDARDIZE CATEGORIES ==========
df["platform"] = df["platform"].astype("string").str.strip().str.title()
df["country"] = df["country"].astype("string").str.strip().str.title()
df["username"] = df["username"].astype("string").str.strip().str.replace(r"^@", "", regex=True).str.lower()
df["tweet_text"] = df["tweet_text"].astype("string").str.replace(r"\s+", " ", regex=True).str.strip()
df["tweet_text_raw"] = df["tweet_text"]

print("\n=== Structured Cleaning Done ===")

# ========== PART A: TF-IDF ==========
print("\n=== Text Preprocessing for TF-IDF ===")

def clean_text_for_tfidf(text):
    """Clean text: lower, remove URLs, mentions, numbers, punctuation, extra spaces."""
    text = str(text).lower()
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)
    text = re.sub(r"@\w+", " ", text)
    text = re.sub(r"\b\d+(?:\.\d+)?\b", " ", text)
    text = re.sub(r"[^a-z\s]", " ", text)   # keep only letters and spaces
    text = re.sub(r"\s+", " ", text).strip()
    return text

df["text_clean"] = df["tweet_text"].apply(clean_text_for_tfidf)

# Create DTM and TF-IDF using sklearn
vectorizer = CountVectorizer(min_df=2, max_df=0.90, lowercase=True, stop_words='english',
                             token_pattern=r"(?u)\b[a-z][a-z]+\b")  # at least 2 letters
dtm = vectorizer.fit_transform(df["text_clean"])
print(f"DTM shape: {dtm.shape}")

tfidf_vec = TfidfVectorizer(min_df=2, max_df=0.90, stop_words='english',
                            token_pattern=r"(?u)\b[a-z][a-z]+\b")
tfidf = tfidf_vec.fit_transform(df["text_clean"])
print(f"TF-IDF shape: {tfidf.shape}")

# ========== PART B: SENTIMENT ANALYSIS ==========
print("\n=== Sentiment Analysis ===")

if USE_ROBERTA:
    try:
        from transformers import pipeline
        print("Loading RoBERTa sentiment model...")
        sentiment_model = pipeline(
            "sentiment-analysis",
            model="cardiffnlp/twitter-roberta-base-sentiment-latest",
            top_k=None,
            device=-1  # -1 for CPU, 0 for GPU if available
        )
        def prepare_for_roberta(text):
            text = re.sub(r"@\w+", "@user", str(text))
            text = re.sub(r"https?://\S+|www\.\S+", "http", text)
            return text.strip()
        df["sentiment_text"] = df["tweet_text_raw"].fillna("").apply(prepare_for_roberta)
        results = sentiment_model(df["sentiment_text"].tolist(), truncation=True, batch_size=16)
        def scores_to_dict(scores):
            return {item["label"].lower(): item["score"] for item in scores}
        score_dicts = [scores_to_dict(s) for s in results]
        print("RoBERTa sentiment analysis complete.")
    except Exception as e:
        print(f"RoBERTa failed ({e}). Falling back to lexicon.")
        USE_ROBERTA = False

if not USE_ROBERTA:
    print("Using lexicon-based fallback sentiment.")
    pos_words = {"love", "great", "amazing", "excellent", "fantastic", "good", "best", "happy", "awesome", "perfect", "beautiful", "nice", "thanks", "thank", "glad", "excited", "recommend", "enjoy", "wonderful", "brilliant", "outstanding", "superb", "loving", "like", "liked", "likes", "fun", "easy", "smooth", "impressive", "satisfied"}
    neg_words = {"hate", "terrible", "worst", "bad", "awful", "horrible", "disappointed", "disappointing", "poor", "useless", "broken", "crash", "crashes", "crashing", "slow", "bug", "bugs", "waste", "wasted", "annoying", "frustrating", "difficult", "confusing", "mess", "pathetic", "sad", "angry", "never", "not", "no", "none", "nothing", "nowhere", "neither", "nobody", "dont", "doesnt", "didnt", "wasnt", "werent", "cant", "cannot", "couldnt", "wouldnt", "shouldnt", "wont", "isnt", "arent", "hasnt", "havent", "hadnt"}
    score_dicts = []
    for text in df["tweet_text_raw"].fillna(""):
        words = set(str(text).lower().split())
        pos = len(words & pos_words)
        neg = len(words & neg_words)
        total = pos + neg + 1
        score_dicts.append({
            "positive": pos / total,
            "negative": neg / total,
            "neutral": 1 / total
        })

df["sentiment_negative"] = [s.get("negative", 0) for s in score_dicts]
df["sentiment_neutral"]  = [s.get("neutral", 0)  for s in score_dicts]
df["sentiment_positive"] = [s.get("positive", 0) for s in score_dicts]

def predicted_label(scores):
    return max(scores, key=scores.get).capitalize()

df["sentiment"] = [predicted_label(s) for s in score_dicts]
df["sentiment_score"] = df["sentiment_positive"] - df["sentiment_negative"]

print("Sentiment distribution (computed):")
print(df["sentiment"].value_counts())

# ========== 8. TIDY DATA ==========
vis_df = df[[
    "tweet_id", "created_at", "date", "hour", "weekday",
    "username", "platform", "country", "tweet_text_raw", "text_clean",
    "likes", "retweets", "sentiment_score", "sentiment"
]].copy()

vis_df.to_csv("../data/lab4_clean_tweets.csv", index=False)
print(f"\nSaved lab4_clean_tweets.csv ({len(vis_df)} rows)")

# ========== 9. AGGREGATES ==========
sentiment_counts = vis_df["sentiment"].value_counts().rename_axis("sentiment").reset_index(name="count")
sentiment_counts.to_csv("../data/sentiment_counts.csv", index=False)

sentiment_platform = vis_df.groupby(["platform", "sentiment"]).size().reset_index(name="count")
sentiment_platform.to_csv("../data/sentiment_by_platform.csv", index=False)

weekday_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
sentiment_time = vis_df.groupby("weekday")["sentiment_score"].mean().reindex(weekday_order).reset_index()
sentiment_time.to_csv("../data/sentiment_by_weekday.csv", index=False)

vis_df["likes_bin"] = pd.cut(vis_df["likes"], bins=[0, 50, 200, 1000, 99999], labels=["0-50", "51-200", "201-1K", "1K+"])
likes_sentiment = vis_df.groupby(["likes_bin", "sentiment"]).size().reset_index(name="count")
likes_sentiment.to_csv("../data/sentiment_by_likes.csv", index=False)

print("Saved all aggregate CSVs.")
print("\nDone!")