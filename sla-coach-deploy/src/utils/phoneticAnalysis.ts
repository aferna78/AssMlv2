/**
 * Phonetic Analysis & Alignment Utility for Assimil English Exercises.
 * Evaluates spoken phrases against target exercise sentences,
 * detects word-by-word phonetic discrepancies, provides Assimil-style
 * figured pronunciation tips, and calculates accuracy scores.
 */

export interface WordPhoneticResult {
  word: string;
  cleanWord: string;
  status: 'correct' | 'mispronounced' | 'missing';
  spokenVariant?: string;
  assimilPhonetic?: string;
  phoneticTip?: string;
  similarity: number; // 0 to 1
}

export interface PhoneticEvaluationResult {
  targetSentence: string;
  spokenTranscript: string;
  score: number; // 0 to 100
  words: WordPhoneticResult[];
  perfectCount: number;
  totalWords: number;
  overallFeedback: string;
  feedbackLevel: 'perfect' | 'good' | 'needs_practice';
  tipsForImprovement: string[];
}

// Common English phonetic patterns & tips for Spanish native speakers (Assimil pedagogical focus)
const PHONETIC_TIPS_MAP: Record<string, { phonetic: string; tip: string }> = {
  the: { phonetic: 'de / di', tip: 'Sonido "th" sonoro: apoya la punta de la lengua contra los incisivos superiores y haz vibrar las cuerdas vocales.' },
  this: { phonetic: 'dis', tip: '"th" sonoro inicial. Cuidado con la "i", es breve y relajada, no una "i" tensa española.' },
  that: { phonetic: 'dat', tip: '"th" sonoro. La "a" es abierta entre "a" y "e".' },
  these: { phonetic: 'diis', tip: 'Vocal larga /ii/ con leve sonrisa y la "s" final suena como un zumbido sonoro /z/.' },
  those: { phonetic: 'dous', tip: 'Diptongo /ou/ británico y "th" sonoro inicial.' },
  there: { phonetic: 'dér', tip: '"th" sonoro inicial. La "r" final británica es suave o muda.' },
  they: { phonetic: 'dei', tip: '"th" sonoro + diptongo /ei/.' },
  their: { phonetic: 'dér', tip: 'Homófono de "there". "th" sonoro inicial.' },
  three: { phonetic: 'zrii', tip: '"th" sorda (como la "z" castellana): saca levemente la punta de la lengua entre los dientes y vocal larga /ii/.' },
  thank: { phonetic: 'zenk', tip: '"th" sorda inicial como la "z" española.' },
  thanks: { phonetic: 'zenks', tip: '"th" sorda inicial como la "z" española.' },
  house: { phonetic: 'jáus', tip: 'La "h" no es muda en inglés: expira aire suavemente desde la garganta /j/.' },
  here: { phonetic: 'jier', tip: '"h" aspirada suave + diptongo /ie/.' },
  he: { phonetic: 'ji', tip: '"h" aspirada suave + vocal /i/.' },
  his: { phonetic: 'jis', tip: '"h" aspirada suave. La "s" final vibra suavemente.' },
  have: { phonetic: 'jav', tip: '"h" aspirada suave. La "v" se produce mordiendo levemente el labio inferior con los dientes superiores.' },
  has: { phonetic: 'jas', tip: '"h" aspirada suave.' },
  where: { phonetic: 'uér / wéar', tip: 'La "w" suena como una "u" semiconsonántica redondeando los labios. En UK la "r" final es muda.' },
  we: { phonetic: 'ui', tip: 'Labios redondeados para la "w", pasando a una "i" larga.' },
  "we're": { phonetic: 'uir', tip: 'Contracción natural: una sola sílaba fluida /uir/.' },
  "where's": { phonetic: 'uérs', tip: 'Contracción fluida: /uérs/.' },
  "it's": { phonetic: 'its', tip: 'Vocal corta y "ts" nítido al final.' },
  "isn't": { phonetic: 'isnt', tip: 'No vocalices una vocal extra entre la "n" y la "t": /isnt/.' },
  "aren't": { phonetic: 'arnt', tip: 'Vocal abierta /aa/ y terminación /rnt/ compacta.' },
  "you're": { phonetic: 'iur', tip: 'Contracción de una sílaba: /iur/.' },
  "i'm": { phonetic: 'aim', tip: 'Diptongo claro /ai/ cerrando bien los labios en la "m".' },
  trees: { phonetic: 'triiz', tip: '"tr" ligeramente africada y vocal larga /ii/ con terminación sonora /z/.' },
  tree: { phonetic: 'trii', tip: 'Vocal larga /ii/.' },
  near: { phonetic: 'níar', tip: 'Diptongo /ia/ con acento en la "í". Recuerda que en inglés "near" no lleva preposición (near the house).' },
  father: { phonetic: 'fáader', tip: 'La "a" es larga y profunda /aa/, y la "th" es sonora /d/.' },
  john: { phonetic: 'dchon', tip: 'La "J" inglesa suena como /dch/ enérgica, nunca como la "j" española.' },
  doctor: { phonetic: 'doktor', tip: 'La "o" británica es corta y redondeada.' },
  polite: { phonetic: 'polait', tip: 'El acento recae en la segunda sílaba: po-LAIT con diptongo /ai/.' },
  brother: { phonetic: 'bráder', tip: 'La "o" suena a vocal corta central /a/, y la "th" es sonora /d/.' },
  difficult: { phonetic: 'difikalt', tip: 'Acento en la primera sílaba: DI-fi-kalt.' },
  easy: { phonetic: 'iisi', tip: 'Vocal larga inicial /ii/ y la "s" intervocálica suena sonora /z/.' },
  pretty: { phonetic: 'priti', tip: 'La "e" se pronuncia como "i": /priti/.' },
  kind: { phonetic: 'kaind', tip: 'Diptongo /ai/ y no olvides pronunciar la "d" final.' },
  book: { phonetic: 'buk', tip: 'La "oo" aquí es una "u" corta y relajada, no larga.' },
  books: { phonetic: 'buks', tip: '"u" corta y terminación /ks/.' },
  paper: { phonetic: 'peiper', tip: 'Diptongo /ei/ en la primera sílaba: PEI-per.' },
  papers: { phonetic: 'peipers', tip: 'Diptongo /ei/ y "s" suave final.' },
  table: { phonetic: 'teibl', tip: 'Diptongo /ei/ y "l" silábica final: TEI-bl.' },
  interesting: { phonetic: 'intresting', tip: '¡Atención! En inglés británico tiene 3 sílabas (IN-tres-ting), la primera "e" no se pronuncia.' },
  very: { phonetic: 'veri', tip: 'La "v" inglesa se pronuncia apoyando los dientes superiores en el labio inferior, diferente de la "b".' },
  excellent: { phonetic: 'ekselent', tip: 'Acento en la primera sílaba: EK-se-lent.' },
};

