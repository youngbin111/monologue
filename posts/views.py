from rest_framework import generics, permissions
from .models import Post
from .serializers import PostSerializer
from .permissions import IsAuthorOrReadOnly #보안 패치

class PostListCreateView(generics.ListCreateAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly] # 로그인해야 글쓰기 가능
    
    # 데이터 가져오는 규칙(QuerySet)을 직접 정의
    # 비공개 글은 빼고 가져오기 + 최신순 정렬
    def get_queryset(self):
        return Post.objects.filter(is_public=True).order_by('-created_at')

    def perform_create(self, serializer):
        # "작성자(user) 칸에 현재 로그인한 사람(self.request.user)을 채워서 저장해라"
        serializer.save(user=self.request.user)
        
class PostDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly] # 읽기는 누구나, 수정/삭제는 로그인한 사람만
    

# ★ [추가] 내가 쓴 글만 목록으로 보여주는 뷰
class MyPostListView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticated] # 로그인은 필수!

    def get_queryset(self):
        # 1. user=self.request.user : 글쓴이가 '나'인 것만 필터링
        # 2. .order_by('-created_at') : 최신순 정렬
        return Post.objects.filter(user=self.request.user).order_by('-created_at')
    
        