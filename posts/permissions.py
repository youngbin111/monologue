# posts/permissions.py
from rest_framework import permissions

class IsAuthorOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # 읽기 요청(GET 등)은 무조건 통과!
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # 수정/삭제(PUT, DELETE) 요청은 '글 작성자 == 현재 로그인한 사람'일 때만 통과!
        return obj.user == request.user