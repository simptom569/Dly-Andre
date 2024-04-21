from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required, permission_required
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate, login, logout
from django.http import HttpResponse, JsonResponse
from django.db.models import Q, Avg
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from datetime import datetime

from .models import User, Meeting


def login_page(request):
    if request.user.is_authenticated:
        return redirect('/')
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        user = authenticate(request, email=email, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse({"data": "Успешно"})
        else:
            return render(request, 'base/login.html', {'error_message': 'Invalid email or password'})
        
    else:
        return render(request, 'base/login.html')


@login_required(login_url="/login")
def logout_page(request):
    logout(request)
    return redirect('login')


@login_required(login_url="/login")
def index_page(request):
    # Получаем текущего пользователя
    user = request.user if request.user.is_authenticated else None
    user_meetings = Meeting.objects.filter(user=user)
    return render(request, 'base/index.html', {'user': user, 'user_meetings': user_meetings, 'userid': user.id if user else None})


@login_required
def get_all_data_user(request):
    user_id = request.GET.get('id')
    user = request.user
    
    is_staff = request.user.is_staff
    
    # Проверка, разрешено ли текущему пользователю просматривать данные
    if (not is_staff) and (user.id != user_id):
        return HttpResponse("У вас нет прав доступа к этим данным", status=403)
    
    try:
        if user_id:
            user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return HttpResponse("Пользователь не найден", status=404)
    
    total_meetings = Meeting.objects.filter(Q(user=user) | Q(companion=user)).count()
    
    completed_meetings = Meeting.objects.filter(Q(user=user) | Q(companion=user), skipped=False).count()
    
    user_feedback = Meeting.objects.filter(user=user).aggregate(avg_feedback=Avg('feedback'))
    
    context = {
        'user': user,
        'total_meetings': total_meetings,
        'completed_meetings': completed_meetings,
        'user_feedback': user_feedback['avg_feedback'],
    }
    print(context)
    
    return HttpResponse(content=context)


@permission_required('auth.is_staff', raise_exception=True)
def get_all_data_admin(request):
    # Получение общего количества зарегистрированных пользователей
    total_users = User.objects.count()
    
    # Получение количества пользователей, у которых установлены время и формат встречи
    users_with_meeting_time = User.objects.exclude(meeting_time__isnull=True).count()
    
    # Расчет процента пользователей, у которых установлены время и формат встречи относительно общего числа пользователей
    if total_users != 0:
        percentage_with_meeting_time = (users_with_meeting_time / total_users) * 100
    else:
        percentage_with_meeting_time = 0
    
    # Получение общего количества встреч
    total_meetings = Meeting.objects.count()

    # Получение количества встреч, которые состоялись (поле skipped равно False)
    meetings_happened = Meeting.objects.filter(skipped=False).count()
    
    # Расчет процента встреч, которые состоялись, относительно общего числа встреч
    if total_meetings != 0:
        percentage_meetings_happened = (meetings_happened / total_meetings) * 100
    else:
        percentage_meetings_happened = 0
    
    # Получение средней длительности встречи
    average_meeting_duration = Meeting.objects.aggregate(avg_duration=Avg('duration'))['avg_duration']

    # Формирование данных для ответа в формате JSON
    data = {
        "total_users": total_users,
        "percentage_with_meeting_time": round(percentage_with_meeting_time, 2),
        "total_meetings": total_meetings,
        "meetings_happened": meetings_happened,
        "percentage_meetings_happened": round(percentage_meetings_happened, 2),
        "average_meeting_duration": average_meeting_duration
    }

    return JsonResponse(data)


@login_required(login_url="/login")
def meets_page(request):
    # Получаем текущего пользователя
    user = request.user

    # Ищем все встречи, в которых участвует текущий пользователь как создатель или компаньон
    user_meetings = Meeting.objects.filter(Q(user=user) | Q(companion=user))

    # Формируем списки данных о будущих и прошлых встречах пользователя для последующей сериализации
    future_meetings_data = []
    past_meetings_data = []

    current_date = datetime.now().date()

    for meeting in user_meetings:
        # Определяем, будущая ли это встреча
        if meeting.date >= current_date:
            # Если это будущая встреча, добавляем данные в список будущих встреч
            future_meetings_data.append({
                'date': meeting.date,
                'time': meeting.time,
                'companion': meeting.companion.login,
                'companion_telegram': meeting.companion.telegram,
                'format': meeting.meeting_format,
                'duration': meeting.duration,
                'id': meeting.id,
            })
        else:
            # Если это прошлая встреча, добавляем данные в список прошлых встреч
            past_meetings_data.append({
                'date': meeting.date,
                'time': meeting.time,
                'companion': meeting.companion.login,
                'companion_telegram': meeting.companion.telegram,
                'format': meeting.meeting_format,
                'duration': meeting.duration,
                'id': meeting.id,

            })

    # Возвращаем данные в формате JSON
    return JsonResponse({'future_meetings': future_meetings_data, 'past_meetings': past_meetings_data})


@require_http_methods(["PATCH"])
def update_user(request, user_id):
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    # Обновляем данные пользователя на основе данных из запроса
    for key, value in request.POST.items():
        setattr(user, key, value)

    # Сохраняем изменения
    user.save()

    return JsonResponse({"message": "User updated successfully"})


class MeetingDetailView(APIView):
    def patch(self, request, pk):
        try:
            meeting = Meeting.objects.get(pk=pk)
            meeting.skipped = True
            meeting.save()
            return Response({'message': 'Meeting skipped successfully'}, status=status.HTTP_200_OK)
        except Meeting.DoesNotExist:
            return Response({'message': 'Meeting not found'}, status=status.HTTP_404_NOT_FOUND)