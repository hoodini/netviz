import type { TechStack } from '../types/network';

interface TechPattern {
  pattern: RegExp;
  tech: TechStack;
}

const TECH_PATTERNS: TechPattern[] = [
  // CDNs
  { pattern: /cdn\.jsdelivr\.net/i, tech: { name: 'jsDelivr', color: '#e84d3d', category: 'cdn' } },
  { pattern: /cdnjs\.cloudflare\.com/i, tech: { name: 'cdnjs', color: '#f48942', category: 'cdn' } },
  { pattern: /unpkg\.com/i, tech: { name: 'unpkg', color: '#fff', category: 'cdn' } },
  { pattern: /fastly/i, tech: { name: 'Fastly', color: '#ff282d', category: 'cdn' } },
  { pattern: /akamai/i, tech: { name: 'Akamai', color: '#009bde', category: 'cdn' } },
  { pattern: /cloudfront\.net/i, tech: { name: 'CloudFront', color: '#f79400', category: 'cdn' } },

  // Cloud providers
  { pattern: /cloudflare/i, tech: { name: 'Cloudflare', color: '#f38020', category: 'cloud' } },
  { pattern: /amazonaws\.com|aws\./i, tech: { name: 'AWS', color: '#ff9900', category: 'cloud' } },
  { pattern: /azure/i, tech: { name: 'Azure', color: '#0089d6', category: 'cloud' } },
  { pattern: /googleapis\.com/i, tech: { name: 'Google APIs', color: '#4285f4', category: 'api' } },
  { pattern: /gstatic\.com/i, tech: { name: 'Google Static', color: '#4285f4', category: 'cdn' } },
  { pattern: /google\.com|google\./i, tech: { name: 'Google', color: '#4285f4', category: 'api' } },
  { pattern: /firebase/i, tech: { name: 'Firebase', color: '#ffca28', category: 'cloud' } },
  { pattern: /vercel|\.vercel\.app/i, tech: { name: 'Vercel', color: '#fff', category: 'cloud' } },
  { pattern: /netlify/i, tech: { name: 'Netlify', color: '#00c7b7', category: 'cloud' } },

  // APIs
  { pattern: /api\.github\.com|github\.com|github\.io|githubusercontent/i, tech: { name: 'GitHub', color: '#f0f6fc', category: 'api' } },
  { pattern: /gitlab/i, tech: { name: 'GitLab', color: '#fc6d26', category: 'api' } },
  { pattern: /jsonplaceholder/i, tech: { name: 'JSONPlaceholder', color: '#22c55e', category: 'api' } },
  { pattern: /httpbin/i, tech: { name: 'HTTPBin', color: '#73dc8c', category: 'api' } },
  { pattern: /dummyjson/i, tech: { name: 'DummyJSON', color: '#ef4444', category: 'api' } },
  { pattern: /reqres\.in/i, tech: { name: 'ReqRes', color: '#6bbb7b', category: 'api' } },
  { pattern: /pokeapi/i, tech: { name: 'PokéAPI', color: '#ef5350', category: 'api' } },
  { pattern: /openai/i, tech: { name: 'OpenAI', color: '#10a37f', category: 'api' } },
  { pattern: /stripe/i, tech: { name: 'Stripe', color: '#635bff', category: 'api' } },

  // Analytics & tracking
  { pattern: /google-analytics|googletagmanager|analytics\.google/i, tech: { name: 'Google Analytics', color: '#e37400', category: 'analytics' } },
  { pattern: /hotjar/i, tech: { name: 'Hotjar', color: '#fd3a5c', category: 'analytics' } },
  { pattern: /sentry/i, tech: { name: 'Sentry', color: '#362d59', category: 'analytics' } },
  { pattern: /segment/i, tech: { name: 'Segment', color: '#52bd94', category: 'analytics' } },
  { pattern: /mixpanel/i, tech: { name: 'Mixpanel', color: '#7856ff', category: 'analytics' } },

  // Fonts
  { pattern: /fonts\.googleapis\.com|fonts\.gstatic\.com/i, tech: { name: 'Google Fonts', color: '#4285f4', category: 'font' } },
  { pattern: /use\.typekit/i, tech: { name: 'Adobe Fonts', color: '#ff0000', category: 'font' } },

  // Dev tools
  { pattern: /localhost|127\.0\.0\.1|0\.0\.0\.0/i, tech: { name: 'Localhost', color: '#a78bfa', category: 'dev' } },
  { pattern: /hot-update|\.hot-update\./i, tech: { name: 'HMR', color: '#f59e0b', category: 'dev' } },
];

export function detectTechStack(url: string, _headers?: Record<string, string>): TechStack {
  for (const { pattern, tech } of TECH_PATTERNS) {
    if (pattern.test(url)) {
      return tech;
    }
  }

  // Infer from file extension
  if (/\.(woff2?|ttf|otf|eot)(\?|$)/i.test(url)) {
    return { name: 'Fonts', color: '#e879f9', category: 'font' };
  }
  if (/\.(png|jpe?g|gif|svg|webp|ico|avif)(\?|$)/i.test(url)) {
    return { name: 'Images', color: '#fb923c', category: 'cdn' };
  }
  if (/\.(css)(\?|$)/i.test(url)) {
    return { name: 'Styles', color: '#38bdf8', category: 'cdn' };
  }
  if (/\.(js|mjs|ts|tsx)(\?|$)/i.test(url)) {
    return { name: 'Scripts', color: '#facc15', category: 'cdn' };
  }

  return { name: 'Server', color: '#94a3b8', category: 'generic' };
}

