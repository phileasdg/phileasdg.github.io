// --- RENDER RESUME FROM JSON ---
export function renderResumeHTML(data) {
  let html = [];
  
  html.push('<div class="resume">');
  
  html.push('  <header class="resume__header">');
  html.push(`    <div class="resume__title-group">`);
  html.push(`      <h1 class="resume__name">${data.name}</h1>`);
  html.push(`      <p class="resume__tagline">${data.tagline}</p>`);
  html.push('    </div>');
  html.push('    <div class="resume__contact">');
  if (data.contact.email) {
    html.push(`      <div class="resume__contact-item"><svg class="resume__contact-icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/></svg><a href="mailto:${data.contact.email.replace('[at]', '@')}">${data.contact.email}</a></div>`);
  }
  if (data.contact.linkedin) {
    html.push(`      <div class="resume__contact-item"><svg class="resume__contact-icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" fill="currentColor"/></svg><a href="${data.contact.linkedin}" target="_blank" rel="noopener">${data.contact.linkedin.replace('https://www.linkedin.com/in/', 'linkedin.com/in/')}</a></div>`);
  }
  if (data.contact.github) {
    html.push(`      <div class="resume__contact-item"><svg class="resume__contact-icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" fill="currentColor"/></svg><a href="${data.contact.github}" target="_blank" rel="noopener">${data.contact.github.replace('https://github.com/', 'github.com/')}</a></div>`);
  }
  html.push('    </div>');
  html.push('  </header>');
  
  html.push('  <div class="resume__grid">');
  
  html.push('    <div class="resume__main">');
  
  if (data.work_experience && data.work_experience.length > 0) {
    const isFR = data.title === 'CV';
    const sectionTitle = isFR ? 'Expérience Professionnelle' : 'Work Experience';
    html.push(`      <section class="resume__section">`);
    html.push(`        <h2 class="resume__section-title">${sectionTitle}</h2>`);
    html.push('        <div class="resume__timeline">');
    data.work_experience.forEach(job => {
      html.push('        <div class="resume__item">');
      html.push('          <div class="resume__item-header">');
      html.push(`            <h3 class="resume__item-title">${job.role}</h3>`);
      html.push(`            <span class="resume__item-meta">${job.start_date} &ndash; ${job.end_date}</span>`);
      html.push('          </div>');
      html.push('          <div class="resume__item-subheader">');
      html.push(`            <span class="resume__item-company">${job.company}</span>`);
      html.push(`            <span class="resume__item-location">${job.location} &bull; ${job.type}</span>`);
      html.push('          </div>');
      html.push(`          <p class="resume__item-desc">${job.description}</p>`);
      html.push('        </div>');
    });
    html.push('        </div>');
    html.push('      </section>');
  }

  if (data.education && data.education.length > 0) {
    const isFR = data.title === 'CV';
    const sectionTitle = isFR ? 'Formation' : 'Education';
    html.push(`      <section class="resume__section">`);
    html.push(`        <h2 class="resume__section-title">${sectionTitle}</h2>`);
    html.push('        <div class="resume__timeline">');
    data.education.forEach(edu => {
      html.push('        <div class="resume__item">');
      html.push('          <div class="resume__item-header">');
      html.push(`            <h3 class="resume__item-title">${edu.institution}</h3>`);
      html.push(`            <span class="resume__item-meta">${edu.start_date} &ndash; ${edu.end_date}</span>`);
      html.push('          </div>');
      html.push('          <div class="resume__item-subheader">');
      html.push(`            <span class="resume__item-degree">${edu.degree}${edu.meta ? ' &bull; ' + edu.meta : ''}</span>`);
      html.push(`            <span class="resume__item-location">${edu.location}</span>`);
      html.push('          </div>');
      if (edu.description) {
        html.push(`          <p class="resume__item-desc">${edu.description}</p>`);
      }
      if (edu.courses && edu.courses.length > 0) {
        const coursesTitle = isFR ? 'Cours notables :' : 'Noteworthy Courses:';
        html.push(`          <div class="resume__courses"><strong>${coursesTitle}</strong> ${edu.courses.join(', ')}</div>`);
      }
      html.push('        </div>');
    });
    html.push('        </div>');
    html.push('      </section>');
  }

  if (data.teaching_experience && data.teaching_experience.length > 0) {
    const isFR = data.title === 'CV';
    const sectionTitle = isFR ? "Expérience d'Enseignement" : 'Teaching Experience';
    html.push(`      <section class="resume__section">`);
    html.push(`        <h2 class="resume__section-title">${sectionTitle}</h2>`);
    html.push('        <div class="resume__timeline">');
    data.teaching_experience.forEach(teach => {
      html.push('        <div class="resume__item">');
      html.push('          <div class="resume__item-header">');
      html.push(`            <h3 class="resume__item-title">${teach.role}</h3>`);
      html.push(`            <span class="resume__item-meta">${teach.dates}</span>`);
      html.push('          </div>');
      html.push('        </div>');
    });
    html.push('        </div>');
    html.push('      </section>');
  }

  if (data.publications && data.publications.length > 0) {
    const isFR = data.title === 'CV';
    const sectionTitle = isFR ? 'Publications' : 'Publications';
    html.push(`      <section class="resume__section">`);
    html.push(`        <h2 class="resume__section-title">${sectionTitle}</h2>`);
    html.push('        <ul class="resume__list">');
    data.publications.forEach(pub => {
      html.push(`          <li>${pub.citation}</li>`);
    });
    html.push('        </ul>');
    html.push('      </section>');
  }

  if (data.leadership_volunteering && data.leadership_volunteering.length > 0) {
    const isFR = data.title === 'CV';
    const sectionTitle = isFR ? 'Leadership, Collaboration et Bénévolat' : 'Leadership, Collaboration, and Volunteering';
    html.push(`      <section class="resume__section">`);
    html.push(`        <h2 class="resume__section-title">${sectionTitle}</h2>`);
    html.push('        <ul class="resume__list">');
    data.leadership_volunteering.forEach(item => {
      html.push(`          <li>${item}</li>`);
    });
    html.push('        </ul>');
    html.push('      </section>');
  }

  html.push('    </div>');

  html.push('    <div class="resume__sidebar">');

  if (data.skills && data.skills.length > 0) {
    const isFR = data.title === 'CV';
    const sectionTitle = isFR ? 'Compétences Clés' : 'Highlighted Skills';
    html.push(`      <section class="resume__section">`);
    html.push(`        <h2 class="resume__section-title">${sectionTitle}</h2>`);
    html.push('        <div class="resume__skills-container">');
    data.skills.forEach(skill => {
      html.push(`          <span class="resume__skill-tag">${skill}</span>`);
    });
    html.push('        </div>');
    html.push('      </section>');
  }

  if (data.languages && data.languages.length > 0) {
    const isFR = data.title === 'CV';
    const sectionTitle = isFR ? 'Langues' : 'Language Proficiency';
    html.push(`      <section class="resume__section">`);
    html.push(`        <h2 class="resume__section-title">${sectionTitle}</h2>`);
    html.push('        <ul class="resume__list-simple">');
    data.languages.forEach(lang => {
      html.push(`          <li><strong>${lang.language}</strong>: ${lang.proficiency}</li>`);
    });
    html.push('        </ul>');
    html.push('      </section>');
  }

  if (data.references && data.references.length > 0) {
    const isFR = data.title === 'CV';
    const sectionTitle = isFR ? 'Références (Disponibles sur demande)' : 'References (Available Upon Request)';
    html.push(`      <section class="resume__section">`);
    html.push(`        <h2 class="resume__section-title">${sectionTitle}</h2>`);
    html.push('        <ul class="resume__list-simple">');
    data.references.forEach(ref => {
      html.push(`          <li>`);
      html.push(`            <div class="resume__ref-name">${ref.name}</div>`);
      html.push(`            <div class="resume__ref-title">${ref.title}</div>`);
      html.push(`          </li>`);
    });
    html.push('        </ul>');
    html.push('      </section>');
  }

  html.push('    </div>');
  html.push('  </div>');
  html.push('</div>');

  return html.join('\n');
}
