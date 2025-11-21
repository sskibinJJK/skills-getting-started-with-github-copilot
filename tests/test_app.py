from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

# Test activities endpoint
def test_get_activities():
    response = client.get("/activities")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert "participants" in data["Chess Club"]
    assert len(data["Chess Club"]["participants"]) == 2

# Test signup endpoint
def test_signup_for_activity():
    email = "newstudent@mergington.edu"
    response = client.post(f"/activities/Chess Club/signup?email={email}")
    assert response.status_code == 200
    assert "Signed up" in response.json()["message"]
    # Check participant added
    response = client.get("/activities")
    assert email in response.json()["Chess Club"]["participants"]

# Test duplicate signup
def test_duplicate_signup():
    email = "alice@mergington.edu"
    response = client.post(f"/activities/Chess Club/signup?email={email}")
    assert response.status_code == 400
    assert "already signed up" in response.json()["detail"]

# Test unregister endpoint
def test_unregister_from_activity():
    email = "bob@mergington.edu"
    response = client.post(f"/activities/Chess Club/unregister?email={email}")
    assert response.status_code == 200
    assert "Unregistered" in response.json()["message"]
    # Check participant removed
    response = client.get("/activities")
    assert email not in response.json()["Chess Club"]["participants"]

# Test unregister not registered
def test_unregister_not_registered():
    email = "notfound@mergington.edu"
    response = client.post(f"/activities/Chess Club/unregister?email={email}")
    assert response.status_code == 400
    assert "not registered" in response.json()["detail"]

# Test activity capacity validation
def test_signup_activity_full():
    # Math Olympiad has max_participants of 10
    # Fill it up with students
    for i in range(8):  # Already has 2 participants, so add 8 more to reach 10
        email = f"student{i}@mergington.edu"
        response = client.post(f"/activities/Math Olympiad/signup?email={email}")
        assert response.status_code == 200
    
    # Try to add one more student when activity is full
    email = "overflow@mergington.edu"
    response = client.post(f"/activities/Math Olympiad/signup?email={email}")
    assert response.status_code == 400
    assert "Activity is full" in response.json()["detail"]
