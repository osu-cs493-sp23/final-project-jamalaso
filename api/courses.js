const { Router } = require('express')

const router = Router()

router.get('/', async function (req, res, next) {
    res.status(200).json({
        message: 'GET /courses'
    });
})

router.post('/', async function (req, res, next) {
    res.status(200).json({
        message: 'POST /courses'
    });
})

router.get('/:id', async function (req, res, next) {
    res.status(200).json({
        message: 'GET /courses/{id}'
    });
})

router.patch('/:id', async function (req, res, next) {
    res.status(200).json({
        message: 'PATCH /courses/{id}'
    });
})

router.delete('/:id', async function (req, res, next) {
    res.status(200).json({
        message: 'DELETE /courses/{id}'
    });
})





router.get('/:id/students', async function (req, res, next) {
    res.status(200).json({
        message: 'GET /courses/{id}/students'
    });
})

router.post('/:id/students', async function (req, res, next) {
    res.status(200).json({
        message: 'POST /courses/{id}/students'
    });
})

router.get('/:id/roster', async function (req, res, next) {
    res.status(200).json({
        message: 'GET /courses/{id}/roster'
    });
})

router.get('/:id/assignments', async function (req, res, next) {
    res.status(200).json({
        message: 'GET /courses/{id}/assignments'
    });
})



module.exports = router