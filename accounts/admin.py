# accounts/admin.py
"""
Django Admin 설정
관리자 페이지에서 User와 Profile 관리
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import Profile


class ProfileInline(admin.StackedInline):
    """
    User 관리 화면에 Profile을 함께 표시
    """
    model = Profile
    can_delete = False
    verbose_name = '프로필'
    verbose_name_plural = '프로필'
    fields = ('nickname', 'phone', 'created_at', 'updated_at')
    readonly_fields = ('created_at', 'updated_at')


class CustomUserAdmin(BaseUserAdmin):
    """
    User 모델 관리자 페이지 커스터마이징
    """
    inlines = (ProfileInline,)
    
    # 목록 화면
    list_display = (
        'username', 
        'email', 
        'first_name', 
        'get_nickname', 
        'is_staff', 
        'is_active',
        'date_joined'
    )
    
    list_filter = (
        'is_staff', 
        'is_superuser', 
        'is_active', 
        'date_joined'
    )
    
    search_fields = (
        'username', 
        'first_name', 
        'email', 
        'profile__nickname',
        'profile__phone'
    )
    
    ordering = ('-date_joined',)
    
    def get_nickname(self, obj):
        """닉네임 표시"""
        try:
            return obj.profile.nickname
        except Profile.DoesNotExist:
            return '-'
    get_nickname.short_description = '닉네임'
    get_nickname.admin_order_field = 'profile__nickname'


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    """
    Profile 모델 관리자 페이지
    """
    # 목록 화면
    list_display = (
        'nickname', 
        'get_username', 
        'get_name', 
        'get_email',
        'phone', 
        'created_at',
        'updated_at'
    )
    
    list_filter = ('created_at', 'updated_at')
    
    search_fields = (
        'nickname', 
        'phone', 
        'user__username', 
        'user__first_name', 
        'user__email'
    )
    
    readonly_fields = ('created_at', 'updated_at')
    
    ordering = ('-created_at',)
    
    # 상세 화면
    fieldsets = (
        ('사용자 정보', {
            'fields': ('user',)
        }),
        ('프로필 정보', {
            'fields': ('nickname', 'phone')
        }),
        ('시간 정보', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_username(self, obj):
        """사용자 아이디 표시"""
        return obj.user.username
    get_username.short_description = '아이디'
    get_username.admin_order_field = 'user__username'
    
    def get_name(self, obj):
        """사용자 이름 표시"""
        return obj.user.first_name
    get_name.short_description = '이름'
    get_name.admin_order_field = 'user__first_name'
    
    def get_email(self, obj):
        """사용자 이메일 표시"""
        return obj.user.email
    get_email.short_description = '이메일'
    get_email.admin_order_field = 'user__email'


# 기존 User admin 등록 해제 후 커스텀 버전으로 재등록
admin.site.unregister(User)
admin.site.register(User, CustomUserAdmin)
