export function extractUrlsFromText(text: string): string[] {
  if (!text) return [];
  const urls: string[] = [];

  // 1. Extract links from HTML anchor tags if present
  if (text.includes('<a') && text.includes('href=')) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const anchors = doc.querySelectorAll('a');
      anchors.forEach(a => {
        let href = a.getAttribute('href') || a.href;
        if (href) {
          href = href.trim();
          if (!href.startsWith('http://') && !href.startsWith('https://')) {
            if (href.startsWith('www.') || href.includes('.')) {
              href = 'https://' + href;
            }
          }
          if (href.startsWith('http://') || href.startsWith('https://')) {
            urls.push(href);
          }
        }
      });
    } catch (e) {}
  }

  // 2. Regex search for URLs or domain patterns in plain text
  const urlRegex = /(https?:\/\/[^\s<>"'\(\)]+|(?:www\.)[^\s<>"'\(\)]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s<>"'\(\)]*)?)/gi;
  const matches = text.match(urlRegex) || [];

  for (let match of matches) {
    let clean = match.trim().replace(/[.,;!?)]+$/, '');
    if (!clean) continue;

    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      urls.push(clean);
    } else if (clean.startsWith('www.')) {
      urls.push('https://' + clean);
    } else if (clean.includes('.') && !clean.includes('@')) {
      const firstPart = clean.split('/')[0];
      const parts = firstPart.split('.');
      const tld = parts[parts.length - 1].toLowerCase();
      // Ensure it has a valid-looking TLD (length >= 2, only letters)
      if (tld.length >= 2 && /^[a-z]+$/.test(tld)) {
        urls.push('https://' + clean);
      }
    }
  }

  // Deduplicate array while preserving order
  return Array.from(new Set(urls));
}
