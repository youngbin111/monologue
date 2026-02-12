# posts/urls.py
from django.urls import path
from .views import PostListCreateView, PostDetailView  # PostDetailView 추가!

urlpatterns = [
    path('', PostListCreateView.as_view()),         # 목록 & 작성 (api/posts/)
    path('<int:pk>/', PostDetailView.as_view()),    # 상세보기 & 수정 & 삭제 (api/posts/1/)
]