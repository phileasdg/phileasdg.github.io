---
title: "Example Markdown Post: Code, Math, and Media"
date: "2026-06-07T12:00"
tags: ["Markdown", "Tutorial", "Web Development", "Showcase"]
thumbnail: "media/imgs/hypergraph-plotter.png"
---

Welcome to the new Markdown publishing workflow! This example post showcases all the content types and formatting options you might want to use when writing your articles.

## 1. Text Formatting & Hierarchy
You can write headings, sub-headings, and standard body text with simple styling:

* **Bold Text:** Wrap text in double asterisks (`**bold**`).
* *Italic Text:* Wrap text in single asterisks (`*italic*`) or underscores (`_italic_`).
* `Inline Code`: Wrap code or terms in backticks (`` `code` ``).

### Subsection Checklist
1. Write the draft in Markdown.
2. Add YAML frontmatter at the top.
3. Commit and push!

---

## 2. Lists and Lists Items
You can create ordered and unordered lists easily:

- **Unordered List Item 1**
- **Unordered List Item 2**
  - Indented sub-items are also supported.
  - Another sub-item.

---

## 3. Code Blocks with Syntax Highlighting
Write multi-line code blocks with language-specific syntax highlighting (powered by Prism.js):

```javascript
// A simple JavaScript function to calculate the Fibonacci sequence
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // Outputs: 55
```

```python
# A simple Python class
class Agent:
    def __init__(self, name):
        self.name = name
        
    def greet(self):
        return f"Hello, I am {self.name}!"
```

---

## 4. Media & Embeds
You can embed images using Markdown syntax:

![Hypergraph Plotter Card Thumbnail](media/imgs/hypergraph-plotter.png)

You can also drop raw HTML blocks like video `<iframe>` embeds directly into the page:

<figure class="post__video">
  <iframe width="560" height="314" src="https://www.youtube.com/embed/mBQfjY_g-pI" frameborder="0" allowfullscreen></iframe>
</figure>

Enjoy writing!
