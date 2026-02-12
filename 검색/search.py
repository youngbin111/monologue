import time
import json
import chromadb
from openai import OpenAI

version = "v0.1"

API_KEY = " "
client = OpenAI(api_key=API_KEY)

db_path = f"monologue_local/검색및추천/data/DB/{version}/chroma_db"
db_client = chromadb.PersistentClient(path=db_path)
collection = db_client.get_collection(name="book_recommendations")

def get_recommendations(query_text, n_results=3):
    response = client.embeddings.create(
        input=query_text,
        model="text-embedding-3-small"
    )
    query_embedding = response.data[0].embedding

    save_path = f"monologue_local/검색및추천/data/response_data/search_embedding/{time.time()}.json"
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

user_input = input("검색어: ")
search_results = get_recommendations(user_input)

print(f"\n🔎 검색어: {user_input}")
print("-" * 50)

for i in range(len(search_results['ids'][0])):
    b_id = search_results['ids'][0][i]
    distance = search_results['distances'][0][i]
    
    raw_file_path = f"monologue_local/크롤링/data/book_data/{b_id}.json"
    with open(raw_file_path, "r", encoding="utf-8") as f:
        full_data = json.load(f)
    
    print(f"{i+1}. [{full_data['title']}] - {full_data['author']}")
    print(f"   출판일: {full_data['bookdata']['pub_date']} | 페이지: {full_data['bookdata']['page_count']}")
    print(f"   카테고리: {full_data['category']}")
    print(f"   유사도: {distance:.6f}\n")