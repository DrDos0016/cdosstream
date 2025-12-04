from django.db import models

from datetime import datetime


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
        SUB_GOAL_START_DATE = datetime(year=2025, month=11, day=29, hour=0, minute=0, second=0)
        sub_count = self.filter(kind="channelsubscribe", created_at__gte=SUB_GOAL_START_DATE).count()
        # channelsubscriptiongift means somebody gave a gift sub that then shows up as a channelsubscribe
        latest_subscriber = self.filter(kind="channelsubscribe").last()

        output = {"sub_count": sub_count, "latest_subscriber": "", "as_of": str(SUB_GOAL_START_DATE)}
        print("OUTPUT", output)

        if latest_subscriber:
            output["latest_subscriber"] = latest_subscriber.raw["event"]["user_name"]
        return output
