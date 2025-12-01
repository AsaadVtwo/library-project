import requests

API_URL = "http://localhost:8000"

def create_initial_admin():
    email = "asaad.v2@gmail.com"
    password = "asaad"
    name = "Asaad"

    try:
        print(f"Connecting to {API_URL}...")
        response = requests.post(f"{API_URL}/auth/setup-admin", json={
            "email": email,
            "password": password,
            "name": name
        }, timeout=5)
        
        if response.status_code == 200:
            print(f"Successfully created initial admin.")
            print(f"Email: {email}")
            print(f"Password: {password}")
        elif response.status_code == 400:
            print("Admin already exists.")
        else:
            print(f"Failed to create admin: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the backend. Make sure 'run_backend.bat' is running.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_initial_admin()
