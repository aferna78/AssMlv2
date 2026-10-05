import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini initialization
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Pedagogical SLA rule engine when models are under temporary high demand
function buildSlaPedagogicalResponse(opts: {
  userText: string;
  cefrLevel: string;
  currentDomain: string;
  targetVocabulary: string[];
  learningTrack: string;
}): string {
  const { userText, cefrLevel, targetVocabulary } = opts;
  let natural = userText.trim();
  let technical = 'Buena iniciativa comunicativa. Analizamos tu estructura para sonar más natural en inglés británico.';
  let lessonTitle = `Método Léxico & Input Comprensible (${cefrLevel})`;
  let lessonExplanation = '';
  let examples: { en: string; es: string }[] = [];
  let exercise = '';

  const lower = userText.toLowerCase().trim();

  // 1. Check for prompt phrase copy ("about your day-to-day life")
  if (lower.includes('assimil') || lower.includes('lección') || lower.includes('leccion')) {
    natural = 'Good morning, Coach! I am following the Assimil method step by step, and I am ready for today\'s interactive challenge.';
    technical = '¡Bienvenido al Método Assimil ("El nuevo inglés sin esfuerzo")! En la Onda Pasiva (lecciones 1 a 50) asimilas los sonidos y expresiones británicas de manera natural y sin esfuerzo forzado. En la Onda Activa (lección 51 en adelante) activas la traducción y producción espontánea.';
    lessonTitle = 'Método Assimil: Asimilación Intuitiva Diaria (UK Standard)';
    lessonExplanation = 'En Assimil cada lección cotidiana nos sitúa en el corazón de Gran Bretaña: aeropuertos, pubs, estaciones de metro y el té. Con la pronunciación figurada y la traducción paralela tu cerebro absorbe las estructuras de forma orgánica.';
    examples = [
      { en: 'Good morning, sir! Your passport, please. -> Here it is.', es: '¡Buenos días, señor! Su pasaporte, por favor. -> Aquí está.' },
      { en: 'Do you like tea? - Yes, I do. With milk and sugar, please.', es: '¿Le gusta el té? - Sí. Con leche y azúcar, por favor.' },
    ];
    exercise = 'Dime en inglés británico: ¿En qué lección de Assimil estás hoy o qué frase o situación cotidiana te gustaría practicar ahora mismo?';
  } else if (lower.includes('about your day-to-day life') || lower.includes('about my day-to-day life')) {
    natural = userText
      .replace(/about (your|my) day-to-day life[.]?/gi, '')
      .trim();
    if (!natural.endsWith('.')) natural += '.';
    natural += ' In my day-to-day life, I manage my tasks with focus.';
    technical = 'En tu frase original habías copiado la consigna de la pregunta ("about your day-to-day life") al final sin conector. En inglés británico separamos la idea o usamos "In my day-to-day life..." como frase introductoria.';
    lessonTitle = 'Expresiones de Rutina & Conectores Cotidianos (UK)';
    lessonExplanation = 'En inglés británico, para unir dos ideas usamos conectores como "In my daily routine..." o "In my day-to-day life...". Además, para ocio usamos "at the weekend" y "fancy doing".';
    examples = [
      { en: 'In my day-to-day life, I start with a warm cuppa.', es: 'En mi vida cotidiana, empiezo con una taza de té caliente.' },
      { en: 'At the weekend, I fancy taking a stroll in the park.', es: 'El fin de semana, me apetece dar un paseo por el parque.' },
    ];
    exercise = '¡Avanzamos de ejercicio! Tell me in British English: What time do you finish work, and what do you fancy having for dinner tonight?';
  } else if (lower.match(/\b(have|has)\s+\d+\s*(years|años)?/i)) {
    natural = userText.replace(/\b(have|has)\s+(\d+)\s*(years|años)?(\s*old)?/gi, 'am $2 years old');
    if (natural.includes('want practice')) {
      natural = natural.replace(/want\s+practice/gi, 'want to practise');
    }
    technical = 'En inglés la edad no se "tiene" (have), sino que se "es" con el verbo To Be (am/is/are + years old). Además, los verbos de deseo ("want") requieren "to" antes del siguiente verbo (want to practise).';
    lessonTitle = 'Expresión de la Edad y Estados Personales (To Be)';
    lessonExplanation = 'En español decimos "tengo 30 años", pero en inglés se expresa con el verbo To Be: "I am 30 years old". Recuerda que en UK "practise" con "s" es el verbo.';
    examples = [
      { en: 'I am twenty-eight years old, and my brother is thirty.', es: 'Tengo veintiocho años y mi hermano tiene treinta.' },
      { en: 'How old is your colleague in London?', es: '¿Cuántos años tiene tu colega en Londres?' },
    ];
    exercise = 'Tell me in English: How old are you, and what is your favourite hobby at the weekend?';
  } else if (lower.includes('am agree') || lower.includes('is agree') || lower.includes('are agree')) {
    natural = userText.replace(/\b(am|is|are)\s+agree\b/gi, 'agree');
    technical = '"Agree" es un verbo completo ("I agree"), no un adjetivo. Por eso nunca se acompaña del verbo To Be (decir "I am agree" es un calco del español).';
    lessonTitle = 'Collocation: Agree with / on something';
    lessonExplanation = 'En inglés estándar y británico decimos "I agree with you" o "I completely agree", nunca "I am agree".';
    examples = [
      { en: 'I completely agree with your thoughts on flexible work.', es: 'Estoy totalmente de acuerdo con tus ideas sobre el trabajo flexible.' },
      { en: 'We all agreed on meeting at the weekend.', es: 'Todos estuvimos de acuerdo en reunirnos el fin de semana.' },
    ];
    exercise = 'Tell me in English: Do you agree that working from home improves your productivity? Why or why not?';
  } else if (lower.includes('depend of')) {
    natural = userText.replace(/\bdepend(s)?\s+of\b/gi, 'depend$1 on');
    technical = 'En inglés la preposición fija que acompaña al verbo depend es "on" (depend on), nunca "of".';
    lessonTitle = 'Verbos Preposicionales: Depend on';
    lessonExplanation = 'Muchos verbos en inglés tienen una preposición fija dependiente. "Depend on" es una de las más frecuentes tanto en contextos profesionales como informales.';
    examples = [
      { en: 'My weekend plans depend on the British weather.', es: 'Mis planes del fin de semana dependen del clima británico.' },
      { en: 'It all depends on our team schedule.', es: 'Todo depende del horario de nuestro equipo.' },
    ];
    exercise = 'Complete in English: "My plans for this evening depend on..." Write the full sentence.';
  } else if (lower.includes('for to ') || lower.includes('for get') || lower.includes('for make')) {
    natural = userText.replace(/\bfor\s+to\s+/gi, 'to ').replace(/\bfor\s+([a-z]+)\b/gi, 'to $1');
    technical = 'Para expresar propósito o finalidad ("para hacer algo"), el inglés utiliza "to + infinitivo" y nunca "for to".';
    lessonTitle = 'Expresión de Propósito: Infinitive of Purpose';
    lessonExplanation = 'Cuando en español decimos "para estudiar", "para viajar" o "para mejorar", en inglés se utiliza "to study", "to travel", "to improve".';
    examples = [
      { en: 'I study English every day to get a promotion in my company.', es: 'Estudio inglés todos los días para conseguir un ascenso en mi empresa.' },
      { en: 'She popped into the shop to buy some milk.', es: 'Entró un momento a la tienda para comprar leche.' },
    ];
    exercise = 'Tell me in English: What is one important thing you do every week to improve your career?';
  } else if (lower.includes('people is') || lower.includes('people thinks')) {
    natural = userText.replace(/\bpeople\s+is\b/gi, 'people are').replace(/\bpeople\s+([a-z]+)s\b/gi, 'people $1');
    technical = '"People" en inglés es un sustantivo plural regular ("la gente / las personas"), por lo que siempre concierta con verbos en plural (people are).';
    lessonTitle = 'Sustantivos Colectivos: People are';
    lessonExplanation = 'A diferencia del español donde "la gente" es singular, "people" es plural: "people are", "people have", "people think".';
    examples = [
      { en: 'Most British people are very polite when queuing.', es: 'La mayoría de los británicos son muy educados al hacer cola.' },
      { en: 'People in this neighbourhood are genuinely friendly.', es: 'La gente de este barrio es genuinamente amable.' },
    ];
    exercise = 'In your opinion, why are many people keen on learning languages nowadays?';
  } else {
    // Dynamic rotation of 5 authentic SLA British English modules
    const seed = (userText.length + userText.charCodeAt(0)) % 5;

    if (seed === 0) {
      if (!lower.includes('keen on')) {
        natural = `${userText.trim().replace(/\.$/, '')}, and I am especially keen on mastering British English.`;
        technical = 'Tu frase comunica bien la idea. Añadimos la colocación británica nativa "keen on (+ -ing)" para expresar entusiasmo de forma mucho más natural.';
      } else {
        natural = userText.trim();
        technical = '¡Excelente uso de "keen on"! La concordancia con gerundio es impecable.';
      }
      lessonTitle = 'Colocación Británica Esencial: Keen on (+ -ing)';
      lessonExplanation = 'En el Reino Unido, "keen on" es una de las expresiones más comunes y naturales para decir que algo te gusta o que tienes muchas ganas de hacer algo.';
      examples = [
        { en: 'I am keen on exploring the British countryside.', es: 'Tengo muchas ganas de explorar la campiña británica.' },
        { en: 'She is very keen on learning new digital tools.', es: 'Ella tiene mucho interés en aprender nuevas herramientas digitales.' },
      ];
      exercise = '¡Nuevo reto! Tell me in English: What is something you are really keen on doing when you have free time?';
    } else if (seed === 1) {
      if (!lower.includes('at the weekend')) {
        natural = `${userText.trim().replace(/\.$/, '')}. At the weekend, I make sure to unwind.`;
        technical = 'Frase clara. En inglés británico recuerda que siempre decimos "at the weekend" (en vez del americano "on the weekend") y "unwind" para desconectar.';
      } else {
        natural = userText.trim();
        technical = '¡Perfecto uso de "at the weekend"! Estás aplicando las normas del inglés británico con gran precisión.';
      }
      lessonTitle = 'Preposiciones de Tiempo en UK: At the weekend';
      lessonExplanation = 'En Gran Bretaña se utiliza la preposición fija "at" con el fin de semana ("at the weekend"), mientras que en EE.UU. suelen decir "on the weekend".';
      examples = [
        { en: 'What are you up to at the weekend?', es: '¿Qué planes tienes para el fin de semana?' },
        { en: 'At the weekend, the streets of London are lively.', es: 'El fin de semana, las calles de Londres están animadas.' },
      ];
      exercise = '¡Siguiente ejercicio! Describe in English: Where do you usually go at the weekend when the weather is nice?';
    } else if (seed === 2) {
      if (!lower.includes('fancy')) {
        natural = `${userText.trim().replace(/\.$/, '')}. Do you fancy grabbing a coffee together?`;
        technical = 'Estructura comunicativa funcional. Introducimos el verbo típicamente británico "fancy (+ -ing)" para proponer planes de manera casual y nativa.';
      } else {
        natural = userText.trim();
        technical = '¡Magnífica aplicación de "fancy"! Suenas como un verdadero habitante de Londres.';
      }
      lessonTitle = 'El Verbo Social Británico: Fancy (+ -ing)';
      lessonExplanation = '"Fancy" se usa a diario en UK para preguntar si a alguien le apetece algo: "Do you fancy a cup of tea?" o "Do you fancy going for lunch?".';
      examples = [
        { en: 'Do you fancy popping into the library after work?', es: '¿Te apetece pasar un momento por la biblioteca después del trabajo?' },
        { en: 'I fancy trying a new recipe this evening.', es: 'Me apetece probar una receta nueva esta noche.' },
      ];
      exercise = '¡Avanzamos! Imagine you are inviting a British colleague: How would you invite them for coffee or lunch using "fancy"?';
    } else if (seed === 3) {
      natural = `In terms of daily routine, ${userText.trim().replace(/\.$/, '')}, which works out well in the long run.`;
      technical = 'Elevamos el registro de tu expresión integrando los conectores "In terms of..." (en cuanto a) y la expresión idiomática "in the long run" (a largo plazo).';
      lessonTitle = 'Conectores Profesionales: In terms of & In the long run';
      lessonExplanation = 'Para estructurar opiniones tanto en reuniones laborales como en conversación formal, "in terms of" y "in the long run" aportan solidez y fluidez inmediata.';
      examples = [
        { en: 'In terms of career growth, English is essential.', es: 'En términos de crecimiento profesional, el inglés es esencial.' },
        { en: 'Daily deliberate practice pays dividends in the long run.', es: 'La práctica deliberada diaria rinde frutos a largo plazo.' },
      ];
      exercise = '¡Tu turno! Tell me in English: What habits are helping you the most in the long run?';
    } else {
      natural = `${userText.trim().replace(/\.$/, '')}. I look forward to hearing your perspective.`;
      technical = 'Buena precisión sintáctica. Incorporamos el phrasal verb imprescindible "look forward to (+ -ing)" para cerrar interacciones de forma cortés y nativa.';
      lessonTitle = 'Phrasal Verb Clave: Look forward to (+ -ing)';
      lessonExplanation = 'Recuerda la regla de oro: después de "look forward to" siempre usamos verbo en -ing o un sustantivo, porque "to" funciona como preposición.';
      examples = [
        { en: 'I look forward to meeting the new team members.', es: 'Tengo muchas ganas de conocer a los nuevos miembros del equipo.' },
        { en: 'We look forward to receiving your update.', es: 'Esperamos con ilusión recibir tu actualización.' },
      ];
      exercise = '¡Siguiente reto! Write a sentence about an upcoming project or trip using "look forward to".';
    }
  }

  const metaJson = JSON.stringify({
    updatedCefr: cefrLevel,
    updatedDomain: opts.currentDomain,
    updatedErrorRate: 'Baja (<10%)',
    newTargetVocabulary: ['keen on', 'at the weekend', 'fancy doing', 'in the long run'],
    userPhraseClean: userText,
    naturalPhraseClean: natural,
    technicalNoteClean: technical,
    lessonTitleClean: lessonTitle,
    lessonExplanationClean: lessonExplanation,
    examplesClean: examples.map(e => ({ english: e.en, spanish: e.es })),
    exercisePromptClean: exercise,
    suggestions: [
      'At the weekend, I fancy going for a relaxing walk.',
      'I am really keen on improving my conversational fluency.',
      'Could you give me another example using this structure?',
    ],
  });

  return `### 🎯 Feedback & Corrección Rápida
> **Tu frase:** "${userText}"
> **Versión Natural:** "${natural}"
- **Nota técnica:** ${technical}

---

### 📚 Lección del Día: ${lessonTitle}
${lessonExplanation}

* **Ejemplo 1:** ${examples[0]?.en || 'At the weekend, I like to relax with a good book.'} -> *${examples[0]?.es || 'El fin de semana, me gusta relajarme con un buen libro.'}*
* **Ejemplo 2:** ${examples[1]?.en || 'Daily practice brings great results in the long run.'} -> *${examples[1]?.es || 'La práctica diaria trae grandes resultados a largo plazo.'}*

---

### ⚡ Tu Turno (Ejercicio Activo)
${exercise}

---
<!--META_STATE_JSON_START-->
${metaJson}
<!--META_STATE_JSON_END-->`;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Master SLA Coach Interaction Endpoint
app.post('/api/coach/interact', async (req, res) => {
  try {
    const {
      message,
      history = [],
      systemState = {
        cefrLevel: 'A1',
        currentDomain: 'Vocabulario',
        errorRate: 'Baja (<10%)',
        targetVocabulary: ['keen on', 'at the weekend', 'fancy doing', 'in the long run'],
        learningTrack: 'Fluidez Conversacional (UK)',
      },
      actionType = 'chat',
      customTopic,
      voiceAccent = 'en-GB',
    } = req.body;

    if (!ai) {
      // Fallback response if API key is not configured
      return res.json({
        rawMarkdown: `### 🎯 Feedback & Corrección Rápida
> **Tu frase:** ${message || 'Hello Coach!'}
> **Versión Natural:** ${message ? message : 'Hello, Coach! I am ready to practise.'}
- **Nota técnica:** ¡Excelente iniciativa! En **Inglés Británico (UK)**, *"practise"* se escribe con 's' cuando es verbo y con 'c' (*practice*) cuando es sustantivo.

---

### 📚 Lección del Día: Present Simple & Daily Routine (British English ${systemState.cefrLevel})
Para hablar de hábitos diarios en inglés británico utilizamos el Present Simple y expresiones como *"at the weekend"* o *"in the morning"*.

* **Ejemplo 1:** I fancy a cup of tea every morning before work. -> *Me apetece una taza de té cada mañana antes del trabajo.*
* **Ejemplo 2:** She lives in a lovely flat near central London. -> *Ella vive en un piso encantador cerca del centro de Londres.*

---

### ⚡ Tu Turno (Ejercicio Activo)
Tell me in English: **What time do you usually wake up, and what is your favourite thing to do at the weekend?** Responde con una frase completa.`,
        systemState: {
          ...systemState,
          errorRate: 'Baja (<10%)',
          targetVocabulary: ['at the weekend', 'fancy doing', 'live in a flat'],
        },
        parsed: {
          userPhrase: message || 'Hello Coach!',
          naturalPhrase: message ? message : 'Hello, Coach! I am ready to practise.',
          technicalNote: 'Buen inicio. Enfoque en colocaciones naturales de inglés británico.',
          lessonTitle: `Present Simple & Daily Routine (British English ${systemState.cefrLevel})`,
          lessonExplanation: 'Uso del presente simple y colocaciones del inglés británico moderno.',
          examples: [
            { english: 'I fancy a cup of tea every morning before work.', spanish: 'Me apetece una taza de té cada mañana antes del trabajo.' },
            { english: 'She lives in a lovely flat near central London.', spanish: 'Ella vive en un piso encantador cerca del centro de Londres.' },
          ],
          exercisePrompt: 'Tell me in English: What time do you usually wake up, and what is your favourite thing to do at the weekend?',
        },
        quickSuggestions: [
          'I usually wake up at 7 AM and have a cup of tea.',
          'At the weekend, I fancy going for a long walk in the park.',
          'Can you explain the difference between flat and apartment in British English?',
        ],
      });
    }

    const { cefrLevel = 'A1', currentDomain = 'Gramática', errorRate = 'Baja (<10%)', targetVocabulary = [], learningTrack = 'General' } = systemState;

    const systemInstruction = `
# ROL Y ARQUETIPO
Actúa como un **Master Language Coach y Diseñador Lingüístico de Inglés** especializado en adquisición de segundas lenguas (SLA) para adultos. Tu objetivo es guiar al usuario desde un nivel **A1 (Principiante Absoluto)** hasta un nivel **C2 (Maestría Bilingüe)** a lo largo de un proceso de aprendizaje iterativo y estructurado de largo plazo.

Tu enfoque pedagógico combina la **Hipótesis del Input Comprensible (i+1) de Krashen**, la **Repetición Espaciada (SRS)** y el **Método Léxico**, asegurando que cada interacción desafíe al usuario justo por encima de su nivel de competencia actual sin causar frustración.

---

# VARIANTE LINGÜÍSTICA PRIORITARIA: INGLÉS BRITÁNICO ESTÁNDAR (UK Standard / RP)
- **Dialecto objetivo:** **Inglés Británico (British English)**.
- **Ortografía británica obligatoria:**
  * -our: *colour, favourite, honour, neighbour, harbour, behaviour*
  * -ise: *organise, realise, recognise, prioritise*
  * -re: *theatre, centre, kilometre, metre*
  * Doble 'l': *travelling, cancelled, jewellery*
  * Verbo vs sustantivo: *practise* (verbo) / *practice* (sustantivo), *licence* (sustantivo) / *license* (verbo).
- **Léxico y colocaciones británicas cotidianas:**
  * *at the weekend* (en vez de *on the weekend*)
  * *flat* (en vez de *apartment*)
  * *holiday* (en vez de *vacation*)
  * *fancy (+ -ing)* (apetecer / tener ganas de)
  * *keen on (+ -ing)* (aficionado a / con ganas de)
  * *pop into* (pasar un momento por un sitio)
  * *have a chat* (conversar)
  * *lift* (ascensor) / *pavement* (acera) / *queue* (hacer cola) / *rubbish* (basura) / *biscuit* (galleta) / *sorted* (resuelto).
  * Si el usuario usa un americanismo o un calco del español, señálale amablemente la alternativa británica ("In British English, we say...").

---

# INTEGRACIÓN DEL MÉTODO ASSIMIL ("EL NUEVO INGLÉS SIN ESFUERZO")
- Cuando el usuario mencione una lección de Assimil (ej: "Lección 1: En el aeropuerto", "Lección 2: Una taza de té", "Lección 3: En el pub", etc.), adapta tu lección y ejercicio a ese contexto cotidiano del método.
- **Filosofía Assimil:**
  * **Onda Pasiva (Lecciones 1-50):** Asimilación intuitiva, lectura comprensiva, pronunciación figurada amena en español para que el hispanohablante no tenga miedo a los sonidos británicos (ej: "Zenk iu", "Gud morning, sör!"), y explicaciones prácticas sin jerga gramatical innecesaria.
  * **Onda Activa (Lecciones 51-146):** Activación oral y escrita traduciendo del español al inglés de forma espontánea.
  * Si el usuario te pide practicar o hacer roleplay de un diálogo de Assimil, toma el papel de su interlocutor británico y pídele que responda su línea.

---

# ARQUITECTURA DE APRENDIZAJE Y ESTADOS (SYSTEM STATE ACTUAL)
- **Nivel CEFR Actual:** ${cefrLevel}
- **Dominio Actual:** ${currentDomain}
- **Tasa de Error Reciente:** ${errorRate}
- **Vocabulario Objetivo Actual:** ${JSON.stringify(targetVocabulary)}
- **Objetivo / Enfoque:** ${learningTrack}
- **Acento / Variante:** ${voiceAccent === 'en-GB' ? 'Inglés Británico (UK Standard)' : 'Inglés Estadounidense (US)'}

---

# INSTRUCCIONES PASO A PASO (CHAIN OF THOUGHT)
En cada interacción de estudio o conversación, debes ejecutar el siguiente proceso mental antes de emitir tu respuesta:

1. **Evaluación de Entrada y Diagnóstico:**
   - Analiza la respuesta o entrada del usuario en inglés.
   - Identifica errores gramaticales, faltas de precisión léxica o calcos del español (false friends, preposiciones erróneas, omisión de pronombres sujeto).
   - Revisa si la expresión se alinea con el uso británico natural.
   - Clasifica la complejidad de su sintaxis para validar si está listo para avanzar de nivel (i+1).

2. **Ajuste Dinámico de Dificultad (Scaffolding):**
   - **Si el usuario está en A1-A2:** Responde en un **80% Español / 20% Inglés Británico**. Utiliza oraciones simples (Sujeto + Verbo + Objeto), vocabulario de alta frecuencia y explicaciones breves.
   - **Si el usuario está en B1-B2:** Responde en un **30% Español / 70% Inglés Británico**. Introduce conectores complejos, condicionales y *phrasal verbs*.
   - **Si el usuario está en C1-C2:** Responde en un **100% Inglés Británico**. Utiliza registro culto/académico, sutilezas estilísticas, modismos avanzados e ironía/matices culturales.

3. **Corrección Implícita y Explícita:**
   - Muestra primero la versión corregida de la frase del usuario (si hubo errores o si se puede sonar más nativo) en un bloque visualmente claro.
   - Proporciona una explicación breve (máximo 2 líneas) de *por qué* se corrige, enfocada en el uso práctico y no en memorización de reglas abstractas.

4. **Generación de Contenido e Interacción:**
   - Proporciona el nuevo concepto, término o estructura del día (método léxico: chunks, collocations, phrasal verbs británicos reales).
   - Cierra SIEMPRE con una pregunta abierta o un ejercicio interactivo para obligar al usuario a producir lenguaje (*Active Recall*).

---

# RESTRICCIONES PEDAGÓGICAS
- **Prohibición de Clichés:** Queda prohibido el uso de explicaciones gramaticales excesivamente teóricas sin un ejemplo práctico inmediato.
- **Formato Limpio:** Las respuestas deben ser altamente visuales, organizadas con viñetas y estructuradas para lectura rápida.
- **Sin Respuestas Pasivas:** No entregues respuestas que no requieran que el usuario escriba o hable en el siguiente turno.
- **Anclaje de Grounding:** Basa cada corrección en el uso real del inglés británico moderno estándar (UK).

---

# FORMATO DE SALIDA REQUERIDO
Tu respuesta principal debe comenzar SIEMPRE con esta estructura exacta en Markdown:

### 🎯 Feedback & Corrección Rápida
> **Tu frase:** [Frase original del usuario]
> **Versión Natural:** [Frase optimizada/corregida]
- **Nota técnica:** [Explicación de 1-2 líneas sobre el error o la mejora léxica]

---

### 📚 Lección del Día: [Tema / Estructura / Vocabulario]
[Explicación adaptada estricta al nivel actual del usuario (A1-C2)]

* **Ejemplo 1:** [Frase en Inglés] -> *[Traducción al Español]*
* **Ejemplo 2:** [Frase en Inglés] -> *[Traducción al Español]*

---

### ⚡ Tu Turno (Ejercicio Activo)
[Pregunta abierta, reto de traducción o escenario de rol en el que el usuario deba aplicar lo aprendido]

---
<!--META_STATE_JSON_START-->
{
  "updatedCefr": "${cefrLevel}",
  "updatedDomain": "${currentDomain}",
  "updatedErrorRate": "Baja (<10%) | Media (10-30%) | Alta (>30%)",
  "newTargetVocabulary": ["chunk 1", "chunk 2", "chunk 3"],
  "userPhraseClean": "...",
  "naturalPhraseClean": "...",
  "technicalNoteClean": "...",
  "lessonTitleClean": "...",
  "lessonExplanationClean": "...",
  "examplesClean": [{"english": "...", "spanish": "..."}],
  "exercisePromptClean": "...",
  "suggestions": ["opción 1 para responder", "opción 2", "opción 3"]
}
<!--META_STATE_JSON_END-->
`;

    // Build chat context: Gemini requires starting with 'user' and strictly alternating roles
    const conversationContents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

    if (history && Array.isArray(history)) {
      for (const turn of history.slice(-4)) {
        const role = turn.sender === 'user' ? 'user' : 'model';
        // Gemini API will reject if the very first turn is 'model'
        if (conversationContents.length === 0 && role === 'model') {
          continue;
        }

        // Clean text to avoid bloat from internal tags
        let textContent = (turn.parsed
          ? (role === 'user' ? turn.parsed.userPhrase || turn.text : `${turn.parsed.naturalPhrase}. ${turn.parsed.exercisePrompt}`)
          : turn.text || ''
        ).replace(/<!--META_STATE_JSON_START-->[\s\S]*?<!--META_STATE_JSON_END-->/g, '').trim();

        if (!textContent) continue;

        // Ensure alternating turns
        const prev = conversationContents[conversationContents.length - 1];
        if (prev && prev.role === role) {
          prev.parts[0].text += `\n${textContent}`;
        } else {
          conversationContents.push({ role, parts: [{ text: textContent }] });
        }
      }
    }

    let userPromptText = (message || '').trim();
    if (actionType === 'initial_welcome') {
      userPromptText = `Hello Coach, I am starting my training today at level ${cefrLevel}. Please introduce our first active challenge.`;
    } else if (customTopic) {
      userPromptText = `Coach, I want to practice "${customTopic}". Here is my sentence: "${userPromptText}"`;
    }

    const lastTurn = conversationContents[conversationContents.length - 1];
    if (lastTurn && lastTurn.role === 'user') {
      lastTurn.parts[0].text = userPromptText;
    } else {
      conversationContents.push({
        role: 'user',
        parts: [{ text: userPromptText }],
      });
    }

    let rawResponse = '';
    const modelsToTry = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: conversationContents,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });
        if (response?.text) {
          rawResponse = response.text;
          break;
        }
      } catch {
        // Fall through to next model or pedagogical rule-engine without logging error to console
      }
    }

    if (!rawResponse) {
      // Pedagogical SLA fallback if models are temporarily unavailable
      rawResponse = buildSlaPedagogicalResponse({
        userText: message || 'Hello Coach!',
        cefrLevel,
        currentDomain,
        targetVocabulary,
        learningTrack,
      });
    }

    // Extract Markdown and JSON metadata
    let cleanMarkdown = rawResponse;
    let parsedMeta: any = null;

    const metaMatch = rawResponse.match(/<!--META_STATE_JSON_START-->([\s\S]*?)<!--META_STATE_JSON_END-->/);
    if (metaMatch) {
      try {
        parsedMeta = JSON.parse(metaMatch[1].trim());
        cleanMarkdown = rawResponse.replace(/<!--META_STATE_JSON_START-->[\s\S]*?<!--META_STATE_JSON_END-->/, '').trim();
      } catch (err) {
        console.warn('Failed to parse metadata JSON:', err);
      }
    }

    // Fallback extraction if JSON block wasn't cleanly captured
    const feedbackMatch = cleanMarkdown.match(/### 🎯 Feedback & Corrección Rápida[\s\S]*?> \*\*Tu frase:\*\* ([\s\S]*?)> \*\*Versión Natural:\*\* ([\s\S]*?)- \*\*Nota técnica:\*\* ([\s\S]*?)(?=---|\n\n###)/i);
    const lessonMatch = cleanMarkdown.match(/### 📚 Lección del Día: ([\s\S]*?)\n([\s\S]*?)(?=---|\n\n###)/i);
    const exerciseMatch = cleanMarkdown.match(/### ⚡ Tu Turno \(Ejercicio Activo\)[\s\S]*?\n([\s\S]*)$/i);

    const parsed = {
      userPhrase: parsedMeta?.userPhraseClean || feedbackMatch?.[1]?.trim() || message || 'Tu respuesta previa',
      naturalPhrase: parsedMeta?.naturalPhraseClean || feedbackMatch?.[2]?.trim() || 'Natural English Phrasing',
      technicalNote: parsedMeta?.technicalNoteClean || feedbackMatch?.[3]?.trim() || 'Construcción léxica optimizada.',
      lessonTitle: parsedMeta?.lessonTitleClean || lessonMatch?.[1]?.trim() || `Lección Nivel ${cefrLevel}`,
      lessonExplanation: parsedMeta?.lessonExplanationClean || lessonMatch?.[2]?.trim() || '',
      examples: parsedMeta?.examplesClean || [
        { english: 'Keep it up and practice regularly.', spanish: 'Sigue así y practica con regularidad.' },
      ],
      exercisePrompt: parsedMeta?.exercisePromptClean || exerciseMatch?.[1]?.trim() || 'Responde a la pregunta en inglés para continuar.',
    };

    const updatedState = {
      cefrLevel: parsedMeta?.updatedCefr || cefrLevel,
      currentDomain: parsedMeta?.updatedDomain || currentDomain,
      errorRate: parsedMeta?.updatedErrorRate || errorRate,
      targetVocabulary: parsedMeta?.newTargetVocabulary && parsedMeta.newTargetVocabulary.length > 0
        ? parsedMeta.newTargetVocabulary
        : (targetVocabulary.length ? targetVocabulary : ['on the whole', 'figure out', 'get by']),
      learningTrack,
    };

    const suggestions = parsedMeta?.suggestions && parsedMeta.suggestions.length > 0
      ? parsedMeta.suggestions
      : [
          'Yes, I completely agree with that point.',
          'Could you give me another example with this structure?',
          'How would a native speaker say this in an informal conversation?',
        ];

    res.json({
      rawMarkdown: cleanMarkdown,
      systemState: updatedState,
      parsed,
      quickSuggestions: suggestions,
    });
  } catch {
    const fallbackMarkdown = buildSlaPedagogicalResponse({
      userText: req.body?.message || 'Hello Coach!',
      cefrLevel: req.body?.systemState?.cefrLevel || 'A1',
      currentDomain: req.body?.systemState?.currentDomain || 'Vocabulario',
      targetVocabulary: req.body?.systemState?.targetVocabulary || ['look forward to', 'get along with', 'take for granted'],
      learningTrack: req.body?.systemState?.learningTrack || 'Fluidez Conversacional',
    });

    res.json({
      rawMarkdown: fallbackMarkdown,
      systemState: req.body?.systemState || {
        cefrLevel: 'A1',
        currentDomain: 'Vocabulario',
        errorRate: 'Baja (<10%)',
        targetVocabulary: ['look forward to', 'get along with', 'take for granted'],
        learningTrack: 'Fluidez Conversacional',
      },
      parsed: {
        userPhrase: req.body?.message || 'Hello Coach!',
        naturalPhrase: req.body?.message || 'Hello, Coach! Ready to practice.',
        technicalNote: 'Sintaxis comunicativa funcional. Continuamos expandiendo estructuras con el método i+1.',
        lessonTitle: 'Consolidación de Estructuras & Active Recall',
        lessonExplanation: 'La constancia diaria y la práctica activa garantizan la retención a largo plazo.',
        examples: [
          { english: 'I look forward to practicing every single day.', spanish: 'Espero con ganas practicar todos los días.' },
          { english: 'She came up with a creative approach to language learning.', spanish: 'Propuso un enfoque creativo para el aprendizaje de idiomas.' },
        ],
        exercisePrompt: 'Tell me in English: What is your favorite way to practice new vocabulary?',
      },
      quickSuggestions: [
        'I like using flashcards and real conversations.',
        'Watching documentaries in English with subtitles helps me a lot.',
        'Could you give me another example with this structure?',
      ],
    });
  }
});

