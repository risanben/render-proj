import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import { carService } from './services/car.service.js'
import { userService } from './services/user.service.js'
import { loggerService } from './services/logger.service.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express()


// App Configuration
const corsOptions = {
    origin: [
        'http://127.0.0.1:8080',
        'http://localhost:8080',
        'http://127.0.0.1:5173',
        'http://localhost:5173',
    ],
    credentials: true
}

app.use(cors(corsOptions))
app.use(cookieParser()) // for res.cookies
app.use(express.json()) // for req.body
app.use(express.static('public'))



// **************** Cars API ****************:
// List
app.get('/api/car', (req, res) => {
    const { txt, maxPrice } = req.query
    const filterBy = { txt, maxPrice: +maxPrice }
    carService.query(filterBy)
        .then(cars => {
            res.send(cars)
        })
        .catch(err => {
            loggerService.error('Cannot load cars', err)
            res.status(400).send('Cannot load cars')
        })
})

// Add
app.post('/api/car', (req, res) => {
    const loggedinUser = userService.validateToken(req.cookies.loginToken)
    if (!loggedinUser) return res.status(401).send('Cannot add car')
    const { vendor, speed, price } = req.body

    const car = {
        vendor,
        speed: +speed,
        price: +price
    }
    carService.save(car, loggedinUser)
        .then(savedCar => {
            res.send(savedCar)
        })
        .catch(err => {
            loggerService.error('Cannot add car', err)
            res.status(400).send('Cannot add car')
        })
})

// Edit
app.put('/api/car', (req, res) => {
    const loggedinUser = userService.validateToken(req.cookies.loginToken)
    if (!loggedinUser) return res.status(401).send('Cannot update car')

    const { vendor, speed, price, _id, owner } = req.body
    const car = {
        _id,
        vendor,
        speed: +speed,
        price: +price,
        owner
    }
    carService.save(car, loggedinUser)
        .then((savedCar) => {
            res.send(savedCar)
        })
        .catch(err => {
            loggerService.error('Cannot update car', err)
            res.status(400).send('Cannot update car')
        })

})

// Read - getById
app.get('/api/car/:carId', (req, res) => {
    const { carId } = req.params
    carService.get(carId)
        .then(car => {
            // car.msgs =['HEllo']
            res.send(car)
        })
        .catch(err => {
            loggerService.error('Cannot get car', err)
            res.status(400).send(err)
        })
})

// Remove
app.delete('/api/car/:carId', (req, res) => {
    const loggedinUser = userService.validateToken(req.cookies.loginToken)
    if (!loggedinUser) return res.status(401).send('Cannot delete car')

    const { carId } = req.params
    carService.remove(carId, loggedinUser)
        .then(msg => {
            res.send({ msg, carId })
        })
        .catch(err => {
            loggerService.error('Cannot delete car', err)
            res.status(400).send('Cannot delete car, ' + err)
        })
})


// **************** Users API ****************:
app.get('/api/auth/:userId', (req, res) => {
    const { userId } = req.params
    userService.getById(userId)
        .then(user => {
            res.send(user)
        })
        .catch(err => {
            loggerService.error('Cannot get user', err)
            res.status(400).send('Cannot get user')
        })
})

app.post('/api/auth/login', (req, res) => {
    const credentials = req.body
    userService.checkLogin(credentials)
        .then(user => {
            const token = userService.getLoginToken(user)
            res.cookie('loginToken', token)
            res.send(user)
        })
        .catch(err => {
            loggerService.error('Cannot login', err)
            res.status(401).send('Not you!')
        })
})

app.post('/api/auth/signup', (req, res) => {
    const credentials = req.body
    userService.save(credentials)
        .then(user => {
            const token = userService.getLoginToken(user)
            res.cookie('loginToken', token)
            res.send(user)
        })
        .catch(err => {
            loggerService.error('Cannot signup', err)
            res.status(401).send('Nope!')
        })
})


app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('loginToken')
    res.send('logged-out!')
})


app.put('/api/user', (req, res) => {
    const loggedinUser = userService.validateToken(req.cookies.loginToken)
    if (!loggedinUser) return res.status(401).send('No logged in user')
    const { diff } = req.body
    if (loggedinUser.score + diff < 0) return res.status(400).send('No credit')
    loggedinUser.score += diff
    return userService.save(loggedinUser).then(user => {
        const token = userService.getLoginToken(user)
        res.cookie('loginToken', token)
        res.send(user)
    })
})


app.get('/**', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'))
})



//TODO: add this line 
const port = process.env.PORT || 3030
app.listen(port, () => {
    loggerService.info(`Server listening on port http://127.0.0.1:${port}/`)
})