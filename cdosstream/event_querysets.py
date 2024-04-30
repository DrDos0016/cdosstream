from django.db import models


class Event_Queryset(models.QuerySet):
    def get_cheer_info(self):
        latest = self.filter(kind="channelcheer").last()

        count = 0
        max_cheer = 0
        greatest = ""
        for event in self.filter(kind="channelcheer"):
            count += event.raw["event"]["bits"]
            if event.raw["event"]["bits"] >= max_cheer:
                max_cheer = event.raw["event"]["bits"]
                greatest = event.raw["event"]["user_name"]

        output = {
            "count": count,
            "latest": "",
            "max": max_cheer,
            "greatest": greatest
        }

        if latest:
            output["latest"] = latest.raw["event"]["user_name"]

        return output

    def get_subscriber_info(self):
        sub_count = self.filter(kind="channelsubscribe").count()
        latest_subscriber = self.filter(kind="channelsubscribe").last()

        output = {"sub_count": sub_count, "latest_subscriber": ""}

        if latest_subscriber:
            output["latest_subscriber"] = latest_subscriber.raw["event"]["user_name"]
        return output