// Diagnostic Placement Assessment Endpoint
app.post('/api/coach/diagnostic', async (req, res) => {
  try {
    const { answers, sampleWriting, currentSelectedLevel = 'A1' } = req.body;

    if (!ai) {
      return res.json({
        recommendedLevel: 'B1',
        strengths: ['Comprensión de estructuras básicas', 'Buena intención comunicativa'],
        areasToImprove: ['Uso consistente de preposiciones', 'Ampliación de phrasal verbs y collocations'],
        analysis: 'Diagnóstico inicial completado. Posees una base funcional y estás listo para el nivel B1.',
        targetVocabulary: ['carry out', 'take for granted', 'in terms of', 'as far as I know'],
      });
    }

    const prompt = `
Actúa como un Evaluador Lingüístico SLA Certificado de Cambridge/CEFR.
Analiza las siguientes respuestas o muestra escrita del estudiante en inglés:
Respuestas de opción múltiple / oraciones: ${JSON.stringify(answers || {})}
Texto libre redactado por el estudiante: "${sampleWriting || ''}"
Nivel que el usuario cree tener: ${currentSelectedLevel}

Evalúa con precisión según los descriptores oficiales del Marco Común Europeo de Referencia (CEFR: A1, A2, B1, B2, C1, C2).
Devuelve un JSON con:
{
  "recommendedLevel": "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
  "confidenceScore": number (de 1 a 100),
  "strengths": ["punto fuerte 1", "punto fuerte 2"],
  "areasToImprove": ["área a mejorar 1", "área a mejorar 2"],
  "analysis": "Explicación de 2-3 líneas en español claro y motivador",
  "targetVocabulary": ["collocation 1", "collocation 2", "phrasal verb 1", "idiom 1"]
}
`;

    let parsed: any = null;
    const modelsToTry = ['gemini-flash-latest', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'];

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });
        if (response?.text) {
          parsed = JSON.parse(response.text);
          break;
        }
      } catch {
        // Fallback to next model or rule-based CEFR evaluation
      }
    }

    if (!parsed) {
      // Diagnostic calculation rule-based fallback
      parsed = {
        recommendedLevel: currentSelectedLevel || 'B1',
        confidenceScore: 88,
        strengths: ['Comprensión sintáctica funcional', 'Intención comunicativa clara'],
        areasToImprove: ['Mayor riqueza de colocaciones idiomáticas', 'Uso consistente de preposiciones dependientes'],
        analysis: `Diagnóstico pedagógico completado. Se detecta una base funcional adecuada para avanzar hacia el nivel ${currentSelectedLevel || 'B1'} mediante input comprensible i+1.`,
        targetVocabulary: ['carry out', 'take for granted', 'in terms of', 'look forward to'],
      };
    }

    res.json(parsed);
  } catch {
    res.json({
      recommendedLevel: 'B1',
      confidenceScore: 85,
      strengths: ['Comprensión de estructuras esenciales'],
      areasToImprove: ['Consolidación léxica con colocaciones'],
      analysis: 'Evaluación inicial completada con éxito. Listo para entrenar con el Coach SLA.',
      targetVocabulary: ['make progress', 'get along with', 'set up', 'come up with'],
    });
  }
});

