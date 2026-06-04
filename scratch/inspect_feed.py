import os
import json

BASE_DIR = "/Users/phileasdazeleygaist/Desktop/My Websites/my blog/phileasdg.github.io"
FEED_JSON_PATH = os.path.join(BASE_DIR, "feed.json")

print(f"Reading feed.json from {FEED_JSON_PATH}...")
with open(FEED_JSON_PATH, "r", encoding="utf-8") as f:
    feed = json.load(f)

print("Feed Keys:", list(feed.keys()))
if "items" in feed and len(feed["items"]) > 0:
    first_item = feed["items"][0]
    print("\nFirst Item Keys:", list(first_item.keys()))
    print("\nSample values for first item:")
    for k in ["id", "url", "title", "date_published", "tags"]:
        print(f"  {k}: {first_item.get(k)}")
    content = first_item.get("content_html", "")
    print(f"  content_html length: {len(content)}")
    print(f"  content_html snippet: {content[:300]}...")
