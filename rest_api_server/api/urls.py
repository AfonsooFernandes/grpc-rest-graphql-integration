from django.urls import path
from api.views.file_views import FileUploadView, FileUploadChunksView
from .views.csvtoxml import csvtoxml
from .views.filterxml import FilterXml
from .views.users import GetAllUsers

urlpatterns = [
    path('upload-file/', FileUploadView.as_view(), name='upload-file'),
    path('upload-file/by-chunks', FileUploadChunksView.as_view(), name='upload-file-by-chunks'),
    path('csvtoxml/', csvtoxml.as_view(), name='csvtoxml'),
    path('filterxml/', FilterXml.as_view(), name='filterxml'),
    path('users/', GetAllUsers.as_view(), name='users')
]