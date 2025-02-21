from pyngrok import ngrok

def reverse_proxy_init(token, port):
    ngrok.set_auth_token(token)
    tunnel = ngrok.connect(port)
    reverse_proxy_url = tunnel.public_url.replace("http://", "https://")
    return reverse_proxy_url
