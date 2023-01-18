require("dotenv").config();
var fs = require('fs');
const Web3 = require('web3');
const web3 = new Web3(process.env.INFURA_END_POINT);
const mongoose = require('mongoose');
const { PassThrough } = require('stream');
//Connecting to the database 
mongoose.connect(process.env.URL,
{
  useNewUrlParser: true,
  useUnifiedTopology: true
}
);
//mongodb://localhost:27017/Transactions


const db = mongoose.connection
db.on("error", console.error.bind(console, "Not Connected"))
db.once("open", () => {
console.log("Mongoose connection established...")
})
//transactions table schema
const transactionSchema = {
transactionHash: String,
blockNumber: Number,

from: {
    type: String
},
to: {
  type: String
},
value: {
type: Number
},
contract: {

type: String
},
tokentype: String,
tokenId:[String],
ms: [String],
amount: [Number],

gas: {
    type: Number
},
gasPrice: Number,
time: String,
};
const Transaction = mongoose.model("Transaction", transactionSchema);


//Writing options for subscription such as which events should be subscribed
let options721 = {
    topics: [
        web3.utils.sha3('Transfer(address,address,uint256)')//ERC721
    ]
};
let subscription721 = web3.eth.subscribe('logs', options721);

let options1155 = {
    topics: [
        web3.utils.sha3('TransferSingle(address,address,address,uint256,uint256)')//ERC1155 single transfer
    ]
};
let subscription1155 = web3.eth.subscribe('logs', options1155);

let options1155batch = {
    topics: ['0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb'//ERC1155 batch tranfer
    //web3.utils.sha3('TransferBatch(address operator, address from, address to, uint256[] ids, uint256[] values)')
]
};
let subscription1155batch = web3.eth.subscribe('logs', options1155batch);
//main function is for ERC721
async function main(transactionHash, blockNumber, contract, tokenId, from, to){

    
    var k = await Transaction.find({ transactionHash: transactionHash}).exec();
    
    if(k.length == 0){//If a transaction is not recorded in the database
      var ms = [];
if(from == '0x0000000000000000000000000000000000000000'){
  ms.push("Mint") 
} else if(to == "0x0000000000000000000000000000000000000000"){
  ms.push("Burn") 
} else{
  ms.push("Transfer/Sale")
}

var tokens = [];
tokens.push(tokenId)

const transaction = await web3.eth.getTransaction(transactionHash);

//create a object and pushto database
const transactions = new Transaction({
  transactionHash: transactionHash,
  blockNumber: blockNumber,
  from: transaction.from,
  to: transaction.to,
  gas: transaction.gas,
  gasPrice: transaction.gasPrice,
  value: web3.utils.fromWei(transaction.value, 'ether'),
  tokenId: tokens,
  ms: ms,
  contract: contract,
  tokentype: "ERC721"

})
await transactions.save();




  } else if(k.length > 0){//If a transaction is already recorded in the database
      var ms;
if(from == '0x0000000000000000000000000000000000000000'){
  ms = "Mint"
} else if(to == "0x0000000000000000000000000000000000000000"){
  ms = "Burn"
} else{
  ms = "Transfer/Sale"
}
//Push the tokenID to the existing array
await Transaction.updateOne(
  { transactionHash: transactionHash }, 
  { $push: { tokenId: tokenId, ms: ms } }
);
  }
}
//erc1155 function is for transfer single ERC1155 transactions
async function erc1155(hash, blockNumber, from, to, contract, tokenId, amount){
    var k = await Transaction.find({ transactionHash: hash}).exec();

    if(k.length == 0){
        var ms = [];
  if(from == '0x0000000000000000000000000000000000000000'){
    ms.push("Mint") 
  } else if(to == "0x0000000000000000000000000000000000000000"){
    ms.push("Burn") 
  } else{
    ms.push("Transfer/Sale")
  }
  
  var tokens = [];
  tokens.push(tokenId)
  
  const transaction = await web3.eth.getTransaction(hash);
  
  
  const transactionsERC1155 = new Transaction({
    transactionHash: hash,
    blockNumber: blockNumber,
    from: transaction.from,
    to: transaction.to,
    gas: transaction.gas,
    gasPrice: transaction.gasPrice,
    value: web3.utils.fromWei(transaction.value, 'ether'),
    tokenId: tokens,
    amount: amount,
    ms: ms,
    contract: contract,
    tokentype: "ERC1155"
  
  })
  await transactionsERC1155.save();
  
  
  
  
    } else if(k.length > 0){
        var ms;
  if(from == '0x0000000000000000000000000000000000000000'){
    ms = "Mint"
  } else if(to == "0x0000000000000000000000000000000000000000"){
    ms = "Burn"
  } else{
    ms = "Transfer/Sale"
  }
  
  await Transaction.updateOne(
    { transactionHash: hash }, 
    { $push: { tokenId: tokenId, ms: ms, amount: amount } }
  );
    }
    
  }
