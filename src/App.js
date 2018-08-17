import {Table, Grid, Button, Form, Thumbnail } from 'react-bootstrap';
// import { saveAs } from 'file-saver/FileSaver';
import React, { Component } from "react"
import ReactDOM from 'react-dom'
//import SimpleStorageContract from '../build/contracts/SimpleStorage.json'
import getWeb3 from './utils/getWeb3'
import ipfs from './ipfs'
import imageSellerFactory from './ImageSellerFactory'
import abi from './ImageSeller'
import {ImageSellerInst} from './ImageSeller'


import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

var imageForm = document.getElementById('image')
var preview = document.getElementById('preview')
var sellCanvas = document.getElementById('SellCanvas')
var imageSellerAbi = abi
var imageSellerInstance = ImageSellerInst

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
            resized: null, //resized canvas url
            ethAddress: null,
            blockNumber: null,
            transactionHash: null,
            gasUsed: null,
            txReceipt: null,
            isFactory: imageSellerFactory,
            is: imageSellerInstance,
            defaultImageName: "image1",
            defaultImagePrice: 1000000000000000,
        }
        // bind functions so they retain class context (this)
        this.convertToBuffer = this.convertToBuffer.bind(this)
        this.convertToUrl = this.convertToUrl.bind(this)
        this.captureFile = this.captureFile.bind(this)
        this.onClickBuy = this.onClickBuy.bind(this)
        this.processFile = this.processFile.bind(this)
        this.resizeMe = this.resizeMe.bind(this)
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
        console.log('about to process file')
        var reader2 = new FileReader()
        reader2.readAsArrayBuffer(file)
        // compress file
        console.log('print file')
        console.log(file)
        readerFile.onloadend = () => this.convertToUrl(readerFile)
        //this.setState({imagePreviewUrl: null})
        reader2.onloadend = () => this.processFile(file)
        reader.onloadend = () => this.convertToBuffer(reader)
        readerFile.readAsDataURL(file)
    }

    // jshint ignore:start
    processFile = async(file) => {
        // blob stuff
        var blob = new Blob([file], {type:"image/jpg"})
        var blobUrl = window.URL.createObjectURL(blob) // get its url
        // helper image obj
        var img = document.getElementById('SellCanvas')
        //var imgCan = ReactDOM.findDOMNode('SellCanvas')
        console.log('print dom nodes')
        console.log(img)
        //console.log(imgCan)
        const ctx = img.getContext('2d')
        var image = new Image()
        image.src = blobUrl
        image.onload = () => this.resizeMe(image)
    }
    // jshint ignore:end

    // jshint ignore:start
    resizeMe = async(img) => {
        console.log('image url')
        console.log(img)
        var canvas = document.getElementById('SellCanvas')
        canvas.src = img.src
        var max_width = 10000
        var max_height = 10000
        var width = img.width
        var height = img.height
        // calculate the width and height, constraining the proportions
        if (width > height) {
            if (width > max_width) {
                //height *= max_width / width;
                height = Math.round(height *= max_width / width)
                width = max_width
            }
        } else {
            if (height > max_height) {
                //width *= max_height / height;
                width = Math.round(width *= max_height / height)
                height = max_height
            }
        }

        // resize the canvas and draw the image data into it
        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext("2d")
        ctx.drawImage(img, 0, 0, width, height)
        var canvasURL = canvas.toDataURL("image/jpeg",0.1) // get the data from canvas as 70% JPG (can be also PNG, etc.)
        /*var compressedImg = new Image()
        compressedImg.src = canvasURL
        compressedImg.onload = () => {
            ctx.drawImage(compressedImg, 0, 0, width, height)
        }
        console.log('print canvas url')
        console.log(canvasURL)
        */
        this.setState({resized:canvasURL})
        // update sale preview of image with lower quality compressed version
        ctx.clearRect(0,0, canvas.width, canvas.height)
        this.setState({imagePreviewUrl:canvasURL})
        console.log("canvas Url")
        console.log(canvasURL)
        var imageCompressed = new Image()
        imageCompressed.src = canvasURL
        imageCompressed.onload = () => {
            ctx.drawImage(imageCompressed, 0,0, width, height)
        }
    }
    // jshint ignore:end

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
    onClickBuy = async () => {
        // buy ipfs hash via solidity contract
        // then get file from ipfs
        // and prompt user to save on local fs
        var buf = [];
        var data
        var blob
        var imgUrl
        var img
        var imageSellerFactoryInstance
        let ImageSellerInstance
        var imageSellerInst
        //console.log('on click buy')
        //console.log(imageSellerInstance)
        this.state.isFactory.setProvider(this.state.web3.currentProvider)
        //this.state.is.setProvider(this.state.web3.currentProvider)
        console.log(this.state.ipfsHash)
        this.state.web3.eth.getAccounts((error, accounts) => {
            imageSellerFactory.deployed().then(async (instance) => {
                imageSellerFactoryInstance = instance
                const sellerContractAddr = await imageSellerFactoryInstance.getSellerContract(accounts[0])
                ImageSellerInstance = new this.state.web3.eth.Contract(imageSellerAbi, sellerContractAddr)
                ImageSellerInstance.methods.buyFromRegistry(this.state.defaultImageName).send({from: accounts[0],
                    value: this.state.defaultImagePrice}, (error, transactionHash) => {
                    console.log(error)
                    console.log("Purchase tx hash")
                    console.log(transactionHash)
                    this.setState({transactionHash})
                })

            })
        })
        /*
        var imageSellerInst = this.state.is
        this.state.web3.eth.getAccounts((error, accounts) => {
            imageSellerInst.deployed().then(async (instance) => {
                imageSellerInst = instance
                let purchaseEvent = imageSellerInst.LogMsgValue({}, {fromBlock:0, toBlock: 'latest'})
                purchaseEvent.get((error, logs) => {
                    // we have logs print them
                    logs.forEach(log => console.log(log.args))
                })
            })
        })
        */
        ipfs.files.cat(`/ipfs/${this.state.ipfsHash}`).then(function (file) {
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
            $imagePreview = (<div id="SellCanvasParent">
                    <canvas ref="image" src={imagePreviewUrl} id="SellCanvas" className="blah"></canvas>
                <Button onClick = {this.onClickRemove}> Remove Image </Button>
                    <p></p>
                </div>
            );
        } else {
            $imagePreview = (<canvas ref="sellCanvas" id="SellCanvas">Please upload an image to sell for Eth!</canvas>);
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
                        <div className="imgPreview" id="image">
                            {$imagePreview}
                        </div>
                        <div className="buyImage">
                            <Button onClick = {this.onClickBuy.bind(this)}> Buy Image </Button>
                        </div>
                    </Form>
                    <div>
                        <canvas ref="canvas" width={10000} height={10000} id="PurchasedPhoto">Waiting for your purchase here</canvas>
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
