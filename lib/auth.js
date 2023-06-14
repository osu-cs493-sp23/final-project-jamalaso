const jwt = require("jsonwebtoken")

const secretKey = "SuperSecret"

exports.generateAuthToken = function (userId) {
    const payload = { sub: userId }
    return jwt.sign(payload, secretKey, { expiresIn: "24h" })
}

exports.requireAuthentication = function (req, res, next) {
    console.log("== requireAuthentication()")
    const authHeader = req.get("Authorization") || ""
    const authHeaderParts = authHeader.split(" ")
    const token = authHeaderParts[0] === "Bearer" ?
        authHeaderParts[1] : null

    if (!token) {
        return res.status(401).send({ error: 'Missing authentication token' });
    }
    console.log("  -- token:", token)
    
    try {
        const payload = jwt.verify(token, secretKey)
        console.log("  -- payload:", payload)
        req.user =
        {
            id: payload.sub,
            isAdmin: payload.admin
        }

        next()
    } catch (err) {
        console.error("== Error verifying token:", err)
        res.status(401).send({
            error: "Invalid authentication token"
        })
    }
}