import os
import json
import shutil

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
POSTS_JSON_PATH = os.path.join(BASE_DIR, "data", "posts.json")

# Read slugs from posts.json
with open(POSTS_JSON_PATH, "r", encoding="utf-8") as f:
    posts = json.load(f)
post_slugs = [p["slug"] for p in posts]

# Pages slugs
page_slugs = [
    "a-few-words-about-me",
    "cv-francais",
    "guest-lectures-and-public-speaking-events",
    "inquiries",
    "playgrounds",
    "publications",
    "resume-cv",
    "resume-english",
    "standing-stones-and-megaliths-of-st-just"  # also this one was in the root/git status
]

folders_to_delete = post_slugs + page_slugs

print("Cleaning up old root directories in newsite/...")
for folder in folders_to_delete:
    target_path = os.path.join(BASE_DIR, folder)
    if os.path.exists(target_path) and os.path.isdir(target_path):
        print(f"Deleting old root folder: {target_path}")
        shutil.rmtree(target_path)

print("Cleanup complete!")
