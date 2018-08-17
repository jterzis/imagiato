import {Table, Grid, Button, Form, Thumbnail } from 'react-bootstrap';
import { saveAs } from 'file-saver/FileSaver';
import React, { Component } from "react"
//import SimpleStorageContract from '../build/contracts/SimpleStorage.json'
import getWeb3 from './utils/getWeb3'
import ipfs from './ipfs'
import imageSellerFactory from './ImageSellerFactory'
import imageSellerAbi from './ImageSeller'


import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

var IPFS = require('ipfs')
var base64 = require('base-64')

class App extends Component {
    constructor(props) {
        super(props)

        this.state = {
            web3: null,
            contract: null,
            account: null,
            ipfsHash: null,
            buffer: null,
            imagePreviewUrl: null,
            ethAddress: null,
            blockNumber: null,
            transactionHash: null,
            gasUsed: null,
            txReceipt: null,
            isFactory: imageSellerFactory,
            defaultImageName: "image1",
            defaultImagePrice: 1000000,
        }
        // bind functions so they retain class context (this)
        this.convertToBuffer = this.convertToBuffer.bind(this)
        this.convertToUrl = this.convertToUrl.bind(this)
        this.captureFile = this.captureFile.bind(this)
        this.onClickBuy = this.onClickBuy.bind(this)
    }
    // jshint ignore:start
    componentWillMount() {
        // Get network provider and web3 instance
        // See utils/getWeb3 for more info

        getWeb3.then(results => {
            this.setState({
                web3: results.web3
            })
        })
    }
    // jshint ignore:end

    captureFile(event) {
        event.stopPropagation()
        event.preventDefault()
        let readerFile = new FileReader()
        const file = event.target.files[0]
        let reader = new window.FileReader()
        reader.readAsArrayBuffer(file)
        readerFile.onloadend = () => this.convertToUrl(readerFile)
        reader.onloadend = () => this.convertToBuffer(reader)
        readerFile.readAsDataURL(file)
    }

    // jshint ignore:start
    convertToUrl = async(readerFile) => {
        this.setState({imagePreviewUrl: readerFile.result})
    }
    // jshint ignore:end

    // jshint ignore:start
    convertToBuffer = async(reader) => {
        // file is converted to a buffer to prepare for uploading to IPFS
        const buffer = await Buffer.from(reader.result)
        // set this buffer using es6 syntax
        this.setState({buffer: buffer})
    }
    // jshint ignore:end


    // jshint ignore:start
    onClickRemove = async () => {
        this.setState({imagePreviewUrl:null})
        // remove via smart contract
        this.state.isFactory.setProvider(this.state.web3.currentProvider)
        let imageSellerFactory = this.state.isFactory
        var imageSellerFactoryInstance
        this.state.web3.eth.getAccounts((error, accounts) => {
            imageSellerFactory.deployed().then(async (instance) => {
                imageSellerFactoryInstance = instance
                const sellerContractAddr = await imageSellerFactoryInstance.getSellerContract(accounts[0])
                var ImageSellerInstance = new this.state.web3.eth.Contract(imageSellerAbi, sellerContractAddr)
                ImageSellerInstance.methods.removeFromRegistry(this.state.defaultImageName).send(
                    {from: accounts[0], gas: 1000000},
                    (error, transactionHash) => {
                        console.log(transactionHash)
                        this.setState({transactionHash})
                    }
                )
            })
        })

    }
    // jshint ignore:end

    // jshint ignore:start
    onClick = async () => {
        try{
            this.setState({blockNumber:"waiting..."})
            this.setState({gasUsed:"waiting..."})

            // await Transaction receipt in console on click
            // See: https://web3js.readthedocs.io/en/1.0/web3-eth.html#gettransactionreceipt
            await this.state.web3.eth.getTransactionReceipt(this.state.transactionHash, (err, txReceipt)=>{
                console.log(err, txReceipt)
                this.setState({txReceipt})
            })
            await this.setState({blockNumber: this.state.txReceipt.blockNumber})
            await this.setState({gasUsed: this.state.txReceipt.gasUsed})
        } catch(error) {
            console.log(error)
        }
    }
    // jshint ignore:end


