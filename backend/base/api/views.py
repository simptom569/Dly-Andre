from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny


from base.serializer import UserSerializer
from base.models import User


class UserViewSet(viewsets.ModelViewSet):

    serializer_class = UserSerializer

    def get_queryset(self):
        if self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(email=self.request.user.email)
    
    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]