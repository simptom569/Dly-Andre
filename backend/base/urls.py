from django.urls import path
from .views import *


urlpatterns = [
    path('login', login_page, name='login'),
    path('', index_page, name='index'),
    path('logout/', logout_page , name='logout'),
    path('meets/', meets_page, name='meets'),
    path('api/user/<int:user_id>/', update_user, name='update_user'),
    path('api/meeting/<int:pk>/', MeetingDetailView.as_view(), name='meeting-detail'),
    path('change_meeting_comm_field', change_meeting_comm_field)
]