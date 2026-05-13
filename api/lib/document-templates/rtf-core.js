/**
 * rtf-core.js
 * Fonctions partagées pour la génération RTF professionnelle.
 * Encodage Unicode (\uN?), color table brand, tableaux, séparateurs.
 */

/** Encode une chaîne pour RTF : Unicode pour tout caractère > 127 */
export function u(str) {
  return String(str || '').replace(/[^\x00-\x7F]/g, c => `\\u${c.charCodeAt(0)}?`);
}

/** Paragraphe RTF simple */
export function par(text, opts = {}) {
  const bold   = opts.bold   ? '\\b '         : '';
  const italic = opts.italic ? '\\i '         : '';
  const size   = opts.size   ? `\\fs${opts.size * 2} ` : '\\fs22 ';
  const cf     = opts.cf     ? `\\cf${opts.cf} ` : '\\cf1 ';
  const align  = opts.center ? '\\qc '        : opts.right ? '\\qr ' : '';
  const space  = opts.spaceAfter ? `\\sa${opts.spaceAfter} ` : '';
  const lines  = String(text || '').split('\n');
  return lines
    .map(l => `{\\pard ${align}${space}${bold}${italic}${size}${cf}${u(l)}\\par}`)
    .join('\n');
}

/** Ligne horizontale (séparateur) */
export function hrule(cf = 3) {
  return `{\\pard\\brdrb\\brdrs\\brdrw10\\brdrcf${cf}\\sa120 \\par}`;
}

/** En-tête de section colorée */
export function sectionHeader(title, cf = 2) {
  return [
    `{\\pard\\sa60\\sb180\\b\\fs24\\cf${cf} ${u(title)}\\par}`,
    hrule(cf),
  ].join('\n');
}

/** Ligne de tableau simple 2 colonnes (label gauche, valeur droite) */
export function kvRow(label, value, bold = false) {
  const b = bold ? '\\b ' : '';
  return (
    `{\\trowd\\trqc\\trgaph80` +
    `\\cellx4500\\cellx9000` +
    `{\\pard\\intbl\\f0\\fs21\\cf3 ${b}${u(label)}\\cell}` +
    `{\\pard\\intbl\\f0\\fs21\\cf1 ${b}${u(value)}\\cell}` +
    `\\row}`
  );
}

/**
 * Construit le document RTF complet.
 * @param {string} body - contenu RTF (paragraphes, tableaux)
 */
export function wrapRtf(body) {
  return (
    '{\\rtf1\\ansi\\ansicpg1252\\deff0\n' +
    '{\\fonttbl{\\f0\\fswiss\\fcharset0 Calibri;}{\\f1\\fswiss\\fcharset0 Arial;}}\n' +
    // cf1=noir  cf2=brand#2B5797  cf3=gris  cf4=bleu clair
    '{\\colortbl;\\red30\\green30\\blue30;\\red43\\green87\\blue151;\\red122\\green127\\blue154;\\red242\\green245\\blue252;}\n' +
    '\\margl1701\\margr1701\\margt1134\\margb1134\n' +
    '\\f0\\fs22\\cf1\n' +
    body +
    '\n}'
  );
}
