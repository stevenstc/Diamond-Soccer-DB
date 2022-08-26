const express = require('express');
const fetch = require('node-fetch');
var cron = require('node-cron');
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const Web3 = require('web3');
var cors = require('cors');
require('dotenv').config();
var moment = require('moment');
const BigNumber = require('bignumber.js');
const uc = require('upper-case');

const abiExchage = require("./abiExchange.js");
const abiInventario = require("./abiInventario.js");
const abiToken = require("./abitoken.js");

//console.log(("HolA Que Haze").toUpperCase())
//console.log(("HolA Que Haze").toLowerCase())

//var cosa = {cosita: "1,23456"}
//console.log(cosa["cosita"].replace(",","."))

var aleatorio = 1;

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

var superUser = require("./superUser");

var testers = require("./betaTesters");

const app = express();
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(bodyParser.text());

cron.schedule('0 0 * * *', async() => {
    console.log('Reinicio Misiones diarias: '+Date());
    await resetDailyMision();

    console.log('FIN Reinicio Misiones diarias: '+Date());

}, {
    scheduled: true,
    timezone: "UTC"
});

cron.schedule('0 * * * * *', async() => {

    var precioactCSC = await precioCSC();
    console.log("########## "+precioactCSC+" ##########")
    if( precioactCSC > 0){

        console.log("valor Diaria: "+new BigNumber(1/precioactCSC).decimalPlaces(2).toNumber() +"CSC")
        await appdatos.updateOne({},[
            { $set: {valorDiaria: new BigNumber(1/precioactCSC).decimalPlaces(2).toNumber()}}
        ]);
    
        await appdatos.updateOne({},[
            { $set:{cscSalas: [
                new BigNumber(0.01/precioactCSC).decimalPlaces(2).toNumber(),
                new BigNumber(0.03/precioactCSC).decimalPlaces(2).toNumber(),
                new BigNumber(0.05/precioactCSC).decimalPlaces(2).toNumber(),
                new BigNumber(0.1/precioactCSC).decimalPlaces(2).toNumber(),
                new BigNumber(0.5/precioactCSC).decimalPlaces(2).toNumber(),
                new BigNumber(1/precioactCSC).decimalPlaces(2).toNumber()

            ]}}
        ]);

        console.log((await appdatos.findOne({})).cscSalas)
    
    }

}, {
    scheduled: true,
    timezone: "UTC"
});

const port = process.env.PORT || 3005;
const PEKEY = process.env.APP_PRIVATEKEY;
const TOKEN = process.env.APP_TOKEN;
const TOKEN2 = process.env.APP_TOKEN2;

const TokenEmail = "nuevo123";
const uri = process.env.APP_URI;

const DaylyTime = process.env.APP_DAYTIME || 86400; //undia 86400

const TimeToMarket = process.env.APP_TIMEMARKET || 86400 * 7;

const miniCoins = parseInt(process.env.APP_MIN_COINS) || 1000;

const quitarLegandarios = process.env.APP_QUIT_LEGENDARIOS || "false";
const quitarEpicos = process.env.APP_QUIT_EPICOS || "true";
const quitarComunes = process.env.APP_QUIT_COMUNES || "true";

const explorador = process.env.APP_EXPLORER || "https://bscscan.com/tx/";

const RED = process.env.APP_RED || "https://bsc-dataseed.binance.org/";
const addressInventario = process.env.APP_CONTRACT_INVENTARIO || "0x16Da4914542574F953b31688f20f1544d4E89537";
const addressExchnge = process.env.APP_CONTRACT_EXCHANGE || "0x42D3ad6032311220C48ccee4cE5401308F7AC88A";
const addressContractToken = process.env.APP_CONTRACTTOKEN || "0xF0fB4a5ACf1B1126A991ee189408b112028D7A63";

const imgDefault = "0";

let web3 = new Web3(RED);

const contractExchange = new web3.eth.Contract(abiExchage,addressExchnge);
const contractInventario = new web3.eth.Contract(abiInventario,addressInventario);
const contractToken = new web3.eth.Contract(abiToken,addressContractToken);

web3.eth.accounts.wallet.add(PEKEY);

//console.log(web3.eth.accounts.wallet[0].address);

//console.log(await web3.eth.accounts.wallet);
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
const options = { useNewUrlParser: true, useUnifiedTopology: true };

var formatoliga = 'MDYYYY';

mongoose.connect(uri, options)
    .then(async() => { console.log("Conectado Exitodamente!");})
    .catch(err => { console.log(err); });

const user = require("./modelos/usuarios");
const appstatuses = require("./modelos/appstatuses");
const appdatos = require("./modelos/appdatos");
const playerData = require("./modelos/playerdatas");
const userplayonline = require("./modelos/userplayonline");

async function precioCSC(){
    var precio = fetch('https://brutustronstaking.tk/csc-market/api/v1/priceCSC')
    .then(response => response.json())
    .then(json => {return json;})

    return precio;
}

async function resetDailyMision(){
    await user.updateMany({},{ $set: {checkpoint: (Date.now()+DaylyTime*1000) , reclamado: false}}).exec();
}

app.get('/', require("./v1/funcionando"));

app.get('/api', require("./v1/funcionando"));

app.get('/api/v1', require("./v1/funcionando"));

app.use('/api/v2', require("./v2"));

app.get('api/v1/tiempo', async(req,res) => {
    res.send(moment(Date.now()).format('MM-DD-YYYY/HH:mm:ss'));
});

app.get('/api/v1/date',async(req,res) => {
    res.send(Date.now()+"");
});

app.get('/api/v1/convertdate/:date',async(req,res) => {

    res.send(moment(parseInt(req.params.date)).format('MM-DD-YYYY/HH:mm:ss')); 
});

app.post('/api/v1/tiket/consultar/',async(req,res) => {

    if(req.body.token == TOKEN2 ){
 
        var sesion = await userplayonline.findOne({identificador: parseInt(req.body.tiket) },{_id:0}).sort({identificador: 1});

        res.send(sesion);

         
    }else{
        res.send("null");
    }

    

});

app.get('/api/v1/sesion/consultar/',async(req,res) => {

    if( req.query.sesionID ){

        var sesion = await userplayonline.findOne({ sesionID: req.query.sesionID },{_id:0}).sort({identificador: 1});

        if(sesion){
            res.send(sesion);

        }else{
            res.send("null");

        }
      
    }else{

        res.send("null");


    }

});

app.get('/api/v1/sesion/consultar/saque',async(req,res) => {

    if( req.query.sesionID ){

        var sesion = await userplayonline.findOne({sesionID: req.query.sesionID },{_id:0}).sort({identificador: 1});

        res.send(sesion.saqueInicial+"");
        
        
    }else{
        res.send("null");
    }

});

app.get('/api/v1/sesion/consultar/turno',async(req,res) => {

    if( req.query.sesionID ){

        var sesion = await userplayonline.findOne({sesionID: req.query.sesionID },{_id:0}).sort({identificador: 1});


        res.send(sesion.turno+"");

        
    }else{
        res.send("null");
    }

});

app.post('/api/v1/sesion/actualizar/turno',async(req,res) => {

    if( req.body.sesionID && req.body.token == TOKEN){

        var sesion = await userplayonline.findOne({sesionID: req.body.sesionID }).sort({identificador: 1});

        if(!sesion.finalizada){
            var data = {};
            if(sesion.turno === "2"){
                data.turno = "1";
            }else{
                data.turno = "2";
            }

            await userplayonline.updateOne({_id: sesion._id}, [
                {$set: data}
            ])

            res.send(data.turno+"");
        }else{
            res.send("null");
        }
        
    }else{
        res.send("null");
    }

});

app.get('/api/v1/sesion/consultar/id',async(req,res) => {

    if( req.query.sesionID ){

        var sesion = await userplayonline.findOne({ sesionID: req.query.sesionID },{identificador:1}).sort({identificador: -1})
        //console.log(sesion)
        if(sesion){
            if(sesion.identificador){
                console.log("consulta de sesion: "+req.query.sesionID+" #"+sesion.identificador )
                res.send(sesion.identificador+"");
            }else{
                res.send("null");

            }
        }else{
            res.send("null");

        }
        
    }else{
        res.send("null");
    }

});

app.get('/api/v1/sesion/consultar/porid',async(req,res) => {

    if( req.query.id ){
 
        var sesion = await userplayonline.findOne({identificador: req.query.id},{__v:0,_id:0});
   
        res.send(sesion);
        
        
    }else{
        res.send("null");
    }

});

