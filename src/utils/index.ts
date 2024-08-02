export const messageContainsUnicode = (message: string): boolean => {
    return /[^\u0000-\u007F]+/.test(message);
}

export const replaceCommonUnicode = (message: string): string => {
    const commonCharactersMapping: { [key: string]: string } = {
        '…': '...',
        '‘': '\'', // Right single quotation mark
        '’': '\'', // Left single quotation mark
        '•': '-', // Bullet
        '–': '-', // En dash
        '—': '-', // Em dash
        '˜': '~', // Tilde
        '“': '"', // Left double quotation mark
        '”': '"', // Right double quotation mark
        '™': '', // Trade mark
        '	': ' ', // Non-breaking space
        '´': '\'', // Acute accent
        '·': '-', // Middle dot
        '‹': '<', // Single left-pointing angle quotation mark
        '›': '>', // Single right-pointing angle quotation mark
        '«': '<<', // Double left-pointing angle quotation mark
        '»': '>>', // Double right-pointing angle quotation mark
        'ˆ': '^', // Circumflex accent
    };
    for (const key in commonCharactersMapping) {
        message = message.replace(new RegExp(key, 'g'), commonCharactersMapping[key]);
    }
    return message;
};

export const getSegments = (message: string): number => {
    const hasUnicode = messageContainsUnicode(message);
    if (hasUnicode) {
        return Math.ceil(message.length / 70);
    }
    return Math.ceil(message.length / 160);
}