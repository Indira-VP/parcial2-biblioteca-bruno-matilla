from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from rest_framework.routers import DefaultRouter
from autores.views import AutorViewSet
from prestamos.views import PrestamoViewSet

from autores.views import vista_inicio, vista_autores
from libros.views import LibroViewSet, EjemplarViewSet


router = DefaultRouter()

router.register(r'autores', AutorViewSet, basename='autor')
router.register(r'prestamos', PrestamoViewSet, basename='prestamo')
router.register(r'libros', LibroViewSet, basename='libro')
router.register(r'ejemplares', EjemplarViewSet, basename='ejemplar')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('autores/', 
        TemplateView.as_view(template_name='autores.html'), 
        name='vista-autores'),
    
    path('prestamos/',
        TemplateView.as_view(template_name='prestamos.html'),
        name='vista-prestamos'),
    path('libros/', TemplateView.as_view(template_name='libros.html'), name='vista-libros'),
    path('', vista_inicio, name='vista-inicio'),

]