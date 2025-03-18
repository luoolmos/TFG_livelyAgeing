// npm init -y
// npm install express
// node index.js

const Sequelize = require('sequelize')
const sequelize = new Sequelize('postgres://postgres:password@localhost:5432/postgres',
    {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: false,
        }
    })

const express = require('express')
const app = express()
const port = 3000;

app.use(express.json());
app.get('/', (req, res) => res.send('Hello World!'))

sequelize.authenticate().then(() => {
    console.log('Connection has been established successfully.');
}).catch(err => {
    console.error('Unable to connect to the database:', err);
});

app.listen(port, () => console.log(`Example app listening at http://localhost:${port}`))