app.get('/api/v1/sesion/consultar/latesmaches',async(req,res) => {


    var long = 5;

    if( req.query.long ){
        long = parseInt(req.query.long)
    }
 
    var sesion = await userplayonline.find({finalizada: true},{__v:0,_id:0}).sort({identificador:-1}).limit(long);

    res.send(sesion);
        


});

app.post('/api/v1/sesion/crear/',async(req,res) => {

    if(req.body.sesionID && req.body.token == TOKEN && req.body.u1 && req.body.u2 ){

        var ids = await userplayonline.count();

        //console.log(ids)

        var usuario1 = await user.findOne({ username: req.body.u1 });
        
        if (usuario1.wallet) {
            var soporte1 = usuario1.wallet;
        }
        
        var usuario2 = await user.findOne({ username: req.body.u2 });

        if (usuario2.wallet) {
            var soporte2 = usuario2.wallet;
        }

        var csc = parseFloat((req.body.csc).replace(",","."));

        var playOnline = new userplayonline({
            identificador: ids,
            sesionID: req.body.sesionID,
            incio: Date.now(),
            fin: 0,
            finalizada: false,
            ganador: "",
            tipo: req.body.tipo,
            saqueInicial: aleatorio,
            turno: aleatorio,
            csc: csc,
            u1: req.body.u1,
            u2: req.body.u2,
            soporte1: soporte1,
            soporte2: soporte2,
            goles1: 0,
            goles2: 0
            
        });

        if(aleatorio === 2){
            aleatorio = 1;

        }else{
            aleatorio = 2;

        }

        if(req.body.u1 === req.body.u2){

            update = await user.updateOne({ username: req.body.u1 }, [
                {$set: {active:false} }
            ]);
            res.send("false");
        }else{
            await playOnline.save();

            res.send("true");
        }


    }else{
        res.send("false")
    }
    
});

app.post('/api/v1/sesion/actualizar/',async(req,res) => {

    if(req.body.sesionID && req.body.token == TOKEN ){

        var sesionPlay = await userplayonline.findOne({$and: [{ sesionID: req.body.sesionID }, { finalizada: false }]}).sort([['identificador', 1]]);
        if(sesionPlay){
            if(!sesionPlay.finalizada){

                var goles1 = 0;
                var goles2 = 0;

                if(req.body.goles1){
                    if(!isNaN(parseInt(req.body.goles1))){
                        goles1 = req.body.goles1;
                    }
                }

                if(req.body.goles2){
                    if(!isNaN(parseInt(req.body.goles2))){
                        goles2 = req.body.goles2;
                    }
                }

                console.log("usuario 1: "+req.body.goles1+" | "+goles1);
                console.log("usuario 2: "+req.body.goles2+" | "+goles2);
                console.log("Dictamen: "+req.body.ganador);

                var ganador = req.body.ganador;

                if ((sesionPlay.tipo).search("DUEL") != -1) {

                    
                    if( req.body.ganador === "Empatado" && goles1 === goles2){

                        var pago = sesionPlay.csc - sesionPlay.csc * 0.1

                        await user.updateOne({ username: sesionPlay.u1 }, [
                            {$set: {balance: {$sum:["$balance",pago]}} }
                        ]);
                        await user.updateOne({ username: sesionPlay.u2 }, [
                            {$set: {balance: {$sum:["$balance",pago]}} }
                        ]);


                    }

                    pago = (sesionPlay.csc*2) - (sesionPlay.csc*2) * 0.1

                    if(req.body.ganador === sesionPlay.u1 && goles1 > goles2){

                        update = await user.updateOne({ username: sesionPlay.u1 }, [
                            {$set: {balance: {$sum:["$balance",pago]}} }
                        ]); 

                    }

                    if(req.body.ganador === sesionPlay.u2 && goles2 > goles1){

                        update = await user.updateOne({ username: sesionPlay.u2 }, [
                            {$set: {balance: {$sum:["$balance",pago]}} }
                        ]); 

                    }

                    await userplayonline.updateOne({ _id: sesionPlay._id },[
                        {$set: {fin: Date.now(), finalizada: true, ganador: ganador, goles1: goles1, goles2:goles2}}
                    ]);

                    console.log(sesionPlay.tipo+" | #"+sesionPlay.identificador+" | "+sesionPlay.csc+" | "+ganador+" | "+goles1+"-"+goles2)


                    //await userplayonline.updateMany({ $and: [{ sesionID: req.body.sesionID }, { finalizada: false }]}, { finalizada: true, fin: Date.now()});

                    res.send("true");
                }

                if ((sesionPlay.tipo).search("LEAGUE") != -1) {

                    await playerData.updateOne({ wallet: sesionPlay.soporte1 }, [
                        {$set: {LeagueOpport: {$sum:["$LeagueOpport" , 1]}} }
                    ]);
                    await playerData.updateOne({ wallet: sesionPlay.soporte2 }, [
                        {$set: {LeagueOpport: {$sum:["$LeagueOpport" , 1]}} }
                    ]);

                    
                    if(req.body.ganador === "Empatado" && goles1 === goles2){

                        await playerData.updateOne({ wallet: sesionPlay.soporte1 }, [
                            {$set: {CupsWin: {$sum:["$CupsWin", 3]}} }
                        ]);
                        await playerData.updateOne({ wallet: sesionPlay.soporte2 }, [
                            {$set: {CupsWin: {$sum:["$CupsWin", 3]}} }
                        ]);

                    }

                    if(req.body.ganador === sesionPlay.u1 && goles1 > goles2){

                        await playerData.updateOne({ wallet: sesionPlay.soporte1 }, [
                            {$set: {CupsWin: {$sum:["$CupsWin", 6]}} }
                        ]); 

                        ganador = sesionPlay.u1;

                    }

                    if(req.body.ganador === sesionPlay.u2 && goles2 > goles1){

                        await playerData.updateOne({ wallet: sesionPlay.soporte2 }, [
                            {$set: {CupsWin: {$sum:["$CupsWin", 6]}} }
                        ]); 

                        ganador = sesionPlay.u2;

                    }

                    await userplayonline.updateOne({ _id: sesionPlay._id },[
                        {$set: {fin: Date.now(), finalizada: true, ganador: ganador, goles1: goles1,goles2:goles2}}
                    ]);

                    console.log(sesionPlay.tipo+" | #"+sesionPlay.identificador+" | "+ganador+" | "+goles1+"-"+goles2)

                    //await userplayonline.updateMany({ $and: [{ sesionID: req.body.sesionID }, { finalizada: false }]}, { finalizada: true, fin: Date.now()});

                    res.send("true");
                }

            
            }else{
                res.send("true");
            }
        }else{
            res.send("false");
        }

    }else{
        res.send("false")
    }

});

app.get('/api/v1/formations-teams/:wallet',async(req,res) => {

    var wallet =  req.params.wallet.toLowerCase();

    var formaciones = [];

    var inventario = [];

    var cantidad = 44;

    var isSuper = 0;

    for (let index = 0; index < superUser.length; index++) {
        if((superUser[index]).toLowerCase() === wallet){
            isSuper = 1;
        }
    }

    for (let index = 0; index < 5; index++) {
        formaciones[index] = isSuper;
    }

    for (let index = 0; index < cantidad; index++) {
        inventario[index] = isSuper;
    }
        
    if (isSuper === 0) {

        var verInventario = await contractInventario.methods
        .verInventario(wallet)
        .call({ from: web3.eth.accounts.wallet[0].address })
        .catch(err => {console.log(err); return 0})

        var nombres_items = await contractInventario.methods
        .verItemsMarket()
        .call({ from: web3.eth.accounts.wallet[0].address })
        .catch(err => {console.log(err); return 0})

  
        for (let index = 0; index < verInventario.length; index++) {

            var item = nombres_items[0][verInventario[index]];

            if(item.indexOf("f") === 0){
                formaciones[parseInt(item.slice(item.indexOf("f")+1,item.indexOf("-")))-1] =  1;
            }
    
            if(item.indexOf("t") === 0){
                inventario[parseInt(item.slice(item.indexOf("t")+1,item.indexOf("-")))-1] =  1;
            }
    
        }

        if (quitarLegandarios === "true") { // quitar legendarios
            for (let index = 0; index < 3; index++) {
                inventario[index] = 0;
            }
        }

        if (quitarEpicos === "true") { // quitar epicos
            for (let index = 3; index < 10; index++) {
                inventario[index] = 0;
            }
        }

        if (quitarComunes === "true") { // quitar Comunes
            for (let index = 10; index < cantidad; index++) {
                inventario[index] = 0;
            }
            
        }
    }

    // añadir equipo betatester
    for (let t = 0; t < testers.length; t++) {
        if(testers[t].toLowerCase() == wallet){
            inventario[inventario.length-1] = 1;
        }
    }

    inventario = [...inventario,1,...formaciones]
    //console.log(inventario)

    res.send(inventario.toString());

});