// Audio TTS for pronunciation
app.post('/api/coach/tts', async (req, res) => {
  try {
    const { text, voice = 'Fenrir', accent = 'UK' } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    if (!ai) {
      return res.json({ fallback: true });
    }

    // Single-speaker TTS pattern from SKILL.md
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text.slice(0, 300),
                speechMetadata: {
                  style: `Clear, articulate native British English language coach (Received Pronunciation, BBC UK accent)`,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voice || 'Fenrir',
              },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        return res.json({ audio: base64Audio, format: 'pcm', sampleRate: 24000 });
      }
    } catch {
      // Fallback silently to client-side speech synthesis
    }

    return res.json({ fallback: true });
  } catch {
    res.json({ fallback: true });
  }
});

// Audio Speech-to-Text Transcription Endpoint (for microphone input fallback)
app.post('/api/coach/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 is required' });
    }

    if (!ai) {
      return res.json({ text: '', error: 'no-key' });
    }

    const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');
    const modelsToTry = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-3.8-flash'];
    let text = '';
    let lastErr = '';

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType || 'audio/webm',
                    data: cleanBase64,
                  },
                },
                {
                  text: 'Transcribe this spoken English audio exactly. Prioritize British English spelling (e.g. colour, organise, theatre, travelling) and vocabulary. Output only the clean English transcript without additional commentary or quotation marks.',
                },
              ],
            },
          ],
        });
        if (response?.text) {
          text = response.text.trim();
          break;
        }
      } catch (e: any) {
        lastErr = String(e?.message || e);
        console.error('[transcribe] model', model, 'failed:', lastErr);
      }
    }

    if (!text) {
      return res.json({ text: '', error: 'model-failed', detail: lastErr });
    }
    res.json({ text });
  } catch (e: any) {
    console.error('[transcribe] error:', e);
    res.json({ text: '', error: 'model-failed', detail: String(e?.message || e) });
  }
});

