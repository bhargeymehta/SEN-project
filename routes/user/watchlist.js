const express = require('express');
const firestore = require('../../firebase/firebase').firestore();
const config = require('../../config');

const router = express.Router();
const watchlists = firestore.collection('watchlists');
const stocksdb = require('../../firebase/stocks');

router.get('/', (req, res) => {
    if(!req.user){
        res.json({
            status: config.statusCodes.failed,
            errorType: config.errorCodes.auth,
            errors: [
                {msg: 'Authenticated but user not Found'}
            ]
        });
        return;
    }

    watchlists.where('email', '==', req.user.email).get()
    .then(snapshot => {
        if(snapshot.empty){
            res.json({
                status: config.statusCodes.ok,
                stocks: []
            });
            watchlists.add({
                email: req.user.email,
                stocks: []
            });
        } else if(snapshot.size != 1){
            res.json({
                status: config.statusCodes.failed,
                errorType: config.errorCodes.db,
                errors: [
                    {msg: 'Inconsistent Database (Multiple users)'}
                ]
            });
        } else {
            snapshot.forEach(doc => {
                res.json({
                    status: config.statusCodes.ok,
                    stocks: doc.data().stocks
                });
            });
        }
    });
});

router.post('/add', (req, res) => {

    let {stocks} = req.body;
    let new_stocks = stocks;

    if(!(new_stocks instanceof Array)){
        res.json({
            status: config.statusCodes.failed,
            errorType: config.errorCodes.api,
            errors: [
                {msg: `Provide 'stocks' to add`}
            ]
        });
        return;
    }

    if(!req.user){
        res.json({
            status: config.statusCodes.failed,
            errorType: config.errorCodes.auth,
            errors: [
                {msg: 'Authenticated but user not Found'}
            ]
        });
        return;
    }

    watchlists.where('email', '==', req.user.email).get()
    .then(snapshot => {
        if(snapshot.empty){
            res.json({
                status: config.statusCodes.ok,
                stocks
            });
            watchlists.add({
                email: req.user.email,
                stocks
            });
        } else if(snapshot.size != 1){
            res.json({
                status: config.statusCodes.failed,
                errorType: config.errorCodes.db,
                errors: [
                    {msg: 'Inconsistent (Multiple users)'}
                ]
            });
        } else {
            snapshot.forEach(doc => {
                let stocks = doc.data().stocks;
                new_stocks.forEach(stock => {
                    if(!stocks.includes(stock) && stocksdb.has(stock)){
                        stocks.push(stock);
                    }
                });
                watchlists.doc(doc.id).set({
                    email: req.user.email,
                    stocks
                });
                res.json({
                    status: config.statusCodes.ok,
                    stocks
                });
            });
        }
    });
});

router.post('/remove', (req, res) => {

    let {stocks} = req.body;
    let del_stocks = stocks;

    if(!(del_stocks instanceof Array)){
        res.json({
            status: config.statusCodes.failed,
            errorType: config.errorCodes.api,
            errors: [
                {msg: `Provide 'stocks' to remove`}
            ]
        });
        return;
    }

    if(!req.user){
        res.json({
            status: config.statusCodes.failed,
            errorType: config.errorCodes.auth,
            errors: [
                {msg: 'Authenticated but user not Found'}
            ]
        });
        return;
    }

    watchlists.where('email', '==', req.user.email).get()
    .then(snapshot => {
        if(snapshot.empty){
            res.json({
                status: config.statusCodes.ok,
                stocks: []
            });
            watchlists.add({
                email: req.user.email,
                stocks: []
            });
        } else if(snapshot.size != 1){
            res.json({
                status: config.statusCodes.failed,
                errorType: config.errorCodes.db,
                errors: [
                    {msg: 'Inconsistent Database (Multiple Users)'}
                ]
            });
        } else {
            snapshot.forEach(doc => {
                let stocks = doc.data().stocks;
                let new_stocks = [];
                stocks.forEach(stock => {
                    if(!del_stocks.includes(stock) && stocksdb.has(stock)){
                        new_stocks.push(stock);
                    }
                });
                watchlists.doc(doc.id).set({
                    email: req.user.email,
                    stocks: new_stocks
                });
                res.json({
                    status: config.statusCodes.ok,
                    stocks: new_stocks
                });
            });
        }
    });
});

module.exports = router;