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
            sellerAccount: null,
            ipfsHash: null,
            buffer: null,
            sellerBalance: 0,
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
            defaultImagePrice: 2000000000000000,
        }
        // bind functions so they retain class context (this)
        this.convertToBuffer = this.convertToBuffer.bind(this)
        this.convertToUrl = this.convertToUrl.bind(this)
        this.captureFile = this.captureFile.bind(this)
        this.onClickBuy = this.onClickBuy.bind(this)
        this.processFile = this.processFile.bind(this)
        this.resizeMe = this.resizeMe.bind(this)
        this.retrieveImage = this.retrieveImage.bind(this)
        this.setWeb3 = this.setWeb3.bind(this)
        this.onClickWithdraw = this.onClickWithdraw.bind(this)
    }
    // jshint ignore:start
    componentWillMount() {
        // Get network provider and web3 instance
        // See utils/getWeb3 for more info

        this.setWeb3()
        //getWeb3.then(results => {
         //   this.setState({
           //     web3: results.web3
            //})
        //})
    }
    // jshint ignore:end

    // jshint ignore:start
    setWeb3() {
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
                        if (!error) {
                            this.setState({imagePreviewUrl: null})
                        }
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
    onClickWithdraw = async () => {
       var imageSellerFactoryInstance
       let ImageSellerInstance
       let thisComponent
       this.state.isFactory.setProvider(this.state.web3.currentProvider)
       this.state.web3.eth.getAccounts((error, accounts) => {
           imageSellerFactory.deployed().then(async (instance) => {
               thisComponent = this
               imageSellerFactoryInstance = instance
               if (accounts[0] !== this.state.sellerAccount) {
                   return
               }
               const sellerContractAddr = await imageSellerFactoryInstance.getSellerContract(this.state.sellerAccount)
               ImageSellerInstance = new this.state.web3.eth.Contract(imageSellerAbi, sellerContractAddr)
               ImageSellerInstance.methods.withdrawBalance(this.state.sellerAccount).send(
                   {from: accounts[0], gas: 1000000}).on('receipt', function(receipt) {
                       for (var key in receipt.events) {
                           var log = receipt.events[key]
                           if (log.event == "LogBalance") {
                               var balWithdrawn = log.returnValues.bal
                               console.log("balance withdrawn")
                               console.log(balWithdrawn)
                               thisComponent.setState({sellerBalance: 0})
                           }
                       }
               })
           })
       })
    }
    // jshint ignore:end

    // jshint ignore:start
    onClickBuy = async () => {
        // buy ipfs hash via solidity contract
        // then get file from ipfs
        // and prompt user to save on local fs
        var imageSellerFactoryInstance
        let ImageSellerInstance
        let txHash
        var paid = false
        let thisComponent
        let sellerBal
        this.state.isFactory.setProvider(this.state.web3.currentProvider)
        console.log(this.state.ipfsHash)
        this.state.web3.eth.getAccounts((error, accounts) => {
            imageSellerFactory.deployed().then(async (instance) => {
                thisComponent = this
                sellerBal = this.state.sellerBalance
                imageSellerFactoryInstance = instance
                const sellerContractAddr = await imageSellerFactoryInstance.getSellerContract(this.state.sellerAccount)
                ImageSellerInstance = new this.state.web3.eth.Contract(imageSellerAbi, sellerContractAddr)
                ImageSellerInstance.methods.buyFromRegistry(this.state.defaultImageName).send({from: accounts[0],
                    value: this.state.defaultImagePrice, gas: 1000000}).on('transactionHash', function(transactionHash){
                    console.log("Purchase tx hash")
                    console.log(transactionHash)
                    txHash = transactionHash
                }).on('receipt', function(receipt){
                    // if value exceeded price, MsgValue event will print
                    console.log(receipt.events)
                    console.log(receipt.events['LogMsgValue'])
                    //thisComponent.web3.eth.getBalance(sellerContractAddr, function(error, result) {
                    //    console.log("contract balance from web3")
                    //    console.log(result)
                    //})
                    ImageSellerInstance.methods.getTotalNumSales().call({from: thisComponent.sellerAccount},
                        function(error, result) {
                            console.log("Number of sales so far")
                            console.log(result)
                            console.log(error)
                        })
                    ImageSellerInstance.methods.getBalance().call({from: thisComponent.sellerAccount},
                        function(error, result) {
                        console.log("Seller balance")
                        console.log(result)
                        //thisComponent.setState({sellerBalance: result/parseFloat(Math.pow(10,18))})
                        })
                    for(var key in receipt.events){
                        var log = receipt.events[key]
                        if (log.event == "LogMsgValue") {
                            console.log('Price paid')
                            var price = log.returnValues.price
                            console.log(price)
                            paid = true
                            var updatedBal = parseFloat(sellerBal) + price/parseFloat(Math.pow(10,18))
                            console.log(updatedBal)
                            thisComponent.setState({sellerBalance: updatedBal})
                            thisComponent.retrieveImage()
                        }
                    }
                    console.log(receipt)
                })
                // wait for log events
                // var event = ImageSellerInstance.methods.LogMsgValue({}, {fromBlock:0, toBlock: 'latest'})
                // const log_info = await this.WaitAllContractEventGet(event)
                // console.log(log_info)
                this.setState({txHash})
            })
        })

    }
    // jshint ignore:end

    // jshint ignore:start
    retrieveImage() {
        var buf = []
        var data
        var blob
        var imgUrl
        var img
        ipfs.files.cat(`/ipfs/${this.state.ipfsHash}`).then(function (file) {
            console.log("retrieving image")
            data = Array.prototype.slice.call(file)
            buf = buf.concat(data)
            console.log(buf)
            // garbage collect last blob
            if (typeof block !== 'undefined') {
                window.URL.revokeObjectURL(blob)
            }
            // create new blob
            buf = ipfs.types.Buffer(buf);
            blob = new Blob([buf], {type: "image/jpg"})
            console.log(blob)
            imgUrl = window.URL.createObjectURL(blob)
            console.log(imgUrl)
            img = document.getElementById('PurchasedPhoto')
            img.src = imgUrl
            const ctx = img.getContext('2d')
            var imgObj = new Image()

            imgObj.src = imgUrl
            imgObj.onload = function () {
                ctx.drawImage(imgObj, 0, 0)
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
                    this.setState({ethAddress: sellerContractAddr})
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
                            this.setState({sellerAccount: accounts[0]})
                        })
                })
            })
        }) // await IPFS hash
    } // onSubmit
    // jshint ignore:end

    render() {
        let {sellerBalance} = this.state;
        let {imagePreviewUrl} = this.state;
        let {defaultImagePrice} = this.state;
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
                            <Button onClick = {this.onClickBuy.bind(this)}> Buy Image ({defaultImagePrice/parseFloat(Math.pow(10, 18))} ETH) </Button>
                        </div>
                    </Form>
                    <div>
                        <canvas ref="canvas" width={10000} height={10000} id="PurchasedPhoto">Waiting for your purchase here</canvas>
                    </div>
                    <hr/>
                    <Button onClick = {this.onClick}> Get Transaction Receipt </Button>
                    <Button onClick = {this.onClickWithdraw}> Withdraw Seller Balance {sellerBalance} </Button>
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


export default App