app.get('/api/v1/coins/:wallet',async(req,res) => {

    let wallet =  req.params.wallet.toLowerCase();

    if(web3.utils.isAddress(wallet)){
        usuario = await user.findOne({ wallet: uc.upperCase(wallet) },{balance: 1});

        if (usuario) {
            res.send((usuario.balance).toString(10));

        }else{
            res.send("0");
                
        }

    }else{
        res.send("0");
    }

    
});

app.get('/api/v1/compraravatar/:wallet',async(req,res) => {
    var wallet =  req.params.wallet.toLowerCase();

    if(web3.utils.isAddress(wallet) ){

        usuario = await user.findOne({ wallet: uc.upperCase(wallet) });

        if(usuario){
            if(!isNaN(parseInt(usuario.imagen))){
                res.send(usuario.imagen+"");

            }else{
                res.send("0");

            }

        }else{
            res.send("0");

        }
        

    }else{
        res.send("0");
        
    }

})

app.post('/api/v1/compraravatar/:wallet',async(req,res) => {

    var wallet =  req.params.wallet.toLowerCase();
    
    if(req.body.token == TOKEN && web3.utils.isAddress(wallet) ){

        var usuario = await user.findOne({ wallet: uc.upperCase(wallet) })
        
        if(usuario){

            if(usuario.balance-(await appdatos.findOne({})).precioAvatar >= 0){
                await user.updateOne({ wallet: uc.upperCase(wallet) },[
                    {$set: {imagen: req.body.avatar, balance: {$subtract:["$balance", (await appdatos.findOne({})).precioAvatar]}} }
                ])
            }
        
            usuario = await user.findOne({ wallet: uc.upperCase(wallet) })
        
            res.send(usuario.imagen);

        }else{
            res.send("0");

        }
        

    }else{
        res.send("0");
        
    }
		
});

app.post('/api/v1/asignar/:wallet',async(req,res) => {

    var wallet =  req.params.wallet.toLowerCase();

    req.body.coins = parseInt(req.body.coins);
    
    if(req.body.token == TOKEN && web3.utils.isAddress(wallet) && req.body.coins <= miniCoins){

        usuario = await user.find({ wallet: uc.upperCase(wallet) });

        if (usuario.length >= 1) {
            var datos = usuario[0];
            if(datos.active){
                datos.balance = datos.balance + req.body.coins;
                
                //datos.wcscExchange = await consultarCscExchange(wallet);

                update = await user.updateOne({ wallet: uc.upperCase(wallet) }, [
                    {$set:datos}
                ])

                console.log("Win coins: "+req.body.coins+" # "+uc.upperCase(wallet));
                res.send("true");
            }else{
                res.send("false");
            }
    
        }else{
            console.log("creado USUARIO al Asignar"+wallet)
            var users = new user({
                wallet: uc.upperCase(wallet),
                email: "",
                password: "",
                username: "", 
                active: true,
                payAt: Date.now(),
                checkpoint: 0,
                reclamado: false,
                balance: req.body.coins,
                txs: [],
                pais: "null",
                imagen: imgDefault,
                wcscExchange: 0
            });
    
            users.save().then(()=>{
                console.log("Usuario creado exitodamente");
                
            })

            res.send("false");
                
            
        }


    }else{
        if(req.body.coins > miniCoins){
            await user.updateOne({ wallet: uc.upperCase(wallet) },[
                {$set:{active: false}}
            ])
            res.send("true");
        }else{
            res.send("false");
        }
    }
		
});

app.post('/api/v1/quitar/:wallet',async(req,res) => {

    var wallet =  req.params.wallet.toLowerCase();

    req.body.coins = parseInt(req.body.coins);

    if(req.body.token == TOKEN  && web3.utils.isAddress(wallet)){

        usuario = await user.find({ wallet: uc.upperCase(wallet) });

        if (usuario.length >= 1) { 
            var datos = usuario[0];
            if(datos.active){
                datos.balance = datos.balance-req.body.coins;
                if(datos.balance >= 0){

                    //datos.wcscExchange = await consultarCscExchange(wallet);

                    update = await user.updateOne({ wallet: uc.upperCase(wallet) }, [
                        {$set:datos}
                    ]);
                    console.log("Lost coins: "+req.body.coins+" # "+uc.upperCase(wallet));
                    res.send("true");

                }else{
                    res.send("false");
                }
                
            }else{
                res.send("false");
            }
    
        }else{
            console.log("usuario creado al retirar monedas"+wallet)
            var users = new user({
                wallet: uc.upperCase(wallet),  
                email: "",
                password: "",
                username: "",   
                active: true,
                payAt: Date.now(),
                checkpoint: 0,
                reclamado: false,
                balance: 0,
                txs: [],
                pais: "null",
                imagen: imgDefault,
                wcscExchange: 0
            });
    
            users.save().then(()=>{
                console.log("Usuario creado exitodamente");
                
            })

            res.send("false");
                
            
        }

    }else{
        res.send("false");
    }
		
    
});

app.post('/api/v1/coinsaljuego/:wallet',async(req,res) => {

    var wallet =  req.params.wallet.toLowerCase();

    var usuario = await user.findOne({ wallet: uc.upperCase(wallet) },{balance:1});

    var result = await contractInventario.methods
        .largoInventario(wallet)
        .call({ from: web3.eth.accounts.wallet[0].address })
        .catch(err => {console.log(err); return 0})

    result = parseInt(result);

    if(result > 0 && req.body.token == TOKEN  && web3.utils.isAddress(wallet) && usuario.balance > 0){

        await delay(Math.floor(Math.random() * 12000));

        coins = new BigNumber(req.body.coins).multipliedBy(10**18);

        if(await monedasAlJuego(coins,wallet,1)){
            res.send("true");

        }else{
            res.send("false");

        }

    }else{
        res.send("false");
    }
		
    
});

async function monedasAlJuego(coins,wallet,intentos){

    await delay(Math.floor(Math.random() * 12000));

    var usuario = await contractExchange.methods
    .investors(wallet)
    .call({ from: web3.eth.accounts.wallet[0].address});

    balance = new BigNumber(usuario.balance).shiftedBy(-18).decimalPlaces(0).toNumber();

    var gases = await web3.eth.getGasPrice(); 

    var paso = true;

    var gasLimit = await contractExchange.methods.gastarCoinsfrom(coins, wallet).estimateGas({from: web3.eth.accounts.wallet[0].address});

    if(balance - coins.shiftedBy(-18).toNumber() >= 0 ){
        await contractExchange.methods
            .gastarCoinsfrom(coins, wallet)
            .send({ from: web3.eth.accounts.wallet[0].address, gas: gasLimit, gasPrice: gases })
            .then(result => {
                console.log("Monedas ENVIADAS en "+intentos+" intentos");
                //console.log(explorador+result.transactionHash);
                
                user.find({ wallet: uc.upperCase(wallet) }).then(usuario =>{

                    if (usuario.length >= 1) {
                        var datos = usuario[0];
                        delete datos._id;
                        if(datos.active){
                            datos.balance = coins.shiftedBy(-18).plus(datos.balance).decimalPlaces(0).toNumber();
                            datos.txs.push(explorador+result.transactionHash)
                            update = user.updateOne({ wallet: uc.upperCase(wallet) }, {$set: datos})
                            .then(console.log("Coins SEND TO GAME: "+coins.shiftedBy(-18)+" # "+wallet))
                            .catch(console.error())
                            
                        }
                
                    }else{
                        console.log("creado USUARIO monedas al juego: "+wallet)
                        var users = new user({
                            wallet: uc.upperCase(wallet),    
                            email: "",
                            password: "",
                            username: "", 
                            active: true,
                            payAt: Date.now(),
                            checkpoint: 0,
                            reclamado: false,
                            balance: coins.shiftedBy(-18).decimalPlaces(0).toNumber(),
                            txs: [explorador+result.transactionHash]
                        });
                
                        async() => {
                            await users.save();
                            console.log("Usuario creado exitodamente");
                        };
                        
                    }
                })

                paso = true;
            })

            .catch(async() => {
                intentos++;
                console.log(coins.shiftedBy(-18)+" ->  "+wallet+" : "+intentos)
                await delay(Math.floor(Math.random() * 12000));
                paso = await monedasAlJuego(coins,wallet,intentos);
            })
    }else{
        paso = false;
    }

    return paso;

}