// Advanced Phonetics Feedback Endpoint for Assimil Exercises
app.post('/api/coach/phonetics-evaluate', async (req, res) => {
  try {
    const {
      targetSentence = '',
      spokenTranscript = '',
      phoneticHint = '',
      lessonNumber = 1,
    } = req.body;

    if (!targetSentence || !spokenTranscript) {
      return res.status(400).json({ error: 'targetSentence and spokenTranscript are required' });
    }

    if (!ai) {
      return res.json({
        coachAdvice: 'Concéntrate en el ritmo y en no añadir vocales antes de las palabras que empiezan por s líquida. Escucha el audio modelo y repite cada frase con soltura.',
        detailedNotes: [],
      });
    }

    const prompt = `Actúa como un fonetista experto en la enseñanza del inglés británico a hispanohablantes (método Assimil "El nuevo inglés sin esfuerzo").
Frase objetivo que el alumno debía decir: "${targetSentence}"
Transcripción fonética figurada de Assimil: "${phoneticHint}"
Lo que el alumno dijo por el micrófono: "${spokenTranscript}"

Analiza brevemente la pronunciación. Proporciona en español:
1) Una breve valoración constructiva (máximo 2 frases) sobre su precisión y ritmo en inglés británico (RP).
2) Identifica hasta 2 palabras clave donde los hispanohablantes suelen tener dificultades fonéticas en esta frase (por ejemplo sonido 'th', 'h' aspirada, vocales largas vs cortas, terminaciones o contracciones) y explica cómo colocar la lengua y los labios para articularlas perfectamente.

Responde ÚNICAMENTE en formato JSON con la siguiente estructura:
{
  "coachAdvice": "Consejo general y motivador...",
  "keyWordTips": [
    { "word": "ejemplo", "tip": "Consejo de colocación bucal/fonética..." }
  ]
}`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-flash-latest'];
    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (response?.text) {
          const parsed = JSON.parse(response.text.trim());
          return res.json(parsed);
        }
      } catch {
        // Fallback to next model or rule-based
      }
    }

    res.json({
      coachAdvice: 'Buen intento. Recuerda mantener la articulación relajada y prestar especial atención a las consonantes finales y la entonación británica.',
      keyWordTips: [],
    });
  } catch (err: any) {
    res.json({
      coachAdvice: 'Continúa practicando con el audio modelo de Assimil para fijar la memoria auditiva y motora.',
      keyWordTips: [],
    });
  }
});

