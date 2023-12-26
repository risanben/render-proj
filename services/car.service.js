import fs from 'fs'
import { utilService } from './util.service.js'

const cars = utilService.readJsonFile('data/car.json')

export const carService = {
    query,
    get,
    remove,
    save
}

function query(filterBy = {}) {
    let carsToDisplay = cars
    if (filterBy.txt) {
        const regExp = new RegExp(filterBy.txt, 'i')
        carsToDisplay = carsToDisplay.filter(car => regExp.test(car.vendor))
    }

    if (filterBy.maxPrice) {
        carsToDisplay = carsToDisplay.filter(car => car.price <= filterBy.maxPrice)
    }

    return Promise.resolve(carsToDisplay)
}

function get(carId) {
    const car = cars.find(car => car._id === carId)
    if (!car) return Promise.reject('Car not found!')
    return Promise.resolve(car)
}

function remove(carId, loggedinUser) {
    const idx = cars.findIndex(car => car._id === carId)
    if (idx === -1) return Promise.reject('No Such Car')
    const car = cars[idx]
    if (car.owner._id !== loggedinUser._id) return Promise.reject('Not your car')
    cars.splice(idx, 1)
    return _saveCarsToFile()

}

function save(car, loggedinUser) {
    if (car._id) {
        const carToUpdate = cars.find(currCar => currCar._id === car._id)
        if (carToUpdate.owner._id !== loggedinUser._id) return Promise.reject('Not your car')
        carToUpdate.vendor = car.vendor
        carToUpdate.speed = car.speed
        carToUpdate.price = car.price
    } else {
        car._id = _makeId()
        car.owner = loggedinUser
        cars.push(car)
    }

    return _saveCarsToFile().then(() => car)
    // return Promise.resolve(car)
}

function _makeId(length = 5) {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function _saveCarsToFile() {
    return new Promise((resolve, reject) => {

        const carsStr = JSON.stringify(cars, null, 4)
        fs.writeFile('data/car.json', carsStr, (err) => {
            if (err) {
                return console.log(err);
            }
            console.log('The file was saved!');
            resolve()
        });
    })
}
