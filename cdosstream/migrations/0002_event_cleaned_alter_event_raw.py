# Generated by Django 4.1.2 on 2022-10-14 20:07

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cdosstream', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='cleaned',
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='event',
            name='raw',
            field=models.JSONField(blank=True, null=True),
        ),
    ]
