TOKEN_PATH = "/home/drdos/projects/stream/ttv-token-{}.txt"

def store_token(token, refresh_token, streamer):
    token_path = get_token_path(streamer)
    with open(token_path, "w") as fh:
        fh.write(token + "\n")
        fh.write(refresh_token + "\n")
    return True

def load_token(streamer):
    token_path = get_token_path(streamer)
    try:
        with open(token_path) as fh:
            token = fh.readline().strip()
            refresh_token = fh.readline().strip()
        return (True, token, refresh_token)
    except FileNotFoundError:
        return (False, None, None)

def get_token_path(streamer):
    return TOKEN_PATH.format(streamer)
