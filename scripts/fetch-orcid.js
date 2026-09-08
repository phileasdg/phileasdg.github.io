import fs from 'fs';
import path from 'path';

const ORCID_ID = '0009-0002-1768-6574';
const ORCID_API_BASE = 'https://pub.orcid.org/v3.0';

// Mappings to internal blog posts where available
const POST_MAPPINGS = {
  'mathematics as human ecology': '/posts/mathematics-as-human-ecology/',
  'remotesensing paclet: gibs satellite imagery and appeears geographic data products': '/posts/remote-sensing-for-the-wolfram-language/'
};

export async function fetchOrcidPublications() {
  console.log(`Fetching ORCID publications for ${ORCID_ID}...`);
  let works = [];

  try {
    const res = await fetch(`${ORCID_API_BASE}/${ORCID_ID}/works`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      throw new Error(`ORCID API returned status ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const groups = data.group || [];

    for (const group of groups) {
      const summaries = group['work-summary'] || [];
      if (summaries.length === 0) continue;

      const summary = summaries[0];
      const putCode = summary['put-code'];

      // Fetch detailed work record for abstracts, contributors, bibtex
      let details = summary;
      try {
        const detailRes = await fetch(`${ORCID_API_BASE}/${ORCID_ID}/work/${putCode}`, {
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(8000)
        });
        if (detailRes.ok) {
          details = await detailRes.json();
        }
      } catch (e) {
        console.warn(`Could not fetch details for work ${putCode}:`, e.message);
      }

      // Title & subtitle
      const titleObj = details.title || summary.title || {};
      const title = titleObj.title?.value || '';
      const subtitle = titleObj.subtitle?.value || null;

      // Type
      const typeRaw = details.type || summary.type || '';
      const type = typeRaw
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      // Venue / Journal
      const journalTitle = details['journal-title']?.value || summary['journal-title']?.value || '';

      // Publication date
      const pubDateObj = details['publication-date'] || summary['publication-date'];
      let year = pubDateObj?.year?.value ? parseInt(pubDateObj.year.value, 10) : null;
      let month = pubDateObj?.month?.value || null;
      let day = pubDateObj?.day?.value || null;
      let formattedDate = '';
      if (year) {
        formattedDate = `${year}`;
        if (month) formattedDate += `-${month.padStart(2, '0')}`;
        if (day) formattedDate += `-${day.padStart(2, '0')}`;
      }

      // External IDs (DOI, ISBN)
      let doi = null;
      let doiUrl = null;
      let isbn = null;
      const externalIds = details['external-ids']?.['external-id'] || summary['external-ids']?.['external-id'] || [];
      for (const ext of externalIds) {
        if (ext['external-id-type']?.toLowerCase() === 'doi') {
          doi = ext['external-id-value'];
          doiUrl = ext['external-id-url']?.value || (doi ? `https://doi.org/${doi}` : null);
        } else if (ext['external-id-type']?.toLowerCase() === 'isbn') {
          isbn = ext['external-id-value'];
        }
      }

      // Citation / BibTeX
      let bibtex = null;
      if (details.citation?.['citation-type'] === 'bibtex') {
        bibtex = details.citation['citation-value'];
      }

      // Fallback year extraction from bibtex if date was empty
      if (!year && bibtex) {
        const yearMatch = bibtex.match(/year\s*=\s*\{?(\d{4})\}?/i) || bibtex.match(/date\s*=\s*\{?(\d{4})\}?/i);
        if (yearMatch) {
          year = parseInt(yearMatch[1], 10);
          formattedDate = `${year}`;
        }
      }

      // URL
      const url = details.url?.value || summary.url?.value || doiUrl;

      // Contributors
      const contribList = details.contributors?.contributor || [];
      const contributors = contribList.map(c => {
        return {
          name: c['credit-name']?.value || '',
          role: c['contributor-attributes']?.['contributor-role'] || 'author'
        };
      }).filter(c => c.name);

      // Description / Abstract
      let description = details['short-description'] || null;
      if (!description && bibtex) {
        const abstractMatch = bibtex.match(/abstract\s*=\s*\{([^}]+)\}/i);
        if (abstractMatch) {
          description = abstractMatch[1].trim();
        }
      }

      // Country
      const country = details['country']?.value || null;

      works.push({
        putCode,
        title,
        subtitle,
        type,
        journalTitle,
        publicationDate: formattedDate,
        year: year || 0,
        doi,
        doiUrl,
        isbn,
        url,
        contributors,
        description,
        country,
        bibtex
      });
    }

    // Sort descending by year / date
    works.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return (b.publicationDate || '').localeCompare(a.publicationDate || '');
    });

    // Cache structured data
    const outJsonPath = path.resolve('data/publications.json');
    fs.writeFileSync(outJsonPath, JSON.stringify(works, null, 2), 'utf8');
    console.log(`Saved ${works.length} publications to data/publications.json`);
  } catch (err) {
    console.warn(`Could not fetch fresh data from ORCID (${err.message}). Using local cache.`);
    const cachedPath = path.resolve('data/publications.json');
    if (fs.existsSync(cachedPath)) {
      try {
        works = JSON.parse(fs.readFileSync(cachedPath, 'utf8'));
        console.log(`Loaded ${works.length} cached publications from data/publications.json`);
      } catch (e) {
        console.error('Error reading cached data/publications.json:', e);
      }
    }
  }

  // Generate publication page HTML
  if (works.length > 0) {
    writePublicationsHtml(works);
  }

  return works;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatContributor(c) {
  let name = (c.name || '').trim();
  const role = (c.role || '').toLowerCase();
  
  if (/phileas/i.test(name) && /dazeley/i.test(name)) {
    name = 'Phileas Dazeley-Gaist';
  } else if (name.includes(',')) {
    const parts = name.split(',').map(p => p.trim());
    if (parts.length === 2) {
      name = `${parts[1]} ${parts[0]}`;
    }
  }

  const isMe = name === 'Phileas Dazeley-Gaist';
  let formatted = isMe ? `<strong>${name}</strong>` : escapeHtml(name);

  if (role === 'editor') {
    formatted += ' (ed.)';
  }

  return formatted;
}