export function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}

export function getNodeTypeFromTech(tech: TechStack): 'cdn' | 'api' | 'server' {
  switch (tech.category) {
    case 'cdn':
    case 'font':
      return 'cdn';
    case 'api':
    case 'analytics':
      return 'api';
    default:
      return 'server';
  }
}

/** Draw a tech logo/icon on canvas. Returns the abbreviation used. */
export function drawTechIcon(
  ctx: CanvasRenderingContext2D,
  tech: TechStack,
  x: number,
  y: number,
  radius: number
): void {
  const abbrev = getTechAbbrev(tech.name);

  // Draw icon circle background
  ctx.beginPath();
  ctx.fillStyle = tech.color + '20';
  ctx.arc(x, y, radius * 0.65, 0, Math.PI * 2);
  ctx.fill();

  // Special shapes for well-known brands
  switch (tech.name) {
    case 'GitHub':
      drawGitHubIcon(ctx, x, y, radius * 0.5);
      return;
    case 'Google':
    case 'Google APIs':
    case 'Google Static':
    case 'Google Analytics':
    case 'Google Fonts':
      drawGoogleIcon(ctx, x, y, radius * 0.45);
      return;
    case 'Cloudflare':
      drawCloudflareIcon(ctx, x, y, radius * 0.5);
      return;
    case 'Vercel':
      drawVercelIcon(ctx, x, y, radius * 0.45);
      return;
    case 'Localhost':
    case 'HMR':
      drawDevIcon(ctx, x, y, radius * 0.5, tech.color);
      return;
    default:
      break;
  }

  // Fallback: colored letter(s)
  ctx.font = `bold ${radius * 0.7}px system-ui, sans-serif`;
  ctx.fillStyle = tech.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(abbrev, x, y + 1);
}

function getTechAbbrev(name: string): string {
  if (name.length <= 3) return name;
  const words = name.split(/\s+/);
  if (words.length >= 2) {
    return words.map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function drawGitHubIcon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  // Simplified octocat silhouette — circle with cat ears
  ctx.fillStyle = '#f0f6fc';
  ctx.beginPath();
  ctx.arc(x, y + r * 0.1, r * 0.8, 0, Math.PI * 2);
  ctx.fill();
  // Ears
  ctx.beginPath();
  ctx.moveTo(x - r * 0.65, y - r * 0.25);
  ctx.lineTo(x - r * 0.35, y - r * 0.85);
  ctx.lineTo(x - r * 0.1, y - r * 0.35);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + r * 0.65, y - r * 0.25);
  ctx.lineTo(x + r * 0.35, y - r * 0.85);
  ctx.lineTo(x + r * 0.1, y - r * 0.35);
  ctx.fill();
  // Eyes
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(x - r * 0.25, y + r * 0.05, r * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + r * 0.25, y + r * 0.05, r * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

function drawGoogleIcon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  const colors = ['#4285f4', '#ea4335', '#fbbc05', '#34a853'];
  const segments = 4;
  for (let i = 0; i < segments; i++) {
    ctx.beginPath();
    ctx.fillStyle = colors[i];
    ctx.moveTo(x, y);
    ctx.arc(x, y, r, (Math.PI * 2 * i) / segments - Math.PI / 2, (Math.PI * 2 * (i + 1)) / segments - Math.PI / 2);
    ctx.closePath();
    ctx.fill();
  }
  // Inner white circle
  ctx.beginPath();
  ctx.fillStyle = '#111827';
  ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
  ctx.fill();
  // G text
  ctx.font = `bold ${r * 1.1}px system-ui`;
  ctx.fillStyle = '#4285f4';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('G', x, y + 1);
}

function drawCloudflareIcon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  // Orange cloud shape
  ctx.fillStyle = '#f38020';
  ctx.beginPath();
  ctx.arc(x - r * 0.15, y, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + r * 0.3, y + r * 0.1, r * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - r * 0.45, y + r * 0.15, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Bottom rectangle
  ctx.fillRect(x - r * 0.75, y + r * 0.1, r * 1.45, r * 0.35);
}

function drawVercelIcon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  // White triangle
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(x, y - r * 0.7);
  ctx.lineTo(x + r * 0.7, y + r * 0.5);
  ctx.lineTo(x - r * 0.7, y + r * 0.5);
  ctx.closePath();
  ctx.fill();
}

function drawDevIcon(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  // Code brackets < / >
  ctx.strokeStyle = color;
  ctx.lineWidth = r * 0.18;
  ctx.lineCap = 'round';
  // <
  ctx.beginPath();
  ctx.moveTo(x - r * 0.15, y - r * 0.4);
  ctx.lineTo(x - r * 0.55, y);
  ctx.lineTo(x - r * 0.15, y + r * 0.4);
  ctx.stroke();
  // >
  ctx.beginPath();
  ctx.moveTo(x + r * 0.15, y - r * 0.4);
  ctx.lineTo(x + r * 0.55, y);
  ctx.lineTo(x + r * 0.15, y + r * 0.4);
  ctx.stroke();
}
