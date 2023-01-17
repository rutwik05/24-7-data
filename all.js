var fs = require('fs');
const Web3 = require('web3');
const web3 = new Web3("wss://mainnet.infura.io/ws/v3/2091ae5e532549eca5e266c98f937e47");
const mongoose = require('mongoose');
const { PassThrough } = require('stream');

mongoose.connect('mongodb://localhost:27017/Transactions',
{
  useNewUrlParser: true,
  useUnifiedTopology: true
}
);
//mongodb+srv://admin1:OZitYTeN405ZktmY@cluster0.hvhmbgf.mongodb.net/?retryWrites=true&w=majority

const db = mongoose.connection
db.on("error", console.error.bind(console, "Not Connected"))
db.once("open", () => {
console.log("Mongoose connection established...")
})

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



let options721 = {
    topics: [
        web3.utils.sha3('Transfer(address,address,uint256)')
    ]
};
let subscription721 = web3.eth.subscribe('logs', options721);

let options1155 = {
    topics: [
        web3.utils.sha3('TransferSingle(address,address,address,uint256,uint256)')
    ]
};
let subscription1155 = web3.eth.subscribe('logs', options1155);

let options1155batch = {
    topics: ['0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb'
    //web3.utils.sha3('TransferBatch(address operator, address from, address to, uint256[] ids, uint256[] values)')
]
};
let subscription1155batch = web3.eth.subscribe('logs', options1155batch);

async function main(transactionHash, blockNumber, contract, tokenId, from, to){

    
    var k = await Transaction.find({ transactionHash: transactionHash}).exec();
    
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

const transaction = await web3.eth.getTransaction(transactionHash);


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
  { transactionHash: transactionHash }, 
  { $push: { tokenId: tokenId, ms: ms } }
);
  }
}

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

var transactions = [];

async function help(transactions){
  if(transactions.length>0){
    //console.log(transactions.length)

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
    
    help(transactions)
  } else{
    setTimeout(() => {
      
      
      help(transactions)
    }, "15000")
  }
  
}



subscription721.on('data', async event => {
  
  
    if (event.topics.length == 4) {
        let transaction = web3.eth.abi.decodeLog([{
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
            
           

var k = {
  "transactionHash": event.transactionHash,
  "blockNumer": event.blockNumber,
  "from": transaction.from,
  "to": transaction.to,
  "contract": event.address,
  "tokenId": transaction.tokenId,
  "tokentype": "ERC721"
}

transactions.push(k)



		}

    
        
   
});



subscription1155.on('data', async event => {
  

    let transaction = web3.eth.abi.decodeLog([{
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


transactions.push(k)


});


subscription1155batch.on('data', async event => {
  

    let transaction = web3.eth.abi.decodeLog([{
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


transactions.push(k)


});
help(transactions)

subscription721.on('error', err => { throw err });
subscription1155.on('error', err => { throw err });
subscription1155batch.on('error', err => { throw err });

subscription721.on('connected', nr => console.log('Subscription on ERC-721 started with ID %s', nr));
subscription1155.on('connected', nr => console.log('Subscription on ERC-1155 started with ID %s', nr));
subscription1155batch.on('connected', nr => console.log('Subscription on ERC-1155 started with ID %s', nr));