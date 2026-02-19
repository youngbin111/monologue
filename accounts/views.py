# accounts/views.py
"""
API Views
- 회원가입, 로그인, 로그아웃
- 프로필 조회 및 수정 (닉네임, 비밀번호)
- 아이디/비밀번호 찾기
- 이메일을 통한 비밀번호 재설정
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.conf import settings

from .models import Profile
from .serializers import (
    SignupSerializer,
    LoginSerializer,
    ProfileSerializer,
    NicknameUpdateSerializer,
    PasswordChangeSerializer,
    FindIdSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)
import re


# ============================================
# 커스텀 Throttle 클래스
# ============================================
class LoginRateThrottle(AnonRateThrottle):
    """로그인 시도를 시간당 5회로 제한"""
    rate = '5/hour'


# ============================================
# 1. 회원가입
# ============================================
@api_view(['POST'])
@permission_classes([AllowAny])
def signup_view(request):
    """
    회원가입 API
    
    [흐름]
    1. 클라이언트로부터 회원가입 정보 수신
    2. Serializer로 유효성 검증
       - 아이디 중복 확인
       - 이메일 중복 확인
       - 닉네임 중복 확인
       - 비밀번호 강도 검증
       - 전화번호 형식 검증
    3. User 및 Profile 생성
    4. JWT 토큰 발급
    5. 응답 반환
    
    POST /api/accounts/signup/
    {
        "username": "testuser",
        "password": "SecurePass123!",
        "password2": "SecurePass123!",
        "name": "홍길동",
        "nickname": "길동이",
        "phone": "010-1234-5678",
        "email": "test@example.com"
    }
    """
    serializer = SignupSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        
        # JWT 토큰 생성
        refresh = RefreshToken.for_user(user)
        
        return Response({
            "success": True,
            "message": "회원가입이 완료되었습니다",
            "user": {
                "id": user.id,
                "username": user.username,
                "name": user.first_name,
                "email": user.email,
                "nickname": user.profile.nickname
            },
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token)
            }
        }, status=status.HTTP_201_CREATED)
    
    return Response({
        "success": False,
        "errors": serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


# ============================================
# 2. 로그인
# ============================================
@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([LoginRateThrottle])
def login_view(request):
    """
    로그인 API
    
    [흐름]
    1. 아이디, 비밀번호 수신
    2. Django authenticate()로 인증
    3. 인증 성공 시 JWT 토큰 발급
    4. 사용자 정보와 함께 토큰 반환
    
    POST /api/accounts/login/
    {
        "username": "testuser",
        "password": "SecurePass123!"
    }
    """
    serializer = LoginSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    username = serializer.validated_data['username']
    password = serializer.validated_data['password']
    
    # 사용자 인증
    user = authenticate(username=username, password=password)
    
    if user is None:
        return Response({
            "success": False,
            "message": "아이디 또는 비밀번호가 틀렸습니다"
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    # JWT 토큰 생성
    refresh = RefreshToken.for_user(user)
    
    # 프로필 정보 가져오기
    try:
        profile = user.profile
        nickname = profile.nickname
    except Profile.DoesNotExist:
        nickname = None
    
    return Response({
        "success": True,
        "message": "로그인 성공",
        "user": {
            "id": user.id,
            "username": user.username,
            "name": user.first_name,
            "email": user.email,
            "nickname": nickname
        },
        "tokens": {
            "refresh": str(refresh),
            "access": str(refresh.access_token)
        }
    }, status=status.HTTP_200_OK)


# ============================================
# 3. 로그아웃
# ============================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    로그아웃 API
    
    [흐름]
    1. Refresh token을 블랙리스트에 등록
    2. 클라이언트는 로컬스토리지에서 토큰 삭제
    
    POST /api/accounts/logout/
    Headers: Authorization: Bearer {access_token}
    Body: { "refresh": "refresh_token" }
    """
    try:
        refresh_token = request.data.get("refresh")
        
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()  # 블랙리스트에 등록
        
        return Response({
            "success": True,
            "message": "로그아웃되었습니다"
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            "success": False,
            "message": "로그아웃 처리 중 오류가 발생했습니다"
        }, status=status.HTTP_400_BAD_REQUEST)


# ============================================
# 4. 프로필 조회
# ============================================
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """
    현재 로그인한 사용자 프로필 조회
    
    [흐름]
    1. JWT 토큰에서 사용자 확인
    2. 사용자의 프로필 정보 조회
    3. Serializer로 직렬화하여 반환
    
    GET /api/accounts/profile/
    Headers: Authorization: Bearer {access_token}
    """
    try:
        profile = request.user.profile
        serializer = ProfileSerializer(profile)
        
        return Response({
            "success": True,
            "profile": serializer.data
        }, status=status.HTTP_200_OK)
        
    except Profile.DoesNotExist:
        return Response({
            "success": False,
            "message": "프로필을 찾을 수 없습니다"
        }, status=status.HTTP_404_NOT_FOUND)


