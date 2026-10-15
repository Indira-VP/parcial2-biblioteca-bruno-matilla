from rest_framework import viewsets

from .models import Libro, Ejemplar
from .serializers import LibroSerializer, EjemplarSerializer


class LibroViewSet(viewsets.ModelViewSet):
    """
    Permite consultar, registrar, actualizar y eliminar libros.
    """

    queryset = Libro.objects.all().order_by("id")
    serializer_class = LibroSerializer


class EjemplarViewSet(viewsets.ModelViewSet):
    """
    Permite consultar, registrar, actualizar y eliminar ejemplares.
    """

    queryset = Ejemplar.objects.select_related("libro").all().order_by("id")
    serializer_class = EjemplarSerializer