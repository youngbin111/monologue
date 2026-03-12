# posts/urls.py
from django.urls import path
from .views import PostListCreateView, PostDetailView, MyPostListView  

urlpatterns = [
    path('', PostListCreateView.as_view()),         # 목록 & 작성 (api/posts/)
    path('<int:pk>/', PostDetailView.as_view()),    # 상세보기 & 수정 & 삭제 (api/posts/1/)
    
    #내 글만 모아보기
    path('my-posts/', MyPostListView.as_view()),
    
    # 🔥 여기에 '내 글 상세보기' URL을 추가합니다!
    path('my-posts/<int:pk>/', PostDetailView.as_view()),
]