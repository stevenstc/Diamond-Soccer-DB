const express = require('express');
const fetch = require('node-fetch');
const Web3 = require('web3');
var cors = require('cors')
require('dotenv').config();
var moment = require('moment'); // require
moment().format(); 

const delay = ms => new Promise(res => setTimeout(res, ms));

const app = express();
app.use(cors());


const port = process.env.PORT || 3004;
const PEKEY = process.env.APP_PRIVATEKEY || "56d2256d18d3fb6ea1a1f077df4bf87183fcca855d06e0a0c629e6168bca5e3f";

const RED = "https://data-seed-prebsc-1-s1.binance.org:8545/";
const addressContract = process.env.APP_CONTRACT || "TBRVNF2YCJYGREKuPKaP7jYYP9R1jvVQeq";
const addressContractPool = process.env.APP_CONTRACT_POOL || "TNGkvCofQcECQFHmuwZ1119uVK8qJYU5C4";


let web3 = new Web3(Web3.providers.HttpProvider(RED));
//web3.eth.accounts.privateKeyToAccount(PEKEY);


//console.log(web3.eth.accounts);
console.log(web3.eth.accounts.wallet);


app.get('/api',async(req,res) => {

    res.send("Conectado y funcionando v1.0");
});

app.get('/api/v1',async(req,res) => {

    res.send("Conectado y funcionando");
});

app.get('/api/v1/tiempo',async(req,res) => {

	data = moment(Date.now()).format('MM-DD-YYYY/HH:mm:ss')

    res.send(data);
});

app.get('/api/v1/user/:wallet',async(req,res) => {

    let wallet = req.params.wallet;

	user = `${wallet}/sevenupsoyo12@gmail.com/${300}/${150}`

    res.send(user);
});


app.get('/api/v1/coins/:wallet',async(req,res) => {

    let wallet = req.params.wallet;

	console.log(wallet);
	//monedasin/monedas Out
	user = "50203-10"
		

    res.send(user);
});


app.get('/api/v1/ejemplo',async(req,res) => {

    //let wallet = req.params.wallet;

	//monedasin/monedas Out
	user = "50000-10"
		

    res.send(user);
});

app.get('/api/v1/asignar/:wallet',async(req,res) => {

    let wallet = req.params.wallet;

    req.query

	console.log(req.query);
	//monedasin/monedas Out
	user = "true"
		
    res.send(user);
});


app.get('/', (req, res, next) => {
    console.log(req.query);

    res.send(req.query);

 });




app.listen(port, ()=> console.log('Escuchando Puerto: ' + port))
