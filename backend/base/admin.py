from django.contrib import admin

from .models import User, Meeting, Hobby, Department, Notification


admin.site.register(User)
admin.site.register(Meeting)
admin.site.register(Hobby)
admin.site.register(Department)
admin.site.register(Notification)