app.get('/api/v1/time/coinsalmarket/:wallet',async(req,res)=>{
    var wallet =  req.params.wallet.toLowerCase();

    if(web3.utils.isAddress(wallet)){

        var usuario = await user.findOne({ wallet: uc.upperCase(wallet) },{wallet:1,payAt:1});

        res.send((usuario.payAt + (TimeToMarket * 1000)).toString())
        
    }else{
        res.send((Date.now()+(TimeToMarket * 1000)).toString())
    }
});

app.post('/api/v1/coinsalmarket/:wallet',async(req,res) => {

    var wallet =  req.params.wallet.toLowerCase();

    if(req.body.token == TOKEN && web3.utils.isAddress(wallet)){

        coins = new BigNumber(req.body.coins).multipliedBy(10**18);

        var usuario = await user.findOne({ wallet: uc.upperCase(wallet) },{password:1,username:1,email:1,balance:1,payAt:1});

        var result = await contractInventario.methods
        .largoInventario(wallet)
        .call({ from: web3.eth.accounts.wallet[0].address })
        .catch(err => {console.log(err); return 0})
        result = parseInt(result);

        if (result > 0 && usuario.password !== "" && usuario.email !== "" && usuario.username !== "" && usuario.balance > 0 && usuario.balance-parseInt(req.body.coins) >= 0 && Date.now() > (usuario.payAt + (TimeToMarket * 1000)) ) {
            
            //await user.updateOne({ wallet: uc.upperCase(wallet) }, [
            //    {$set:{balance:usuario.balance-parseInt(req.body.coins)}}
            //])

            await delay(Math.floor(Math.random() * 12000));

            if(await monedasAlMarket(coins, wallet,1)){
                res.send("true");

            }else{
                res.send("false");

            }
        }else{

            res.send("false");

        }

    }else{

        res.send("false");
    }
		
});

async function monedasAlMarket(coins,wallet,intentos){

    await delay(Math.floor(Math.random() * 12000));

    var paso = false;

    var gases = await web3.eth.getGasPrice(); 

    var gasLimit = await contractExchange.methods.asignarCoinsTo(coins, wallet).estimateGas({from: web3.eth.accounts.wallet[0].address});

    var usuario = await user.find({ wallet: uc.upperCase(wallet) });

    if (usuario.length >= 1) {
        var datos = usuario[0];

        if(Date.now() < datos.payAt + (TimeToMarket * 1000))return false ;
    }else{
        return false;
    }

    await contractExchange.methods
        .asignarCoinsTo(coins, wallet)
        .send({ from: web3.eth.accounts.wallet[0].address, gas: gasLimit, gasPrice: gases })
        .then(result => {

            console.log("Monedas ENVIADAS en "+intentos+" intentos");
            
            user.find({ wallet: uc.upperCase(wallet) }).then(usuario =>{

                if (usuario.length >= 1) {
                    var datos = usuario[0];
                    delete datos._id;
                    if(datos.active ){
                        datos.payAt = Date.now();
                        datos.balance = datos.balance-coins.shiftedBy(-18).toNumber();
                        
                        datos.txs.push(explorador+result.transactionHash)
                        
                        user.updateOne({ wallet: uc.upperCase(wallet) }, [
                            {$set:datos}
                        ])
                        .then(console.log("Coins SEND TO MARKET: "+coins.shiftedBy(-18)+" # "+wallet))
                        .catch(console.error())
                    
                    }
            
                }else{
                    console.log("creado USUARIO monedas al Market"+wallet)
                    var users = new user({
                        wallet: uc.upperCase(wallet),
                        email: "",
                        password: "",
                        username: "", 
                        active: true,
                        payAt: Date.now(),
                        checkpoint: 0,
                        reclamado: false,
                        balance: 0,
                        txs: [explorador+result.transactionHash]
                    });
            
                    users.save().then(()=>{
                        console.log("Usuario creado exitodamente");
                    })
                        
                
                }
            })

            paso = true;
        })

        .catch(async err => {
            console.log(err);
            intentos++;
            console.log(coins.shiftedBy(-18)+" ->  "+wallet+" : "+intentos)
            await delay(Math.floor(Math.random() * 12000));
            paso = await monedasAlMarket(coins,wallet,intentos);
        })

    return paso;

}

async function recompensaDiaria(wallet){
  
    var inventario = [];

    var cantidad = 43;

    //20%
    var coins = ((await appdatos.findOne({})).valorDiaria)*0.2; // CSC coins comunes todos
    var bono = false;

    for (let index = 0; index < cantidad; index++) {
        inventario[index] = 0;
        for (let t = 0; t < testers.length; t++) {
            if(testers[t] == wallet){
                inventario[cantidad] = 1;
            }
            
        }
        
    }

    if (true) { // Habilitar reconocimiento de equipos

        var verInventario = await contractInventario.methods
        .verInventario(wallet)
        .call({ from: web3.eth.accounts.wallet[0].address })
        .catch(err => {console.log(err); return 0})

        var nombres_items = await contractInventario.methods
        .verItemsMarket()
        .call({ from: web3.eth.accounts.wallet[0].address })
        .catch(err => {console.log(err); return 0})

            
        for (let index = 0; index < verInventario.length; index++) {

            var item = nombres_items[0][verInventario[index]];

            if(item.indexOf("t") === 0){

                inventario[parseInt(item.slice(item.indexOf("t")+1,item.indexOf("-")))-1] =  1;

            }

        }
    }
    

    if (true) { // habilitar bono legendarios
        for (let index = 0; index < 3; index++) {
            if(inventario[index]){

                //80%+20%
                coins += ((await appdatos.findOne({})).valorDiaria)*0.8;
                bono = true;
                break;
            }

        }
    }

    if (true) { // habilitar bono epico
        if(!bono){
            for (let index = 3; index < 10; index++) {
                if(inventario[index]){

                    //50%
                    coins += ((await appdatos.findOne({})).valorDiaria)*0.5;
                    break;
                }
            }
        }
    }

    //console.log(coins);
    return coins;

}

app.post('/api/v1/sendmail',async(req,res) => {
    //console.log(req.query);
    if(req.body.destino && req.body.code){

        var resultado = await fetch("https://brutusgroup.tk/mail.php?destino="+req.body.destino+"&code="+req.body.code+"&token=crypto2021");

        if (await resultado.text() === "true") {
            res.send("true");
        }else{
            res.send("false");
        }

    }else{
        res.send("false");
    }

});

app.get('/api/v1/enlinea',async(req,res) => {

    if(req.query.version){

        var appstatus = await appstatuses.find({version: req.query.version});
        appstatus = appstatus[appstatus.length-1]

        if(req.query.rango){

            for (let index = 0; index < appstatus.linea.length; index++) {

                if(parseInt(req.query.rango) == index){
                    if (parseInt(req.query.activo) >= 0 ) {
                        appstatus.linea[index] = parseInt(req.query.activo);
                    }else{
                        appstatus.linea[index] = 0;
                    }
                    
                }
                
            }

            update = await appstatuses.updateOne({ _id: appstatus._id }, [
                {$set: {linea:appstatus.linea}}
            ])

            res.send("true");

        }else{

            res.send((appstatus.linea).toString());

        }   
    }else{

        var appstatus = await appstatuses.find({});
        appstatus = appstatus[appstatus.length-1]

        if(req.query.rango){

            for (let index = 0; index < appstatus.linea.length; index++) {

                if(parseInt(req.query.rango) == index){
                    if (parseInt(req.query.activo) >= 0 ) {
                        appstatus.linea[index] = parseInt(req.query.activo);
                    }else{
                        appstatus.linea[index] = 0;
                    }
                    
                }
                
            }

            datos = {};
            datos.linea = appstatus.linea;

            update = await appstatuses.updateOne({ _id: appstatus._id }, [
                {$set: datos}
            ])

            res.send("true");

        }else{

            res.send((appstatus.linea).toString());

        }   

    }
    
});