//erc1155batch is for batch transfer erc1155 transactions 
  async function erc1155batch(hash, blockNumber, from, to, contract, tokenId, amount){
    var k = await Transaction.find({ transactionHash: hash}).exec();

    if(k.length == 0){
        var ms = [];
  if(from == '0x0000000000000000000000000000000000000000'){
    ms.push("Mint") 
  } else if(to == "0x0000000000000000000000000000000000000000"){
    ms.push("Burn") 
  } else{
    ms.push("Transfer/Sale")
  }
  
//   var tokens = [];
//   tokens.push(tokenId)
  
  const transaction = await web3.eth.getTransaction(hash);
  
  
  const transactionsERC1155 = new Transaction({
    transactionHash: hash,
    blockNumber: blockNumber,
    from: transaction.from,
    to: transaction.to,
    gas: transaction.gas,
    gasPrice: transaction.gasPrice,
    value: web3.utils.fromWei(transaction.value, 'ether'),
    tokenId: tokenId,
    amount: amount,
    ms: ms,
    contract: contract
  
  })
  await transactionsERC1155.save();
  
  
  
  
    } else if(k.length > 0){
        var ms;
  if(from == '0x0000000000000000000000000000000000000000'){
    ms = "Mint"
  } else if(to == "0x0000000000000000000000000000000000000000"){
    ms = "Burn"
  } else{
    ms = "Transfer/Sale"
  }
  
  await Transaction.updateOne(
    { transactionHash: hash }, 
    { $push: { tokenId: tokenId, ms: ms, amount: amount } }
  );
    }
    
  }
//transactions array will continously populate by transactions as we subscribe to nft transactions
var transactions = [];
//help function is used to get the transactions from transactions array and prcess and push each one of them into their resective nft transactions 
async function help(transactions){
  //checks if transactions is not empty 
  if(transactions.length>0){// If no run the the if code

    for(var i=0; i< transactions.length; i++){
      var transaction = transactions.shift();
      if(transaction.tokentype == "ERC721"){ 
        await main(transaction.transactionHash, transaction.blockNumber, transaction.contract, transaction.tokenId, transaction.from, transaction.to)
    } else if(transaction.tokentype == "ERC1155"){
        if(transaction.transfertype == "Single"){
            await erc1155(transaction.transactionHash, transaction.blockNumber, transaction.from, transaction.to, transaction.contract,transaction.tokenId, transaction.value);
        } else if(transaction.transfertype == "Batch"){
            await erc1155batch(transaction.transactionHash, transaction.blockNumber, transaction.from, transaction.to, transaction.contract,transaction.tokenId, transaction.value);
        }
        
    }
     
    }
    //check whether it is populated again
    help(transactions)
  } else{//if array is empty wait for 15 seconds as ethereum blockchain creates a block for every 15 seconds and run help function again 
    setTimeout(() => {
      
      
      help(transactions)
    }, "15000")
  }
  
}


//suncription for 721
subscription721.on('data', async event => {
  
  
    if (event.topics.length == 4) {//Check for topics length
        let transaction = web3.eth.abi.decodeLog([{//abi for erc721
            type: 'address',
            name: 'from',
            indexed: true
        }, {
            type: 'address',
            name: 'to',
            indexed: true
        }, {
            type: 'uint256',
            name: 'tokenId',
            indexed: true
        }],
            event.data,
            [event.topics[1], event.topics[2], event.topics[3]])
            
           
//create object  
var k = {
  "transactionHash": event.transactionHash,
  "blockNumer": event.blockNumber,
  "from": transaction.from,
  "to": transaction.to,
  "contract": event.address,
  "tokenId": transaction.tokenId,
  "tokentype": "ERC721"
}
//push to transactions array
transactions.push(k)



		}

    
        
   
});


//subscription for erc1155
subscription1155.on('data', async event => {
  

    let transaction = web3.eth.abi.decodeLog([{//abi for erc1155
  type: 'address',
  name: 'operator',
  indexed: true
}, {
  type: 'address',
  name: 'from',
  indexed: true
}, {
  type: 'address',
  name: 'to',
  indexed: true
}, {
  type: 'uint256',
  name: 'id'
}, {
  type: 'uint256',
  name: 'value'
}],
  event.data,
  [event.topics[1], event.topics[2], event.topics[3]]);
  
//create object
var k = {
"transactionHash": event.transactionHash,
"blockNumer": event.blockNumber,
"from": transaction.from,
"to": transaction.to,
"contract": event.address,
"tokentype": "ERC1155",
"tokenId": transaction.id,
"value": transaction.value,
"transfertype": "Single"
}

//push to transactions array
transactions.push(k)


});

//subscription for erc1155 batch tranfer 
subscription1155batch.on('data', async event => {
  

    let transaction = web3.eth.abi.decodeLog([{//abi for erc1155
        type: 'address',
        name: 'operator',
        indexed: true
    }, {
        type: 'address',
        name: 'from',
        indexed: true
    }, {
        type: 'address',
        name: 'to',
        indexed: true
    }, {
        type: 'uint256[]',
        name: 'ids'
    }, {
        type: 'uint256[]',
        name: 'values'
    }],
        event.data,
        [event.topics[1], event.topics[2], event.topics[3]]);
      
//create object
var k = {
  "transactionHash": event.transactionHash,
  "blockNumer": event.blockNumber,
  "from": transaction.from,
  "to": transaction.to,
  "contract": event.address,
  "tokentype": "ERC1155",
  "tokenId": transaction.ids,
  "value": transaction.values,
  "transfertype": "Batch"
}

//push to transactions array
transactions.push(k)


});
help(transactions)

subscription721.on('error', err => { throw err });
subscription1155.on('error', err => { throw err });
subscription1155batch.on('error', err => { throw err });
//run the subscriptions
subscription721.on('connected', nr => console.log('Subscription on ERC-721 started with ID %s', nr));
subscription1155.on('connected', nr => console.log('Subscription on ERC-1155 started with ID %s', nr));
subscription1155batch.on('connected', nr => console.log('Subscription on ERC-1155 started with ID %s', nr));