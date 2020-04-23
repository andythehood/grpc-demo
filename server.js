// The package @grpc/grpc-js can also be used instead of grpc here
const grpc = require('grpc');
const fs = require('fs');
const protoLoader = require('@grpc/proto-loader');

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
  fs.readFileSync('./nginx.crt'),
  [
    {
      cert_chain: fs.readFileSync('./nginx.crt'),
      private_key: fs.readFileSync('./nginx.key'),
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

const sayHello = (call, callback) => {
  console.log('sayHello', call.request.name);
  callback(null, { message: `Hello ${call.request.name}` });
};

const check = (call, callback) => {
  console.log('healthcheck', call.request.service);
  callback(null, { status: 1 });
};

function main() {
  const server = new grpc.Server();
  server.addService(healthCheckProto.Health.service, { check });
  server.addService(helloWorldProto.Greeter.service, { sayHello });

  server.bindAsync(`0.0.0.0:${PORT}`, insecureCredentials, (error, port) => {
    console.log('Server started, listening on port', port);
    if (error) {
      throw error;
    }
    server.start();
  });
}

main();
