from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from datetime import datetime
from django.contrib.auth import get_user_model


class UserManager(BaseUserManager):
    def create_user(self, login, email, password, firstName, lastName, **extra_fields):
        user = self.model(
            login = login,
            email = self.normalize_email(email=email).lower(),
            firstName = firstName,
            lastName = lastName,
            **extra_fields
        )

        user.set_password(raw_password=password)
        user.save(using=self._db)

        return user
    
    def create_superuser(self, login, email, password, firstName, lastName, **extra_fields):
        user = self.create_user(
            login = login,
            email = email,
            firstName = firstName,
            lastName = lastName,
            password = password,
            **extra_fields
        )

        user.is_active = True
        user.is_staff = True
        user.is_admin = True
        user.is_superuser = True

        user.save(using=self._db)

        return user


class Hobby(models.Model):
    name = models.CharField(max_length=100)  # Название хобби
    description = models.TextField()  # Описание хобби
    user = models.ForeignKey('User', on_delete=models.CASCADE)  

    def __str__(self):
        return self.name
    
class Notification(models.Model):
    title = models.CharField(max_length=100)  # Название уведомления
    description = models.TextField()  # Описание уведомления
    user = models.ForeignKey('User', on_delete=models.CASCADE)  # Пользователь, которому адресовано уведомление

    def __str__(self):
        return self.title

class Department(models.Model):
    name = models.CharField(max_length=100)  # Название отдела

    def __str__(self):
        return self.name


class Meeting(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='meetings')
    companion = models.ForeignKey('User', on_delete=models.CASCADE, related_name='meeting_partners')
    date = models.DateField()
    time = models.TimeField(null=True, blank=True)  # Время встречи
    duration = models.DurationField(null=True, blank=True)  # Длительность встречи
    skipped = models.BooleanField(default=False)  # Состоялась ли встреча
    skiped_comment = models.CharField(max_length=100, blank=True)  # Комментарий по пропущенной встрече
    feedback = models.TextField(default="", null=True)  # Отзыв

    MEETING_FORMAT_CHOICES = [
        ('Online', 'Online'),
        ('Offline', 'Offline'),
    ]

    meeting_format = models.CharField(max_length=7, choices=MEETING_FORMAT_CHOICES, blank=True, null=True)

    def __str__(self):
        return f"{self.user.email} - {self.companion.email} - {self.date}"


class User(AbstractBaseUser, PermissionsMixin):
    id = models.AutoField(primary_key=True)
    login = models.CharField(max_length=40)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    firstName = models.CharField(max_length=40)
    lastName = models.CharField(max_length=100)
    registered = models.DateTimeField(auto_now_add=datetime.now())
    last_login = models.DateTimeField(auto_now_add=datetime.now())
    avatar = models.ImageField(blank=True)

    status = models.BooleanField(default=False)

    meeting_time = models.PositiveIntegerField(blank=True, null=True) 
    meeting_format = models.CharField(max_length=7, choices=(("Online", "Online"), ("Offline", "Offline")), blank=True, null=True)

    department = models.ForeignKey('Department', on_delete=models.SET_NULL, null=True, blank=True)

    telegram = models.CharField(max_length=40)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    objects = UserManager()

    REQUIRED_FIELDS = ['login', 'password', 'firstName', 'lastName']
    USERNAME_FIELD = 'email'
    EMAIL_FIELD = 'email'

    def __str__(self) -> str:
        return self.email