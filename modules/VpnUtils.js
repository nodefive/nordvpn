export default class VpnUtils {
    // Remove the junk that shows up from messages in the nordvpn output
    processCityCountryOutput = (input) => {
        // Remove ANSI escape codes / color formatting
        input = input.replace(/[\u001b\x1b]\[[0-9;]*[a-zA-Z]/g, '');

        const lines = input.split(/\r?\n/);
        const items = [];

        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            // Skip lines containing update/upgrade messages or virtual location servers
            if (line.includes('Virtual location servers') || line.includes('update') || line.includes('new version')) {
                continue;
            }

            // Split the line by 2 or more spaces (column separators)
            const parts = line.split(/\s{2,}/);
            for (const part of parts) {
                const trimmed = part.trim();
                // Remove any leading non-word characters like "-  -  " or other punctuation at the beginning of the item
                const cleaned = trimmed.replace(/^[\W_]+/, '');
                if (cleaned) {
                    items.push(cleaned);
                }
            }
        }

        // Keep valid names matching the pattern (words, spaces, hyphens, apostrophes)
        const validItems = items.filter(c => /\b\w[\w\s'-]*\b/.test(c));

        return validItems.sort();
    };

    getString = (data) => {
        const decoder = new TextDecoder('utf-8');
        return data instanceof Uint8Array
            ? decoder.decode(data)
            : data.toString();
    }

    resolveSettingsValue(text) {
        if (!text) return;
        const normalizedText = text.trim();

        if (normalizedText === `enabled`) return true;
        if (normalizedText === `disabled`) return false;

        return normalizedText;
    }

    resolveSettingsKey(text) {
        if (!text) return;
        const normalizedText = text.trim().toLowerCase()

        if (normalizedText === `firewall`) return `firewall`;
        if (normalizedText.includes(`tech`)) return `technology`;
        if (normalizedText === `protocol`) return `protocol`;
        if (normalizedText === `kill switch`) return `killswitch`;
        if (normalizedText === `analytics`) return `analytics`;
        if (normalizedText === `threat protection lite`) return `cybersec`;
        if (normalizedText === `obfuscate`) return `obfuscate`;
        if (normalizedText === `notify`) return `notify`;
        if (normalizedText === `auto-connect`) return `autoconnect`;
        if (normalizedText === `ipv6`) return `ipv6`;

        // Currently these settings are not supported in this extension
        //if (normalizedText === `dns`) return `dns`;

        return null;
    }
}