// Contraction normalizations for speech recognition
const CONTRACTIONS_EXPANSIONS: Record<string, string[]> = {
  "we're": ['we', 'are'],
  "where's": ['where', 'is'],
  "it's": ['it', 'is'],
  "isn't": ['is', 'not'],
  "aren't": ['are', 'not'],
  "you're": ['you', 'are'],
  "i'm": ['i', 'am'],
  "he's": ['he', 'is'],
  "she's": ['she', 'is'],
  "they're": ['they', 'are'],
  "there's": ['there', 'is'],
  "what's": ['what', 'is'],
  "that's": ['that', 'is'],
  "don't": ['do', 'not'],
  "doesn't": ['does', 'not'],
  "can't": ['cannot', 'can', 'not'],
};

/**
 * Clean a word: lowercase, strip punctuation
 */
export function cleanToken(word: string): string {
  return word
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, '')
    .trim();
}

/**
 * Calculate Levenshtein similarity (0 to 1)
 */
export function calculateStringSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;

  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return Math.max(0, 1 - distance / maxLen);
}

/**
 * Check if spoken token matches target token taking into account
 * contractions, homophones, and phonetic variations.
 */
export function isPhoneticMatch(target: string, spoken: string): { match: boolean; similarity: number } {
  const t = cleanToken(target);
  const s = cleanToken(spoken);

  if (t === s) return { match: true, similarity: 1.0 };

  // Common phonetic equivalents in SpeechRecognition
  const equivalents: [string, string][] = [
    ["we're", 'we are'],
    ["where's", 'where is'],
    ["it's", 'it is'],
    ["isn't", 'is not'],
    ["aren't", 'are not'],
    ["you're", 'you are'],
    ["i'm", 'i am'],
    ['there', 'their'],
    ['their', 'theyre'],
    ['two', 'to'],
    ['two', 'too'],
    ['for', 'four'],
    ['here', 'hear'],
    ['no', 'know'],
    ['new', 'knew'],
    ['hour', 'our'],
    ['right', 'write'],
  ];

  for (const [a, b] of equivalents) {
    if ((t === a && s === b) || (t === b && s === a)) {
      return { match: true, similarity: 0.95 };
    }
  }

  const similarity = calculateStringSimilarity(t, s);
  // High similarity (e.g. slight plural or consonant inflection like 'tree' / 'trees' or minor typo)
  if (similarity >= 0.82) {
    return { match: true, similarity };
  }

  return { match: false, similarity };
}

