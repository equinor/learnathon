// Central Reveal.js bootstrap - handles ALL CDN loading and initialization
// Update version here to update across all presentations
const REVEAL_VERSION = '5.2.1';
const CDN = `https://cdnjs.cloudflare.com/ajax/libs/reveal.js/${REVEAL_VERSION}`;

// Detect base path from the script's own URL so it works on GitHub Pages
// e.g. https://equinor.github.io/learnathon/assets/reveal-bootstrap.js → "/learnathon"
const SCRIPT_URL = new URL(import.meta.url);
const BASE = SCRIPT_URL.pathname.replace(/\/assets\/reveal-bootstrap\.js$/, '');

// Load all required CSS files
const stylesheets = [
  `${CDN}/reset.css`,
  `${CDN}/reveal.min.css`,
  `${CDN}/plugin/highlight/monokai.css`,
  `${BASE}/assets/sessions.css`
];

stylesheets.forEach(href => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
});

// Helper to load external scripts
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    script.referrerPolicy = 'no-referrer';
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

// Helper to get configuration from data attributes with defaults
function getConfig(attrName, defaultValue, parser = (v) => v) {
  const value = document.body.getAttribute(attrName);
  if (value === null) return defaultValue;
  try {
    return parser(value);
  } catch (e) {
    console.warn(`Invalid value for ${attrName}: "${value}". Using default: ${defaultValue}`);
    return defaultValue;
  }
}