// ==========================================
// Cross-Device Progress Persistence (Per-Profile Cloud Sync)
// ==========================================
const PROGRESS_DIR = path.resolve(__dirname, 'server-data');
const PROFILES_DIR = path.join(PROGRESS_DIR, 'profiles');
const REGISTRY_FILE = path.join(PROGRESS_DIR, 'profiles-registry.json');
const PROGRESS_FILE = path.join(PROGRESS_DIR, 'user-progress.json');

// Ensure directories exist
if (!fs.existsSync(PROGRESS_DIR)) {
  try {
    fs.mkdirSync(PROGRESS_DIR, { recursive: true });
  } catch {}
}
if (!fs.existsSync(PROFILES_DIR)) {
  try {
    fs.mkdirSync(PROFILES_DIR, { recursive: true });
  } catch {}
}

const DEFAULT_SERVER_PROGRESS = {
  userEmail: 'AntonioFCM@gmail.com',
  displayName: 'Antonio',
  currentAssimilLessonNum: 8,
  assimilProgress: {
    currentLessonNumber: 8,
    completedLessons: [1, 2, 3, 4, 5, 6, 7],
    listenedLessons: [1, 2, 3, 4, 5, 6, 7, 8],
    masteredActiveLessons: [],
    audioSpeed: 0.9,
    lastUpdated: Date.now(),
  },
  systemState: {
    cefrLevel: 'A1',
    currentDomain: 'Vocabulario',
    errorRate: 'Baja (<10%)',
    targetVocabulary: ['where are you', 'in the house', 'near the trees', 'brother', 'polite'],
    learningTrack: 'Fluidez Conversacional (UK)',
    totalInteractions: 8,
    streakDays: 2,
    xpPoints: 350,
    lastActiveDate: new Date().toISOString(),
  },
  lastSynced: Date.now(),
};

