---
layout: default
title: Publications
description: arXiv preprints and conference proceedings by Yulong Cao.
permalink: /publications
publication_timeline: true
---

# Selected Publications

{% include selected-publications.html %}

{% assign publication_years = "2026,2025,2024,2023,2022,2021,2020,2019,2017" | split: "," %}
{% assign publication_count = 0 %}
{% for section in site.data.publications %}
  {% assign section_count = section.entries | size %}
  {% assign publication_count = publication_count | plus: section_count %}
{% endfor %}

<details class="publication-archive">
  <summary>
    <span>Full Publications</span>
    <span class="publication-count">{{ publication_count }} entries</span>
  </summary>

  <nav class="publication-timeline" aria-label="Publication timeline">
    {% for year in publication_years %}
      <a href="#publications-{{ year }}" data-publication-year="{{ year }}">{{ year }}</a>
    {% endfor %}
  </nav>

  <div class="publications full-publications">
    {% for year in publication_years %}
      <section class="publication-year-group" data-publication-year-section="{{ year }}">
        <h2 class="bibliography" id="publications-{{ year }}">{{ year }}</h2>
        <ol class="bibliography">
          {% for section in site.data.publications %}
            {% for publication in section.entries %}
              {% assign publication_year = publication.year | append: "" %}
              {% if publication_year == year %}
                <li>{% include publication-entry.html publication=publication %}</li>
              {% endif %}
            {% endfor %}
          {% endfor %}
        </ol>
      </section>
    {% endfor %}
  </div>
</details>