// Initialize Reveal.js with content and plugins
async function initReveal() {
  try {
    // Load Reveal.js core first
    await loadScript(`${CDN}/reveal.min.js`);
    
    // Get content configuration from body attributes
    const contentAttr = document.body.getAttribute('data-content');
    const titleAttr = document.body.getAttribute('data-title');
    const faviconAttr = document.body.getAttribute('data-favicon');
    
    // Set page title if provided
    if (titleAttr) {
      document.title = titleAttr;
    }
    
    // Set favicon if provided
    if (faviconAttr) {
      // Remove existing favicon links to avoid duplicates
      document.querySelectorAll('link[rel*="icon"]').forEach(link => link.remove());
      
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = `${BASE}${faviconAttr}`;
      document.head.appendChild(link);
    }
    
    // Build slides from content attribute(s) if provided
    const slidesContainer = document.querySelector('.slides');
    const hasExistingSlides = slidesContainer.children.length > 0;
    
    if (contentAttr && !hasExistingSlides) {
      // Handle multiple content files (comma-separated or newline-separated)
      const contentPaths = contentAttr
        .split(/[,\n]/)
        .map(path => path.trim())
        .filter(path => path.length > 0);
      
      if (contentPaths.length === 0) {
        console.warn('data-content attribute is empty. No slides will be generated.');
      }
      
      contentPaths.forEach(contentPath => {
        const section = document.createElement('section');
        section.setAttribute('data-markdown', `${BASE}${contentPath}`);
        section.setAttribute('data-separator', '^-----');
        section.setAttribute('data-separator-vertical', '^---');
        section.setAttribute('data-separator-notes', '^--Speaker Note--');
        section.setAttribute('data-charset', 'utf-8');
        slidesContainer.appendChild(section);
      });
    } else if (!hasExistingSlides && !contentAttr) {
      console.error('No content found: Either provide data-content attribute or add <section> elements to .slides');
    }
    // If slides already exist in HTML, they are used as-is
    
    // Generate setting dropdown HTML from setting ID
    function generateSettingDropdownHtml(settingId) {
      return `<div class="setting-dropdown" data-setting-id="${settingId}" aria-expanded="false">
  <span class="setting-link-main">
    <svg class="codicon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M9.1 4.4L8.6 2H7.4l-.5 2.4-.7.3-2-1.3-.9.8 1.3 2-.2.7-2.4.5v1.2l2.4.5.3.8-1.3 2 .8.8 2-1.3.8.3.4 2.3h1.2l.5-2.4.8-.3 2 1.3.8-.8-1.3-2 .3-.8 2.3-.4V7.4l-2.4-.5-.3-.8 1.3-2-.8-.8-2 1.3-.7-.2zM8 11c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"/>
    </svg>
    ${settingId}
  </span>
  <button type="button" class="setting-dropdown-trigger" aria-haspopup="listbox" aria-label="Open setting in VS Code">
    <svg class="setting-dropdown-chevron" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M7.976 10.072l4.357-4.357.62.618L8.284 11h-.618L3 6.333l.619-.618 4.357 4.357z"/>
    </svg>
  </button>
  <ul class="setting-dropdown-menu" role="listbox" aria-label="Open setting">
    <li role="option" class="setting-action-item" data-version="stable" tabindex="0">Open in VS Code</li>
    <li role="option" class="setting-action-item" data-version="insiders" tabindex="0">Open in VS Code Insiders</li>
  </ul>
</div>`;
    }

    // Process @embed() and @setting() directives in markdown content
    async function processEmbeds() {
      const sections = document.querySelectorAll('section[data-markdown]');
      for (const section of sections) {
        const mdPath = section.getAttribute('data-markdown');
        if (!mdPath) continue;
        
        try {
          const response = await fetch(mdPath);
          if (!response.ok) continue;
          
          let content = await response.text();
          let hasChanges = false;
          
          // Process @setting(settingId) directives
          const settingRegex = /@setting\(([^)]+)\)/g;
          const settingMatches = [...content.matchAll(settingRegex)];
          
          for (const match of settingMatches) {
            const settingId = match[1].trim();
            const dropdownHtml = generateSettingDropdownHtml(settingId);
            content = content.replace(match[0], dropdownHtml);
            hasChanges = true;
          }
          
          // Find all @embed(/path/to/file) or @embed(/path/to/file, width=X) directives
          const embedRegex = /@embed\(([^,)]+)(?:,\s*([^)]+))?\)/g;
          const matches = [...content.matchAll(embedRegex)];
          
          for (const match of matches) {
            const embedPath = `${BASE}${match[1].trim()}`;
            const embedOptions = match[2] ? match[2].trim() : '';
            const fileExtension = embedPath.split('.').pop().toLowerCase();
            
            try {
              // Handle SVG files differently - convert to image syntax
              if (fileExtension === 'svg') {
                // Parse options like width=80%, height=400px
                let styleAttr = '';
                if (embedOptions) {
                  const styles = embedOptions.split(/\s+/).map(opt => {
                    const [key, value] = opt.split('=');
                    return value ? `${key}:${value}` : '';
                  }).filter(Boolean).join(';');
                  if (styles) {
                    styleAttr = ` <!-- .element style="${styles}" -->`;
                  }
                }
                // Replace @embed with markdown image syntax for SVGs
                content = content.replace(match[0], `![](${embedPath})${styleAttr}`);
              } else {
                // For MD and other text files, fetch and inline the content
                const embedResponse = await fetch(embedPath);
                if (embedResponse.ok) {
                  let embedContent = await embedResponse.text();
                  
                  // For markdown files, handle slide separators
                  if (fileExtension === 'md') {
                    // Remove leading/trailing whitespace but preserve internal structure
                    embedContent = embedContent.trim();
                  }
                  
                  content = content.replace(match[0], embedContent);
                } else {
                  console.warn(`Failed to embed file: ${embedPath}`);
                }
              }
            } catch (err) {
              console.warn(`Error embedding file ${embedPath}:`, err);
            }
          }
          
          if (matches.length > 0) {
            hasChanges = true;
          }
          
          // If we processed any directives, we need to inject the content directly
          if (hasChanges) {
            section.removeAttribute('data-markdown');
            section.innerHTML = `<script type="text/template">${content}</script>`;
            section.setAttribute('data-markdown', '');
            section.setAttribute('data-separator', '^-----');
            section.setAttribute('data-separator-vertical', '^---');
            section.setAttribute('data-separator-notes', '^--Speaker Note--');
          }
        } catch (err) {
          console.warn(`Error processing embeds for ${mdPath}:`, err);
        }
      }
    }
    
    // Process embeds before loading plugins
    await processEmbeds();
    
    // Load Mermaid library
    await loadScript('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js');
    
    // Load Reveal.js plugins dynamically
    const [
      { default: RevealMarkdown }, 
      { default: RevealHighlight }, 
      { default: RevealNotes }
    ] = await Promise.all([
      import(`${CDN}/plugin/markdown/markdown.esm.min.js`),
      import(`${CDN}/plugin/highlight/highlight.esm.min.js`),
      import(`${CDN}/plugin/notes/notes.esm.min.js`)
    ]);
    
    // Build configuration with overrides from data attributes
    const config = {
      history: true,
      // Allow per-presentation overrides via data attributes
      transition: getConfig('data-transition', 'fade'),
      transitionSpeed: getConfig('data-transition-speed', 'slow'),
      backgroundTransition: getConfig('data-background-transition', 'fade'),
      width: getConfig('data-width', 1200, parseInt),
      height: getConfig('data-height', null, parseInt),
      controls: getConfig('data-controls', true, (v) => v !== 'false'),
      progress: getConfig('data-progress', true, (v) => v !== 'false'),
      slideNumber: getConfig('data-slide-number', false, (v) => v === 'true'),
      plugins: [RevealMarkdown, RevealHighlight, RevealNotes]
    };
    
    // Remove null values
    Object.keys(config).forEach(key => config[key] === null && delete config[key]);
    
    // Initialize Reveal with configuration
    Reveal.initialize(config);
    
    // Function to render Mermaid diagrams
    const renderMermaid = () => {
      if (typeof mermaid === 'undefined') {
        console.error('Mermaid library not loaded');
        return;
      }
      
      console.log('Looking for Mermaid diagrams...');
      const codeBlocks = document.querySelectorAll('code');
      console.log(`Found ${codeBlocks.length} code blocks`);
      
      codeBlocks.forEach((block, index) => {
        const text = block.textContent.trim();
        // Check if it's a mermaid diagram
        if (text.startsWith('%%{init:') || text.startsWith('timeline') || text.startsWith('graph') || text.startsWith('flowchart') || text.startsWith('sequenceDiagram') || text.startsWith('mindmap')) {
          console.log(`Found Mermaid diagram ${index}:`, text.substring(0, 50));
          
          const id = `mermaid-diagram-${index}-${Date.now()}`;
          const container = document.createElement('div');
          container.className = 'mermaid-container';
          container.style.display = 'flex';
          container.style.justifyContent = 'center';
          container.style.alignItems = 'center';
          container.style.width = '100%';
          
          mermaid.render(id, text).then(result => {
            console.log(`Rendered diagram ${index}`);
            container.innerHTML = result.svg;
            const parent = block.parentElement;
            if (parent.tagName === 'PRE') {
              parent.replaceWith(container);
            } else {
              block.replaceWith(container);
            }
          }).catch(err => {
            console.error('Mermaid rendering error:', err);
            container.innerHTML = `<pre style="color: red;">Mermaid Error: ${err.message}</pre>`;
            const parent = block.parentElement;
            if (parent.tagName === 'PRE') {
              parent.replaceWith(container);
            } else {
              block.replaceWith(container);
            }
          });
        }
      });
    };
    
    // Initialize Mermaid after slides are loaded
    Reveal.on('ready', () => {
      if (typeof mermaid !== 'undefined') {
        mermaid.initialize({ 
          startOnLoad: false,
          theme: 'base',
          securityLevel: 'loose'
        });
        console.log('Mermaid initialized');
        
        // Wait for markdown to be fully processed
        setTimeout(renderMermaid, 1000);
      } else {
        console.error('Mermaid library not loaded');
      }
    });
    
    // Re-render on slide change to catch dynamically loaded slides
    Reveal.on('slidechanged', () => {
      setTimeout(renderMermaid, 100);
    });
    
    // Initialize VS Code setting dropdowns
    initSettingDropdowns();
    
    console.log('Reveal.js initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize Reveal.js:', error);
    // Display user-friendly error message
    const slidesContainer = document.querySelector('.slides');
    if (slidesContainer) {
      slidesContainer.innerHTML = `
        <section style="color: #ff6b6b;">
          <h2>⚠️ Presentation Loading Error</h2>
          <p>Failed to initialize the presentation.</p>
          <p style="font-size: 0.8em; font-family: monospace;">${error.message}</p>
          <p style="font-size: 0.7em;">Check the browser console for more details.</p>
        </section>
      `;
    }
  }
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initReveal);
} else {
  initReveal();
}

