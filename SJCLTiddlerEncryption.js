// SJCLTiddlerEncryption.js
const fs = require('fs');
const crypto = require('crypto');
const readline = require('readline');
const sjcl = require('sjcl');

// --- Helper Functions ---

/**
 * Calculates a SHA-1 hash of a string and returns it in uppercase hexadecimal format.
 * @param {string} str The input string.
 * @returns {string} The SHA-1 hash in uppercase hex.
 */
function hexSha1Str(str) {
    const hash = crypto.createHash('sha1');
    hash.update(str);
    return hash.digest('hex').toUpperCase();
}

/**
 * Securely prompts the user for a password via the command line.
 * @param {string} prompt The message to display to the user.
 * @returns {Promise<string>} A promise that resolves with the entered password.
 */
async function promptPassword(prompt) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise(resolve => {
        rl.question(prompt, { hideEchoBack: true }, password => {
            rl.close();
            resolve(password);
        });
    });
}

/**
 * Converts a string to its hexadecimal representation, adding newlines every 32 characters.
 * This function replicates the behavior of the original TiddlyWiki plugin for formatting.
 * @param {string} theString The input string.
 * @returns {string} The formatted hexadecimal string.
 */
function stringToHext(theString) {
    let theResult = "";
    for (let i = 0; i < theString.length; i++) {
        const theHex = theString.charCodeAt(i).toString(16);
        theResult += theHex.length < 2 ? `0${theHex}` : theHex;
        if (i > 0 && (i + 1) % 32 === 0) {
            theResult += "\n";
        }
    }
    return theResult;
}

/**
 * Converts a hex string back to a standard string. This is crucial
 * because the encrypted content is stored as a hexadecimal representation of a JSON string.
 * It removes all whitespace and newlines before conversion.
 * @param {string} theString The input hexadecimal string.
 * @returns {string} The resulting standard string.
 */
function hexToString(theString) {
    let theResult = "";
    // Remove all whitespace and newlines from the hex string
    const sanitizedHex = theString.replace(/\s+/g, '');
    for (let i = 0; i < sanitizedHex.length; i += 2) {
        theResult += String.fromCharCode(parseInt(sanitizedHex.substr(i, 2), 16));
    }
    return theResult;
}

// --- CLI Logic ---

async function runCli() {
    const args = process.argv.slice(2);
    const [action, filePath, promptString] = args;

    if (!action || !filePath || !promptString) {
        console.error('❌ Usage: node SJCLTiddlerEncryption.js [encrypt|decrypt] <file_path> <prompt_string>');
        process.exit(1);
    }

    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');

        // Regex to capture the entire div, tags attribute, and content within <pre>
        const tiddlerRegex = new RegExp(`(<div[^>]*tags=")([^"]+)(".*?>[\\s\\S]*?<pre>)([\\s\\S]*?)(<\\/pre>[\\s\\S]*<\\/div>)`);
        const match = fileContent.match(tiddlerRegex);

        if (!match) {
            throw new Error('Tiddler file is not in the expected format (missing <div>, tags, or <pre>).');
        }

        const [_, preTags, tagsString, postTags, content, endDiv] = match;
        const tagsArray = tagsString.split(' ').filter(tag => tag.length > 0);

        const password = await promptPassword(`Enter password for '${promptString}': `);

        let newContentText;
        let newTagsArray;
        let originalContent;

        if (action === 'encrypt') {
            const encryptTag = `SJCLEncrypt(${promptString})`;
            const decryptTag = `SJCLDecrypt(${promptString})`;

            if (!tagsArray.includes(encryptTag)) {
                throw new Error(`Tiddler does not have the tag '${encryptTag}'.`);
            }
         
            originalContent = content.trim();

            const encryptedJson = sjcl.encrypt(password, originalContent);
            const encryptedHexText = stringToHext(encryptedJson);

            newContentText = encryptedHexText;
            newTagsArray = tagsArray.map(tag => tag === encryptTag ? decryptTag : tag);
        } else if (action === 'decrypt') {
            const decryptTag = `SJCLDecrypt(${promptString})`;
            const encryptTag = `SJCLEncrypt(${promptString})`;

            if (!tagsArray.includes(decryptTag)) {
                throw new Error(`Tiddler does not have the tag '${decryptTag}'.`);
            }
         
            const encryptedHexText = content.trim();
            const encryptedJson = hexToString(encryptedHexText);

            try {
                const decryptedText = sjcl.decrypt(password, encryptedJson);
             
                newContentText = decryptedText;
                newTagsArray = tagsArray.map(tag => tag === decryptTag ? encryptTag : tag);
            } catch (err) {
                if (err.message.includes('corrupt')) {
                    throw new Error('Decryption failed. The password might be incorrect or the data is corrupted.');
                }
                throw err;
            }

        } else {
            throw new Error('Invalid action. Use "encrypt" or "decrypt".');
        }

        const newTagsString = newTagsArray.join(' ');
        const newFileContent = `${preTags}${newTagsString}${postTags}${newContentText}${endDiv}`;

        fs.writeFileSync(filePath, newFileContent, 'utf8');
        console.log(`✅ Successfully ${action}ed file: ${filePath}`);
    } catch (err) {
        console.error('❌ An error occurred:', err.message);
        process.exit(1);
    }
}

// Run the CLI
runCli();
