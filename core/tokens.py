TOKEN_PATH = "/home/drdos/projects/stream/ttv-token.txt"

def store_token(token, refresh_token):
    with open(TOKEN_PATH, "w") as fh:
        fh.write(token + "\n")
        fh.write(refresh_token + "\n")
    return True

def load_token():
    try:
        with open(TOKEN_PATH) as fh:
            token = fh.readline().strip()
            refresh_token = fh.readline().strip()
        return (True, token, refresh_token)
    except FileNotFoundError:
        return (False, None, None)
