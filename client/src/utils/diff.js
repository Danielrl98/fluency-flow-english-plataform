// Diff algorithm and smart flexible validation for listening dictation

// Clean and normalize text: ignore punctuation, lower case, standardize quotes
export function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[’‘`]/g, "'") // standardize apostrophes
    .replace(/[“”]/g, '"')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, '') // remove punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

// Levenshtein distance for typo detection
export function levenshteinDistance(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Validates user typed text against target sentence.
 * Returns word-by-word feedback:
 * - correct (exact match)
 * - typo (1-2 edits off for words > 3 chars)
 * - missing (word was omitted)
 * - incorrect (wrong word)
 */
export function validateDictation(userInput, targetSentence) {
  const normUser = normalizeText(userInput);
  const normTarget = normalizeText(targetSentence);

  const userWords = normUser ? normUser.split(' ') : [];
  const targetWords = normTarget ? normTarget.split(' ') : [];

  // Exact match shortcut
  if (normUser === normTarget) {
    return {
      isMatch: true,
      accuracy: 100,
      diffWords: targetWords.map(w => ({ word: w, status: 'correct', userWord: w })),
      message: 'Perfeito! Você acertou todas as palavras!'
    };
  }

  const diffWords = [];
  let correctCount = 0;
  let typosCount = 0;

  for (let i = 0; i < targetWords.length; i++) {
    const targetWord = targetWords[i];
    const userWord = userWords[i];

    if (!userWord) {
      diffWords.push({
        word: targetWord,
        status: 'missing',
        userWord: ''
      });
      continue;
    }

    if (userWord === targetWord) {
      diffWords.push({
        word: targetWord,
        status: 'correct',
        userWord
      });
      correctCount++;
    } else {
      const dist = levenshteinDistance(userWord, targetWord);
      const isTypo = (targetWord.length >= 4 && dist <= 2) || (targetWord.length < 4 && dist === 1);

      if (isTypo) {
        diffWords.push({
          word: targetWord,
          status: 'typo',
          userWord,
          distance: dist
        });
        typosCount++;
      } else {
        diffWords.push({
          word: targetWord,
          status: 'incorrect',
          userWord
        });
      }
    }
  }

  // Any extra words user typed beyond target
  if (userWords.length > targetWords.length) {
    for (let i = targetWords.length; i < userWords.length; i++) {
      diffWords.push({
        word: '',
        status: 'extra',
        userWord: userWords[i]
      });
    }
  }

  const accuracy = Math.round((correctCount / Math.max(targetWords.length, userWords.length)) * 100);
  const isMatch = correctCount === targetWords.length && typosCount === 0 && userWords.length === targetWords.length;

  let message = 'Vamos lá, ouça com atenção e ajuste o texto.';
  if (isMatch) {
    message = 'Excelente! Acertou 100%!';
  } else if (typosCount > 0 && correctCount + typosCount === targetWords.length) {
    message = 'Quase lá! Veja as palavras destacadas em amarelo com pequenos erros de digitação.';
  } else if (accuracy > 70) {
    message = 'Muito bom! Faltam apenas alguns detalhes.';
  }

  return {
    isMatch,
    accuracy,
    diffWords,
    message
  };
}

// Generate hints based on hintLevel (1, 2, or 3)
export function getHint(targetSentence, hintLevel = 1) {
  const words = normalizeText(targetSentence).split(' ');

  if (hintLevel === 1) {
    // Word counts and blank spaces: "_ _ _ (X palavras)"
    return {
      type: 'structure',
      text: `A frase tem ${words.length} palavras: ` + words.map(w => '_'.repeat(Math.min(w.length, 6))).join(' ')
    };
  } else if (hintLevel === 2) {
    // First letter of each word
    return {
      type: 'firstLetters',
      text: 'Primeiras letras: ' + words.map(w => w.charAt(0).toUpperCase() + '_'.repeat(Math.max(1, w.length - 1))).join(' ')
    };
  } else {
    // Full sentence reveal
    return {
      type: 'reveal',
      text: targetSentence
    };
  }
}
