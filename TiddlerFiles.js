const fs = require('fs');
const path = require('path');

/**
 * Converts a .tiddler file to a .tid file.
 * @param {string} filePath - The path to the .tiddler file.
 */
function convertTiddlerToTid(filePath) {
  const tidPath = filePath.replace(/\.tiddler$/, '.tid');
  const content = fs.readFileSync(filePath, 'utf8');

  // Extract attributes from the opening div tag
  const divTagMatch = content.match(/<div([^>]*)>/);
  if (!divTagMatch) {
    console.error(`Error: Could not find opening div tag in ${filePath}`);
    return;
  }
  let attributesString = divTagMatch[1];
  let attributes = '';
  // Convert key="value" to key: value
  attributesString.replace(/(\w+)\s*=\s*["']([^"']*)["']/g, (match, key, value) => {
    attributes += `${key}: ${value}\n`;
    return match;
  });

  // Extract the text content from within the <pre> tag
  const textMatch = content.match(/<pre>\s*(.*?)\s*<\/pre>/s);
  const text = textMatch ? textMatch[1] : '';

  const tidContent = `${attributes}\n${text}`;
  fs.writeFileSync(tidPath, tidContent, 'utf8');
  console.log(`Converted ${filePath} to ${tidPath}`);
}

/**
 * Converts a .tid file to a .tiddler file.
 * @param {string} filePath - The path to the .tid file.
 */
function convertTidToTiddler(filePath) {
  const tiddlerPath = filePath.replace(/\.tid$/, '.tiddler');
  const content = fs.readFileSync(filePath, 'utf8');

  // Split the content into attributes and text by the first blank line
  const lines = content.split('\n');
  let blankLineIndex = lines.findIndex(line => line.trim() === '');
  if (blankLineIndex === -1) {
    blankLineIndex = lines.length;
  }
  const attributesLines = lines.slice(0, blankLineIndex);
  const textContent = lines.slice(blankLineIndex + 1).join('\n');

  // Convert attribute lines (key: value) into a string of HTML attributes
  let attributes = '';
  attributesLines.forEach(line => {
    const parts = line.split(':');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join(':').trim();
      attributes += ` ${key}="${value}"`;
    }
  });

  // Construct the .tiddler HTML
  const tiddlerContent = `<div${attributes}>\n<pre>${textContent}</pre>\n</div>`;
  fs.writeFileSync(tiddlerPath, tiddlerContent, 'utf8');
  console.log(`Converted ${filePath} to ${tiddlerPath}`);
}

// Process command-line arguments
const files = process.argv.slice(2);
if (files.length === 0) {
  console.log('Usage: node your_script_name.js <file1> <file2> ...');
  process.exit(1);
}

files.forEach(file => {
  if (!fs.existsSync(file)) {
    console.error(`Error: File not found - ${file}`);
    return;
  }

  if (file.endsWith('.tiddler')) {
    convertTiddlerToTid(file);
  } else if (file.endsWith('.tid')) {
    convertTidToTiddler(file);
  } else {
    console.log(`Skipping: ${file} is not a .tid or .tiddler file.`);
  }
});
