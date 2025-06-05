import os

from django.apps import AppConfig
from django.core.cache import cache
from .core import get_stream_entries


class WozztConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'cdosstream'

    def ready(self):
        print("init.")
        site_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        NOTES_FILE_PATH = os.path.join(site_root, "cdosstream", "static", "cdosstream", "stream-notes.txt")
        if not os.path.isfile(NOTES_FILE_PATH):
            with open(NOTES_FILE_PATH, "w") as fh:
                fh.write("")
