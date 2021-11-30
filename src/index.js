const express = require('express');
const fetch = require('node-fetch');
const bodyParser = require("body-parser");
const Web3 = require('web3');
var cors = require('cors')
require('dotenv').config();
var moment = require('moment'); // require
moment().format(); 

const abiMarket = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"admin","type":"address"}],"name":"AdminRemoved","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"admin","type":"address"}],"name":"NewAdmin","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[{"internalType":"address","name":"_tokenERC20","type":"address"}],"name":"ChangePrincipalToken","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_tokenERC20","type":"address"}],"name":"ChangeTokenOTRO","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"_nombre","type":"string"},{"internalType":"string","name":"_tipo","type":"string"},{"internalType":"uint256","name":"_value","type":"uint256"},{"internalType":"bool","name":"_acumulable","type":"bool"},{"internalType":"bool","name":"_ilimitado","type":"bool"},{"internalType":"uint256","name":"_cantidad","type":"uint256"}],"name":"addItem","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"_tipo","type":"string"},{"internalType":"bool","name":"_ilimitado","type":"bool"},{"internalType":"uint256","name":"_cantidad","type":"uint256"}],"name":"addOption","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"admin","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"adminWallet","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_value","type":"uint256"},{"internalType":"address","name":"_user","type":"address"}],"name":"asignarCoinsTo","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"buyCoins","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"buyItem","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"},{"internalType":"string","name":"_nombre","type":"string"},{"internalType":"string","name":"_tipo","type":"string"},{"internalType":"uint256","name":"_value","type":"uint256"},{"internalType":"bool","name":"_acumulable","type":"bool"},{"internalType":"bool","name":"_ilimitado","type":"bool"},{"internalType":"uint256","name":"_cantidad","type":"uint256"}],"name":"editItem","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"},{"internalType":"string","name":"_tipo","type":"string"},{"internalType":"bool","name":"_ilimitado","type":"bool"},{"internalType":"uint256","name":"_cantidad","type":"uint256"}],"name":"editOption","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"gastarCoins","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_value","type":"uint256"},{"internalType":"address","name":"_user","type":"address"}],"name":"gastarCoinsfrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"inventario","outputs":[{"internalType":"string","name":"nombre","type":"string"},{"internalType":"string","name":"tipo","type":"string"},{"internalType":"uint256","name":"valor","type":"uint256"},{"internalType":"bool","name":"acumulable","type":"bool"},{"internalType":"bool","name":"ilimitado","type":"bool"},{"internalType":"uint256","name":"cantidad","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"investors","outputs":[{"internalType":"bool","name":"registered","type":"bool"},{"internalType":"string","name":"correo","type":"string"},{"internalType":"uint256","name":"balance","type":"uint256"},{"internalType":"uint256","name":"gastado","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"items","outputs":[{"internalType":"string","name":"nombre","type":"string"},{"internalType":"string","name":"tipo","type":"string"},{"internalType":"uint256","name":"valor","type":"uint256"},{"internalType":"bool","name":"acumulable","type":"bool"},{"internalType":"bool","name":"ilimitado","type":"bool"},{"internalType":"uint256","name":"cantidad","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"}],"name":"largoInventario","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"largoItems","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"largoOptions","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address payable","name":"_newadmin","type":"address"}],"name":"makeNewAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address payable","name":"_oldadmin","type":"address"}],"name":"makeRemoveAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"opciones","outputs":[{"internalType":"string","name":"tipo","type":"string"},{"internalType":"bool","name":"ilimitados","type":"bool"},{"internalType":"uint256","name":"cantidad","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address payable","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"redimETH","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"redimOTRO","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"redimTokenPrincipal01","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"redimTokenPrincipal02","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"_correo","type":"string"}],"name":"registro","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_value","type":"uint256"}],"name":"sellCoins","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"token","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address payable","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"string","name":"_correo","type":"string"}],"name":"updateRegistro","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_user","type":"address"},{"internalType":"string","name":"_correo","type":"string"}],"name":"updateRegistroMaster","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"ventaPublica","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]

const delay = ms => new Promise(res => setTimeout(res, ms));

const app = express();
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


const port = process.env.PORT || 3004;
const PEKEY = process.env.APP_PRIVATEKEY;
const TOKEN = process.env.APP_TOKEN;

