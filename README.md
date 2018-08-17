# imagiato
Decentralized P2P Stock Image Marketplace on Ethereum
=======
## Requirements

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

## Deploy

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