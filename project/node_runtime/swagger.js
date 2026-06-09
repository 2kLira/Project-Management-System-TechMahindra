const swaggerAutogen = require ('swagger-autogen')();


const doc = {
    info: {
        title: 'Lista de API thynk unlimited',
        description: 'Documentación API del proyecto'
    },
    host: process.env.REACT_APP_API_URL || 'localhost:8080',
    schemes: ['http'],
};

const outputFile = './swagger_output.json'
const endpointsFiles = ["./src/app.js"]

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
    require('./index'); 
});