# Imagiato
Author: John C Terzis

Date: August 2018


Decentralized P2P Stock Image Marketplace on Ethereum

Web 2.0 brought us products like Shutterstock that give photographers and content creators a highly
trafficked centralized marketplace to sell royalty free rights to their digital work. In this arrangement,
Shutterstock provides the hosting infrastructure and dictates market price and temrs of the arrangement
with content creators.

Web 3.0 brings us a new stack of technologies that can allow for paradigm shifts not possible previously.
Ethereum allows us to created decentralized apps that run trustlessly on the Ethereum virtual machine.
Moreover, value can be exchanged on the Ethereum blockchain network in a p2p manner and business logic
can be encoded in a tamper resistant manner through immutable smart contracts.

Imagiato is a dapp running on Ethereum. It gives content creators a p2p venue to sell their content (images)
through self-sovereign "stores" that resolve to smart contracts deployed on the blockchain with the content owner's
Ethereum wallet address guarding their sale proceeds and their content hashes. 

IPFS hosted on Infura is used to store fully un-compressed versions of content creator's images that are posted for sale
on the Ethereum blockchain. The hashes returned by IPFS are stored on the content creator's smart contract as storage.

Consumers can browse through low-quality compressed versions of images for sale on the dapp's frontend and purchase
them by connecting their Ethereum wallet via MetaMask. The transaction will result in a call to the content creator's 
deployed contract to retrieve the IPFS hash and ultimately the uncompressed original image via Infura's IPFS nodes to the 
buyer who can then save the image from the dapp frontend directly.


================================================
## Requirements

- Chrome browser
- node (>8)
- npm
- ganache
- truffle


`sudo apt-get update`

`sudo apt-get install nodejs`

`sudo apt-get install npm`

Upgrade to latest node

```
sudo npm cache clean -f
sudo npm install -g n
sudo n latest
```

`npm install -g ganache-cli`

`npm install -g truffle`

## Deploy (locally)

`ganache-cli`

Compile contracts

`truffle compile`

Migrate contracts onto ganache local instance

`truffle migrate --reset`

Install dependencies

`npm install`

Run js and solidity unit and integration test suite

`truffle test`

Start application on localhost:3000

`npm run start`

Import seed from ganache into MetaMask and connect to 127.0.0.1:8545

Navigate to localhost:3000 in browser MetaMask is connected to

Add an image by clicking "Choose File" and then "Add to Sell Registry"

Adding an image will create and deploy an instance of `ImageSeller` your image store
and store your image on IPFS forwarding the hash to your contract for future retrieval.

It will also display a compressed version of the image for buyers to browse and purchase
for a fixed price of .002 ETH.

To buy the image "Create Account" in MetaMask to toggle accounts and click on "Buy Image"
at bottom of dapp. Once the transaction is sent via MetaMask (should prompt you), the
original uncompressed image should appear on your screen which you can then download
by right clicking and "Save As" on your browser.


## Notes on Unit/Integration Tests

Unit tests are written in solidity while integration tests between ImageSellerFactory
and ImageSeller contracts are written in javascript taking advantage of web3 .10 api utilities
mainly account import. There are total 11 tests spanning the two deployed contracts, ImageSellerFactory,
and ImageSeller. 

Tests span a typical life cycle usage from the perspective of both an image seller creating
their own marketplace / adding inventory (photos) with price parameters and a buyer purchasing
an image in a p2p manner. 

The tests try to test good and bad code pathways. There's a test where an image is purchased
using insufficient Eth which should fail ultimately. There are tests that test the admin
modifiers on the ImageSeller contract; only the deployer (seller) should be able to add or
remove an image from their marketplace.

## Todo

- Allow for multiple images to be simultaneously hosted by multiple sellers
- Search functionality by image metadata
- Auction capabilities
- Discounts
- Form to offer variational pricing
- Implement Oraclize oracle on `ImageSeller` contract to encrypt IPFS hash to prevent snooping
of IPFS hash which is stored unencrypted on blockchain.
- Aggregate seller's balance and sales figures on a seller portal site
- Test local IPFS integration in case Infura is down or drops stored hashes arbitrarily.