    // jshint ignore:start
    onClickBuy() {
        // buy ipfs hash via solidity contract
        // then get file from ipfs
        // and prompt user to save on local fs
        var buf = [];
        var data
        var blob
        var imgUrl
        var img
        this.state.isFactory.setProvider(this.state.web3.currentProvider)
        console.log(this.state.ipfsHash)
        ipfs.files.cat(`/ipfs/${this.state.ipfsHash}`).then(function (file) {
            console.log('file')
            console.log(file)
            data = Array.prototype.slice.call(file)
            buf = buf.concat(data)
            console.log(buf)
            // garbage collect last blob
            if (typeof block !== 'undefined') {
                window.URL.revokeObjectURL(blob)
            }
            // create new blob
            buf = ipfs.types.Buffer(buf);
            blob = new Blob([buf], {type:"image/jpg"})
            console.log(blob)
            imgUrl = window.URL.createObjectURL(blob)
            console.log(imgUrl)
            img = document.getElementById('PurchasedPhoto')
            img.src = imgUrl
            const ctx = img.getContext('2d')
            var imgObj = new Image()
            imgObj.src = imgUrl
            imgObj.onload = function() {
                ctx.drawImage(imgObj,0,0)
            }
        })
    }
    // jshint ignore:end

    // jshint ignore:start
    onSubmit = async (event) => {
        event.preventDefault()

        // set web3 provider for contract
        // move to constructor
        console.log("Current provider web3 " + this.state.web3.currentProvider)
        this.state.isFactory.setProvider(this.state.web3.currentProvider)
        let imageSellerFactory = this.state.isFactory
        var imageSellerFactoryInstance
        // read in user's metamask account addr
        // save document to IPFS, return its hash, and set hash to state
        await ipfs.add(this.state.buffer, (err, files) => {
            const file = files[0]
            console.log(file.hash)
            console.log(file.path)
            console.log(err)
            //setState by setting ipfsHash to ipfsHash[0].hash
            this.setState({ ipfsHash: file.hash})
            // call Ethereum contract factory method to create ImageSeller
            // and add image hash to registry for seller's marketplace
            this.state.web3.eth.getAccounts((error, accounts) => {
                imageSellerFactory.deployed().then(async (instance) => {
                    imageSellerFactoryInstance = instance
                    await imageSellerFactoryInstance.createImageSeller({from: accounts[0]})
                    const sellerContractAddr = await imageSellerFactoryInstance.getSellerContract(accounts[0])
                    // use web3 1.0 send and web3.eth.contract to create contract interface
                    console.log("ImageSeller ABI " + imageSellerAbi)
                    console.log("Seller contrac taddr " + sellerContractAddr)
                    console.log("IPFS Hash " + this.state.ipfsHash)
                    var ImageSellerInstance = new this.state.web3.eth.Contract(imageSellerAbi, sellerContractAddr)
                    ImageSellerInstance.methods.addImageToRegistry(
                        this.state.defaultImageName, this.state.ipfsHash, 0, this.state.defaultImagePrice, 1000)
                        .send({from: accounts[0]},
                        (error, transactionHash) => {
                            console.log(transactionHash)
                            // store tx hash in component
                            this.setState({transactionHash})
                        })
                })
            })
        }) // await IPFS hash
    } // onSubmit
    // jshint ignore:end