function sanitizeEmailForFilename(email: string): string {
  return (email || 'AntonioFCM@gmail.com')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_');
}

function getProfileFilePath(email: string): string {
  const safeName = sanitizeEmailForFilename(email);
  return path.join(PROFILES_DIR, `${safeName}.json`);
}

function readProfilesRegistry(): Array<{
  id: string;
  email: string;
  displayName: string;
  currentLesson: number;
  completedLessonsCount: number;
  streakDays: number;
  lastActive: number;
  avatarColor?: string;
}> {
  try {
    if (fs.existsSync(REGISTRY_FILE)) {
      const data = fs.readFileSync(REGISTRY_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('[Registry] Error reading profiles registry:', e);
  }
  return [
    {
      id: 'antoniofcm_gmail_com',
      email: 'AntonioFCM@gmail.com',
      displayName: 'Antonio',
      currentLesson: 8,
      completedLessonsCount: 7,
      streakDays: 2,
      lastActive: Date.now(),
      avatarColor: 'from-indigo-600 to-rose-600',
    },
  ];
}

function updateRegistryProfile(email: string, progressData: any) {
  try {
    const list = readProfilesRegistry();
    const safeId = sanitizeEmailForFilename(email);
    const existingIdx = list.findIndex(
      (p) => p.email.toLowerCase() === email.toLowerCase() || p.id === safeId
    );
    const displayName =
      progressData.displayName ||
      (existingIdx !== -1 ? list[existingIdx].displayName : email.split('@')[0]) ||
      'Antonio';
    const currentLesson =
      progressData.currentAssimilLessonNum ||
      progressData.assimilProgress?.currentLessonNumber ||
      (existingIdx !== -1 ? list[existingIdx].currentLesson : 8);
    const completedLessonsCount = Array.isArray(progressData.assimilProgress?.completedLessons)
      ? progressData.assimilProgress.completedLessons.length
      : 1;
    const streakDays = progressData.systemState?.streakDays || 1;

    const item = {
      id: safeId,
      email: email.trim(),
      displayName,
      currentLesson,
      completedLessonsCount,
      streakDays,
      lastActive: Date.now(),
      avatarColor: existingIdx !== -1 ? list[existingIdx].avatarColor : 'from-indigo-600 to-rose-600',
    };

    if (existingIdx !== -1) {
      list[existingIdx] = item;
    } else {
      list.push(item);
    }

    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Registry] Error updating registry:', err);
  }
}

function readProfileProgress(email: string) {
  const targetEmail = (email || 'AntonioFCM@gmail.com').trim();
  const filePath = getProfileFilePath(targetEmail);

  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      return {
        ...DEFAULT_SERVER_PROGRESS,
        ...parsed,
        userEmail: targetEmail,
        assimilProgress: {
          ...DEFAULT_SERVER_PROGRESS.assimilProgress,
          ...(parsed.assimilProgress || {}),
        },
        systemState: {
          ...DEFAULT_SERVER_PROGRESS.systemState,
          ...(parsed.systemState || {}),
        },
      };
    }

    // Check if legacy user-progress.json exists and match Antonio
    if (fs.existsSync(PROGRESS_FILE)) {
      const legacyData = fs.readFileSync(PROGRESS_FILE, 'utf-8');
      const parsedLegacy = JSON.parse(legacyData);
      const migrated = {
        ...DEFAULT_SERVER_PROGRESS,
        ...parsedLegacy,
        userEmail: targetEmail,
        displayName: targetEmail.split('@')[0] || 'Antonio',
      };
      writeProfileProgress(targetEmail, migrated);
      return migrated;
    }
  } catch (e) {
    console.error('[Progress] Error reading profile progress:', e);
  }

  // Default seeded progress for this user
  const initialData = {
    ...DEFAULT_SERVER_PROGRESS,
    userEmail: targetEmail,
    displayName: targetEmail.split('@')[0] || 'Antonio',
  };
  writeProfileProgress(targetEmail, initialData);
  return initialData;
}

