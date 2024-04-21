from django.urls import path
from .views import *


urlpatterns = [
    path('login', login_page, name='login'),
    path('', index_page, name='index'),
    path('logout/', logout_page , name='logout'),
    path('meets/', meets_page, name='meets'),
    path('api/user/<int:user_id>/', update_user, name='update_user'),
    path('api/meeting/<int:pk>/', MeetingDetailView.as_view(), name='meeting-detail'),
    path('api/get_all_data_user/', get_all_data_user, name='get_all_data_user'),
    path('api/get_all_data_admin/', get_all_data_admin, name='get_all_data_admin'),
    path('change_meeting_comm_field', change_meeting_comm_field),
    path('api/get_user_info/', get_user_info, name='get_user_info'),
    path('create_meetings/', create_meetings_for_intersecting_intervals)
]