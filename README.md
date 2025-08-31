# SJCLTiddlerEncryptionPlugin

An adaptation of TiddlerEncryptionPlugin (http://www.remotely-helpful.com/TiddlyWiki/TiddlerEncryptionPlugin.html), but use Stanford Javascript Crypto Library (SJCL) instead of Tiny Encryption Algorithm.

# SJCLTiddlerEncryption.js

SJCLTiddlerEncryption.js is a Node.js CLI version of SJCLTiddlerEncryptionPlugin.It only works for .tiddler format.

### Usage

To Encrypt: node SJCLTiddlerEncryption.js encrypt my-tiddler.tiddler prompt

To Decrypt: node SJCLTiddlerEncryption.js decrypt my-tiddler.tiddler prompt

# TiddlerFiles.js

TiddlerFiles.js is a Node.js script to convert TiddlerFiles between .tid and .tiddler.

### Usage

node TiddlerFiles.js DcTableOfContentsPlugin.tid

node TiddlerFiles.js DcTableOfContentsPlugin.tiddler
