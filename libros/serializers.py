from rest_framework import serializers
from .models import Libro, Ejemplar


class EjemplarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ejemplar
        fields = [
            "id",
            "libro",
            "codigo_unico",
            "estado",
            "ubicacion_fisica",
        ]


class LibroSerializer(serializers.ModelSerializer):
    ejemplares = EjemplarSerializer(many=True, read_only=True)

    class Meta:
        model = Libro
        fields = [
            "id",
            "titulo",
            "autor",
            "tipo_publicacion",
            "isbn",
            "editorial",
            "edicion",
            "volumen_coleccion",
            "anio_publicacion",
            "genero_area",
            "ejemplares",
        ]