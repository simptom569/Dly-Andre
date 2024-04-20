from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.exceptions import PermissionDenied
from rest_framework.viewsets import ModelViewSet
from base.serializer import UserSerializer
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from base.models import User, Meeting


class UserViewSet(ModelViewSet):
    serializer_class = UserSerializer

    def get_queryset(self):
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(email=self.request.user.email)
    
    def get_permissions(self):
        permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    def delete(self, request, *args, **kwargs):
        user = self.get_object()
        if not request.user.is_staff:
            if user == request.user:
                raise PermissionDenied("You cannot delete yourself.")
        self.perform_destroy(user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    # Поиск юзеров с одинаковыми параметрами
    @action(detail=False, methods=['get'])
    def find_users_by_meeting_details(self, request):
        users = User.objects.all()
        meeting_details_map = {}

        # Получаем текущую дату
        current_date = timezone.now()

        # Определяем дату, за последний месяц
        last_month_date = current_date - timedelta(days=30)

        for user in users:
            key = (user.meeting_time, user.meeting_format)
            if key in meeting_details_map:
                meeting_details_map[key].append(user)
            else:
                meeting_details_map[key] = [user]

        # Фильтруем пользователей с одинаковыми meeting_time и meeting_format
        users_with_same_meeting_details = [users for users in meeting_details_map.values() if len(users) > 1]

        # Пары пользователей, у которых не было встреч за последний месяц
        user_pairs_without_meetings_last_month = []

        # Проверяем, что не было встреч между парами пользователей
        for users in users_with_same_meeting_details:
            for i in range(len(users)):
                for j in range(i + 1, len(users)):
                    user1 = users[i]
                    user2 = users[j]

                    # Проверяем, были ли встречи между этими двумя пользователями за последний месяц
                    has_meetings_last_month = Meeting.objects.filter(user=user1, companion=user2, date__gte=last_month_date).exists()
                    if not has_meetings_last_month:
                        user_pairs_without_meetings_last_month.append((user1, user2))

        if not user_pairs_without_meetings_last_month:
            return Response({"message": "There are no pairs of users with the same meeting details and no meetings between them in the last month."}, status=status.HTTP_404_NOT_FOUND)
        
        response_data = []
        for user1, user2 in user_pairs_without_meetings_last_month:
            response_data.append({
                "meeting_details": {"meeting_time": user1.meeting_time, "meeting_format": user1.meeting_format},
                "users": [{"id": user1.id, "email": user1.email}, {"id": user2.id, "email": user2.email}]
            })

        return Response(response_data, status=status.HTTP_200_OK)