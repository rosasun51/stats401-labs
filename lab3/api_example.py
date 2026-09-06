import requests

url = "https://jsonplaceholder.typicode.com/posts"

response = requests.get(url, timeout=10)
response.raise_for_status()

data = response.json()

print(type(data))
print(len(data))
print(data[0])