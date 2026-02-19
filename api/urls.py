from django.urls import path
from .views import BookSearchView, BookDetailView

urlpatterns = [
    path('books/search', BookSearchView.as_view(), name='book-search'),
    path('books/detail', BookDetailView.as_view(), name='book-detail'),
]