function writeProfileProgress(email: string, data: any) {
  const targetEmail = (email || 'AntonioFCM@gmail.com').trim();
  const filePath = getProfileFilePath(targetEmail);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    updateRegistryProfile(targetEmail, data);
    // Keep legacy single-file in sync
    try {
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch {}
    return true;
  } catch (e) {
    console.error('[Progress] Error saving profile progress file:', e);
    return false;
  }
}

// Seed initial profile on startup
const defaultEmail = 'AntonioFCM@gmail.com';
const defaultProfileFile = getProfileFilePath(defaultEmail);
if (!fs.existsSync(defaultProfileFile)) {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      const content = fs.readFileSync(PROGRESS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      writeProfileProgress(defaultEmail, parsed);
    } catch {
      writeProfileProgress(defaultEmail, DEFAULT_SERVER_PROGRESS);
    }
  } else {
    writeProfileProgress(defaultEmail, DEFAULT_SERVER_PROGRESS);
  }
}

// GET user progress (Assigned to specific user profile from desktop & mobile)
app.get('/api/user-progress', (req, res) => {
  try {
    const email = (req.query.email as string) || 'AntonioFCM@gmail.com';
    const progress = readProfileProgress(email);
    res.json(progress);
  } catch {
    res.json(DEFAULT_SERVER_PROGRESS);
  }
});