# ============================================
# 5. 닉네임 변경 (마이페이지)
# ============================================
@api_view(['PATCH', 'PUT'])
@permission_classes([IsAuthenticated])
def update_nickname_view(request):
    """
    닉네임 변경 API
    
    [흐름]
    1. 새 닉네임 수신
    2. 유효성 검증 (형식, 중복)
    3. 프로필 업데이트
    4. 성공 응답
    
    PATCH /api/accounts/profile/nickname/
    Headers: Authorization: Bearer {access_token}
    Body: { "nickname": "새닉네임" }
    """
    try:
        profile = request.user.profile
    except Profile.DoesNotExist:
        return Response({
            "success": False,
            "message": "프로필을 찾을 수 없습니다"
        }, status=status.HTTP_404_NOT_FOUND)
    
    serializer = NicknameUpdateSerializer(
        data=request.data,
        context={'request': request}
    )
    
    if serializer.is_valid():
        profile.nickname = serializer.validated_data['nickname']
        profile.save()
        
        return Response({
            "success": True,
            "nickname": profile.nickname,
            "message": "닉네임이 변경되었습니다"
        }, status=status.HTTP_200_OK)
    
    return Response({
        "success": False,
        "errors": serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


# ============================================
# 6. 비밀번호 변경 (마이페이지)
# ============================================
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """
    비밀번호 변경 API (현재 비밀번호 필요)
    
    [흐름]
    1. 현재 비밀번호, 새 비밀번호 수신
    2. 현재 비밀번호 확인
    3. 새 비밀번호 유효성 검증
    4. 비밀번호 변경
    5. 모든 Refresh 토큰 무효화 (보안)
    
    POST /api/accounts/profile/change-password/
    Headers: Authorization: Bearer {access_token}
    Body: {
        "old_password": "현재비밀번호",
        "new_password": "새비밀번호",
        "new_password2": "새비밀번호확인"
    }
    """
    serializer = PasswordChangeSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = request.user
    old_password = serializer.validated_data['old_password']
    new_password = serializer.validated_data['new_password']
    
    # 현재 비밀번호 확인
    if not user.check_password(old_password):
        return Response({
            "success": False,
            "message": "현재 비밀번호가 일치하지 않습니다"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # 새 비밀번호 설정
    user.set_password(new_password)
    user.save()
    
    # 보안을 위해 모든 토큰 무효화 (사용자는 다시 로그인해야 함)
    # 이 부분은 선택사항 - 필요시 활성화
    # from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
    # tokens = OutstandingToken.objects.filter(user=user)
    # for token in tokens:
    #     RefreshToken(token.token).blacklist()
    
    return Response({
        "success": True,
        "message": "비밀번호가 변경되었습니다. 다시 로그인해주세요."
    }, status=status.HTTP_200_OK)


# ============================================
# 7. 아이디 찾기 (이름 + 전화번호)
# ============================================
@api_view(['POST'])
@permission_classes([AllowAny])
def find_id_view(request):
    """
    아이디 찾기 API
    
    [흐름]
    1. 이름, 전화번호 수신
    2. 해당 정보로 사용자 검색
    3. 아이디 반환 (일부 마스킹 가능)
    
    POST /api/accounts/find-id/
    Body: {
        "name": "홍길동",
        "phone": "010-1234-5678"
    }
    """
    serializer = FindIdSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    name = serializer.validated_data['name']
    phone = serializer.validated_data['phone']
    
    # 전화번호에서 숫자만 추출
    phone_digits = re.sub(r'[^0-9]', '', phone)
    
    try:
        # 이름과 전화번호 뒤 8자리로 검색
        profile = Profile.objects.get(
            user__first_name=name,
            phone__contains=phone_digits[-8:]
        )
        
        username = profile.user.username
        
        # 선택: 아이디 일부 마스킹 (보안 강화)
        # if len(username) > 3:
        #     masked_username = username[:3] + '*' * (len(username) - 3)
        # else:
        #     masked_username = username[0] + '*' * (len(username) - 1)
        
        return Response({
            "success": True,
            "username": username,  # 또는 masked_username
            "message": "아이디를 찾았습니다"
        }, status=status.HTTP_200_OK)
        
    except Profile.DoesNotExist:
        return Response({
            "success": False,
            "message": "일치하는 사용자를 찾을 수 없습니다"
        }, status=status.HTTP_404_NOT_FOUND)
    except Profile.MultipleObjectsReturned:
        return Response({
            "success": False,
            "message": "여러 계정이 발견되었습니다. 고객센터에 문의하세요"
        }, status=status.HTTP_400_BAD_REQUEST)


# ============================================
# 8. 비밀번호 재설정 요청 (이메일 발송)
# ============================================
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_request_view(request):
    """
    비밀번호 재설정 이메일 발송 API
    
    [흐름]
    1. 이메일 주소 수신
    2. 해당 이메일로 가입된 사용자 확인
    3. 재설정 토큰 생성
    4. 재설정 링크가 포함된 이메일 발송
    
    POST /api/accounts/password-reset/
    Body: { "email": "test@example.com" }
    """
    serializer = PasswordResetRequestSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    
    try:
        user = User.objects.get(email=email)
        
        # 토큰 생성
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # 재설정 링크 생성
        # 프론트엔드 URL로 설정 (실제 배포 시 변경 필요)
        reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"
        
        # 이메일 내용
        subject = "[내 웹사이트] 비밀번호 재설정"
        message = f"""
안녕하세요, {user.first_name}님

비밀번호 재설정을 요청하셨습니다.
아래 링크를 클릭하여 새 비밀번호를 설정해주세요.

{reset_url}

이 링크는 24시간 동안 유효합니다.
비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하세요.

감사합니다.
내 웹사이트 팀
        """
        
        # 이메일 발송
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        
        return Response({
            "success": True,
            "message": "비밀번호 재설정 이메일이 발송되었습니다. 이메일을 확인해주세요."
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        # 보안상 사용자가 없어도 같은 메시지 반환 (계정 존재 여부 노출 방지)
        return Response({
            "success": True,
            "message": "비밀번호 재설정 이메일이 발송되었습니다. 이메일을 확인해주세요."
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            "success": False,
            "message": "이메일 발송 중 오류가 발생했습니다"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================
# 9. 비밀번호 재설정 확인
# ============================================
@api_view(['POST'])
@permission_classes([AllowAny])
def password_reset_confirm_view(request, uidb64, token):
    """
    비밀번호 재설정 확인 API
    
    [흐름]
    1. 이메일 링크를 통해 uid, token 수신
    2. 토큰 유효성 검증
    3. 새 비밀번호 수신 및 검증
    4. 비밀번호 변경
    
    POST /api/accounts/password-reset-confirm/{uidb64}/{token}/
    Body: {
        "new_password": "새비밀번호",
        "new_password2": "새비밀번호확인"
    }
    """
    serializer = PasswordResetConfirmSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # UID 디코딩
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
        
        # 토큰 검증
        if not default_token_generator.check_token(user, token):
            return Response({
                "success": False,
                "message": "유효하지 않거나 만료된 링크입니다"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 새 비밀번호 설정
        new_password = serializer.validated_data['new_password']
        user.set_password(new_password)
        user.save()
        
        return Response({
            "success": True,
            "message": "비밀번호가 성공적으로 재설정되었습니다. 새 비밀번호로 로그인해주세요."
        }, status=status.HTTP_200_OK)
        
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({
            "success": False,
            "message": "유효하지 않은 링크입니다"
        }, status=status.HTTP_400_BAD_REQUEST)


# ============================================
# 10. 중복 확인 API들
# ============================================
@api_view(['GET'])
@permission_classes([AllowAny])
def check_username(request):
    """아이디 중복 확인"""
    username = request.query_params.get('username')
    
    if not username:
        return Response({
            "success": False,
            "message": "아이디를 입력해주세요"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not re.match(r'^[a-zA-Z0-9_]{4,20}$', username):
        return Response({
            "success": False,
            "message": "아이디는 4-20자의 영문, 숫자, 언더스코어만 가능합니다",
            "available": False
        }, status=status.HTTP_400_BAD_REQUEST)
    
    exists = User.objects.filter(username=username).exists()
    
    return Response({
        "success": True,
        "exists": exists,
        "available": not exists,
        "message": "이미 사용 중인 아이디입니다" if exists else "사용 가능한 아이디입니다"
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_nickname(request):
    """닉네임 중복 확인"""
    nickname = request.query_params.get('nickname')
    
    if not nickname:
        return Response({
            "success": False,
            "message": "닉네임을 입력해주세요"
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not re.match(r'^[a-zA-Z0-9가-힣_]{2,20}$', nickname):
        return Response({
            "success": False,
            "message": "닉네임은 2-20자의 한글, 영문, 숫자, 언더스코어만 가능합니다",
            "available": False
        }, status=status.HTTP_400_BAD_REQUEST)
    
    exists = Profile.objects.filter(nickname=nickname).exists()
    
    return Response({
        "success": True,
        "exists": exists,
        "available": not exists,
        "message": "이미 사용 중인 닉네임입니다" if exists else "사용 가능한 닉네임입니다"
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_token_view(request):
    """토큰 검증 API"""
    return Response({
        "success": True,
        "message": "유효한 토큰입니다",
        "user": {
            "id": request.user.id,
            "username": request.user.username,
            "name": request.user.first_name
        }
    }, status=status.HTTP_200_OK)
