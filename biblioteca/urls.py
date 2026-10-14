from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from autores.views import AutorViewSet

router = DefaultRouter()
router.register(r'autores', AutorViewSet, basename='autor')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
]