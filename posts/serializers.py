from rest_framework import serializers
from .models import Post

class PostSerializer(serializers.ModelSerializer):
    # user 필드는 프론트에서 입력받지 않고, 결과 보여줄 때만 표시 (읽기 전용)
    # source='user.username' : user 객체 전체가 아니라 '아이디(글자)'만 보여줌
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Post
        # 프론트엔드가 요구한 필드명 그대로 나열
        fields = ['id', 'user', 'book_title', 'content', 'created_at', 'is_public']