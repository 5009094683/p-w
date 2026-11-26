---
title: How the article pipeline is tested
description: A fixture article that lives only in the test suite. It proves that articles, feeds, structured data and code highlighting work before a real one is written.
date: 2026-01-15T09:30:00Z
updated: 2026-02-01T09:30:00Z
tags: [testing, publishing]
---

This article is never published. The test suite builds a copy of the site with this folder as its articles, then checks everything an article touches.

It links to [the projects](/projects) so that relative links can be checked in the feeds.

## What an article needs

- A page of its own, with a canonical address and a social image.
- An entry in the sitemap and in all three feeds.
- Structured data that names the author and both dates.

## Code is highlighted without inline styles

```ts
export function greet(name: string): string {
  return `Hello, ${name}`;
}
```

A table also has to survive the trip to Markdown:

| Format | Address    |
| ------ | ---------- |
| RSS    | /feed.xml  |
| Atom   | /feed.atom |
