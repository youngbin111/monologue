import time
import json
import chromadb
from openai import OpenAI

version = "v0.1"

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# API Key handling
# Check for SEARCH_OPENAI_API_KEY first (as per .env), then fallback to OPENAI_API_KEY
API_KEY = os.getenv("SEARCH_OPENAI_API_KEY") or os.getenv("OPENAI_API_KEY")

if not API_KEY:
    # Fallback to user input if still not found
    API_KEY = input("Enter OpenAI API Key: ").strip()

client = OpenAI(api_key=API_KEY)

# Adjusted paths for local environment
db_path = f"data/DB/{version}/chroma_db"
# Ensure the directory exists
# os.makedirs(os.path.dirname(db_path), exist_ok=True) # It's a read path for chroma

# Verify DB path exists before initializing
if not os.path.exists(db_path):
    print(f"Warning: ChromaDB path does not exist: {os.path.abspath(db_path)}")

try:
    db_client = chromadb.PersistentClient(path=db_path)
    collection = db_client.get_collection(name="book_recommendations")
except Exception as e:
    print(f"Error initializing ChromaDB: {e}")
    exit(1)

def get_recommendations(query_text, n_results=3):
    try:
        response = client.embeddings.create(
            input=query_text,
            model="text-embedding-3-small"
        )
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        return None

    query_embedding = response.data[0].embedding

    # Adjusted save path
    save_dir = "data/response_data/search_embedding"
    os.makedirs(save_dir, exist_ok=True)
    save_path = f"{save_dir}/{time.time()}.json"
    
    data = {
        "request": query_text,
        "response": response.model_dump()
        }
    with open(save_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )
    return results

if __name__ == "__main__":
    user_input = input("검색어: ")
    search_results = get_recommendations(user_input)

    if search_results:
        print(f"\n🔎 검색어: {user_input}")
        print("-" * 50)

        if not search_results['ids'][0]:
            print("검색 결과가 없습니다.")
        else:
            for i in range(len(search_results['ids'][0])):
                b_id = search_results['ids'][0][i]
                distance = search_results['distances'][0][i]
                
                # Adjusted raw file path - attempting to find book data
                # Since book_data folder is missing in this branch, we handle the error.
                raw_file_path = f"data/book_data/{b_id}.json"
                
                try:
                    with open(raw_file_path, "r", encoding="utf-8") as f:
                        full_data = json.load(f)
                    
                    print(f"{i+1}. [{full_data.get('title', 'Unknown Title')}] - {full_data.get('author', 'Unknown Author')}")
                    print(f"   출판일: {full_data.get('bookdata', {}).get('pub_date', 'N/A')} | 페이지: {full_data.get('bookdata', {}).get('page_count', 'N/A')}")
                    print(f"   카테고리: {full_data.get('category', 'N/A')}")
                    print(f"   유사도: {distance:.6f}\n")
                
                except FileNotFoundError:
                    print(f"{i+1}. [Book ID: {b_id}] (Details unavailable - file not found)")
                    print(f"   유사도: {distance:.6f}\n")
                except Exception as e:
                    print(f"{i+1}. [Book ID: {b_id}] (Error loading details: {e})")
                    print(f"   유사도: {distance:.6f}\n")