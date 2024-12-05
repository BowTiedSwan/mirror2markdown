let markdownContent = '';

document.getElementById('convertBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  const result = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: convertToMarkdown
  });

  markdownContent = result[0].result;
  
  // Create blob and trigger download
  const blob = new Blob([markdownContent], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'article.md';
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('copyBtn').addEventListener('click', async () => {
  if (!markdownContent) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: convertToMarkdown
    });
    markdownContent = result[0].result;
  }
  
  await navigator.clipboard.writeText(markdownContent);
  alert('Copied to clipboard!');
});

function convertToMarkdown() {
  function processText(element) {
    let text = '';
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node.nodeName === 'BR') {
        text += '\n';
      } else if (node.nodeName === 'A') {
        text += `[${node.textContent}](${node.href})`;
      } else if (node.nodeName === 'STRONG' || node.nodeName === 'B') {
        text += `**${node.textContent}**`;
      } else if (node.nodeName === 'EM' || node.nodeName === 'I') {
        text += `*${node.textContent}*`;
      } else {
        text += processText(node);
      }
    }
    return text;
  }

  const article = document.querySelector('div._1sjywpl0._1sjywpl1.bc5nciih.bc5ncit1.bc5ncixh');
  if (!article) return 'Article not found';

  let markdown = '';

  // Process all elements
  for (const element of article.querySelectorAll('*')) {
    if (element.nodeName === 'H1') {
      markdown += `# ${processText(element)}\n\n`;
    } else if (element.nodeName === 'H2') {
      markdown += `## ${processText(element)}\n\n`;
    } else if (element.nodeName === 'H3') {
      markdown += `### ${processText(element)}\n\n`;
    } else if (element.nodeName === 'H4') {
      markdown += `#### ${processText(element)}\n\n`;
    } else if (element.nodeName === 'P') {
      markdown += `${processText(element)}\n\n`;
    } else if (element.nodeName === 'UL') {
      for (const li of element.querySelectorAll('li')) {
        markdown += `* ${processText(li)}\n`;
      }
      markdown += '\n';
    } else if (element.nodeName === 'FIGURE' && element.classList.contains('rehype-figure')) {
      const img = element.querySelector('img');
      if (img && img.src) {
        markdown += `Image [${img.src}]\n\n`;
      }
    }
  }

  return markdown.trim();
} 