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

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Add headers before the routes are defined
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});


cron.schedule('0 5 * * *', async() => {

    // termina partidas abandonadas por tiempo
    await finalizarPartidas();

}, {
    scheduled: true,
    timezone: "UTC"
});

cron.schedule('0 20 * * *', async() => {

    console.log('Recarga saldo misiones diarias: '+Date());
    await recargaDayliMision();
    console.log('FIN: '+Date());

}, {
    scheduled: true,
    timezone: "UTC"
});

cron.schedule('0 22 * * *', async() => {
    console.log('Reinicio de OBJETIVOS Misiones diarias y Oportunidad de liga: '+Date());
    await resetDailyMision();
    console.log('FIN: '+Date());

}, {
    scheduled: true,
    timezone: "UTC"
});

cron.schedule('20 * * * * *', async() => {

    var precioactCSC = await precioCSC();
    //console.log("########## "+precioactCSC+" ##########")
    if( precioactCSC > 0){

        var salas = [0.05 , 0.1 , 0.3 , 0.5 , 1 , 3];

        //console.log("valor Diaria: "+new BigNumber(0.5/precioactCSC).decimalPlaces(3).toNumber() +"CSC")
        await appdatos.updateOne({},[
            { $set: {valorDiaria: new BigNumber(0.5/precioactCSC).decimalPlaces(3).toNumber()}}
        ]);
    
        await appdatos.updateOne({},[
            { $set:{cscSalas: [
                new BigNumber(salas[0]/precioactCSC).decimalPlaces(3).toNumber(),
                new BigNumber(salas[1]/precioactCSC).decimalPlaces(3).toNumber(),
                new BigNumber(salas[2]/precioactCSC).decimalPlaces(3).toNumber(),
                new BigNumber(salas[3]/precioactCSC).decimalPlaces(3).toNumber(),
                new BigNumber(salas[4]/precioactCSC).decimalPlaces(3).toNumber(),
                new BigNumber(salas[5]/precioactCSC).decimalPlaces(3).toNumber()

            ]}}
        ]);

        await appdatos.updateOne({},[
            { $set: {entrenamiento: new BigNumber(salas[0]/precioactCSC).decimalPlaces(3).toNumber()}}
        ]);

        await appdatos.updateOne({},[
            { $set: {ligaCosto: new BigNumber(salas[0]/precioactCSC).decimalPlaces(3).toNumber()}}
        ]);



        //console.log((await appdatos.findOne({})).cscSalas)
    
    }

    // termina partidas abandonadas por tiempo
    //await finalizarPartidas();

    
    // transforma los CSC a la nueva moneda DCSC
    /*await user.updateMany({active:true},[
        { $set: { balanceUSD: {$sum: ["$balanceUSD", {$multiply:["$balance",0.00045] } ]}  , balance: 0} }
    ]).exec(); */


}, {
    scheduled: true,
    timezone: "UTC"
});

const port = process.env.PORT || 3015;
const PEKEY = process.env.APP_PRIVATEKEY;
const TOKEN = process.env.APP_TOKEN;
const TOKEN2 = process.env.APP_TOKEN2;

const TokenEmail = "nuevo123";
const uri = process.env.APP_URI;

const DaylyTime = process.env.APP_DAYTIME || 86400; //undia 86400

const TimeToMarket = process.env.APP_TIMEMARKET || 86400 * 7;

const miniCoins = parseInt(process.env.APP_MIN_COINS) || 1000;

const cantidadPersonasDiaria = process.env.APP_CANTDIARIA || 20;

const quitarLegandarios = process.env.APP_QUIT_LEGENDARIOS || "false";
const quitarEpicos = process.env.APP_QUIT_EPICOS || "true";
const quitarComunes = process.env.APP_QUIT_COMUNES || "true";

const RED = process.env.APP_RED || "https://bsc-dataseed.binance.org/";
const addressInventario = process.env.APP_CONTRACT_INVENTARIO || "0x16Da4914542574F953b31688f20f1544d4E89537";
const addressExchnge = process.env.APP_CONTRACT_EXCHANGE || "0x7eeAA02dAc001bc589703B6330067fdDAeAcAc87";
const addressContractToken = process.env.APP_CONTRACTTOKEN || "0x456D75D8cE68Aff9e746b77B1AEC0b052cD29e57";

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
const options = { useNewUrlParser: true, useUnifiedTopology: true};

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
    var precio = 1;

    /*var precio = fetch('https://brutustronstaking.tk/csc-market/api/v1/priceCSC')
    .then(response => response.json())
    .then(json => {return json;})*/

    return precio;
}

