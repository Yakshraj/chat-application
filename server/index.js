var mongo = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/users";
var brain = require('./data.json')
let express = require('express')
let app = express();


let http = require('http')
let server = http.Server(app);

let socketIO = require('socket.io')
let io = socketIO(server);

let activeClient = [];
let freeAgents = [];

let privateDetails;

let connectedUserAndAdmin = [];
var db;
const port = process.env.PORT || 3001;

server.listen(port, () => {
    console.log('started on port ' + port);

});
io.on('connection', (socket) => {

    mongo.connect(url, function (err, client) {
        db = client.db('local');
    })

    socket.on('check-user',(checkUser) => {
        let user = JSON.parse(checkUser);
        db.collection('users').findOne({name: user.name}, function(error, result) {
            if(result == null) {
                io.sockets.in(socket.id).emit('failure');
            }
            else if(result.name == user.name && result.loggedIn == "false") {
                db.collection('users').updateOne({name : result.name}, {$set : {loggedIn : "true", socketId : socket.id} });
                if(result.role == "admin") {                    
                    io.sockets.in(socket.id).emit('admin-success');
                }
                else if(result.role == "agent") {
                    freeAgents.push({ name: result.name, id: socket.id })
                    io.sockets.in(socket.id).emit('agent-success')
                }
                else {
                    activeClient.push({ name : result.name, id : socket.id});
                    io.sockets.in(socket.id).emit('user-success');
                }
            }
            else {
                io.sockets.in(socket.id).emit('duplicate');
            }
        });
    });

    // socket.on('new-user', (name) => {
    //     db.collection('users').findOne({ name: name }, function (error, result) {
    //         if (result == null) {
    //             db.collection('users').insertOne({ name: name, role: "employee" });
    //             activeClient.push({ name: name, id: socket.id });
    //             io.sockets.in(socket.id).emit('add-new-user');
    //         } else {
    //             io.sockets.in(socket.id).emit('user-exist');
    //         }
    //     });
    // });

    socket.on('get-all-users', () => {
        db.collection('users').find({ role: "employee" }, { _id: 0, name: 0 }).toArray(function (error, result) {
            io.sockets.in(socket.id).emit('received-all-users', JSON.stringify(result));
        });
    });


    socket.on('join', (username) => {
        socket.join(username);
    });

    socket.on('get-clients', () => {
        io.emit('get-clients', JSON.stringify(activeClient));
    })


    socket.on('chat-message', (message) => {
        io.emit('chat-message', message);
    });

    socket.on('disconnect', (indx) => {
        socket.disconnect(socket.id);
        db.collection('users').updateOne({socketId : socket.id}, {$set : {loggedIn : "false", socketId : ''}});
        for (i = 0; i < activeClient.length; i++) {
            if (activeClient[i].id == socket.id) {
                this.temp = activeClient[i].name
                activeClient.splice(i, 1);
            }
        }
        for(i=0; i<freeAgents.length;i++){
            if(freeAgents[i].id == socket.id){
                this.temp = freeAgents[i].name;
                freeAgents.splice(i,1);
            }
        }
        for(let i in connectedUserAndAdmin){
            if(this.temp == connectedUserAndAdmin[i].name){
                connectedUserAndAdmin.splice(i,1);
            }
        }
        io.emit('delete-map', this.temp)
        io.emit('get-clients', JSON.stringify(activeClient));
    });

    socket.on('all-agents',()=> {
        db.collection('users').find({role:"agent"}).toArray(function(error,result){
                io.emit('get-all-agents',JSON.stringify(result));
        });
    });

    socket.on('private-message', (data) => {
        privateDetails = JSON.parse(data);
        db.collection('ChatMessages').insertOne(privateDetails);
        if (privateDetails.receiverName == 'Agent') {
            if (privateDetails.msg in brain) {
                botMessage = { senderName: privateDetails.receiverName, receiverName: privateDetails.senderName, msg: brain[privateDetails.msg] }
                if (privateDetails.msg == 'connect to admin') {
                    if (freeAgents.length > 0) {
                        console.log("here",freeAgents)
                        let connectionDetail = { name: privateDetails.senderName, agentConnected: { name: freeAgents[0].name, id: freeAgents[0].id } } ;
                        connectedUserAndAdmin.push(connectionDetail);
                        io.sockets.in(freeAgents[0].name).emit('connect-to-admin', JSON.stringify(connectionDetail));
                        io.sockets.in(privateDetails.senderName).emit('real-admin-connecting', JSON.stringify(connectionDetail));
                        freeAgents.splice(0, 1);
                    }
                    else{
                        botMessage = { senderName: privateDetails.receiverName, receiverName: privateDetails.senderName, msg: brain["agent_busy"] } ;
                    }
                }
            }
            else {
                botMessage = { senderName: privateDetails.receiverName, receiverName: privateDetails.senderName, msg: brain["out_of_brain"] }
            }
            io.sockets.in(privateDetails.senderName).emit('send-private-message', JSON.stringify(botMessage));
            db.collection('ChatMessages').insertOne(botMessage);
        }
        else {
            io.sockets.in(privateDetails.receiverName).emit('send-private-message', data);
        }
    });

    socket.on('pass-chatbot-and-user-chat', (name) => {
        db.collection('ChatMessages').find({ $or: [{ senderName: name, receiverName: "Agent" }, { senderName: "Agent", receiverName: name }] })
            .toArray(function (error, result) {
                for (let i = 0; i < connectedUserAndAdmin.length; i++) {
                    if (connectedUserAndAdmin[i].name == name) {
                        io.sockets.in(connectedUserAndAdmin[i].agentConnected.name).emit('fetch-chatbot-and-user-chat', JSON.stringify(result));
                    }
                }

            })
    });

    socket.on('send-receiver-details', (fetchDetails) => {
        let FetchDetails = JSON.parse(fetchDetails)
            db.collection('ChatMessages').find({ $or: [{ senderName: FetchDetails.senderName, receiverName: FetchDetails.receiverName }, { senderName: FetchDetails.receiverName, receiverName: FetchDetails.senderName }] })
                .toArray(function (error, result) {
                    let chatHistory = result;
                    io.sockets.in(socket.id).emit('fetch-chat-history', JSON.stringify(chatHistory));
                });
    });

    socket.on('base64-string', msg => {
        console.log(msg,'msg');
        io.sockets.in(msg.receiverName).emit('base64-file',msg);
    })

    // socket.on('add-free-agent', (agent) => {
    //     console.log("here", agent);
    //     db.collection('users').find({name: agent}).toArray(function(error, result) {
    //         freeAgents.push({name:agent, id : result.socketId});
    //     });
    //     for(let i=0; i<connectedUserAndAdmin.length; i++) {
    //         if(connectedUserAndAdmin[i].agentConnected.name == agent) {
    //             io.sockets.in(connectedUserAndAdmin[i].agentConnected.name).emit('remove-real-agent', agent);
    //             connectedUserAndAdmin.splice(i,1);
    //         }
    //     }
       
    // });
});

