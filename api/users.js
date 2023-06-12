const { Router } = require('express')

const router = Router()

router.post('/', function (req, res) {
    res.status(200).json({
      message: 'POST /users'
    });
});

router.post('/login', async function (req, res, next) {
    res.status(200).json({
        message: 'POST /users/login'
      });
})

router.get('/:id', async function (req, res, next) {
    res.status(200).json({
        message: 'POST /users/{id}'
      });
})


module.exports = router