// The package @grpc/grpc-js can also be used instead of grpc here
const grpc = require('@grpc/grpc-js');
const fs = require('fs');
const protoLoader = require('@grpc/proto-loader');
var async = require('async');
var _ = require('lodash');

// const packageDefinition = protoLoader.loadSync(
//   __dirname + '/helloworld.proto',
//   { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true }
// );
const helloWorldProto = grpc.loadPackageDefinition(
  protoLoader.loadSync(__dirname + '/helloworld.proto', {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  })
).helloworld;

const healthCheckProto = grpc.loadPackageDefinition(
  protoLoader.loadSync(__dirname + '/healthcheck.proto', {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  })
).grpc.health.v1;

const PORT = process.env.PORT || 50051;

let secureCredentials = grpc.ServerCredentials.createSsl(
  fs.readFileSync('./grpc-server.crt'),
  [
    {
      cert_chain: fs.readFileSync('./grpc-server.crt'),
      private_key: fs.readFileSync('./grpc-server.key'),
    },
  ],
  false
);

let insecureCredentials = grpc.ServerCredentials.createInsecure();

// function calculate(call, callback) {
//   const request = call.request;
//   let result;
//   if (request.operation === 'ADD') {
//     result = request.first_operand + request.second_operand;
//   } else {
//     result = request.first_operand - request.second_operand;
//   }
//   callback(null, { result });
// }

const doSayHello = (call, callback) => {
  console.log('sayHello', call.request.name);
  callback(null, { message: `Hello ${call.request.name}` });
};

function doSayRepeatHello(call) {
  var senders = [];
  function sender(name) {
    return (callback) => {
      call.write({
        message: 'Hey! ' + name
      });
      _.delay(callback, 500); // in ms
    };
  }
  for (var i = 0; i < call.request.count; i++) {
    senders[i] = sender(call.request.name + i);
  }
  async.series(senders, () => {
    // console.log('closing stream');
    call.write({
      message: 'Closing stream'
    });
    call.end();
  });
}

const doHealthCheck = (call, callback) => {
  console.log('healthcheck', call.request.service);
  callback(null, { status: 1 });
};

function main() {
  const server = new grpc.Server();
  server.addService(healthCheckProto.Health.service, { check: doHealthCheck });
  server.addService(helloWorldProto.Greeter.service, {
    sayHello: doSayHello,
    sayRepeatHello: doSayRepeatHello,
  });

  server.bindAsync(`0.0.0.0:${PORT}`, insecureCredentials, (error, port) => {
    console.log('Server started, listening on port', port);
    if (error) {
      throw error;
    }
    server.start();
  });
}

main();