app.get('/api/v1/ben10',async(req,res) => {

    var aplicacion = await appdatos.find({});
    aplicacion = aplicacion[aplicacion.length-1]

    if(req.query.ganadoliga){

        if(aplicacion.ganadoliga){
            aplicacion.ganadoliga += parseInt(req.query.ganadoliga);
        }else{
            aplicacion.ganadoliga = parseInt(req.query.ganadoliga);
        }

        update = await appdatos.updateOne({ _id: aplicacion._id }, [
                {$set: {ganadoliga: aplicacion.ganadoliga}}
            ])

        res.send("true");

    }else{

    
        if(req.query.ganado){

            aplicacion.ganado += parseInt(req.query.ganado);

            update = await appdatos.updateOne({ _id: aplicacion._id }, [
                {$set:{ganado: aplicacion.ganado}}
            ])

            res.send("true");

        }else{
            
            res.send(appstatus.ganado+","+appstatus.entregado);

        }
    }
    
});

app.get('/api/v1/texto/daily/', async(req,res) =>{

    // friendly traini // duelos // liga // torneos
    res.send((await appdatos.findOne({})).objetivosDiaria.toString());
});

app.post('/api/v1/consulta/dailymission/:wallet',async(req,res) => {

    var wallet =  req.params.wallet;

    if(web3.utils.isAddress(wallet)){

        var data = await playerData.find({wallet: uc.upperCase(wallet)});
        var usuario = await user.find({wallet: uc.upperCase(wallet)})

        if (data.length >= 1) {
            data = data[0];
            usuario = usuario[0];

            var no_time = false;

            if(Date.now() < usuario.checkpoint && usuario.reclamado){
                no_time = true;
            }

            await pagarDiaria(wallet);
        
            res.send(data.TournamentsPlays+","+data.DuelsPlays+","+data.FriendLyWins+","+usuario.reclamado+","+no_time);

        }else{

            res.send("0,0,0,false,false");
                
        }

    }else{
        res.send("0,0,0,false,false");
    }

});

app.get('/api/v1/misionesdiarias/tiempo/:wallet',async(req,res) => {

    var wallet =  req.params.wallet.toLowerCase();

    if(web3.utils.isAddress(wallet)){

            var usuario = await user.find({ wallet: uc.upperCase(wallet) },{checkpoint: 1, reclamado:1});

            var cuando = "Earlier than";

            if (usuario.length >= 1) {
                var usuario = usuario[0];

                await resetChecpoint(wallet);

                if(usuario.checkpoint === 0){
                    usuario.checkpoint=Date.now();
                }

                if(usuario.reclamado){
                    cuando = "Later than";
                }

                res.send(moment(usuario.checkpoint).format('['+cuando+',] D/M/YY HH:mm:ss [,UTC]'));
                
            }else{
                res.send(moment(Date.now()).format('['+cuando+',] D/M/YY HH:mm:ss [,UTC]'));
            }
        
    }
});

async function resetChecpoint(wallet){
    var usuario = await user.findOne({ wallet: uc.upperCase(wallet) },{});

    if(Date.now() >= usuario.checkpoint){

        // resetear daily mision
        await user.updateOne({ wallet: uc.upperCase(wallet) }, [
            {$set: {checkpoint: (Date.now()+DaylyTime*1000) , reclamado: false}}
        ]);

        // resetear objetivos
        //await playerData.updateOne({wallet: uc.upperCase(wallet)},[{$set: {DuelsPlays: "0", FriendLyWins: "0"}}]);

    }

}

async function pagarDiaria(wallet){
    if(web3.utils.isAddress(wallet.toLowerCase())){

        await resetChecpoint(wallet);

        var usuario = await user.find({ wallet: uc.upperCase(wallet) });
        var data = await playerData.find({wallet: uc.upperCase(wallet)});

        if (data.length >= 1 && usuario.length >= 1 ) {

            data = data[0];
            usuario = usuario[0];
    
            if(usuario.active && !usuario.reclamado && parseInt(data.FriendLyWins) >= (await appdatos.findOne({})).objetivosDiaria[0]  && parseInt(data.DuelsPlays) >= (await appdatos.findOne({})).objetivosDiaria[1] && parseInt(data.LeagueOpport) >= (await appdatos.findOne({})).objetivosDiaria[2] && parseInt(data.TournamentsPlays) >= (await appdatos.findOne({})).objetivosDiaria[3] ){

                if(await asignarMisionDiaria(wallet) > 0){
                    return true;
                }else{
                    console.log("fallo mision diaria")
                    return false;

                }
            
            }else{
                
                //console.log("no cumple mision diaria: "+uc.upperCase(wallet)+" DP: "+data.DuelsPlays+" Training: "+data.FriendLyWins);
                //console.log("f2");
                return false;
    
            }

        }else{
            return false;
        }

    }else{
        return false;
    }

}

app.get('/api/v1/misiondiaria/:wallet',async(req,res) => {

    var wallet =  req.params.wallet.toLowerCase();

    if(web3.utils.isAddress(wallet) ){

        res.send(await pagarDiaria(wallet)+"")

    }else{
        res.send("false");
    }

});

async function asignarMisionDiaria(wallet){

    wallet =  wallet.toLowerCase();

    var aplicacion = await appdatos.find({});
    aplicacion = aplicacion[aplicacion.length-1]
    
    if(web3.utils.isAddress(wallet)){

            var usuario = await user.find({ wallet: uc.upperCase(wallet) });
            var player = await playerData.find({ wallet: uc.upperCase(wallet) });

            if (usuario.length >= 1 && player.length >= 1) {
                var datos = usuario[0];

                if(datos.active ){

                    var coins = parseInt(await recompensaDiaria(wallet));

                    //datos.wcscExchange = await consultarCscExchange(wallet);

                    await appdatos.updateOne({ version: aplicacion.version }, [
                        {$set: {entregado:{$sum:["$entregado",coins]}}}
                    ])
                    await user.updateOne({ wallet: uc.upperCase(wallet) }, [
                        {$set: {reclamado: true , balance: {$sum:["$balance",coins]}}}
                    ]);
                    await playerData.updateOne({ wallet: uc.upperCase(wallet) }, [
                        {$set: {DuelsPlays: "0", FriendLyWins: "0"}}
                    ]);

                    console.log("Daily mision coins: "+coins+" # "+uc.upperCase(wallet));
                    return coins;
                }else{
                    return 0;
                }

            
            }else{
                return 0;
            }

       

    }else{
        return 0;
    }

}

app.get('/api/v1/user/exist/:wallet',async(req,res) => {

    var wallet =  req.params.wallet.toLowerCase();
     
    if(web3.utils.isAddress(wallet)){

        usuario = await user.find({ wallet: uc.upperCase(wallet) })
            .catch(err => {
                console.log("usuario inexistente");
                res.send("false");
                return;
            });

        if (usuario.length >= 1) {
            res.send("true");
        }else{
    
            res.send("false");
        }
    }else{
        res.send("false");
    }
});

app.get('/api/v1/user/active/:wallet',async(req,res) => {
    
    var wallet =  req.params.wallet.toLowerCase();
     
    if(web3.utils.isAddress(wallet)){

        usuario = await user.find({ wallet: uc.upperCase(wallet) });

        if (usuario.length >= 1) {
            usuario = usuario[0];
            res.send(""+usuario.active);
        }else{
            res.send("false");
        }
    }else{
        res.send("false");
    }
});

app.get('/api/v1/user/username/:wallet',async(req,res) => {
    var wallet =  req.params.wallet.toLowerCase();
     
    if(web3.utils.isAddress(wallet)){

        usuario = await user.find({ wallet: uc.upperCase(wallet) });

        if (usuario.length >= 1) {
            usuario = usuario[0];

            res.send(usuario.username);
        }else{
            res.send("false");
        }
    }else{
        res.send("false");
    }
});

app.get('/api/v1/user/wallet/',async(req,res) => {
    var username =  req.query.username;
     
    usuario = await user.find({ username: username });

    if (usuario.length >= 1) {
        usuario = usuario[0];

        res.send(usuario.wallet);
    }else{
        res.send("false");
    }
    
});

app.get('/api/v1/user/email/:wallet',async(req,res) => {
    var wallet =  req.params.wallet.toLowerCase();
     
    if( req.query.tokenemail === TokenEmail && web3.utils.isAddress(wallet)){

        usuario = await user.findOne({ wallet: uc.upperCase(wallet) });

        res.send(usuario.email);
        
    }else{
        res.send("false");
    }
});

