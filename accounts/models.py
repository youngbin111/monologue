# accounts/models.py
"""
사용자 프로필 모델
- User 모델 확장 (OneToOne 관계)
- 회원가입 시 필수 정보 저장
"""

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import RegexValidator
from django.db.models.signals import post_save
from django.dispatch import receiver


class Profile(models.Model):
    """
    사용자 프로필 모델
    필드:
    - user: Django User 모델과 1:1 관계
    - nickname: 사용자 닉네임 (수정 가능)
    - phone: 전화번호 (아이디 찾기에 사용)
    - created_at: 가입일시
    - updated_at: 정보 수정일시
    """
    
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='profile',
        verbose_name='사용자'
    )
    
    nickname = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='닉네임',
        validators=[
            RegexValidator(
                regex=r'^[a-zA-Z0-9가-힣_]{2,20}$',
                message='닉네임은 2-20자의 한글, 영문, 숫자, 언더스코어만 가능합니다'
            )
        ],
        help_text='2-20자의 한글, 영문, 숫자, 언더스코어'
    )
    
    phone = models.CharField(
        max_length=15,
        verbose_name='전화번호',
        validators=[
            RegexValidator(
                regex=r'^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$',
                message='올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'
            )
        ],
        help_text='예: 010-1234-5678'
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True, 
        verbose_name='가입일시'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True, 
        verbose_name='수정일시'
    )
    
    class Meta:
        db_table = 'profiles'
        verbose_name = '프로필'
        verbose_name_plural = '프로필 목록'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username}의 프로필 ({self.nickname})"


# Signal: User 삭제 시 Profile도 자동 삭제 (CASCADE로 이미 처리되지만 명시적 로깅 가능)
@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    """
    User 생성 시 Profile도 자동 생성하는 시그널
    (회원가입 시 명시적으로 생성하므로 실제로는 사용 안 함)
    """
    # 이 시그널은 필요 시 활성화
    # if created:
    #     Profile.objects.create(user=instance)
    pass