async function resetDailyMision(){
    await user.updateMany({},{ $set: {checkpoint: (Date.now()+DaylyTime*1000) , reclamado: false}}).exec();

    await playerData.updateMany({},
        { $set: {FriendLyWins: 0, DuelsPlays:0 ,LeagueOpport: 0, TournamentsPlays: 0, }}
    ).exec();

}

async function recargaDayliMision(){

    var diponibleParaElDia = (await appdatos.findOne({})).valorDiaria*(await appdatos.findOne({})).cantidadPersonasDiaria

    var disponibleMes = (await appdatos.findOne({})).disponibleDiariaMES

    if(disponibleMes > diponibleParaElDia ){

        await appdatos.updateOne({},[
            {$set:{diponibleDiaria: {$sum:['$diponibleDiaria',diponibleParaElDia]}, disponibleDiariaMES: disponibleMes-diponibleParaElDia}}
        ])
    }else{
        await appdatos.updateOne({},[
            {$set:{diponibleDiaria: {$sum:['$diponibleDiaria','$disponibleDiariaMES']}, disponibleDiariaMES:0}}
        ])
    }

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

async function finalizarPartidas(){

    var tiempoDeCorte = Date.now()-185000;

    console.log("##"+tiempoDeCorte+"##")

    await userplayonline.updateMany({inicio:{$lte:tiempoDeCorte},finalizada:false},
        [
            {$set: {fin: Date.now(),finalizada: true , ganador: "finalizado por tiempo"}}
        ]
    )

    /*await userplayonline.updateMany({finalizada:false,inicio:{$lte:tiempoDeCorte}},
        [
            {$set: {fin: Date.now(),finalizada: true , ganador: "finalizado por tiempo"}}
        ]).exec();*/
    //await userplayonline.updateMany({$and: [{finalizada:false},{inicio: 1664628445577}]}, {fin: Date.now(),finalizada: true , ganador: "finalizado por tiempo"}).exec();

}

app.get('/api/v1/sesion/usuarioenpartida',async(req,res) => {

    if( req.query.usuario ){

        req.query.usuario = uc.upperCase(req.query.usuario);

        var sesion = await userplayonline.findOne({$and: [{$or:[{soporte1:req.query.usuario},{soporte2:req.query.usuario}]  },{finalizada:false}]}).sort({identificador: -1})
        //console.log(sesion)

        //await finalizarPartidas();
        if(sesion){
            if(sesion.identificador){
                console.log("consulta de sesion #"+sesion.identificador )
                res.send("si#"+sesion.identificador);
            }else{
                res.send("no");

            }
        }else{
            res.send("no");

        }
        
    }else{
        res.send("no");
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

app.get('/api/v1/sesion/consultar/maches',async(req,res) => {

    var long = 5;

    var wallet = req.query.wallet = uc.upperCase(req.query.wallet);

    if( req.query.long ){
        long = parseInt(req.query.long)
    }
 
    var sesion = await userplayonline.find({wallet: wallet},{__v:0,_id:0}).sort({identificador:-1}).limit(long);

    res.send(sesion);
        


});

app.post('/api/v1/sesion/crear/',async(req,res) => {

    if(req.body.sesionID && req.body.token == TOKEN && req.body.u1 && req.body.u2 ){

        var ids = await userplayonline.count();

        var usuario1 = await user.findOne({ username: req.body.u1 });
        
        if (usuario1.wallet) {
            var soporte1 = usuario1.wallet;
        }
        
        var usuario2 = await user.findOne({ username: req.body.u2 });

        if (usuario2.wallet) {
            var soporte2 = usuario2.wallet;
        }

        var csc = parseFloat((req.body.csc).toString(10).replace(",","."));

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
            csc: csc.toString(10),
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

        //console.log(req.body)

        var sesionPlay = {};

        if(isNaN(parseInt(req.body.sesionID))){
            sesionPlay = await userplayonline.findOne({ sesionID: req.body.sesionID }).sort({identificador: -1});
        }else{
            sesionPlay = await userplayonline.findOne({ identificador: parseInt(req.body.sesionID) });

        }

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

                var ganador = req.body.ganador;

                await userplayonline.updateOne({ _id: sesionPlay._id },[
                    {$set: {fin: Date.now(), finalizada: true, ganador: ganador, goles1: goles1, goles2:goles2}}
                ]);

                
                if ((sesionPlay.tipo).search("DUEL") != -1) {

                    var pago = parseFloat(sesionPlay.csc);

                    await appdatos.updateOne({ }, [
                        {$set:{ganado: {$sum:["$ganado",pago*0.2]}}}
                    ])

                    if(goles1 < 99 && goles2 < 99){

                        if(ganador === "Empatado" && goles1 === goles2){

                            await user.updateOne({ username: sesionPlay.u1 }, [
                                {$set: {balanceUSD: {$subtract:["$balanceUSD", pago*0.1]}} }
                            ]);
                            await user.updateOne({ username: sesionPlay.u2 }, [
                                {$set: {balanceUSD: {$subtract:["$balanceUSD", pago*0.1]}} }
                            ]);

                        }

                        if(ganador === sesionPlay.u1 && goles1 > goles2){

                            await user.updateOne({ username: sesionPlay.u1 }, [
                                {$set: {balanceUSD: {$sum:["$balanceUSD",pago*0.8]}} }
                            ]); 

                            await user.updateOne({ username: sesionPlay.u2 }, [
                                {$set: {balanceUSD: {$subtract:["$balanceUSD",pago]}} }
                            ]); 

                        }

                        if(ganador === sesionPlay.u2 && goles2 > goles1){

                            await user.updateOne({ username: sesionPlay.u2 }, [
                                {$set: {balanceUSD: {$sum:["$balanceUSD",pago*0.8]}} }
                            ]);

                            await user.updateOne({ username: sesionPlay.u1 }, [
                                {$set: {balanceUSD: {$subtract:["$balanceUSD",pago]}} }
                            ]); 

                        }


                    }else{

                        if(goles1 > goles2){

                            await user.updateOne({ username: sesionPlay.u1 }, [
                                {$set: {balanceUSD: {$sum:["$balanceUSD",pago*0.8]}} }
                            ]);

                            await user.updateOne({ username: sesionPlay.u2 }, [
                                {$set: {balanceUSD: {$subtract:["$balanceUSD",pago]}} }
                            ]);

                        }else{

                            await user.updateOne({ username: sesionPlay.u2 }, [
                                {$set: {balanceUSD: {$sum:["$balanceUSD",pago*0.8]}} }
                            ]);

                            await user.updateOne({ username: sesionPlay.u1 }, [
                                {$set: {balanceUSD: {$subtract:["$balanceUSD",pago]}} }
                            ]);
                        
                        }
                        

                        
                    }

                    console.log(sesionPlay.tipo+" | #"+sesionPlay.identificador+" | "+sesionPlay.csc+" | "+ganador+" | "+goles1+"-"+goles2)

                    res.send("true");
                }

                if ((sesionPlay.tipo).search("LEAGUE") != -1) {

                    await userplayonline.updateOne({ _id: sesionPlay._id },[
                        {$set: {csc: 0}}
                    ]);

                    

                    

                    if(goles1 < 99 && goles2 < 99){

                        // pagar entrada liga

                        var costoDeLiga = (await appdatos.findOne({})).ligaCosto;

                        await appdatos.updateOne({ }, [
                            {$set:{ganado: {$sum:["$ganado",costoDeLiga*0.1]}}}
                        ])

                        await user.updateOne({ username: sesionPlay.u1 }, [
                            {$set: {balanceUSD: {$subtract:["$balanceUSD",costoDeLiga]}} }
                        ]);

                        await user.updateOne({ username: sesionPlay.u2 }, [
                            {$set: {balanceUSD: {$subtract:["$balanceUSD",costoDeLiga]}} }
                        ]);

                        // sumatoria para repartir entre usuarios

                        await appdatos.updateOne({ }, [
                            {$set: {ganadoliga: {$sum:["$ganadoliga",costoDeLiga*2]}}}
                        ])

                    
                        if(ganador === "Empatado" && goles1 === goles2){

                            await playerData.updateOne({ wallet: sesionPlay.soporte1 }, [
                                {$set: {CupsWin: {$sum:["$CupsWin", 4]}} }
                            ]);
                            await playerData.updateOne({ wallet: sesionPlay.soporte2 }, [
                                {$set: {CupsWin: {$sum:["$CupsWin", 4]}} }
                            ]);

                        }

                        if(ganador === sesionPlay.u1 && goles1 > goles2){

                            
                            await playerData.updateOne({ wallet: sesionPlay.soporte1 }, [
                                {$set: {CupsWin: {$sum:["$CupsWin", 6]}} }
                            ]);


                        }

                        if(ganador === sesionPlay.u2 && goles2 > goles1){

                            
                            await playerData.updateOne({ wallet: sesionPlay.soporte2 }, [
                                {$set: {CupsWin: {$sum:["$CupsWin", 6]}} }
                            ]); 

                        }

                        await playerData.updateOne({ wallet: sesionPlay.soporte1 }, [
                            {$set: {LeagueOpport:{$sum:["$LeagueOpport", 1]}} }
                        ]);
                        await playerData.updateOne({ wallet: sesionPlay.soporte2 }, [
                            {$set: {LeagueOpport:{$sum:["$LeagueOpport", 1]}} }
                        ]);

                    }else{


                        var copas = 3;

                        await playerData.updateOne({ wallet: sesionPlay.soporte1 }, [
                            {$set:{ CupsWin: {$sum:["$CupsWin", copas]} }}
                        ]);

                        await playerData.updateOne({ wallet: sesionPlay.soporte2 }, [
                            {$set:{ CupsWin: {$sum:["$CupsWin", copas]} }}

                        ]);

                        
                    }

                    console.log(sesionPlay.tipo+" | #"+sesionPlay.identificador+" | "+ganador+" | "+goles1+"-"+goles2)


                    res.send("true");
                }

                //await userplayonline.updateMany({ $and: [{ sesionID: req.body.sesionID }, { finalizada: false }]}, { finalizada: true, fin: Date.now()});

            }else{

                var support = JSON.stringify({goles1:req.body.goles1,goles2:req.body.goles2,ganador:req.body.ganador})

                await userplayonline.updateOne({ _id: sesionPlay._id },[
                    {$set: {soporteAlterno: support}}
                ]);

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
        .catch(err => {console.log(err); return []})

        var nombres_items = await contractInventario.methods
        .verItemsMarket()
        .call({ from: web3.eth.accounts.wallet[0].address })
        .catch(err => {console.log(err); return []})

  
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
    
            
        usuario = await user.findOne({ wallet: uc.upperCase(wallet) },{balanceUSD: 1});

        if (usuario) {

            if (usuario.balanceUSD) {
                res.send((usuario.balanceUSD).toFixed(3)+"");

            }else{
                res.send("0");

            }

        }else{
            res.send("0");
                
        }

        
    }else{
        res.send("null");
    }

    

    
});

app.get('/api/v1/coinscsc/:wallet',async(req,res) => {

    let wallet =  req.params.wallet.toLowerCase();

    if(web3.utils.isAddress(wallet)){
    
        usuario = await user.findOne({ wallet: uc.upperCase(wallet) },{balance: 1});

        if (usuario) {
            if(usuario.balance){
                res.send(parseFloat(usuario.balance).toFixed(2)+"");

            }else{
                res.send("0");

            }


        }else{
            res.send("0");
                
        }


        
    }else{
        res.send("null");
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

            if(usuario.balanceUSD-(await appdatos.findOne({})).precioAvatar >= 0){
                await user.updateOne({ wallet: uc.upperCase(wallet) },[
                    {$set: {imagen: req.body.avatar, balanceUSD: {$subtract:["$balanceUSD", (await appdatos.findOne({})).precioAvatar]}} }
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

async function asignarMonedas(wallet, cantidad){

    usuario = await user.findOne({ wallet: uc.upperCase(wallet) });

    if (usuario) {
        
        if(usuario.active){
            //datos.wcscExchange = await consultarCscExchange(wallet);

            await user.updateOne({ wallet: uc.upperCase(wallet) }, [
                {$set:{balanceUSD: {$sum:["$balanceUSD",cantidad]}}}
            ])

            console.log("Add coins: "+cantidad+" # "+uc.upperCase(wallet));
            return true;
        }else{
            return false;
        }

    }else{
        
        return false;
    }

}

app.post('/api/v1/asignar/:wallet',async(req,res) => {

    var wallet =  req.params.wallet.toLowerCase();

    req.body.coins = parseInt(req.body.coins);
    
    if(req.body.token == TOKEN && web3.utils.isAddress(wallet) && req.body.coins <= miniCoins){

        if (await asignarMonedas(wallet, req.body.coins)) {
            res.send("true");
            
        }else{
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

    req.body.coins = parseFloat((req.body.coins).toString().replace(",","."));

    if(req.body.token == TOKEN  && web3.utils.isAddress(wallet)){

        usuario = await user.findOne({ wallet: uc.upperCase(wallet) });

        if (usuario) { 

            if(usuario.active){

                if(usuario.balanceUSD-req.body.coins >= 0){

                    //datos.wcscExchange = await consultarCscExchange(wallet);

                    await user.updateOne({ wallet: uc.upperCase(wallet) }, [
                        {$set:{balanceUSD: {$subtract:["$balanceUSD",req.body.coins]}}}
                    ]);
                    console.log("Subtract coins: "+req.body.coins+" # "+uc.upperCase(wallet));
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

    }else{
        res.send("false");
    }
		
    
});


app.get('/api/v1/coinsdiaria/',async(req,res)=>{

    res.send((await appdatos.findOne({})).diponibleDiaria.toString(10))
})

app.get('/api/v1/time/coinsalmarket/:wallet',async(req,res)=>{
    var wallet =  req.params.wallet.toLowerCase();

    if(web3.utils.isAddress(wallet)){

        var usuario = await user.findOne({ wallet: uc.upperCase(wallet) },{wallet:1,payAt:1});

        res.send((usuario.payAt + (TimeToMarket * 1000)).toString())
        
    }else{
        res.send((Date.now()+(TimeToMarket * 1000)).toString())
    }
});


async function recompensaDiaria(wallet){

    wallet = wallet.toLocaleLowerCase();
  
    var inventario = [];
    var cantidad = 43;
    inventario[cantidad] = 0;
    var coins = 0;
    
    if (true) { // Habilitar reconocimiento de equipos

        var verInventario = await contractInventario.methods
        .verInventario(wallet)
        .call({ from: web3.eth.accounts.wallet[0].address })
        .catch(err => {console.log(err); return []})

        var nombres_items = await contractInventario.methods
        .verItemsMarket()
        .call({ from: web3.eth.accounts.wallet[0].address })
        .catch(err => {console.log(err); return []})


        for (let index = 0; index < verInventario.length; index++) {

            var item = nombres_items[0][verInventario[index]];

            if(item.indexOf("t") === 0){

                inventario[parseInt(item.slice(item.indexOf("t")+1,item.indexOf("-")))-1] =  1;

            }

        }
    }

    if(false){ // habilitar bono tester

        for (let index = 0; index < cantidad; index++) {
        
            for (let t = 0; t < testers.length; t++) {
                if(testers[t] == wallet){
                    coins += 0.1
                }
                
            }
            
        }

    }

    if(true) {// habilitar bono comunes
        for (let index = 10; index < inventario.length; index++) {
            if(coins < 0.5){
                if(inventario[index]){

                    coins += 0.1; // CSC coins comunes todos
                }
            }else{
                break;
            }
            
        }

    }

    if (true) { // habilitar bono epico

        for (let index = 3; index < 10; index++) {

            if(coins < 1.5){
                if(inventario[index]){

                    coins += 0.5;
                }
            }else{
                break;
            }
        }
    }
    

    if (true) { // habilitar bono legendarios
        for (let index = 0; index < 3; index++) {
            if(coins < 2){
                if(inventario[index]){

                    coins += 1;
                }
            }else{
                break;
            }

        }
    }

    if(coins > 2){
        coins = 2; // limite del 200% en la recompensa diaria con legendarios y otros
    }


    coins = ((await appdatos.findOne({})).valorDiaria)*coins;

    var restante = (await appdatos.findOne({})).diponibleDiaria;

    restante = restante-coins;

    if(restante >= 0){
        await appdatos.updateOne({},[
            {$set:{diponibleDiaria:restante}}
        ])
        return coins;

    }else{
        return 0;
    }


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

            res.send((appstatus.linea).toString(10));

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

        var data = await playerData.findOne({wallet: uc.upperCase(wallet)});
        var usuario = await user.findOne({wallet: uc.upperCase(wallet)})

        if (data && usuario) {

            await pagarDiaria(wallet);

            // true =  permite completar misiones || false = vuelva mañana 
        
            res.send(data.FriendLyWins+","+data.DuelsPlays+","+data.TournamentsPlays+","+!usuario.reclamado);

        }else{

            res.send("0,0,0,true");
                
        }

    }else{
        res.send("0,0,0,true");
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
        // resetear - habilitar  daily mision
        await user.updateOne({ wallet: uc.upperCase(wallet) }, [
            {$set: {checkpoint: (Date.now()+DaylyTime*1000) , reclamado: false}}
        ]);
        return true;
    }else{
        return false;
    }

}

async function pagarDiaria(wallet){
    if(web3.utils.isAddress(wallet.toLowerCase())){

        await resetChecpoint(wallet);

        var usuario = await user.findOne({ wallet: uc.upperCase(wallet) });
        var data = await playerData.findOne({wallet: uc.upperCase(wallet)});

        if (data && usuario ) {
    
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

        res.send( "false")//await pagarDiaria(wallet)+"")

    }else{
        res.send("false");
    }

});

async function asignarMisionDiaria(wallet){

    wallet =  wallet.toLowerCase();

    var aplicacion = await appdatos.findOne({});
    
    if(aplicacion && web3.utils.isAddress(wallet)){

        var coins = await recompensaDiaria(wallet);
        //datos.wcscExchange = await consultarCscExchange(wallet);

        var usuario = await user.findOne({ wallet: uc.upperCase(wallet) });
        var player = await playerData.findOne({ wallet: uc.upperCase(wallet) });

        if (usuario && player) {

            if(usuario.active && coins > 0 && !usuario.reclamado){

                await user.updateOne({ wallet: uc.upperCase(wallet) }, [
                    {$set: {reclamado: true , balanceUSD: {$sum:["$balanceUSD",coins]}}}
                ]);
                await appdatos.updateOne({ version: aplicacion.version }, [
                    {$set: {entregado:{$sum:["$entregado",coins]}}}
                ]);
                await playerData.updateOne({ wallet: uc.upperCase(wallet) }, [
                    {$set: {FriendLyWins: 0, DuelsPlays: 0, TournamentsPlays: 0}}
                ]);

                console.log("Daily mision coins: "+coins+" # "+uc.upperCase(wallet));
                return coins;
            }else{
                console.log("## no hay saldo para pagar dayli misions");
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

        usuario = await user.findOne({ wallet: uc.upperCase(wallet) },{id: true})

        if (usuario) {
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

        usuario = await user.findOne({ wallet: uc.upperCase(wallet) });

        if (usuario) {
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

        usuario = await user.findOne({ wallet: uc.upperCase(wallet) });

        if (usuario) {
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
     
    usuario = await user.findOne({ username: username });

    if (usuario) {
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

        usuario = await user.findOne({ wallet: uc.upperCase(wallet) });

        if (usuario) {
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

        usuario = await user.findOne({ wallet: uc.upperCase(wallet) });
        
            if (usuario) {

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
                    balanceUSD: 0,
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
            var email = "N/A@N/A.N/A";
            var username = "N/A";
            var password = "please register bro";

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
                balanceUSD: 0,
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

    usuario = await user.findOne({ email: email });

    if (usuario) {
        res.send("false");
        //res.send("true");
    }else{
        res.send("true");
    }

});

app.get('/api/v1/app/init/',async(req,res) => {

    if(req.query.version){
        var aplicacion = await appstatuses.findOne({version: req.query.version},{_id:0});

        if (aplicacion) {

            var appData = await appdatos.findOne({});

            if (appData) {

                var finliga = (appData.finliga-Date.now())/(86400*1000);

                if(finliga <= 0){

                    console.log("pagar Liga y reiniciar nueva fecha");

                    var cantidades = await redwardleague(10);
                    var wallets = await leadborad(10);

                    await appdatos.updateOne({},[
                        {$set: {finliga: appData.finliga + 86400*1000 * 7 , ganadoliga: 0}}
                    ]);

                    await playerData.updateMany({},{ $set: {CupsWin:0, LeagueOpport:0}}).exec();

                    for (let index = 0; index < wallets.length; index++) {
                        if(cantidades[index] > 0){
                            await asignarMonedas(wallets[index], cantidades[index])
                        }
                        
                    }

                }

                appData = await appdatos.findOne({});

                var today = new Date(appData.finliga);

                finliga = "End: "+ today.getUTCDate()+" - "+today.getUTCHours()+":"+today.getUTCMinutes()+":"+today.getUTCSeconds() +" ~ "+parseInt(finliga+1)
                //"M"+(today.getUTCMonth()+1)+" / D"+

            }
            

            await appstatuses.updateOne({version: req.query.version}, aplicacion);

            aplicacion = await appstatuses.findOne({version: req.query.version},{_id:0});

            var lead = await leadborad(3);

            for (let index = 0; index < lead.length; index++) {
                lead[index] = (await user.findOne({wallet: lead[index]})).username;
            
            }
        
            var inicial = await appdatos.findOne({})
    
            res.send( aplicacion.liga+","+aplicacion.mantenimiento+","+aplicacion.version+","+aplicacion.link+","+aplicacion.duelo+","+aplicacion.torneo+","+aplicacion.updates+","+finliga+",false,"+inicial.maximoCSC+","+inicial.ligaCosto +","+inicial.precioAvatar+","+lead+","+inicial.cscSalas+","+inicial.onOffServers+","+inicial.entrenamiento+","+inicial.plaformaWin+","+inicial.plaformaAnd+","+inicial.plaformaWeb   ); 


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

    cantidad = parseInt(cantidad);

    if(isNaN(cantidad))cantidad = 0;
    if(cantidad > 100)cantidad = 100;
    if(cantidad <= 0)cantidad = 20;
   

    var lista = [];

    var aplicacion = await playerData.find({}).limit(cantidad).sort({"CupsWin": -1,"LeaguesOnlineWins": -1, "UserOnline": -1});
      
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

    var cantidad = 20;

    if(req.body){
        cantidad = req.body.cantidad;
    }

    if(req.query){
        cantidad = req.query.cantidad;
        
    }

    res.send((await leadborad(cantidad)).toString());
});

async function redwardleague(cantidad){

    var appData = await appdatos.findOne({});

    if (appData ) {

        if(!cantidad){
            cantidad = 20;
        }else{
            if(parseInt(cantidad) > 100){
                cantidad = 100;
            }else{
                cantidad = parseInt(cantidad);
            }
        }

        var poolliga = appData.ganadoliga;

        var porcentajes = [0.35,0.25,0.15,0.06,0.04,0.035,0.035,0.03,0.03,0.02]
        var lista = [];
    
            
        for (let index = 0; index < cantidad; index++) {

            lista[index] = parseInt(poolliga*porcentajes[index]);
        
            if(isNaN(lista[index])){
                lista[index] = 0;
            }
            
        }

        return lista;

    }else{
        return [];
    }

}

app.get('/api/v1/consulta/redwardleague',async(req,res) => {

    var cantidad;

    if(!req.query.cantidad){
        cantidad = 20;
    }else{
        if(parseInt(req.query.cantidad) > 100){
            cantidad = 100;
        }else{
            cantidad = parseInt(req.query.cantidad);
        }
    }

    var lista =  await redwardleague(cantidad)

    res.send(lista.toString(10));


});

app.get('/api/v1/consulta/poolliga',async(req,res) => {

    var appData = await appdatos.find({});

    if (appData.length >= 1) {
        appData = appData[appData.length-1]
    }else{
        appData.ganadoliga = 0;
    }


    res.send((appData.ganadoliga).toString(10));


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

        await playerData.updateMany({},{ $set: {CupsWin:0, LeagueOpport:0}}).exec();
        
        //await playerData.updateMany({},{ $set: { LeagueOpport:0}}).exec();

        
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

            /*if( Date.now() >= parseInt(usuario.LeagueTimer) + 86400*1000){
                datos.LeagueOpport = 0;
                datos.LeagueTimer = Date.now();
            }*/

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

app.get('/api/v1/consultar/usd/lista/', async(req, res, next) => {

    var usuarios;

    var cantidad

    if(!req.query.cantidad) cantidad = 10;

    cantidad = parseInt(req.query.cantidad);

    if(cantidad > 300){
        cantidad = 300;
    }
    
    usuarios = await user.find({},{password: 0, _id: 0, checkpoint:0, txs:0,email:0,reclamado:0}).limit(cantidad).sort([['balanceUSD', -1]]);

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
            balanceUSD: usuarios[index].balanceUSD,
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

 app.get('/api/v1/consultar/dcsc/cuenta/:wallet', async(req, res, next) => {

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
