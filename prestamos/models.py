from django.db import models

class Prestamo(models.Model):
# Estos son los estados que puede tener un préstamo.
    ESTADOS = [
        ("prestado", "Prestado"),
        ("devuelto", "Devuelto"),
        ("vencido", "Vencido"),
    ]

    # Datos de la persona que solicita el libro.
    solicitante = models.CharField(max_length=150)
    identificacion = models.CharField(max_length=30)

    fecha_prestamo = models.DateField()
    fecha_devolucion_prevista = models.DateField()

    # El préstamo comienza como prestado, pero su estado puede cambiar.
    estado = models.CharField(
        max_length=20,
        choices=ESTADOS,
        default="prestado",
    )

    # Este campo es opcional y puede quedar vacío.
    observaciones = models.TextField(blank=True)

    # Así se muestra el préstamo cuando Django lo representa como texto.
    def __str__(self):
        return f"{self.solicitante} - {self.fecha_prestamo}"