/**
 * Main Phonetic Evaluation Function
 * Compares target sentence and user spoken transcript.
 */
export function evaluateExercisePhonetics(
  targetSentence: string,
  spokenTranscript: string,
  lessonPhoneticText?: string
): PhoneticEvaluationResult {
  // Strip speaker labels like "1 — " or dashes if present
  const cleanTargetSentence = targetSentence
    .replace(/^\s*\d+\s*[—–-]\s*/, '')
    .trim();

  // Split target words keeping original punctuation for display
  const rawTargetWords = cleanTargetSentence
    .split(/\s+/)
    .filter((w) => w.trim().length > 0);

  // Split spoken transcript into normalized words
  const cleanSpokenWords = spokenTranscript
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0);

  // Word-by-word evaluation using greedy phonetic alignment
  const wordsResult: WordPhoneticResult[] = [];
  const usedSpokenIndices = new Set<number>();
  const tipsCollected = new Set<string>();

  rawTargetWords.forEach((rawWord, targetIdx) => {
    const cleanW = cleanToken(rawWord);
    if (!cleanW) return;

    let bestMatchIdx = -1;
    let bestSimilarity = 0;

    // Search window in spoken words around expected position
    for (let sIdx = 0; sIdx < cleanSpokenWords.length; sIdx++) {
      if (usedSpokenIndices.has(sIdx)) continue;

      const spokenWord = cleanSpokenWords[sIdx];
      const { match, similarity } = isPhoneticMatch(cleanW, spokenWord);

      if (match && similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatchIdx = sIdx;
      }
    }

    // Check contraction multi-word match (e.g. target "we're" vs spoken "we" + "are")
    if (bestMatchIdx === -1 && CONTRACTIONS_EXPANSIONS[cleanW]) {
      const parts = CONTRACTIONS_EXPANSIONS[cleanW];
      const part1Idx = cleanSpokenWords.findIndex((sw, idx) => !usedSpokenIndices.has(idx) && sw === parts[0]);
      if (part1Idx !== -1 && cleanSpokenWords[part1Idx + 1] === parts[1]) {
        bestMatchIdx = part1Idx;
        bestSimilarity = 0.95;
        usedSpokenIndices.add(part1Idx);
        usedSpokenIndices.add(part1Idx + 1);
      }
    }

    // Lookup Assimil phonetic tip
    const knownTip = PHONETIC_TIPS_MAP[cleanW];
    let assimilPhonetic = knownTip?.phonetic;
    let phoneticTip = knownTip?.tip;

    // If no specific dictionary match, generate standard Assimil figured approximation
    if (!assimilPhonetic) {
      assimilPhonetic = approximateAssimilPhonetic(cleanW);
    }
    if (!phoneticTip) {
      phoneticTip = generateGeneralPhoneticTip(cleanW);
    }

    if (bestMatchIdx !== -1) {
      usedSpokenIndices.add(bestMatchIdx);
      const spokenVariant = cleanSpokenWords[bestMatchIdx];
      wordsResult.push({
        word: rawWord,
        cleanWord: cleanW,
        status: 'correct',
        spokenVariant,
        assimilPhonetic,
        phoneticTip,
        similarity: bestSimilarity,
      });
    } else {
      // Find closest spoken word that wasn't used to provide diagnostic feedback
      let closestUnusedWord = '';
      let closestSim = 0;
      cleanSpokenWords.forEach((sw, idx) => {
        if (!usedSpokenIndices.has(idx)) {
          const sim = calculateStringSimilarity(cleanW, sw);
          if (sim > closestSim) {
            closestSim = sim;
            closestUnusedWord = sw;
          }
        }
      });

      const isMispronounced = closestSim >= 0.45 && closestUnusedWord.length > 0;
      wordsResult.push({
        word: rawWord,
        cleanWord: cleanW,
        status: isMispronounced ? 'mispronounced' : 'missing',
        spokenVariant: isMispronounced ? closestUnusedWord : undefined,
        assimilPhonetic,
        phoneticTip,
        similarity: closestSim,
      });

      if (phoneticTip) {
        tipsCollected.add(`**${rawWord}** (${assimilPhonetic}): ${phoneticTip}`);
      }
    }
  });

  const totalWords = wordsResult.length;
  const perfectCount = wordsResult.filter((w) => w.status === 'correct').length;
  const score = totalWords > 0 ? Math.round((perfectCount / totalWords) * 100) : 0;

  let feedbackLevel: 'perfect' | 'good' | 'needs_practice' = 'needs_practice';
  let overallFeedback = '';

  if (score === 100) {
    feedbackLevel = 'perfect';
    overallFeedback = '¡Pronunciación sobresaliente! Has articulado todas las palabras con precisión británica.';
  } else if (score >= 75) {
    feedbackLevel = 'good';
    overallFeedback = `¡Muy buen intento (${score}%)! Has pronunciado bien la mayoría de las palabras. Revisa los detalles en rojo/ámbar para perfeccionar tu entonación.`;
  } else {
    feedbackLevel = 'needs_practice';
    overallFeedback = `Precisión del ${score}%. Escucha el modelo nativo, practica las palabras señaladas y repite la prueba para consolidar tu oído y habla.`;
  }

  return {
    targetSentence: cleanTargetSentence,
    spokenTranscript,
    score,
    words: wordsResult,
    perfectCount,
    totalWords,
    overallFeedback,
    feedbackLevel,
    tipsForImprovement: Array.from(tipsCollected).slice(0, 3),
  };
}

