from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
import sys
import os

# Add project root to sys.path to allow importing from 검색.search
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import local search module
# Since the folder name is '검색' (Korean), we might need careful import or rename.
# Assuming '검색' is a valid package name in Python 3.
try:
    from 검색.search import get_recommendations
except ImportError:
    # Fallback or error handling if import fails
    get_recommendations = None

class BookSearchView(APIView):
    def get(self, request):
        keyword = request.query_params.get('keyword')
        limit = int(request.query_params.get('limit', 5))

        if not keyword:
            return Response(
                {"error": "keyword is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        if not get_recommendations:
            return Response(
                {"error": "Search module not loaded"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            # Call the existing search function
            results = get_recommendations(keyword, n_results=limit)
            
            # Format results
            formatted_results = []
            if results and results['ids'] and results['ids'][0]:
                for i in range(len(results['ids'][0])):
                    b_id = results['ids'][0][i]
                    
                    # We need to fetch details again or modify search.py to return them.
                    # search.py currently prints them. 
                    # Ideally, search.py should return the full data, but for now we reproduce the reading logic.
                    
                    raw_file_path = f"data/book_data/{b_id}.json"
                    book_info = {
                        "id": b_id,
                        "title": "Unknown",
                        "author": "Unknown",
                        "cover_image": "" # Not in previous print output, checking structure...
                    }
                    
                    try:
                        import json
                        if os.path.exists(raw_file_path):
                            with open(raw_file_path, "r", encoding="utf-8") as f:
                                full_data = json.load(f)
                                book_info["title"] = full_data.get('title', 'Unknown')
                                book_info["author"] = full_data.get('author', 'Unknown')
                                # Assuming cover_image might be in full_data or constructed
                                # The user spec shows: "https://monologue.com/api/img/..."
                                # We'll just return what we have or a placeholder if not found.
                                book_info["cover_image"] = full_data.get('cover_image', '') 
                    except Exception:
                        pass
                        
                    formatted_results.append(book_info)

            return Response({
                "total_count": len(formatted_results),
                "search_results": formatted_results
            })


        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class BookDetailView(APIView):
    def get(self, request):
        book_id = request.query_params.get('id')
        if not book_id:
            return Response(
                {"error": "id is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Path to book data
        # In this branch, book_data is missing, so we simulate the logic or return defaults.
        # But we must implement the logic as if data exists.
        raw_file_path = f"data/book_data/{book_id}.json"
        
        try:
            import json
            if os.path.exists(raw_file_path):
                with open(raw_file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
            else:
                # If file missing, valid logic would be 404.
                # But for dev purposes in this specific missing-data branch,
                # we might want to return a mock structure so the user can verify the API contract.
                # However, strictly speaking, 404 is correct.
                # Let's return 404 but with a helpful message.
                 return Response(
                    {"error": f"Book data not found for id: {book_id}"}, 
                    status=status.HTTP_404_NOT_FOUND
                )

            # Construct response based on user spec
            response_data = {
                "id": book_id,
                "title": data.get("title", ""),
                "author": data.get("author", ""),
                "category": data.get("category", ""),
                "review_score": data.get("review_score", "0.0"), # Assuming score exists or default
                "summary": data.get("summary", ""), # Assuming summary
                "cover_image": data.get("cover_image", f"https://monologue.com/api/img/{book_id}.jpg"),
                "bookdata": {
                    "isbn": data.get("bookdata", {}).get("isbn", ""),
                    "pub_date": data.get("bookdata", {}).get("pub_date", ""),
                    "page_count": data.get("bookdata", {}).get("page_count", "")
                }
            }
            return Response(response_data)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

