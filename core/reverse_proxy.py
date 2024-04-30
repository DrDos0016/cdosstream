from pyngrok import ngrok

def reverse_proxy_init(token, port):
    print("Launching Reverse Proxy (ngrok)...")
    ngrok.set_auth_token(token)
    tunnel = ngrok.connect(port)
    reverse_proxy_url = tunnel.public_url.replace("http://", "https://")
    print(f"Reverse Proxy url: {reverse_proxy_url}")
    return reverse_proxy_url
