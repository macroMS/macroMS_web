from django.conf.urls import include, url
from django.contrib import admin
from django.urls import path
from go import views
import go
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, re_path
urlpatterns = [

    path(r'',views.index1),

    path(r'3/<str:foldername>/', views.index3),
    path(r'4', views.index4),
    path(r'5', views.index5),
    path(r'6', views.index6),
    path(r'7', views.index7),
    path(r'8', views.index8),
    path(r'9', views.index9),
    path(r'10', views.index10),
    path(r'11/<int:fname>/', views.index11),
    path(r'12', views.index12),
    path(r'14', views.index14),
    path(r'15', views.index15),
    path(r'16', views.index16),
    path(r'17',views.index1),
    path(r'18',views.index18),
    path(r'19/<str:foldername>/',views.index19),
    path(r'20',views.index20),

    ]+static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)