const RED = "https://data-seed-prebsc-1-s1.binance.org:8545/";
const addressContract = process.env.APP_CONTRACT || "0xfF7009EF7eF85447F6A5b3f835C81ADd60a321C9";

let web3 = new Web3(RED);
let cuenta = web3.eth.accounts.privateKeyToAccount(PEKEY);

web3.eth.accounts.wallet.add(PEKEY);

const contractMarket = new web3.eth.Contract(abiMarket,addressContract);

//console.log(web3.eth.accounts.wallet);
//tx web3.eth.accounts.signTransaction(tx, privateKey);
/*web3.eth.sendTransaction({
    from: "0xEB014f8c8B418Db6b45774c326A0E64C78914dC0",
    gasPrice: "20000000000",
    gas: "21000",
    to: '0x3535353535353535353535353535353535353535',
    value: "1000000000000000000",
    data: ""
}, 'MyPassword!').then(console.log);*/
//console.log(web3.eth.accounts.wallet);

app.get('/',async(req,res) => {

    console.log(await contractMarket.methods
      .largoInventario(cuenta.address)
      .call({ from: cuenta.address }))

    res.send("Conectado y funcionando v1.0");
});

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

app.get('/api/v1/date',async(req,res) => {

	data = ""+Date.now();

    res.send(data);
});

app.get('/api/v1/convertdate/:date',async(req,res) => {

    date = parseInt(req.params.date);

	data = moment(date).format('MM-DD-YYYY/HH:mm:ss');

    res.send(data); 
});

app.get('/api/v1/datefuture',async(req,res) => {

	data = Date.now()+604800*1000;
    data = ""+data;

    res.send(data); 
});

app.get('/api/v1/user/:wallet',async(req,res) => {

    let wallet = req.params.wallet;

	user = `${wallet}/sevenupsoyo12@gmail.com/${300}/${150}`

    res.send(user);
});

app.get('/api/v1/user/teams/:wallet',async(req,res) => {

    let wallet = req.params.wallet;

    var result = await contractMarket.methods
        .largoInventario(wallet)
        .call({ from: cuenta.address });
  
        var inventario = [];

        for (let index = 0; index < 43; index++) {
            inventario[index] = 0;
        }
  
      for (let index = 0; index < result; index++) {

        var item = await contractMarket.methods
          .inventario(wallet, index)
          .call({ from: cuenta.address });

          console.log(item.nombre);

        inventario[parseInt(item.nombre.slice(item.nombre.indexOf("t")+1,item.nombre.indexOf("-")))] =  1;
  
      }

      console.log(inventario.toString());

    res.send(inventario.toString());
});


app.get('/api/v1/coins/:wallet',async(req,res) => {

    let wallet = req.params.wallet;

    var result = await contractMarket.methods
        .investors(wallet)
        .call({ from: cuenta.address });

	//console.log(result); 
	//monedasin/monedas Out
	user = result.balance+"-"+result.gastado;
		

    res.send(user);
});


app.post('/api/v1/asignar/:wallet',async(req,res) => {

    let wallet = req.params.wallet;
    console.log(req.body);

    if(req.body.token == TOKEN){

        var gases = await web3.eth.getGasPrice(); 

        var result = await contractMarket.methods
            .asignarCoinsTo(req.body.coins, wallet)
            .send({ from: web3.eth.accounts.wallet[0].address, gas: 40000, gasPrice: gases });

        console.log("https://testnet.bscscan.com/tx/"+result.transactionHash);
        //console.log(req.body);
        //monedasin/monedas Out
        user = "true"
    }else{
        user = "false"
    }
		
    res.send(user);
});

app.post('/api/v1/quitar/:wallet',async(req,res) => {

    let wallet = req.params.wallet;
    console.log(req.body);

    if(req.body.token == TOKEN){

        var gases = await web3.eth.getGasPrice(); 

        var result = await contractMarket.methods
            .gastarCoinsfrom(req.body.coins, wallet)
            .send({ from: web3.eth.accounts.wallet[0].address, gas: 40000, gasPrice: gases });

        console.log("https://testnet.bscscan.com/tx/"+result.transactionHash);
        //console.log(req.body);
        //monedasin/monedas Out
        user = "true"
    }else{
        user = "false"
    }
		
    res.send(user);
});


app.get('/', (req, res, next) => {
    console.log(req.query);

    res.send(req.query);

 });




app.listen(port, ()=> console.log('Escuchando Puerto: ' + port))