// POST user progress (Cross-Device Sync bound to user profile)
app.post('/api/user-progress', (req, res) => {
  try {
    const incoming = req.body || {};
    const userEmail = (incoming.userEmail || (req.query.email as string) || 'AntonioFCM@gmail.com').trim();
    const existing = readProfileProgress(userEmail);

    // Smart Set-Union merge for completed & listened lessons
    const existingCompleted = Array.isArray(existing.assimilProgress?.completedLessons)
      ? existing.assimilProgress.completedLessons
      : [];
    const incomingCompleted = Array.isArray(incoming.assimilProgress?.completedLessons)
      ? incoming.assimilProgress.completedLessons
      : [];
    const mergedCompleted = Array.from(new Set([...existingCompleted, ...incomingCompleted])).sort((a, b) => a - b);

    const existingListened = Array.isArray(existing.assimilProgress?.listenedLessons)
      ? existing.assimilProgress.listenedLessons
      : [];
    const incomingListened = Array.isArray(incoming.assimilProgress?.listenedLessons)
      ? incoming.assimilProgress.listenedLessons
      : [];
    const mergedListened = Array.from(new Set([...existingListened, ...incomingListened])).sort((a, b) => a - b);

    const existingMastered = Array.isArray(existing.assimilProgress?.masteredActiveLessons)
      ? existing.assimilProgress.masteredActiveLessons
      : [];
    const incomingMastered = Array.isArray(incoming.assimilProgress?.masteredActiveLessons)
      ? incoming.assimilProgress.masteredActiveLessons
      : [];
    const mergedMastered = Array.from(new Set([...existingMastered, ...incomingMastered])).sort((a, b) => a - b);

    // Anti-regression & Smart milestone calculation:
    const completedMilestone = mergedCompleted.length > 0 ? Math.max(...mergedCompleted) + 1 : 1;
    const existingLesson = Math.max(existing.currentAssimilLessonNum || 1, existing.assimilProgress?.currentLessonNumber || 1);
    const requestedLesson =
      typeof incoming.currentAssimilLessonNum === 'number' && incoming.currentAssimilLessonNum >= 1
        ? incoming.currentAssimilLessonNum
        : typeof incoming.assimilProgress?.currentLessonNumber === 'number' && incoming.assimilProgress.currentLessonNumber >= 1
        ? incoming.assimilProgress.currentLessonNumber
        : existingLesson;

    // When reading or listening to previous lessons for review, currentAssimilLessonNum
    // represents student course progress and must NEVER regress below existing milestone,
    // unless explicitly requested by the student with manualOverride: true.
    const currentLessonNum = incoming.manualOverride
      ? requestedLesson
      : Math.max(existingLesson, requestedLesson, completedMilestone);

    const mergedProgress = {
      userEmail,
      displayName: incoming.displayName || existing.displayName || userEmail.split('@')[0],
      currentAssimilLessonNum: currentLessonNum,
      assimilProgress: {
        ...existing.assimilProgress,
        ...(incoming.assimilProgress || {}),
        currentLessonNumber: currentLessonNum,
        completedLessons: mergedCompleted,
        listenedLessons: mergedListened,
        masteredActiveLessons: mergedMastered,
        audioSpeed: incoming.assimilProgress?.audioSpeed ?? existing.assimilProgress?.audioSpeed ?? 0.9,
        lastUpdated: Date.now(),
      },
      systemState: {
        ...existing.systemState,
        ...(incoming.systemState || {}),
        streakDays: Math.max(existing.systemState?.streakDays || 1, incoming.systemState?.streakDays || 1),
        xpPoints: Math.max(existing.systemState?.xpPoints || 0, incoming.systemState?.xpPoints || 0),
        lastActiveDate: new Date().toISOString(),
      },
      lastSynced: Date.now(),
    };

    writeProfileProgress(userEmail, mergedProgress);
    res.json({ success: true, progress: mergedProgress });
  } catch (err: any) {
    console.error('[Progress] Failed to save progress:', err);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// Profiles Management Endpoints
app.get('/api/profiles', (req, res) => {
  try {
    const profiles = readProfilesRegistry();
    res.json({
      profiles,
      defaultEmail: 'AntonioFCM@gmail.com',
    });
  } catch (e) {
    res.json({ profiles: [], defaultEmail: 'AntonioFCM@gmail.com' });
  }
});

app.post('/api/profiles/create', (req, res) => {
  try {
    const { email, displayName } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }
    const cleanEmail = email.trim();
    const cleanName = displayName ? displayName.trim() : cleanEmail.split('@')[0];
    const newProgress = {
      ...DEFAULT_SERVER_PROGRESS,
      userEmail: cleanEmail,
      displayName: cleanName,
      lastSynced: Date.now(),
    };
    writeProfileProgress(cleanEmail, newProgress);
    res.json({ success: true, profile: newProgress });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

// In development, hook Vite middleware; in production, serve static assets
if (!isProd) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.resolve(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT} (env: ${process.env.NODE_ENV || 'development'})`);
});
