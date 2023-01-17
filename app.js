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
tokenId:[String],
ms: [String],

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



async function main(transactionHash, blockNumber, address, tokenId, from, to, contract){

    
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
  contract: contract

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



var transactions = [];

async function help(transactions){
  if(transactions.length>0){
    //console.log(transactions.length)

    for(var i=0; i< transactions.length; i++){
      var transaction = transactions.shift();
      await main(transaction.transactionHash, transaction.blockNumber, transaction.contract, transaction.tokenId, transaction.from, transaction.to, transaction.contract)
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
            
           
//         console.log(`\n` +
//         `New ERC-712 transaction found in block ${event.blockNumber} with hash ${event.transactionHash}\n` +
//         `From: ${(transaction.from === '0x0000000000000000000000000000000000000000') ? 'New mint!' : transaction.from}\n` +
//         `To: ${transaction.to}\n` +
//         `Token contract: ${event.address}\n` +
//         `Token ID: ${transaction.tokenId}`
// );
var k = {
  "transactionHash": event.transactionHash,
  "blockNumer": event.blockNumber,
  "from": transaction.from,
  "to": transaction.to,
  "contract": event.address,
  "tokenId": transaction.tokenId
}

transactions.push(k)



		}

    
        
   
});
help(transactions)

subscription721.on('error', err => { throw err });
subscription721.on('connected', nr => console.log('Subscription on ERC-721 started with ID %s', nr));