app.get('/api/v1/user/pais/:wallet',async(req,res) => {
    var wallet =  req.params.wallet.toLowerCase();
     
    if(web3.utils.isAddress(wallet)){

        usuario = await user.find({ wallet: uc.upperCase(wallet) });

        if (usuario.length >= 1) {
            usuario = usuario[0];

            res.send(usuario.pais);
        }else{
            res.send("false");
        }
    }else{
        res.send("false");
    }
});

app.get('/api/v1/imagen/user',async(req,res) => {
    var username =  req.query.username;
     
    usuario = await user.findOne({ username: username });

    if (usuario) {

        resetChecpoint(usuario.wallet);

        if(!isNaN(parseInt(usuario.imagen))){
            res.send(usuario.imagen+"");

        }else{
            res.send(imgDefault);

        }
      
    }else{
        res.send(imgDefault);
    }

});

app.get('/api/v1/user/ban/:wallet',async(req,res) => {
    var wallet =  req.params.wallet.toLowerCase();
     
    if(web3.utils.isAddress(wallet)){

        usuario = await user.find({ wallet: uc.upperCase(wallet) });
        
  
            if (usuario.length >= 1) {
                usuario = usuario[0];

                res.send(!usuario.active+"");
            }else{
                var users = new user({
                    wallet: uc.upperCase(wallet),
                    email: "",
                    password: "",
                    username: "", 
                    active: true,
                    payAt: Date.now(),
                    checkpoint: 0,
                    reclamado: false,
                    balance: 0,
                    txs: [],
                    pais: "null",
                    imagen: imgDefault,
                    wcscExchange: 0
                });
        
                users.save().then(()=>{
                    console.log("Nuevo Usuario creado exitodamente");
                    
                })
                res.send("false");
            }



            
    }else{
        res.send("true");
    }
});

app.post('/api/v1/user/update/info/:wallet',async(req,res) => {

    var wallet =  req.params.wallet.toLowerCase();
    
    if(req.body.token == TOKEN && web3.utils.isAddress(wallet)){

        usuario = await user.find({ wallet: uc.upperCase(wallet) });

        if (usuario.length >= 1) {
            var datos = usuario[0];
            if(datos.active){
                if (req.body.email) {
                    req.body.email =  req.body.email.toLowerCase();
                    datos.email = req.body.email;
                }

                if (req.body.username) {
                    datos.username = req.body.username;
                }

                if (req.body.password) {
                    datos.password = req.body.password;
                }

                if (req.body.pais) {
                    datos.pais = req.body.pais;
                }

                if (req.body.imagen) {
                    datos.imagen = req.body.imagen;
                }

                if (req.body.ban) {

                    var razonban = "";
                    if (req.body.ban !== "true") {
                        razonban = req.body.ban;
                    }

                    datos.active = false;

                    update = await user.updateOne({ wallet: uc.upperCase(wallet) }, [
                        {$set: {razonban: razonban}}
                    ]);
                
                }

                if (req.body.email || req.body.username || req.body.password || req.body.pais || req.body.ban || req.body.imagen){
                    update = await user.updateOne({ wallet: uc.upperCase(wallet) }, [
                        {$set: datos}
                    ]);
                    res.send("true");
                }else{
                    res.send("false");
                }
                
            }else{
                res.send("false");
            }
    
        }else{
            console.log("creado USUARIO al actualizar info: "+wallet)
            var email = "";
            var username = "";
            var password = "";

            if (req.body.email) {
                email = req.body.email;
            }

            if (req.body.username) {
                username = req.body.username;
            }

            if (req.body.password) {
                password = req.body.password;
            }
            var users = new user({
                wallet: uc.upperCase(wallet),
                email: email,
                password: password,
                username: username, 
                active: true,
                payAt: Date.now(),
                checkpoint: 0,
                reclamado: false,
                balance: 0,
                txs: [],
                pais: "null",
                imagen: imgDefault,
                wcscExchange: 0
            });
    
            users.save().then(()=>{
                console.log("Usuario creado exitodamente");
                
            })

            res.send("false");
                
            
        }


    }else{
        res.send("false");
    }
		
});

app.post('/api/v1/user/auth/:wallet',async(req,res) => {

    var wallet =  req.params.wallet.toLowerCase();

    if(req.body.token == TOKEN && web3.utils.isAddress(wallet)){

        usuario = await user.find({ wallet: uc.upperCase(wallet) });

        if (usuario.length >= 1) {
            var usuario = usuario[0];

            if(usuario.password === req.body.password && req.body.password != "" && req.body.password.length >= 8){

                if(usuario.active ){

                    res.send("true");
                    
                }else{
                    
                    res.send("false");
                    
                }
            }else{
                console.log("Error Loggin:"+uc.upperCase(wallet)+": "+req.body.password);
                res.send("false");
            }
    
        }else{
           
            res.send("false");
            
        }


    }else{
        res.send("false");
    }
		
});

app.get('/api/v1/username/disponible/',async(req,res) => {

    var username =  req.query.username;

    usuario = await user.find({ username: username });

    //console.log(usuario)

    if (usuario.length >= 1) {
        res.send("false");
    }else{
        res.send("true");
    }

});

app.get('/api/v1/email/disponible/',async(req,res) => {

    var email =  req.query.email;

    usuario = await user.find({ email: email });

    if (usuario.length >= 1) {
        //res.send("false");
        res.send("true");
    }else{
        res.send("true");
    }

});