function formatPubDate(dateStr, year) {
  if (!dateStr && year) return `${year}`;
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length >= 2) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mIdx = parseInt(parts[1], 10) - 1;
    if (mIdx >= 0 && mIdx < 12) {
      return `${months[mIdx]} ${parts[0]}`;
    }
  }
  return parts[0] || `${year}`;
}

function writePublicationsHtml(works) {
  const customPagePath = path.resolve('content/custom-pages/publications.html');

  let html = `<!-- title: Publications & Academic Writing -->
<!-- body_class: post-template -->
<!-- main_class: post -->

<div class="wrapper">
  <article class="content">
    <header class="content__header">
      <h1 class="content__title">Publications &amp; Academic Writing</h1>
    </header>
    <div class="content__inner">
      <div class="content__entry">
        <p class="pub-intro">
          My ORCID page: <a class="pub-orcid-link" href="https://orcid.org/${ORCID_ID}" target="_blank" rel="noopener noreferrer"><svg class="pub-orcid-icon" width="16" height="16" style="width: 1.05rem; height: 1.05rem; max-width: 1.05rem; max-height: 1.05rem; vertical-align: -0.15rem; display: inline-block; flex-shrink: 0;" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="#A6CE39" d="M256,128c0,70.7-57.3,128-128,128C57.3,256,0,198.7,0,128C0,57.3,57.3,0,128,0C198.7,0,256,57.3,256,128z"/><g fill="#FFFFFF"><path d="M86.3,186.2H70.9V79.1h15.4V186.2z"/><path d="M108.9,79.1h41.6c39.6,0,57,28.3,57,53.6c0,27.5-21.5,53.6-56.8,53.6h-41.8V79.1z M124.3,172.4h24.5c34.9,0,42.9-26.5,42.9-39.7c0-21.5-13.7-39.7-43-39.7h-24.4V172.4z"/><path d="M88.7,56.8c0,5.5-4.5,10.1-10.1,10.1c-5.6,0-10.1-4.6-10.1-10.1c0-5.6,4.5-10.1,10.1-10.1C84.2,46.7,88.7,51.2,88.7,56.8z"/></g></svg><span>https://orcid.org/${ORCID_ID}</span></a><br>
          Selected publications listed in reverse chronological order.
        </p>

        <div class="pub-list">
`;

  works.forEach((work, index) => {
    const titleEsc = escapeHtml(work.title);
    const subtitleEsc = work.subtitle ? escapeHtml(work.subtitle) : null;
    const typeEsc = escapeHtml(work.type || 'Publication');
    
    // Clean venue name
    let rawVenue = (work.journalTitle || '').replace(/\s*-\s*\d{4}$/, '').trim();
    const venueEsc = escapeHtml(rawVenue);
    
    const dateFormatted = formatPubDate(work.publicationDate, work.year);
    const targetUrl = work.doiUrl || work.url || '';

    // Clean author list
    const authorList = (work.contributors || []).map(formatContributor).join(', ');

    // Check blog post match
    const lowerTitle = (work.title || '').toLowerCase().trim();
    const blogPostUrl = POST_MAPPINGS[lowerTitle];

    // Meta line: Venue · Type · Date · DOI / ISBN
    const metaParts = [];
    if (venueEsc) metaParts.push(`<span class="pub-entry__venue">${venueEsc}</span>`);
    if (typeEsc) metaParts.push(`<span class="pub-entry__type">${typeEsc}</span>`);
    if (dateFormatted) metaParts.push(`<span class="pub-entry__date">${dateFormatted}</span>`);
    if (work.doi) {
      metaParts.push(`DOI: <a href="${escapeHtml(work.doiUrl || `https://doi.org/${work.doi}`)}" target="_blank" rel="noopener noreferrer">${escapeHtml(work.doi)}</a>`);
    } else if (work.url) {
      metaParts.push(`<a href="${escapeHtml(work.url)}" target="_blank" rel="noopener noreferrer">Link</a>`);
    }
    if (work.isbn) {
      metaParts.push(`ISBN: ${escapeHtml(work.isbn)}`);
    }
    const metaLine = metaParts.join(' <span class="pub-meta-sep">·</span> ');

    html += `          <article class="pub-entry" id="pub-${work.putCode || index}">
            <div class="pub-entry__title">
              ${targetUrl ? `<a href="${escapeHtml(targetUrl)}" target="_blank" rel="noopener noreferrer">${titleEsc}</a>` : titleEsc}${subtitleEsc ? `: <span class="pub-entry__subtitle">${subtitleEsc}</span>` : ''}
            </div>

            ${authorList ? `<div class="pub-entry__authors">${authorList}</div>` : ''}

            ${metaLine ? `<div class="pub-entry__meta">${metaLine}</div>` : ''}
          </article>
`;
  });

  html += `        </div>
      </div>
      <footer>
        <div class="content__tags-share"><aside class="content__share"></aside></div>
      </footer>
    </div>
  </article>
</div>\n`;

  fs.writeFileSync(customPagePath, html, 'utf8');
  console.log(`Updated ${customPagePath}`);
}

// Allow direct CLI execution
if (process.argv[1] && process.argv[1].endsWith('fetch-orcid.js')) {
  fetchOrcidPublications();
}
