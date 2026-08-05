---
# You don't need to edit this file, it's empty on purpose.
# Edit theme's home layout instead if you wanna make some changes
# See: https://jekyllrb.com/docs/themes/#overriding-theme-defaults
layout: posts_dir
title: Blogs
permalink: /blogs
---

{% assign posts = site.posts %}
{% if posts.size > 0 %}
  {% for post in posts %}
  ## [{{ post.title }}]({{ post.url | relative_url }})

  <span class="post-date">{{ post.date | date: "%B %-d, %Y" }}</span>

  {% if post.description %}{{ post.description }}{% else %}{{ post.excerpt | strip_html | truncatewords: 28 }}{% endif %}
  {% endfor %}
{% else %}
No posts yet.
{% endif %}
