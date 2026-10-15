#contiene las herramientas de Django REST Framework 
# para convertir datos entre objetos de Python y formatos 
# que la API puede recibir o devolver
from rest_framework import serializers
from .models import Prestamo


class PrestamoSerializer(serializers.ModelSerializer):
    # indicamos qué modelo vamos a utilizar
    class Meta:

        model = Prestamo
        # incluimos todos los campos del modelo en la API
        fields = "__all__"
