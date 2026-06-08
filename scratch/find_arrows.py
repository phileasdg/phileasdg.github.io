import os
from bs4 import BeautifulSoup

path = "/Users/phileasdazeleygaist/Desktop/My Websites/my blog/phileasdg.github.io/index.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

soup = BeautifulSoup(content, 'html.parser')

# Print all text nodes that have '<<' or similar
print("--- Searching for text nodes containing '<<' ---")
for text_node in soup.find_all(text=True):
    parent = text_node.parent.name if text_node.parent else "None"
    text = text_node.strip()
    if '<<' in text or '>>' in text:
        print(f"Parent: {parent} | Text: '{text}'")

print("--- Searching for elements with '<<' in attributes ---")
for el in soup.find_all():
    for attr, val in el.attrs.items():
        if isinstance(val, str) and ('<<' in val or '>>' in val):
            print(f"Tag: {el.name} | Attr: {attr} | Val: '{val}'")
        elif isinstance(val, list) and any('<<' in v or '>>' in v for v in val):
            print(f"Tag: {el.name} | Attr: {attr} | Val: {val}")

print("Done scanning index.html")
