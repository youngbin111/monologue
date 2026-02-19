from django.db import models
from django.contrib.auth.models import User

class Post(models.Model):
    # 1. 작성자 (FK: user) - 요청하신 대로 이름을 'user'로 설정
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # 2. 책 제목 (book_title) - 기존 title에서 이름 변경
    book_title = models.CharField(max_length=100)
    
    # 3. 내용 (content)
    content = models.TextField()
    
    # 4. 생성일 (created_at)
    created_at = models.DateTimeField(auto_now_add=True)

    # (참고) 공개 여부는 요청 리스트에 없지만, 기능상 필요할 수 있어 남겨둡니다. 
    # 프론트에서 안 쓰면 무시해도 됩니다.
    is_public = models.BooleanField(default=True)

    def __str__(self):
        return self.book_title