const fs = require('fs');

const html = fs.readFileSync('content/pages/guest-lectures-and-public-speaking-events.html', 'utf8');
const events = [];

let currentYear = 'Upcoming';
let currentStatus = 'upcoming';

const lines = html.split('\n');
for (const line of lines) {
    if (line.includes('<h3>Upcoming Events</h3>')) {
        currentYear = 2026;
        currentStatus = 'upcoming';
    } else if (line.match(/<h3>(\d{4})<\/h3>/)) {
        currentYear = parseInt(line.match(/<h3>(\d{4})<\/h3>/)[1]);
        currentStatus = 'past';
    } else if (line.startsWith('<li>')) {
        let text = line.replace('<li>', '').replace('</li>', '').trim();
        
        let title = '';
        let host = '';
        let dateStr = '';
        let links = [];

        // Extract links first
        const linkRegex = /<a href="([^"]+)">\[?(.*?)\]?<\/a>\]?/g;
        let match;
        while ((match = linkRegex.exec(text)) !== null) {
            let type = match[2].replace('[', '').replace(']', '').trim();
            links.push({ type: type, url: match[1] });
        }
        
        // Remove links from text to parse the rest
        text = text.replace(/<a href="[^"]+">.*?<\/a>\]?/g, '').trim();

        // Extract host (in <em>)
        const emMatch = text.match(/<em>(.*?)<\/em>/);
        if (emMatch) {
            host = emMatch[1].trim();
            text = text.replace(emMatch[0], 'HOST_PLACEHOLDER');
        }

        // Split by '-' or '–'
        const parts = text.split(/\s*-\s*|\s*–\s*/);
        
        title = parts[0].trim();
        
        // Find the part that comes after the host placeholder
        let foundHost = false;
        for (let i = 1; i < parts.length; i++) {
            if (parts[i].includes('HOST_PLACEHOLDER')) {
                foundHost = true;
            } else if (foundHost && parts[i].trim() !== '') {
                dateStr += parts[i].trim() + ' ';
            }
        }
        dateStr = dateStr.trim();
        
        // Fallback if parsing missed something
        if (!dateStr && parts.length > 2) {
           dateStr = parts[parts.length - 1];
        }

        // Special fix for some strings
        if (title.endsWith('<strong>')) title = title.replace('<strong>', '').trim();
        
        events.push({
            title: title,
            host: host.replace(/<\/?strong>/g, ''),
            date: dateStr.replace(/<\/?strong>\.?/g, '').trim() || `Year ${currentYear}`,
            year: currentYear,
            status: currentStatus,
            links: links
        });
    }
}

fs.writeFileSync('data/speaking.json', JSON.stringify(events, null, 2));
console.log("Wrote " + events.length + " events to data/speaking.json");
