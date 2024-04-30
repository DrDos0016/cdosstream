EVENTSUB_FUNCTIONS = [
    {"func_name": "listen_channel_cheer", "args": ["broadcaster_user_id", "callback"], "name": "Cheers"},
    {"func_name": "listen_channel_follow_v2", "args": ["broadcaster_user_id", "moderator_user_id", "callback"], "name": "Follows"},
    {"func_name": "listen_channel_points_custom_reward_redemption_add", "args": ["broadcaster_user_id", "callback"], "name": "Channel Point Redeems"},
    {"func_name": "listen_channel_raid", "args": ["callback", "to_broadcaster_user_id"], "name": "Raids"},
    {"func_name": "listen_channel_subscribe", "args": ["broadcaster_user_id", "callback"], "name": "New Subscriptions"},
    {"func_name": "listen_channel_subscription_message", "args": ["broadcaster_user_id", "callback"], "name": "Resubs"},
    {"func_name": "listen_channel_subscription_gift", "args": ["broadcaster_user_id", "callback"], "name": "Gift Subscriptions"},
]


def prepare_eventsub_args(user_id, log_event):
    replacements = {
        "broadcaster_user_id": user_id,
        "callback": log_event,
        "moderator_user_id": user_id,
        "to_broadcaster_user_id": user_id,
    }
    for i in EVENTSUB_FUNCTIONS:
        for idx in range(0, len(i["args"])):
            i["args"][idx] = replacements.get(i["args"][idx])
