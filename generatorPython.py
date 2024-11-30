from mnemonic import Mnemonic
from bip_utils import Bip39SeedGenerator, Bip84, Bip84Coins, Bip44Changes

# Function to get user input with a default value
def ask_question(prompt, default_value):
    user_input = input(prompt).strip()
    return user_input if user_input else default_value

# Main function
def main():
    try:
        # Default mnemonic
        default_mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"

        # Ask for mnemonic or use the default
        mnemonic_phrase = ask_question("Enter your 12-word mnemonic (leave blank for default): ", default_mnemonic)

        # Validate the mnemonic
        mnemo = Mnemonic("english")
        if not mnemo.check(mnemonic_phrase):
            raise ValueError("Invalid mnemonic phrase")

        # Ask for passphrase
        passphrase = ask_question("Enter your passphrase (leave blank for default wallet): ", "")

        # Ask for the starting index
        start_index = int(ask_question("Enter the starting index for address generation (default is 0): ", "0"))

        # Ask for the number of addresses to generate
        num_addresses = int(ask_question("Enter the number of addresses to generate (default is 10): ", "10"))

        # Generate seed from the mnemonic and passphrase
        seed = Bip39SeedGenerator(mnemonic_phrase).Generate(passphrase)

        # Initialize BIP-84 for Bitcoin (Bech32 SegWit addresses)
        bip84_mst = Bip84.FromSeed(seed, Bip84Coins.BITCOIN)

        # Get the xpub (extended public key) for the account m/84'/0'/0'
        bip84_acc = bip84_mst.Purpose().Coin().Account(0)
        xpub = bip84_acc.PublicKey().ToExtended()

        print(f"\nXPUB (m/84'/0'/0'): {xpub}")
        print("=" * 50)

        # Generate Bech32 addresses
        for i in range(start_index, start_index + num_addresses):
            # Derive keys from the path m/84'/0'/0'/0/i
            bip84_addr = bip84_acc.Change(Bip44Changes.CHAIN_EXT).AddressIndex(i)

            private_key = bip84_addr.PrivateKey().Raw().ToHex()
            public_key = bip84_addr.PublicKey().RawCompressed().ToHex()
            address = bip84_addr.PublicKey().ToAddress()  # Bech32 address

            print(f"Index: {i}")
            print(f"Private Key: {private_key}")
            print(f"Public Key: {public_key}")
            print(f"Address: {address}")
            print("-" * 50)

    except Exception as e:
        print(f"Error: {str(e)}")

# Run the script
if __name__ == "__main__":
    main()
