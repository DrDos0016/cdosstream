# Generated by Django 4.2.1 on 2024-07-18 17:05

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cdosstream', '0006_gemrule_response'),
    ]

    operations = [
        migrations.CreateModel(
            name='Audio_Info',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('key', models.CharField(max_length=100)),
                ('artist', models.CharField(max_length=100)),
                ('track', models.CharField(max_length=100)),
                ('url', models.CharField(blank=True, max_length=255)),
            ],
        ),
    ]