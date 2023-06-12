const { Router } = require('express')

const router = Router()

router.post('/', async function (req, res, next) {
    res.status(200).json({
        message: 'POST /assignments'
    });
})

router.get('/:id', async function (req, res, next) {
    res.status(200).json({
        message: 'GET /assignments/{id}'
    });
})

router.patch('/:id', async function (req, res, next) {
    res.status(200).json({
        message: 'PATCH /assignments/{id}'
    });
})

router.delete('/:id', async function (req, res, next) {
    res.status(200).json({
        message: 'DELETE /assignments/{id}'
    });
})


router.get('/:id/submissions', async function (req, res, next) {
    res.status(200).json({
        message: 'GET /assignments/{id}/submissions'
    });
})

router.post('/:id/submissions', async function (req, res, next) {
    res.status(200).json({
        message: 'POST /assignments/{id}/submissions'
    });
})





module.exports = router