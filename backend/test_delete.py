import requests

# Login first
login_resp = requests.post(
    "http://localhost:8000/api/v1/auth/demo-login",
    json={}
)

if login_resp.status_code == 200:
    token = login_resp.json()["data"]["token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Try to delete a task
    task_id = "b32afafa-7598-4044-9fdc-81063aef174d"
    delete_resp = requests.delete(
        f"http://localhost:8000/api/v1/tasks/{task_id}",
        headers=headers
    )
    
    print(f"Status: {delete_resp.status_code}")
    print(f"Response: {delete_resp.text}")
else:
    print(f"Login failed: {login_resp.status_code}")
    print(login_resp.text)
