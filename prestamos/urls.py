#Aquí se ponen las direcciones que se usan
#para entrar a la parte de préstamos
from rest_framework.routers import DefaultRouter
from .views import PrestamoViewSet


#creamos el enrutador para organizar las rutas de préstamos
router = DefaultRouter()
#conecta la dirección prestamos con el PrestamoViewSet
router.register(r'prestamos', PrestamoViewSet, basename='prestamo')

#contiene las rutas que Django puede utilizar
urlpatterns = router.urls

