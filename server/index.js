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
let allEmployees = [];
let activeAdmins = [];
let freeAdmins = [];
let privateDetails;

let connectedUserAndAdmin = [];
let senderSocketName;
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
        // For Admins
        if (flag == false) {
            for (i = 0; i < activeAdmins.length; i++) {
                if (activeAdmins[i].name == checkingUser.name) {
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
                        freeAdmins.push({ name: checkingUser.name, id: socket.id })
                        activeAdmins.push({ name: checkingUser.name, id: socket.id })
                        io.sockets.in(socket.id).emit('admin-success');
                    }
                    else {
                        activeClient.push({ name: checkingUser.name, id: socket.id });
                        io.sockets.in(socket.id).emit('success');
                    }
                }
                console.log(freeAdmins)
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
        for (i = 0; i < activeAdmins.length; i++) {
            if (activeAdmins[i].id == socket.id) {
                this.temp = activeAdmins[i].name
                activeAdmins.splice(i, 1);
            }
        }
        for(i=0; i<freeAdmins.length;i++){
            if(freeAdmins[i].id == socket.id){
                this.temp = freeAdmins[i].name;
                freeAdmins.splice(i,1);
                 connectedUserAndAdmin = connectedUserAndAdmin.filter(function(value,index,arr){
                    return connectedUserAndAdmin.name != this.temp;
                })
            }
        }
        //console.log("deleted user",this.temp)
        io.emit('delete-map', this.temp)
        io.emit('get-clients', JSON.stringify(activeClient));
    });

    socket.on('private-message', (data) => {

        privateDetails = JSON.parse(data);
        //console.log(privateDetails)
        db.collection('ChatMessages').insertOne(privateDetails);
        if (privateDetails.receiverName == 'Agent') {
            if (privateDetails.msg in brain) {
                botMessage = { senderName: privateDetails.receiverName, receiverName: privateDetails.senderName, msg: brain[privateDetails.msg] }
                if (privateDetails.msg == 'connect to admin') {
                    if (freeAdmins.length > 0) {
                        connectedUserAndAdmin.push({ name: privateDetails.senderName, agentConnected: { name: freeAdmins[0].name, id: freeAdmins[0].id } });
                        console.log(freeAdmins[0].name, "Line 141", privateDetails.senderName)
                        io.sockets.in(freeAdmins[0].name).emit('connect-to-admin', JSON.stringify({ name: privateDetails.senderName, agentConnected: { name: freeAdmins[0].name, id: freeAdmins[0].id } }));
                        io.sockets.in(privateDetails.senderName).emit('real-admin-connecting', JSON.stringify({ name: privateDetails.senderName, agentConnected: { name: freeAdmins[0].name, id: freeAdmins[0].id } }));
                        freeAdmins.splice(0, 1);
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
            //console.log('here', privateDetails.receiverName)
            io.sockets.in(privateDetails.receiverName).emit('send-private-message', data);
        }
        console.log(connectedUserAndAdmin)

    });

    socket.on('pass-chatbot-and-user-chat', (name) => {
        //console.log("here")
        console.log(name)
        db.collection('ChatMessages').find({ $or: [{ senderName: name, receiverName: "Agent" }, { senderName: "Agent", receiverName: name }] })
            .toArray(function (error, result) {
                //console.log(result, connectedUserAndAdmin[0].agentConnected.name);
                for (let i = 0; i < connectedUserAndAdmin.length; i++) {
                    if (connectedUserAndAdmin[i].name == name) {
                        io.sockets.in(connectedUserAndAdmin[i].agentConnected.name).emit('fetch-chatbot-and-user-chat', JSON.stringify(result));
                    }
                }

            })
    });





    socket.on('send-receiver-details', (fetchDetails) => {
        //console.log("Call received")
        let FetchDetails = JSON.parse(fetchDetails)
        if (FetchDetails.userRole == 'admin') {
            console.log("here in sd")
            db.collection('ChatMessages').find({ $or: [{ senderName: FetchDetails.senderName, receiverName: FetchDetails.receiverName }, { senderName: FetchDetails.receiverName, receiverName: FetchDetails.senderName }, { senderName: 'Agent', receiverName: FetchDetails.senderName }, { senderName: FetchDetails.senderName, receiverName: 'Agent' }] })
                .toArray(function (error, result) {
                    let chatHistory = result;
                    //console.log(result,"Chat History fetched");
                    io.sockets.in(socket.id).emit('fetch-chat-history', JSON.stringify(chatHistory));
                });
        }
        else {
            //console.log(fetchDetails)
            console.log("here in sdad")
            db.collection('ChatMessages').find({ $or: [{ senderName: FetchDetails.senderName, receiverName: FetchDetails.receiverName }, { senderName: FetchDetails.receiverName, receiverName: FetchDetails.senderName }] })
                .toArray(function (error, result) {
                    let chatHistory = result;
                    //console.log(result,"Chat History fetched");
                    io.sockets.in(socket.id).emit('fetch-chat-history', JSON.stringify(chatHistory));
                });
        }

    })




});

