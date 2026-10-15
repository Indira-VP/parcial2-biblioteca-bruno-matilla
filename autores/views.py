from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import Autor
from .serializers import AutorSerializer

class AutorViewSet(viewsets.ModelViewSet):
    queryset = Autor.objects.all()
    serializer_class = AutorSerializer
    
def vista_inicio(request):
    return render(request, 'index.html')

def vista_autores(request):
    return render(request, 'autores.html')