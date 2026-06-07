from django.urls import path
from . import views

urlpatterns = [
    path('jobs/<str:job_id>/recommend/', views.recommend_jobs_api, name='recommend_jobs_api'),
    path('chatbot/recommend/', views.chatbot_recommend_api, name='chatbot_recommend_api'),
    path('chatbot/chat/', views.chatbot_chat_api, name='chatbot_chat_api'),
]
