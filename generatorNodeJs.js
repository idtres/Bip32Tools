const bip39 = require('bip39');
const { BIP32Factory } = require('bip32');
const bitcoin = require('bitcoinjs-lib');
const readline = require('readline');
const ecc = require('tiny-secp256k1');

// Initialize the BIP32 factory with the crypto library
const bip32 = BIP32Factory(ecc);

// Create a readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

// Function to get user input with a default value
const askQuestion = (query, defaultValue) => {
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            resolve(answer || defaultValue);
        });
    });
};

(async () => {
    try {
        const defaultMnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        const mnemonic = await askQuestion(`Enter your 12-word mnemonic (leave blank for default): `, defaultMnemonic);

        if (!bip39.validateMnemonic(mnemonic)) {
            throw new Error("Invalid mnemonic phrase");
        }

        const passphrase = await askQuestion(`Enter your passphrase (leave blank for default wallet): `, "");
        const startIndex = parseInt(await askQuestion(`Enter the starting index for address generation (default is 0): `, "0"), 10);
        const numAddresses = parseInt(await askQuestion(`Enter the number of addresses to generate (default is 10): `, "10"), 10);

        // Generate seed from the mnemonic and passphrase
        const seed = bip39.mnemonicToSeedSync(mnemonic, passphrase);

        // Initialize BIP-84 for Bitcoin (Bech32 SegWit addresses)
        const root = bip32.fromSeed(seed, bitcoin.networks.bitcoin);

        // Derive the account node (m/84'/0'/0')
        const account = root.derivePath("m/84'/0'/0'");
        const xpub = account.neutered().toBase58();

        console.log(`\nBitcoin XPUB (m/84'/0'/0'): ${xpub}`);
        console.log("=".repeat(50));

        // Generate the requested number of Bitcoin addresses
        for (let i = startIndex; i < startIndex + numAddresses; i++) {
            const child = account.derive(0).derive(i);
            const { address } = bitcoin.payments.p2wpkh({
                pubkey: child.publicKey,
                network: bitcoin.networks.bitcoin,
            });

            console.log(`Index: ${i}`);
            console.log(`Private Key: ${child.toWIF()}`);
            console.log(`Public Key: ${child.publicKey.toString('hex')}`);
            console.log(`Address: ${address}`);
            console.log("-".repeat(50));
        }

        rl.close();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        rl.close();
    }
})();