    render() {
        let {imagePreviewUrl} = this.state;
        let $imagePreview = null;
        if (imagePreviewUrl) {
            $imagePreview = (
                <Thumbnail src={imagePreviewUrl}>
                    <p>
                        <Button onClick = {this.onClickRemove}> Remove Image </Button>
                    </p>
                </Thumbnail>
            );
        } else {
            $imagePreview = (<div className="previewText">Please upload an image to sell for Eth!</div>);
        }
        return (
            <div className="App">
                <header className="App-header">
                    <h1> Imagiato Decentralized Stock Image Marketplace on Ethereum</h1>
                </header>

                <hr />

                <Grid>
                    <h3> Choose file to send to IPFS </h3>
                    <Form onSubmit={this.onSubmit}>
                        <input
                            type = "file"
                            onChange = {this.captureFile}
                        />
                        <Button
                            bsStyle="primary"
                            type="submit">
                            Add to Sell Registry
                        </Button>
                        <p>

                        </p>
                        <div className="imgPreview">
                            {$imagePreview}
                        </div>
                        <div className="buyImage">
                            <Button onClick = {this.onClickBuy.bind(this)}> Buy Image </Button>
                        </div>
                    </Form>
                    <div>
                        <canvas ref="canvas" width={640} height={425} id="PurchasedPhoto">Waiting for your purchase here</canvas>
                    </div>

                    <hr/>
                    <Button onClick = {this.onClick}> Get Transaction Receipt </Button>

                    <Table bordered responsive>
                        <thead>
                        <tr>
                            <th>Tx Receipt Category</th>
                            <th>Values</th>
                        </tr>
                        </thead>

                        <tbody>
                        <tr>
                            <td>IPFS Hash # stored on Eth Contract</td>
                            <td>{this.state.ipfsHash}</td>
                        </tr>
                        <tr>
                            <td>Ethereum Contract Address</td>
                            <td>{this.state.ethAddress}</td>
                        </tr>

                        <tr>
                            <td>Tx Hash # </td>
                            <td>{this.state.transactionHash}</td>
                        </tr>

                        <tr>
                            <td>Block Number # </td>
                            <td>{this.state.blockNumber}</td>
                        </tr>

                        <tr>
                            <td>Gas Used</td>
                            <td>{this.state.gasUsed}</td>
                        </tr>
                        </tbody>
                    </Table>
                </Grid>
            </div>
        );
    } //render
}


/*
class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      storageValue: 0,
      web3: null,
        contract: null,
        account: null
    }
  }

  componentWillMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
    .then(results => {
      this.setState({
        web3: results.web3
      })

      // Instantiate contract once web3 provided.
      this.instantiateContract()
      this.instantiateIPFS()
    })
    .catch(() => {
      console.log('Error finding web3.')
    })
  }

  instantiateIPFS() {
      const node = new IPFS({ repo: String(Math.random() + Date.now()) })
      node.once('ready', () => console.log('IPFS node is ready'))
  }
*/
/*
  instantiateContract() {
    //
     //SMART CONTRACT EXAMPLE
     //
     //Normally these functions would be called in the context of a
     //state management library, but for convenience I've placed them here.
     //

    const contract = require('truffle-contract')
    const simpleStorage = contract(SimpleStorageContract)
    simpleStorage.setProvider(this.state.web3.currentProvider)

    // Declaring this for later so we can chain functions on SimpleStorage.
    var simpleStorageInstance

    // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      simpleStorage.deployed().then((instance) => {
        simpleStorageInstance = instance

        // Stores a given value, 5 by default. Prompts a transaction
        return simpleStorageInstance.set(5, {from: accounts[0]})
      }).then((result) => {
        // Get the value from the contract to prove it worked.
        return simpleStorageInstance.get.call(accounts[0])
      }).then((result) => {
        // Update state of app with the result.
        return this.setState({ storageValue: result.c[0], contract: simpleStorageInstance, account: accounts[0] })
      })
    })
  }

  handleClick(event){
      const contract = this.state.contract;
      const account = this.state.account;

      var value = 3;

      contract.set(value, {from: account})
          .then(result =>  {
              //read contract state
              return contract.get.call()
          }).then(result => {
              //update UI
              return this.setState({storageValue: result.c[0]})
      })

  }

  render() {
    return (
      <div className="App">
        <nav className="navbar pure-menu pure-menu-horizontal">
            <a href="#" className="pure-menu-heading pure-menu-link">Truffle Box</a>
        </nav>

        <main className="container">
          <div className="pure-g">
            <div className="pure-u-1-1">
              <h1>Good to Go!</h1>
              <p>Your Truffle Box is installed and ready.</p>
              <h2>Smart Contract Example</h2>
              <p>If your contracts compiled and migrated successfully, below will show a stored value of 5 (by default).</p>
              <p>Try changing the value stored on <strong>line 59</strong> of App.js.</p>
              <p>The stored value is: {this.state.storageValue}</p>
              <button onClick={this.handleClick.bind(this)}>Set Storage!</button>
            </div>
          </div>
        </main>
      </div>
    );
  }
}
*/
export default App
