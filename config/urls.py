"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

# 🔥 Swagger를 위한 임포트 추가
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# 🔥 Swagger 문서 설정 세팅
schema_view = get_schema_view(
    openapi.Info(
        title="Monologue API", # 프로젝트 이름
        default_version='v1',
        description="모놀로그 프로젝트 API 명세서입니다.",
    ),
    public=True,
    permission_classes=(permissions.AllowAny,), # 누구나 문서를 볼 수 있게 설정
)

urlpatterns = [
    # Django Admin (관리자 페이지)
    path('admin/', admin.site.urls),
    
    # Accounts API (회원가입/로그인 등 jm님 작업물)
    path('api/accounts/', include('accounts.urls')),
    
    # Posts API (독서록 관련 yb님 작업물)
    path('api/posts/', include('posts.urls')),
    
    # ehdgus님의 api 앱 (api/ 폴더 안의 urls.py 연결)
    path('api/', include('api.urls')),
    
    # 🔥 Swagger 주소 추가
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
]

# 개발 환경에서 미디어 및 정적 파일 서빙 설정
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Admin 사이트 문구 커스터마이징
admin.site.site_header = "내 웹사이트 관리자"
admin.site.site_title = "관리자 페이지"
admin.site.index_title = "대시보드"