/**
 * Generate heuristic Assimil phonetic spelling for any English word
 */
function approximateAssimilPhonetic(word: string): string {
  let p = word.toLowerCase();

  p = p.replace(/th/g, 'z');
  p = p.replace(/sh/g, 'sh');
  p = p.replace(/ch/g, 'ch');
  p = p.replace(/ph/g, 'f');
  p = p.replace(/ee|ea/g, 'ii');
  p = p.replace(/oo/g, 'u');
  p = p.replace(/ai|ay/g, 'ei');
  p = p.replace(/igh/g, 'ai');
  p = p.replace(/kn/g, 'n');
  p = p.replace(/wr/g, 'r');
  p = p.replace(/j/g, 'dch');
  p = p.replace(/qu/g, 'cu');

  return `/${p}/`;
}

/**
 * Generate specific phonetic tip based on sound combinations
 */
function generateGeneralPhoneticTip(word: string): string {
  const w = word.toLowerCase();
  if (w.startsWith('th')) {
    return 'Recuerda el diptongo "th": saca ligeramente la punta de la lengua entre los incisivos.';
  }
  if (w.startsWith('h')) {
    return 'La "h" no es muda en inglés: expira aire suavemente como empañando un espejo.';
  }
  if (w.includes('ee') || w.includes('ea')) {
    return 'Sonido vocálico largo /ii/: sonríe levemente al pronunciarlo.';
  }
  if (w.endsWith('ed')) {
    return 'Terminación en pasado: no agregues una "e" fuerte a menos que termine en t o d.';
  }
  if (w.startsWith('s') && !w.startsWith('sh')) {
    return 'Atención: no agregues una "e" española delante de la "s" líquida (di "st...", no "est...").';
  }
  return 'Articula con claridad y escucha el modelo de audio nativo pulsando el icono del altavoz.';
}
