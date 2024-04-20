from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager

from datetime import datetime


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

    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_admin = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    objects = UserManager()

    REQUIRED_FIELDS = ['login', 'password', 'firstName', 'lastName']
    USERNAME_FIELD = 'email'
    EMAIL_FIELD = 'email'

    def __str__(self) -> str:
        return self.email