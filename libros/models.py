from django.db import models


class Libro(models.Model):
    TIPOS_PUBLICACION = [
        ("libro", "Libro"),
        ("tesis", "Tesis"),
        ("revista", "Revista"),
    ]

    titulo = models.CharField(max_length=200)

    # Conservamos el nombre del autor como texto.
    autor = models.CharField(max_length=150)

    # Relación temporal con el modelo Autor.
    autor_relacionado = models.ForeignKey(
        "autores.Autor",
        on_delete=models.PROTECT,
        related_name="libros",
        null=True,
        blank=True,
    )

    tipo_publicacion = models.CharField(
        max_length=20,
        choices=TIPOS_PUBLICACION,
        default="libro",
    )

    isbn = models.CharField(max_length=20, blank=True)
    editorial = models.CharField(max_length=150, blank=True)
    edicion = models.CharField(max_length=100, blank=True)
    volumen_coleccion = models.CharField(max_length=150, blank=True)
    anio_publicacion = models.PositiveIntegerField()
    genero_area = models.CharField(max_length=100)

    def __str__(self):
        return self.titulo


class Ejemplar(models.Model):
    ESTADOS = [
        ("disponible", "Disponible"),
        ("prestado", "Prestado"),
        ("mantenimiento", "En mantenimiento"),
    ]

    libro = models.ForeignKey(
        Libro,
        on_delete=models.CASCADE,
        related_name="ejemplares",
    )

    codigo_unico = models.CharField(max_length=30, unique=True)

    estado = models.CharField(
        max_length=20,
        choices=ESTADOS,
        default="disponible",
    )

    ubicacion_fisica = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.codigo_unico