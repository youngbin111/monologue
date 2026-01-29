# posts/models.py
from django.db import models

class Post(models.Model):
    title = models.CharField(max_length=100)  # 제목
    content = models.TextField()              # 독서록 내용

    # 공개/비공개 핵심 기능
    # True면 공개, False면 비공개
    is_public = models.BooleanField(default=True) 

    created_at = models.DateTimeField(auto_now_add=True) # 작성 시간

    def __str__(self):
        return self.title