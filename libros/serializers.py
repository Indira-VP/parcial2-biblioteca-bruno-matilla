
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
    autor_nombre = serializers.SerializerMethodField()

    def get_autor_nombre(self, obj):
        if obj.autor_relacionado:
            return str(obj.autor_relacionado)
        return obj.autor

    class Meta:
        model = Libro
        fields = [
            "id",
            "titulo",
            "autor",
            "autor_relacionado",
            "autor_nombre",
            "tipo_publicacion",
            "isbn",
            "editorial",
            "edicion",
            "volumen_coleccion",
            "anio_publicacion",
            "genero_area",
            "ejemplares",
        ]
