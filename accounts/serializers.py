# accounts/serializers.py
"""
REST API Serializers
- 입력 데이터 검증 및 직렬화
- 회원가입, 로그인, 프로필 수정 등의 Serializer
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import Profile
import re


class UserSerializer(serializers.ModelSerializer):
    """기본 사용자 정보 Serializer"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class ProfileSerializer(serializers.ModelSerializer):
    """
    프로필 정보 Serializer (읽기용)
    사용자 정보와 프로필 정보를 함께 반환
    """
    
    username = serializers.CharField(source='user.username', read_only=True)
    name = serializers.CharField(source='user.first_name', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Profile
        fields = [
            'id', 
            'nickname', 
            'phone', 
            'username', 
            'name', 
            'email', 
            'created_at', 
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SignupSerializer(serializers.Serializer):
    """
    회원가입 Serializer
    
    입력 필드:
    - username: 아이디 (4-20자, 영문/숫자/언더스코어)
    - password: 비밀번호 (8자 이상, 영문/숫자/특수문자)
    - password2: 비밀번호 확인
    - name: 이름 (실명)
    - nickname: 닉네임 (2-20자)
    - phone: 전화번호 (010-1234-5678)
    - email: 이메일 (비밀번호 찾기에 사용)
    """
    
    username = serializers.CharField(
        min_length=4,
        max_length=20,
        required=True,
        help_text='4-20자의 영문, 숫자, 언더스코어'
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text='8자 이상, 영문/숫자/특수문자 조합'
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        help_text='비밀번호 확인'
    )
    name = serializers.CharField(
        max_length=30, 
        required=True,
        help_text='실명'
    )
    nickname = serializers.CharField(
        min_length=2, 
        max_length=20, 
        required=True,
        help_text='2-20자의 한글, 영문, 숫자, 언더스코어'
    )
    phone = serializers.CharField(
        max_length=15, 
        required=True,
        help_text='예: 010-1234-5678'
    )
    email = serializers.EmailField(
        required=True,
        help_text='비밀번호 찾기에 사용됩니다'
    )
    
    def validate_username(self, value):
        """아이디 검증"""
        if not re.match(r'^[a-zA-Z0-9_]{4,20}$', value):
            raise serializers.ValidationError(
                "아이디는 4-20자의 영문, 숫자, 언더스코어만 가능합니다"
            )
        
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("이미 사용 중인 아이디입니다")
        
        return value
    
    def validate_email(self, value):
        """이메일 중복 확인"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("이미 사용 중인 이메일입니다")
        return value
    
    def validate_nickname(self, value):
        """닉네임 검증"""
        if not re.match(r'^[a-zA-Z0-9가-힣_]{2,20}$', value):
            raise serializers.ValidationError(
                "닉네임은 2-20자의 한글, 영문, 숫자, 언더스코어만 가능합니다"
            )
        
        if Profile.objects.filter(nickname=value).exists():
            raise serializers.ValidationError("이미 사용 중인 닉네임입니다")
        
        return value
    
    def validate_phone(self, value):
        """전화번호 형식 검증"""
        phone_digits = re.sub(r'[^0-9]', '', value)
        
        if not re.match(r'^01[0-9]{8,9}$', phone_digits):
            raise serializers.ValidationError(
                "올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)"
            )
        
        return value
    
    def validate(self, data):
        """전체 데이터 검증"""
        # 비밀번호 일치 확인
        if data['password'] != data['password2']:
            raise serializers.ValidationError({
                "password2": "비밀번호가 일치하지 않습니다"
            })
        
        # Django 비밀번호 강도 검증
        try:
            validate_password(data['password'])
        except DjangoValidationError as e:
            raise serializers.ValidationError({
                "password": list(e.messages)
            })
        
        return data
    
    def create(self, validated_data):
        """사용자 및 프로필 생성"""
        validated_data.pop('password2')
        
        # User 생성
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            email=validated_data['email'],
            first_name=validated_data['name']
        )
        
        # Profile 생성
        Profile.objects.create(
            user=user,
            nickname=validated_data['nickname'],
            phone=validated_data['phone']
        )
        
        return user


class LoginSerializer(serializers.Serializer):
    """로그인 Serializer"""
    
    username = serializers.CharField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )


class NicknameUpdateSerializer(serializers.Serializer):
    """
    닉네임 변경 Serializer
    마이페이지에서 사용
    """
    
    nickname = serializers.CharField(
        min_length=2, 
        max_length=20, 
        required=True,
        help_text='2-20자의 한글, 영문, 숫자, 언더스코어'
    )
    
    def validate_nickname(self, value):
        """닉네임 검증"""
        if not re.match(r'^[a-zA-Z0-9가-힣_]{2,20}$', value):
            raise serializers.ValidationError(
                "닉네임은 2-20자의 한글, 영문, 숫자, 언더스코어만 가능합니다"
            )
        
        # 현재 사용자 제외하고 중복 확인
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            if Profile.objects.filter(nickname=value).exclude(user=request.user).exists():
                raise serializers.ValidationError("이미 사용 중인 닉네임입니다")
        
        return value


class PasswordChangeSerializer(serializers.Serializer):
    """
    비밀번호 변경 Serializer
    마이페이지에서 사용 (현재 비밀번호 필요)
    """
    
    old_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text='현재 비밀번호'
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text='새 비밀번호 (8자 이상)'
    )
    new_password2 = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text='새 비밀번호 확인'
    )
    
    def validate(self, data):
        """비밀번호 검증"""
        # 새 비밀번호 일치 확인
        if data['new_password'] != data['new_password2']:
            raise serializers.ValidationError({
                "new_password2": "새 비밀번호가 일치하지 않습니다"
            })
        
        # 새 비밀번호 강도 검증
        try:
            validate_password(data['new_password'])
        except DjangoValidationError as e:
            raise serializers.ValidationError({
                "new_password": list(e.messages)
            })
        
        return data


class FindIdSerializer(serializers.Serializer):
    """
    아이디 찾기 Serializer
    이름 + 전화번호로 아이디 찾기
    """
    
    name = serializers.CharField(
        max_length=30, 
        required=True,
        help_text='가입 시 입력한 실명'
    )
    phone = serializers.CharField(
        max_length=15, 
        required=True,
        help_text='가입 시 등록한 전화번호'
    )


class PasswordResetRequestSerializer(serializers.Serializer):
    """
    비밀번호 재설정 요청 Serializer
    이메일로 재설정 링크 발송
    """
    
    email = serializers.EmailField(
        required=True,
        help_text='가입 시 등록한 이메일'
    )


class PasswordResetConfirmSerializer(serializers.Serializer):
    """
    비밀번호 재설정 확인 Serializer
    이메일 링크를 통해 접근 후 새 비밀번호 설정
    """
    
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text='새 비밀번호'
    )
    new_password2 = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'},
        help_text='새 비밀번호 확인'
    )
    
    def validate(self, data):
        """비밀번호 검증"""
        if data['new_password'] != data['new_password2']:
            raise serializers.ValidationError({
                "new_password2": "비밀번호가 일치하지 않습니다"
            })
        
        try:
            validate_password(data['new_password'])
        except DjangoValidationError as e:
            raise serializers.ValidationError({
                "new_password": list(e.messages)
            })
        
        return data
