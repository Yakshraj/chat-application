var mongo = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/users";
var brain = require('./data.json')
let express = require('express')
let app = express();


let http = require('http')
let server = http.Server(app);

let socketIO = require('socket.io')
let io = socketIO(server);

let allAgents=[];
let activeClient = [];
let allEmployees = [];

let activeAgents = [];
let freeAgents = [];
let privateDetails;

let connectedUserAndAdmin = [];
var db;
const port = process.env.PORT || 3001;
var Sentiment = require('sentiment');
var sentiment = new Sentiment();

server.listen(port, () => {
    console.log('started on port ' + port);

});
io.on('connection', (socket) => {

    mongo.connect(url, function (err, client) {
        db = client.db('local');
    })

    socket.on('check-user', (checkUser) => {
        let checkingUser = JSON.parse(checkUser)
        let flag = false;
        // For Users
        for (i = 0; i < activeClient.length; i++) {
            if (activeClient[i].name == checkingUser.name) {
                io.sockets.in(socket.id).emit('duplicate')
                flag = true
                break;
            }
        }
        // For Agents
        if (flag == false) {
            for (i = 0; i < activeAgents.length; i++) {
                if (activeAgents[i].name == checkingUser.name) {
                    io.sockets.in(socket.id).emit('duplicate')
                    flag = true
                    break;
                }
            }
        }

        if (flag == false) {
            db.collection('users').findOne({ name: checkingUser.name }, function (findErr, result) {
                if (result == null) {
                    io.sockets.in(socket.id).emit('failure');
                }
                else if (result.name == checkingUser.name) {
                    if (result.role == "admin") {
                       
                        io.sockets.in(socket.id).emit('admin-success');
                    }
                    else if(result.role == "employee"){
                        activeClient.push({ name: checkingUser.name, id: socket.id });
                        io.sockets.in(socket.id).emit('user-success');
                    }
                    else{
                        freeAgents.push({ name: checkingUser.name, id: socket.id })
                        activeAgents.push({ name: checkingUser.name, id: socket.id })
                        io.sockets.in(socket.id).emit('agent-success');
                    }
                }
            });
        }

    });

    socket.on('new-user', (name) => {
        db.collection('users').findOne({ name: name }, function (error, result) {
            if (result == null) {
                db.collection('users').insertOne({ name: name, role: "employee" });
                activeClient.push({ name: name, id: socket.id });
                io.sockets.in(socket.id).emit('add-new-user');
            } else {
                io.sockets.in(socket.id).emit('user-exist');
            }
        });
    });

    socket.on('get-all-users', () => {
        db.collection('users').find({ role: "employee" }, { _id: 0, name: 0 }).toArray(function (error, result) {
            allEmployees = result;
            io.sockets.in(socket.id).emit('received-all-users', JSON.stringify(allEmployees));
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

    socket.on('disconnect', (index) => {
        socket.disconnect(socket.id);
        for (i = 0; i < activeClient.length; i++) {
            if (activeClient[i].id == socket.id) {
                this.temp = activeClient[i].name
                activeClient.splice(i, 1);
            }
        }
        for (i = 0; i < activeAgents.length; i++) {
            if (activeAgents[i].id == socket.id) {
                this.temp = activeAgents[i].name
                activeAgents.splice(i, 1);
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
        //console.log("deleted user",this.temp)
        io.emit('delete-map', this.temp)
        io.emit('get-clients', JSON.stringify(activeClient));
    });

    // socket.on('active-agents',()=> {
    //     io.emit('get-active-agents',JSON.stringify(activeClient));
    // });
    socket.on('all-agents',()=> {
        db.collection('users').find({role:"agent"}).toArray(function(error,result){
                allAgents = result;
                for(let i=0;i<activeAgents.length;i++){
                    for(let j=0;j<allAgents.length;j++){
                        if(activeAgents[i].name == allAgents[j].name){
                            allAgents[j].LoggedIn = true;
                        }
                        else{
                            allAgents[j].LoggedIn = false;
                        }
                    }
                }
                for(i in freeAgents){
                    for(j in allAgents){
                        if(freeAgents[i].name == allAgents[j].name){
                            allAgents[j].status = "free";
                        } 
                        else{
                            allAgents[j].status = "busy";
                        }
                    }
                }
                io.emit('get-all-agents',JSON.stringify(allAgents))
                console.log(allAgents)
        });
    });
    socket.on('add-free-agent',agent => {
        freeAgents.push({name:agent,role:'agent'});
        for(i in connectedUserAndAdmin){
            if(connectedUserAndAdmin[i].agentConnected.name == agent){
                connectedUserAndAdmin.splice(i,1);
            }
        }
    })

    socket.on('private-message', (data) => {

        privateDetails = JSON.parse(data);
        //   var docx = sentiment.analyze(privateDetails.msg).score;
        // console.log(docx)
        // if (docx < 0) {
        //     emotion = 'Negative'
        // }
        // else if (docx = 0) {
        //     emotion = 'Neutral'
        // }
        // else {
        //     emotion = 'Positive'
        // }
        // console.log(emotion)
     
        db.collection('ChatMessages').insertOne(privateDetails);
        if (privateDetails.receiverName == 'Agent') {
            if (privateDetails.msg in brain) {
                botMessage = { senderName: privateDetails.receiverName, receiverName: privateDetails.senderName, msg: brain[privateDetails.msg] }
                if (privateDetails.msg == 'connect to admin') {
                    if (freeAgents.length > 0) {
                        connectedUserAndAdmin.push({ name: privateDetails.senderName, agentConnected: { name: freeAgents[0].name, id: freeAgents[0].id } });
                        io.sockets.in(freeAgents[0].name).emit('connect-to-admin', JSON.stringify({ name: privateDetails.senderName, agentConnected: { name: freeAgents[0].name, id: freeAgents[0].id } }));
                        io.sockets.in(privateDetails.senderName).emit('real-admin-connecting', JSON.stringify({ name: privateDetails.senderName, agentConnected: { name: freeAgents[0].name, id: freeAgents[0].id } }));
                        freeAgents.splice(0, 1);
                    }
                    else{
                        botMessage = { senderName: privateDetails.receiverName, receiverName: privateDetails.senderName, msg: brain["agent_busy"] }

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
    })
});