app.get('/api/v1/app/init/',async(req,res) => {

    if(req.query.version){
        var aplicacion = await appstatuses.find({version: req.query.version},{_id:0});

        if (aplicacion.length >= 1) {

            aplicacion = aplicacion[aplicacion.length-1]

            var appData = await appdatos.find({});

            if (appData.length >= 1) {
                appData = appData[appData.length-1]

                appData.finliga = parseInt((appData.finliga-Date.now())/(86400*1000));

                if(appData.finliga < 0){
                    appData.finliga = 0;

                    aplicacion.liga = "off"

                }else{
                    ////aplicacion.liga = "on"
                }

            }else{

                appData = new appdatos({
                    entregado: 0,
                    ganado: 0, 
                    ganadoliga: 0,
                    misiondiaria: true,
                    finliga: Date.now() + 86400 * 1000 * 30 
                });
            
                await appData.save();

                appData.finliga = 30;

            }

            await appstatuses.updateOne({version: req.query.version}, aplicacion);


            aplicacion = await appstatuses.find({version: req.query.version},{_id:0});
            aplicacion = aplicacion[aplicacion.length-1]

           var lead = await leadborad(3);

           for (let index = 0; index < lead.length; index++) {
            lead[index] = (await user.findOne({wallet: lead[index]})).username;
            
           }
        
        
            res.send( aplicacion.liga+","+aplicacion.mantenimiento+","+aplicacion.version+","+aplicacion.link+","+aplicacion.duelo+","+aplicacion.torneo+","+aplicacion.updates+","+appData.finliga+",false,"+(await appdatos.findOne({})).maximoCSC+","+(await appdatos.findOne({})).ligaCosto +","+(await appdatos.findOne({})).precioAvatar+","+lead+","+(await appdatos.findOne({})).cscSalas ); 

        }else{

            aplicacion = new appstatuses({
                version: req.query.version,
                torneo: "on",
                duelo: "on",
                liga: "on",
                mantenimiento: "on",
                link: "https://cryptosoccermarket.com/download",
                linea: [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                updates:["V"+req.query.version+" READY!","thanks for download",moment(Date.now()).format('DD/MM/YYYY HH:mm:ss [UTC]')],
                apuestas:[true,true,true,true,true,true]

            });
    
            await aplicacion.save();

            aplicacion = await appstatuses.find({version: req.query.version},{_id:0});
            aplicacion = aplicacion[aplicacion.length-1]
            res.send(aplicacion.liga+","+aplicacion.mantenimiento+","+aplicacion.version+","+aplicacion.link+","+aplicacion.duelo+","+aplicacion.torneo+","+aplicacion.updates+",30");
                    
        }
    }else{
        res.send("null")
    }

});

app.get('/api/v1/app/apuestas/',async(req,res) => {

    if(req.query.version){
        var aplicacion = await appstatuses.find({version: req.query.version});
        
        if (aplicacion.length >= 1) {
            aplicacion = aplicacion[aplicacion.length-1]
         
            res.send(aplicacion.apuestas.toLocaleString());

        }else{

            res.send("null")
        }
    }else{
        res.send("null")
    }

});

app.get('/api/v1/consulta/miranking/:wallet',async(req,res) => {

    var wallet =  uc.upperCase(req.params.wallet);

    var myuser = await playerData.findOne({wallet: wallet},
        {_id:0,BallonSet:0,DificultConfig:0,LastDate:0,PlaysOnlineTotal:0,LeaguesOnlineWins:0,DiscountMomment:0,DuelsOnlineWins:0,DuelsPlays:0,FriendLyWins:0,FriendlyTiming:0,LeagueDate:0,LeagueOpport:0,LeagueTimer:0,MatchLose:0,MatchWins:0,MatchesOnlineWins:0,Music:0,PhotonDisconnected:0,QualityConfig:0,StadiumSet:0,PlaysTotal:0,TournamentsPlays:0,Version:0,VolumeConfig:0,Plataforma:0,GolesEnContra:0,GolesAFavor:0,FirstTime:0,DrawMatchs:0,DrawMatchsOnline:0,LeaguePlay:0,Analiticas:0,Fxs:0,__v:0,Soporte:0,Fullscreen:0,Resolucion:0}
    )

    var playDat = await playerData.find({CupsWin: {$gte: myuser.CupsWin}},
        {_id:0,BallonSet:0,DificultConfig:0,LastDate:0,PlaysOnlineTotal:0,LeaguesOnlineWins:0,DiscountMomment:0,DuelsOnlineWins:0,DuelsPlays:0,FriendLyWins:0,FriendlyTiming:0,LeagueDate:0,LeagueOpport:0,LeagueTimer:0,MatchLose:0,MatchWins:0,MatchesOnlineWins:0,Music:0,PhotonDisconnected:0,QualityConfig:0,StadiumSet:0,PlaysTotal:0,TournamentsPlays:0,Version:0,VolumeConfig:0,Plataforma:0,GolesEnContra:0,GolesAFavor:0,FirstTime:0,DrawMatchs:0,DrawMatchsOnline:0,LeaguePlay:0,Analiticas:0,Fxs:0,__v:0,Soporte:0,Fullscreen:0,Resolucion:0}
    ).limit(300).sort({"CupsWin": -1, "UserOnline": -1});


    if (playDat.length >= 1) {

        if (playDat.length < 300) {
            res.send(playDat.length+","+myuser.CupsWin);
        }else{
            res.send("0,"+myuser.CupsWin);
        }
        

    }else{
    
        res.send("0,0");
        
    }

});

async function leadborad(cantidad){
    
    if(cantidad <= 0){
        cantidad = 20;
    }else{
        cantidad = parseInt(cantidad);
        if(cantidad > 100 )cantidad= 100;
    }

    var lista = [];

    var aplicacion = await playerData.find({}).limit(cantidad).sort({"CupsWin": -1, "UserOnline": -1});
      
    if (aplicacion.length >= 1) {
        
        for (let index = 0; index < aplicacion.length; index++) {
            lista[index] = aplicacion[index].wallet;
            
        }
        return lista;

    }else{
        return [0,0,0];
            
    }
    
}

app.get('/api/v1/consulta/leadboard',async(req,res) => {

    res.send((await leadborad(req.body.cantidad)).toString());
});

app.get('/api/v1/consulta/redwardleague',async(req,res) => {

    var appData = await appdatos.findOne({});

    if (appData) {

        var cantidad;

        if(!req.query.cantidad){
            cantidad = 20;
        }else{
            if(parseInt(req.query.cantidad) > 300){
                cantidad = 300;
            }else{
                cantidad = parseInt(req.query.cantidad);
            }
        }

        var poolliga = appData.ganadoliga;

        poolliga = poolliga*0.7

        var porcentajes = [0.4,0.2,0.15,0.05,0.04,0.04,0.04,0.03,0.03,0.02]
        var lista = [];

        var usuarios = await playerData.find({}).sort([['CupsWin', -1]]).limit(cantidad);
        
        if (usuarios.length >= 1) {
            
            for (let index = 0; index < usuarios.length; index++) {
    
                lista[index] = parseInt(poolliga*porcentajes[index]);
            
                if(isNaN(lista[index])){
                    lista[index] = 0;
                }
                
            }
            res.send(lista.toString(10));

        }else{
            res.send("null");  
        }

    }else{
        res.send("null");
    }


});

app.get('/api/v1/consulta/poolliga',async(req,res) => {

    var appData = await appdatos.find({});

    if (appData.length >= 1) {
        appData = appData[appData.length-1]
    }else{
        appData.ganadoliga = 0;
    }


    res.send(appData.ganadoliga+"");


});



app.get('/api/v1/consulta/playerdata/:wallet',async(req,res) => {

    var wallet =  req.params.wallet;

    var data = await playerData.find({wallet: uc.upperCase(wallet)},{_id:0,wallet:0,__v:0,UserOnline:0});

    if (data.length >= 1) {
        data = data[0];

        if(!req.query.consulta){
            res.send(data);
        }else{
            res.send(data[req.query.consulta]+"");
        }
        
        
        
    
    }else{

        var playernewdata = new playerData({
            wallet: uc.upperCase(wallet),
            BallonSet: "0",
            CupsWin: 0,
            DificultConfig:  "3",
            DiscountMomment:  "0",
            DuelsOnlineWins:  "0",
            DuelsPlays:  "0",
            FriendLyWins:  "0",
            FriendlyTiming: "2",
            LastDate:  "0",
            LeagueDate:  moment(Date.now()).format(formatoliga),
            LeagueOpport:  0,
            LeagueTimer:  moment(Date.now()).format('HH:mm:ss'),
            LeaguesOnlineWins:  "0",
            MatchLose:  "0",
            MatchWins:  "0",
            MatchesOnlineWins:  "0",
            Music:  "0",
            PhotonDisconnected:  "0",
            PlaysOnlineTotal:  "0",
            PlaysTotal:  "0",
            QualityConfig:  "0",
            StadiumSet:  "0",
            TournamentsPlays:  "0",
            Version:  "mainet",
            VolumeConfig:  "0",
            Plataforma: "pc",
            GolesEnContra: "0",
            GolesAFavor: "0",
            FirstTime: "0",
            DrawMatchs: "0",
            DrawMatchsOnline: "0",
            LeaguePlay: "0",
            Analiticas: "0",
            Fxs: "0",
            UserOnline: Date.now(),
            Resolucion: "0",
            Fullscreen: "0",
            Soporte: "J&S"
            
        })

        playernewdata.save().then(()=>{
            res.send("nueva playerdata creado");
        })
            
        
    }

    
});

app.post('/api/v1/reset/leadboard',async(req,res) => {

    if(req.body.token == TOKEN ){

        //var dataUsuarios = await playerData.find({}).sort([['CupsWin', 1]]);

        await playerData.updateMany({},{ $set: {CupsWin:0, LeagueOpport:0}}).exec();
        
        
        res.send("true");
    }else{
        res.send("false");
    }
    
});

app.post('/api/v1/update/playerdata/:wallet',async(req,res) => {
    var wallet =  req.params.wallet;

    var data = req.body;
    
    if( data.misDat && req.body.token == TOKEN){

        //console.log("escribiendo data: "+uc.upperCase(wallet))

        data = JSON.parse(data.misDat);
        data = data.misDat;

        //console.log(data)

        var usuario = await playerData.find({wallet: uc.upperCase(wallet)});
        
        if (usuario.length >= 1) {
            usuario = usuario[0];
            var datos = {};
        
            for (let index = 0; index < data.length; index++) {

                if(usuario[data[index].variable] === "NaN"){
                    datos[data[index].variable] = "0"
                }

                switch (data[index].action) {
                    case "sumar":
                        datos[data[index].variable] = (parseFloat((usuario[data[index].variable]+"").replace(",", "."))+parseFloat((data[index].valorS+"").replace(",", ".")))+"";
                     
                        break;

                    case "restar":
                        datos[data[index].variable] = (parseFloat((usuario[data[index].variable]+"").replace(",", "."))-parseFloat((data[index].valorS+"").replace(",", ".")))+"";
  
                        break;

                    case "setear":
                        datos[data[index].variable] = (data[index].valorS+"").replace(",", ".");
                         
                        break;

                
                    default:
                        
                        break;
                }
                
                
            }
        
            datos.UserOnline = Date.now();

            if( Date.now() >= parseInt(usuario.LeagueTimer) + 86400*1000){
                datos.LeagueOpport = 0;
                datos.LeagueTimer = Date.now();
            }

            playerData.updateOne({ wallet: uc.upperCase(wallet) }, [
                {$set: datos}
            ]).then(async()=>{
                var consulta = await playerData.findOne({wallet: uc.upperCase(wallet)},{_id:0,wallet:0,__v:0,UserOnline:0});

                res.send(consulta);

            }).catch(()=>{
                res.send("false");
            })   

        }else{
            res.send("false");
        }

    }else{

        res.send("false");
                
    }

    
});

app.get('/', (req, res, next) => {

    res.send(req.query);

});

app.get('/api/v1/consultar/wcsc/lista/', async(req, res, next) => {

    var usuarios;

    var cantidad

    if(!req.query.cantidad) cantidad = 10;

    cantidad = parseInt(req.query.cantidad);

    if(cantidad > 300){
        cantidad = 300;
    }
    
    usuarios = await user.find({},{password: 0, _id: 0, checkpoint:0, txs:0,email:0,reclamado:0}).limit(cantidad).sort([['balance', -1]]);

    var lista = [];
    var ex = 0;

    for (let index = 0; index < usuarios.length; index++) {

        if(!usuarios[index].wcscExchange){
            ex = 0;
        }else{
            ex = usuarios[index].wcscExchange;
        }
        
        lista[index] = {
            username: usuarios[index].username,
            activo: usuarios[index].active,
            wallet: usuarios[index].wallet,
            balance: usuarios[index].balance,
            exchange: ex
        }
        
    }

    res.send(lista);

});

async function consultarCscExchange(wallet){
    var investor = await contractExchange.methods
    .investors(wallet.toLowerCase())
    .call({ from: web3.eth.accounts.wallet[0].address });
                
    var balance = new BigNumber(investor.balance).shiftedBy(-18).toString(10);
    return balance ; 
}

app.get('/api/v1/consultar/csc/exchange/:wallet', async(req, res, next) => {

    var wallet = req.params.wallet;

    if(web3.utils.isAddress(wallet)){
        
        await user.findOne({ wallet: uc.upperCase(wallet) })
        .then(async(usuario)=>{

            resetChecpoint(wallet)
            
            var wcscExchange = await consultarCscExchange(wallet);

            await user.updateOne({_id: usuario._id}, [
                {$set: {wcscExchange: wcscExchange}}
            ])
        
            res.send(wcscExchange+'');

        })
        .catch(async()=>{
            res.send("0");
        })  
    }else{
        res.send("0");
    }

 });

 app.get('/api/v1/consultar/csc/cuenta/:wallet', async(req, res, next) => {

    var wallet = req.params.wallet;

    var saldo = await contractToken.methods
    .balanceOf(wallet.toLowerCase())
    .call({ from: web3.eth.accounts.wallet[0].address });

    saldo = new BigNumber(saldo).shiftedBy(-18).toString(10);
    
    res.send(saldo+"");
    
 
 });

app.get('/api/v1/consultar/numero/aleatorio', async(req, res, next) => {

    res.send(Math.floor(Math.random() * 2)+'');
 
});

app.post('/api/v1/asignar2/:wallet',async(req,res) => {

    var wallet =  req.params.wallet.toLowerCase();

    req.body.coins = parseInt(req.body.coins);
    
    if(req.body.token == TOKEN2 && web3.utils.isAddress(wallet)){

        usuario = await user.find({ wallet: uc.upperCase(wallet) },{_id: 0});

        if (usuario.length >= 1) {
            usuario = usuario[0];
            var datos = {}
            if(usuario.active){
                datos.balance = usuario.balance + req.body.coins;
                
                //datos.wcscExchange = await consultarCscExchange(wallet);

                await user.updateOne({ wallet: uc.upperCase(wallet) }, [
                    {$set: datos}
                ]);
                console.log("Ajuste: "+req.body.coins+" # "+uc.upperCase(wallet));
                res.send("true");
            }else{
                res.send("false");
            }
    
        }else{
            console.log("creado USUARIO al Ajustar"+wallet)
            var users = new user({
                wallet: uc.upperCase(wallet),
                email: "",
                password: "",
                username: "", 
                active: true,
                payAt: Date.now(),
                checkpoint: 0,
                reclamado: false,
                balance: req.body.coins,
                txs: [],
                pais: "null",
                imagen: imgDefault,
                wcscExchange: 0
            });
    
            users.save().then(()=>{
                console.log("Usuario creado exitodamente");
                res.send("true");
            })
                
            
        }


    }else{
        res.send("false");
    }
		
});

app.post('/api/v1/quitar2/:wallet',async(req,res) => {

    var wallet =  req.params.wallet.toLowerCase();

    req.body.coins = parseInt(req.body.coins);

    if(req.body.token == TOKEN2  && web3.utils.isAddress(wallet)){

        usuario = await user.find({ wallet: uc.upperCase(wallet) });

        if (usuario.length >= 1) { 
            var datos = usuario[0];
            if(datos.active){
                datos.balance = datos.balance-req.body.coins;
                if(datos.balance >= 0){

                    //datos.wcscExchange = await consultarCscExchange(wallet);

                    var nuevoUsuario = new user(datos)
                    await nuevoUsuario.save();

                    //update = await user.updateOne({ wallet: uc.upperCase(wallet) }, datos);
                    console.log("-Ajuste: "+req.body.coins+" # "+uc.upperCase(wallet));
                    res.send("true");

                }else{
                    res.send("false");
                }
                
            }else{
                res.send("false");
            }
    
        }else{
            console.log("usuario creado al retirar monedas"+wallet)
            var users = new user({
                wallet: uc.upperCase(wallet),  
                email: "",
                password: "",
                username: "",   
                active: true,
                payAt: Date.now(),
                checkpoint: 0,
                reclamado: false,
                balance: 0,
                txs: [],
                pais: "null",
                imagen: imgDefault,
                wcscExchange: 0
            });
    
            users.save().then(()=>{
                console.log("Usuario creado exitodamente");
                
            })
            res.send("false");
                
            
        }

    }else{
        res.send("false");
    }
		
    
});

app.post('/api/v1/ban/unban/:wallet',async(req,res) => {

    var wallet =  req.params.wallet.toLowerCase();

    req.body.active
    req.body.ban 

    if(req.body.token == TOKEN2  && web3.utils.isAddress(wallet)){

        usuario = await user.find({ wallet: uc.upperCase(wallet) });

        if (usuario.length >= 1) { 
            var datos = usuario[0];

            if(req.body.active){
                datos.active = true;
            }
            
            if(req.body.ban){
                datos.active = false;
            }
            
            datos.wcscExchange = await consultarCscExchange(wallet);

            await user.updateOne({ wallet: uc.upperCase(wallet) }, [
                {$set: {active: datos.active, wcscExchange: datos.wcscExchange}}
            ]);
            console.log("unban # "+uc.upperCase(wallet));
            res.send({activo: datos.active});
    
        }else{
                
            res.send("false");
            
        }

    }else{
        res.send("false");
    }
		
    
});


app.post('/api/v1/copas/asignar/:wallet',async(req,res) => {

    var wallet =  req.params.wallet.toLowerCase();

    var copas = parseInt(req.body.copas);

    if(req.body.token == TOKEN && web3.utils.isAddress(wallet)){

        await playerData.updateOne({ wallet: uc.upperCase(wallet) },[
            {$set:{CupsWin: {$sum: ["$CupsWin",copas]}}}
        ]);

        console.log("Copas: +"+copas+" wallet:"+wallet)
        
        res.send("true");  
    
    }else{
        
        res.send("false");

        
    }

		
});

app.post('/api/v1/copas/quitar/:wallet',async(req,res) => {

    var wallet =  req.params.wallet.toLowerCase();

    var copas = parseInt(req.body.copas);

    
    
    if(req.body.token == TOKEN && web3.utils.isAddress(wallet)){

        await playerData.updateOne({ wallet: uc.upperCase(wallet) },[
            {$set:{CupsWin: {$subtract: ["$CupsWin" ,copas]}}}
        ]);

        console.log("Copas: -"+copas+" wallet:"+wallet)
        res.send("true");     
    
    }else{
        
        res.send("false");

        
    }
		
    
});


app.listen(port, ()=> console.log('Escuchando Puerto: ' + port))