// VS Code Setting Dropdown functionality
function initSettingDropdowns() {
  // Close all dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.setting-dropdown')) {
      document.querySelectorAll('.setting-dropdown-menu.open').forEach(menu => {
        menu.classList.remove('open');
        menu.closest('.setting-dropdown')?.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // Handle dropdown toggle and item clicks using event delegation
  document.addEventListener('click', (e) => {
    const dropdown = e.target.closest('.setting-dropdown');
    if (!dropdown) return;

    const trigger = e.target.closest('.setting-dropdown-trigger');
    const actionItem = e.target.closest('.setting-action-item');
    const menu = dropdown.querySelector('.setting-dropdown-menu');
    const settingId = dropdown.dataset.settingId;

    if (trigger && menu) {
      e.stopPropagation();
      const isOpen = menu.classList.contains('open');
      
      // Close all other dropdowns first
      document.querySelectorAll('.setting-dropdown-menu.open').forEach(m => {
        if (m !== menu) {
          m.classList.remove('open');
          m.closest('.setting-dropdown')?.setAttribute('aria-expanded', 'false');
        }
      });
      
      // Toggle current dropdown
      menu.classList.toggle('open', !isOpen);
      dropdown.setAttribute('aria-expanded', !isOpen);
    }

    if (actionItem && settingId) {
      const version = actionItem.dataset.version;
      const protocol = version === 'insiders' ? 'vscode-insiders' : 'vscode';
      const url = `${protocol}://settings/${settingId}`;
      
      // Open the setting in VS Code
      window.open(url, '_blank');
      
      // Close the menu
      menu?.classList.remove('open');
      dropdown.setAttribute('aria-expanded', 'false');
    }
  });

  // Handle keyboard navigation
  document.addEventListener('keydown', (e) => {
    const openMenu = document.querySelector('.setting-dropdown-menu.open');
    if (!openMenu) return;

    const items = openMenu.querySelectorAll('.setting-action-item');
    const currentIndex = Array.from(items).findIndex(item => item === document.activeElement);

    switch (e.key) {
      case 'Escape':
        openMenu.classList.remove('open');
        openMenu.closest('.setting-dropdown')?.setAttribute('aria-expanded', 'false');
        openMenu.closest('.setting-dropdown')?.querySelector('.setting-dropdown-trigger')?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        items[Math.min(currentIndex + 1, items.length - 1)]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        items[Math.max(currentIndex - 1, 0)]?.focus();
        break;
      case 'Enter':
        if (document.activeElement.classList.contains('setting-action-item')) {
          document.activeElement.click();
        }
        break;
    }
  });
}

// Helper function to create setting dropdown HTML
// Usage: createSettingDropdown('chat.thinking.style')
window.createSettingDropdown = function(settingId) {
  return `
<div class="setting-dropdown" data-setting-id="${settingId}" aria-expanded="false">
  <span class="setting-link-main">
    <svg class="codicon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M9.1 4.4L8.6 2H7.4l-.5 2.4-.7.3-2-1.3-.9.8 1.3 2-.2.7-2.4.5v1.2l2.4.5.3.8-1.3 2 .8.8 2-1.3.8.3.4 2.3h1.2l.5-2.4.8-.3 2 1.3.8-.8-1.3-2 .3-.8 2.3-.4V7.4l-2.4-.5-.3-.8 1.3-2-.8-.8-2 1.3-.7-.2zM8 11c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z"/>
    </svg>
    ${settingId}
  </span>
  <button type="button" class="setting-dropdown-trigger" aria-haspopup="listbox" aria-label="Open setting in VS Code">
    <svg class="setting-dropdown-chevron" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M7.976 10.072l4.357-4.357.62.618L8.284 11h-.618L3 6.333l.619-.618 4.357 4.357z"/>
    </svg>
  </button>
  <ul class="setting-dropdown-menu" role="listbox" aria-label="Open setting">
    <li role="option" class="setting-action-item" data-version="stable" tabindex="0">Open in VS Code</li>
    <li role="option" class="setting-action-item" data-version="insiders" tabindex="0">Open in VS Code Insiders</li>
  </ul>
</div>`;
};
