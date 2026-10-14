from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import Autor
from .serializers import AutorSerializer

class AutorViewSet(viewsets.ModelViewSet):
    queryset = Autor.objects.all()
    serializer_class = AutorSerializer