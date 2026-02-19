# accounts/urls.py
"""
URL 라우팅 설정
모든 API 엔드포인트 정의
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'accounts'

urlpatterns = [
    # ============================================
    # 인증 관련
    # ============================================
    
    # 회원가입
    path('signup/', views.signup_view, name='signup'),
    
    # 로그인
    path('login/', views.login_view, name='login'),
    
    # 로그아웃
    path('logout/', views.logout_view, name='logout'),
    
    # 토큰 갱신 (Refresh Token으로 Access Token 재발급)
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # 토큰 검증
    path('verify-token/', views.verify_token_view, name='verify_token'),
    
    
    # ============================================
    # 프로필 관련 (마이페이지)
    # ============================================
    
    # 프로필 조회
    path('profile/', views.profile_view, name='profile'),
    
    # 닉네임 변경
    path('profile/nickname/', views.update_nickname_view, name='update_nickname'),
    
    # 비밀번호 변경 (로그인 상태)
    path('profile/change-password/', views.change_password_view, name='change_password'),
    
    
    # ============================================
    # 계정 찾기
    # ============================================
    
    # 아이디 찾기 (이름 + 전화번호)
    path('find-id/', views.find_id_view, name='find_id'),
    
    # 비밀번호 재설정 요청 (이메일 발송)
    path('password-reset/', views.password_reset_request_view, name='password_reset_request'),
    
    # 비밀번호 재설정 확인 (이메일 링크 클릭 후)
    path('password-reset-confirm/<uidb64>/<token>/', 
         views.password_reset_confirm_view, 
         name='password_reset_confirm'),
    
    
    # ============================================
    # 중복 확인
    # ============================================
    
    # 아이디 중복 확인
    path('check-username/', views.check_username, name='check_username'),
    
    # 닉네임 중복 확인
    path('check-nickname/', views.check_nickname, name='check_nickname'),
]
