from django.apps import AppConfig
from django.core.cache import cache
from .core import get_stream_entries


class WozztConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'cdosstream'

    def ready(self):
        print("init.")
