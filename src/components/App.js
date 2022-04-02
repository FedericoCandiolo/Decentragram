import React, { Component } from 'react';
import Web3 from 'web3';
import Identicon from 'identicon.js';
import './App.css';
import Decentragram from '../abis/Decentragram.json'
import Navbar from './Navbar'
import Main from './Main'

//Declare IPFS
const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' }) // leaving out the arguments will default to these values

class App extends Component {
  async componentWillMount() {
    //React se fija si esta y lo ejecuta, es de Life Cycle
    await this.loadWeb3();
    await this.loadBlockchainData();
    this.setState({ loading: false });
  }

  async loadWeb3() {
    //de estado
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    } else {
      window.alert(
        'Non-Ethereum browser detected. You should consider trying MetaMask!'
      );
    }
  }

  async loadBlockchainData() {
    const range = n => [...Array(n).keys()];

    const web3 = window.web3;
    //Load accounts
    const accounts = await web3.eth.getAccounts();
    this.setState({ account: accounts[0] });

    const networkId = await web3.eth.net.getId();
    const networkData = Decentragram.networks[networkId];
    if (networkData) {
      const decentragram = web3.eth.Contract(
        Decentragram.abi,
        networkData.address
      );
      this.setState({ decentragram });
      const imagesCount = await decentragram.methods.imageCount().call();
      this.setState({ imagesCount }); 
      // Load images
      for (let i = 1; i <= imagesCount; i++) {
        const image = await decentragram.methods.images(i).call()
        this.setState({
          images: [...this.state.images, image]
        })
      }
      // Sort images
      this.setState({images : this.state.images.sort((a,b)=>a.tipAmount<=b.tipAmount)});
    } else {
      window.alert('Decentragram contract not deployed to detected network.');
    }
  }

  captureFile = (event) => { //Preprocesa la imagen para upload
    event.preventDefault();
    const file = event.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);

    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) });
      console.log('buffer', this.state.buffer);
    };
  };

  uploadImage = (description) => {
    console.log('Submitting file to ipfs...');

    //adding file to the IPFS
    ipfs.add(this.state.buffer, (error, result) => {
      console.log('Ipfs result', result);
      if (error){
        console.error(error);
        return;
      }
      this.setState({ loading: true });
      this.state.decentragram.methods
      .uploadImage(result[0].hash, description)
      .send({ from: this.state.account }) //Send porque hago una transaccion (escribo en blockchain)
      .on('transactionHash', (hash) => {
        this.setState({ loading: false });
      });
    });
  };

  tipImageOwner = (id, tipAmount) => {
    this.setState({ loading: true });
    this.state.decentragram.methods
      .tipImageOwner(id)
      .send({ from: this.state.account, value: tipAmount })
      .on('transactionHash', (hash) => {
        this.setState({ loading: false });
      });
  }

  constructor(props) {
    super(props);
    this.state = {
      account: '',
      decentragram: null,
      images: [],
      loading: true,
    };
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        {this.state.loading ? (
          <div id="loader" className="text-center mt-5">
            <p>Loading...</p>
          </div>
        ) : (
          <Main
            images={this.state.images}
            captureFile={this.captureFile}
            uploadImage={this.uploadImage}
            tipImageOwner={this.tipImageOwner}
          />
        )}
      </div>
    );
  }
}

export default App;