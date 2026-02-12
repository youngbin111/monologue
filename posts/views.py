from rest_framework import generics, permissions
from .models import Post
from .serializers import PostSerializer

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