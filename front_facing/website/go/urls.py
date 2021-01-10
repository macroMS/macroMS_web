from django.conf.urls import url

from . import views

urlpatterns = [
    # ex: /polls/5/
    url(r'^(?P<fname>[0-9a-z]+)/$', views.index3),
]
