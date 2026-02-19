# myproject/urls.py
"""
프로젝트 메인 URL 설정
모든 앱의 URL을 여기서 연결
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Django Admin (관리자 페이지)
    path('admin/', admin.site.urls),
    
    # Accounts API
    path('api/accounts/', include('accounts.urls')),
    
    # posts API
    path('api/posts/', include('posts.urls')),
]

# 개발 환경에서 미디어 파일 서빙
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Admin 사이트 커스터마이징
admin.site.site_header = "내 웹사이트 관리자"
admin.site.site_title = "관리자 페이지"
admin.site.index_title = "대시보드"
